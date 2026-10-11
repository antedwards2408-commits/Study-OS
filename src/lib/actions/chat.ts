"use server";

import { createClient } from "@/lib/supabase/server";
import { askTutor, type TutorMessage } from "@/lib/ai/generate";

/**
 * Where a chat turn is grounded: a single material (full-text search scoped
 * to that material) or an entire course (scoped to all of its materials).
 * `chat_messages.material_id` is set for the former and left null for the
 * latter, so the two are separate, independently-persisted conversations.
 */
export type ChatScope =
  | { type: "material"; courseId: string; materialId: string }
  | { type: "course"; courseId: string };

export type SendChatMessageResult = { answer: string } | { error: string };

/**
 * Retrieves grounded context for `question` via the full-text search RPCs,
 * asks the tutor, and persists both the question and the answer to
 * `chat_messages`. Shared by the material-level and course-level chat UIs.
 */
export async function sendChatMessage(
  scope: ChatScope,
  question: string,
): Promise<SendChatMessageResult> {
  const trimmed = question.trim();
  if (!trimmed) {
    return { error: "Ask something first." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "You need to be signed in to chat." };
  }

  const { data: course } = await supabase
    .from("courses")
    .select("name")
    .eq("id", scope.courseId)
    .single();
  if (!course) {
    return { error: "Course not found." };
  }

  let materialTitle: string | undefined;
  if (scope.type === "material") {
    const { data: material } = await supabase
      .from("materials")
      .select("title")
      .eq("id", scope.materialId)
      .eq("course_id", scope.courseId)
      .single();
    if (!material) {
      return { error: "Material not found." };
    }
    materialTitle = material.title;
  }

  let historyQuery = supabase
    .from("chat_messages")
    .select("role, content")
    .eq("course_id", scope.courseId)
    .order("created_at", { ascending: true });
  historyQuery =
    scope.type === "material"
      ? historyQuery.eq("material_id", scope.materialId)
      : historyQuery.is("material_id", null);

  const { data: historyRows } = await historyQuery;
  const history: TutorMessage[] = (historyRows ?? []).map((row) => ({
    role: row.role,
    content: row.content,
  }));

  let retrievedChunks: string[] = [];
  if (scope.type === "material") {
    const { data: chunks } = await supabase.rpc("search_material_chunks", {
      p_material_id: scope.materialId,
      p_query: trimmed,
      p_limit: 6,
    });
    retrievedChunks = (chunks ?? []).map((c) => c.content);
  } else {
    const { data: chunks } = await supabase.rpc("search_course_chunks", {
      p_course_id: scope.courseId,
      p_query: trimmed,
      p_limit: 6,
    });
    retrievedChunks = (chunks ?? []).map((c) => c.content);
  }

  let answer: string;
  try {
    answer = await askTutor({
      courseName: course.name,
      materialTitle,
      retrievedChunks,
      history,
      question: trimmed,
    });
  } catch (err) {
    return {
      error:
        err instanceof Error
          ? `The AI tutor couldn't answer that: ${err.message}`
          : "The AI tutor couldn't answer that.",
    };
  }

  const materialId = scope.type === "material" ? scope.materialId : null;
  await supabase.from("chat_messages").insert([
    { user_id: user.id, course_id: scope.courseId, material_id: materialId, role: "user", content: trimmed },
    { user_id: user.id, course_id: scope.courseId, material_id: materialId, role: "assistant", content: answer },
  ]);

  return { answer };
}
