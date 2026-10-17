"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { generateQuiz } from "@/lib/ai/generate";
import { recomputeTopicMastery } from "@/lib/mastery";

const QUIZ_QUESTION_COUNT = 8;

export interface GenerateQuizState {
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
 * Generates a quiz for one material and inserts it + its questions, bound to a <form action>.
 * Expects hidden fields "materialId" and "courseId". On success, redirects to the new quiz.
 */
export async function generateQuizAction(
  _prevState: GenerateQuizState,
  formData: FormData,
): Promise<GenerateQuizState> {
  const materialId = String(formData.get("materialId") ?? "");
  const courseId = String(formData.get("courseId") ?? "");

  if (!materialId || !courseId) {
    return { error: "Missing material." };
  }

  let quizId: string;

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

    const generated = await generateQuiz({
      materialTitle: material.title,
      chunks,
      topics: topics.map((t) => t.name),
      count: QUIZ_QUESTION_COUNT,
    });

    if (!generated || generated.length === 0) {
      return { error: "The AI didn't return any questions. Try again." };
    }

    const { data: quiz, error: quizError } = await supabase
      .from("quizzes")
      .insert({
        course_id: courseId,
        material_id: materialId,
        user_id: auth.user.id,
        title: `${material.title} Quiz`,
      })
      .select("id")
      .single();

    if (quizError || !quiz) {
      return { error: quizError?.message ?? "Failed to create quiz." };
    }

    const questionRows = generated.map((q, index) => ({
      quiz_id: quiz.id,
      topic_id: matchTopicId(q.topicName, topicsByLowerName),
      question: q.question,
      choices: q.choices,
      correct_index: q.correctIndex,
      explanation: q.explanation,
      order_index: index,
    }));

    const { error: questionsError } = await supabase.from("quiz_questions").insert(questionRows);
    if (questionsError) {
      return { error: questionsError.message };
    }

    quizId = quiz.id as string;
  } catch (err) {
    console.error("[quizzes] generation failed", err);
    return { error: err instanceof Error ? err.message : "Failed to generate quiz." };
  }

  revalidatePath(`/courses/${courseId}/quizzes`);
  redirect(`/courses/${courseId}/quizzes/${quizId}`);
}

export interface QuizSubmissionAnswer {
  questionId: string;
  selectedIndex: number | null;
}

/**
 * Scores a completed quiz attempt: creates the attempt, records one answer per question
 * (never trusting a client-sent correct_index), updates the attempt's score/total, and
 * recomputes topic_mastery for every distinct topic touched.
 */
export async function submitQuizAttempt(params: {
  quizId: string;
  courseId: string;
  answers: QuizSubmissionAnswer[];
}): Promise<{ attemptId: string }> {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) {
    throw new Error("You must be signed in.");
  }

  const { data: quiz } = await supabase
    .from("quizzes")
    .select("id, course_id, user_id")
    .eq("id", params.quizId)
    .eq("course_id", params.courseId)
    .single();

  if (!quiz) {
    throw new Error("Quiz not found.");
  }

  const { data: questions } = await supabase
    .from("quiz_questions")
    .select("id, correct_index, topic_id")
    .eq("quiz_id", params.quizId);

  if (!questions || questions.length === 0) {
    throw new Error("This quiz has no questions.");
  }

  const questionById = new Map(questions.map((q) => [q.id, q]));

  const { data: attempt, error: attemptError } = await supabase
    .from("quiz_attempts")
    .insert({
      quiz_id: params.quizId,
      course_id: params.courseId,
      user_id: auth.user.id,
      total: questions.length,
    })
    .select("id")
    .single();

  if (attemptError || !attempt) {
    throw new Error(attemptError?.message ?? "Failed to start attempt.");
  }

  let score = 0;
  const answerRows = params.answers
    .filter((a) => questionById.has(a.questionId))
    .map((a) => {
      const question = questionById.get(a.questionId)!;
      const isCorrect = a.selectedIndex !== null && a.selectedIndex === question.correct_index;
      if (isCorrect) score += 1;
      return {
        attempt_id: attempt.id as string,
        question_id: a.questionId,
        topic_id: question.topic_id,
        user_id: auth.user!.id,
        selected_index: a.selectedIndex,
        is_correct: isCorrect,
      };
    });

  const { error: answersError } = await supabase.from("quiz_answers").insert(answerRows);
  if (answersError) {
    throw new Error(answersError.message);
  }

  const { error: updateError } = await supabase
    .from("quiz_attempts")
    .update({
      score,
      total: questions.length,
      completed_at: new Date().toISOString(),
    })
    .eq("id", attempt.id);

  if (updateError) {
    throw new Error(updateError.message);
  }

  const touchedTopicIds = [...new Set(answerRows.map((r) => r.topic_id).filter((t): t is string => !!t))];
  for (const topicId of touchedTopicIds) {
    await recomputeTopicMastery(supabase, {
      userId: auth.user.id,
      courseId: params.courseId,
      topicId,
    });
  }

  revalidatePath(`/courses/${params.courseId}/quizzes`);

  return { attemptId: attempt.id as string };
}
