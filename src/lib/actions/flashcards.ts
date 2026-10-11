"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { generateFlashcards } from "@/lib/ai/generate";
import type { Difficulty } from "@/types/database";

const FLASHCARD_COUNT = 10;

export interface GenerateFlashcardsState {
  error: string | null;
}

/** Maps an AI-returned topic name back to this course's topic_id (case-insensitive, no fuzzy match). */
function matchTopicId(
  topicName: string | null,
  topicsByLowerName: Map<string, string>,
): string | null {
  if (!topicName) return null;
  return topicsByLowerName.get(topicName.trim().toLowerCase()) ?? null;
}

/**
 * Generates a flashcard deck for one material and inserts it, bound to a <form action>.
 * Expects hidden fields "materialId" and "courseId".
 */
export async function generateFlashcardsAction(
  _prevState: GenerateFlashcardsState,
  formData: FormData,
): Promise<GenerateFlashcardsState> {
  const materialId = String(formData.get("materialId") ?? "");
  const courseId = String(formData.get("courseId") ?? "");

  if (!materialId || !courseId) {
    return { error: "Missing material." };
  }

  try {
    const supabase = await createClient();
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) {
      return { error: "You must be signed in." };
    }

    const { data: material } = await supabase
      .from("materials")
      .select("id, title, course_id, status")
      .eq("id", materialId)
      .eq("course_id", courseId)
      .single();

    if (!material) {
      return { error: "Material not found." };
    }
    if (material.status !== "ready") {
      return { error: "This material isn't finished processing yet." };
    }

    const { data: chunkRows } = await supabase
      .from("material_chunks")
      .select("content")
      .eq("material_id", materialId)
      .order("chunk_index", { ascending: true });

    const chunks = (chunkRows ?? []).map((c) => c.content);
    if (chunks.length === 0) {
      return { error: "No extracted content found for this material." };
    }

    const { data: topicRows } = await supabase
      .from("topics")
      .select("id, name")
      .eq("course_id", courseId);

    const topics = topicRows ?? [];
    const topicsByLowerName = new Map(topics.map((t) => [t.name.toLowerCase(), t.id]));

    const generated = await generateFlashcards({
      materialTitle: material.title,
      chunks,
      topics: topics.map((t) => t.name),
      count: FLASHCARD_COUNT,
    });

    if (!generated || generated.length === 0) {
      return { error: "The AI didn't return any flashcards. Try again." };
    }

    const rows = generated.map((card) => ({
      material_id: materialId,
      course_id: courseId,
      user_id: auth.user!.id,
      topic_id: matchTopicId(card.topicName, topicsByLowerName),
      question: card.question,
      answer: card.answer,
      difficulty: card.difficulty as Difficulty,
    }));

    const { error: insertError } = await supabase.from("flashcards").insert(rows);
    if (insertError) {
      return { error: insertError.message };
    }
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to generate flashcards." };
  }

  revalidatePath(`/courses/${courseId}/flashcards`);
  return { error: null };
}

/** Records one flashcard review (knew it / didn't know it) during a study session. */
export async function recordFlashcardReview(flashcardId: string, known: boolean): Promise<void> {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) {
    throw new Error("You must be signed in.");
  }

  const { error } = await supabase.from("flashcard_reviews").insert({
    flashcard_id: flashcardId,
    user_id: auth.user.id,
    known,
  });

  if (error) {
    throw new Error(error.message);
  }
}
