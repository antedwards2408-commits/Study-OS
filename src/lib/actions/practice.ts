"use server";

import { createClient } from "@/lib/supabase/server";
import { generatePracticeQuestions } from "@/lib/ai/generate";
import { AIError } from "@/lib/ai/groq";
import { getTopicChunks } from "@/lib/ai/topic-chunks";
import { recomputeTopicMastery } from "@/lib/mastery";

const QUESTIONS_PER_SESSION = 6;
const CHUNKS_PER_SESSION = 8;

export interface PracticeQuestionView {
  id: string;
  question: string;
  choices: string[];
  correctIndex: number;
  explanation: string | null;
}

export type StartPracticeResult =
  | {
      ok: true;
      sessionId: string;
      topicName: string;
      questions: PracticeQuestionView[];
    }
  | {
      ok: false;
      error: "unauthorized" | "not-found" | "no-chunks" | "generation-failed";
      message?: string;
    };

/**
 * Starts a new practice session for a topic: pulls tagged material chunks,
 * generates grounded questions, and persists the session + questions rows.
 */
export async function startPracticeSession(
  courseId: string,
  topicId: string,
): Promise<StartPracticeResult> {
  const supabase = await createClient();

  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { ok: false, error: "unauthorized" };

  const { data: topic } = await supabase
    .from("topics")
    .select("id, name, description")
    .eq("id", topicId)
    .eq("course_id", courseId)
    .single();

  if (!topic) return { ok: false, error: "not-found" };

  const chunks = await getTopicChunks(supabase, {
    courseId,
    topicId,
    topicName: topic.name,
    topicDescription: topic.description,
    limit: CHUNKS_PER_SESSION,
  });
  if (chunks.length === 0) return { ok: false, error: "no-chunks" };

  let generated;
  try {
    generated = await generatePracticeQuestions({
      topicName: topic.name,
      chunks,
      count: QUESTIONS_PER_SESSION,
    });
  } catch (err) {
    console.error("[practice] generation failed", err);
    return {
      ok: false,
      error: "generation-failed",
      message: err instanceof AIError ? err.message : "Failed to generate practice questions - please try again.",
    };
  }

  if (!generated || generated.length === 0) {
    return { ok: false, error: "generation-failed", message: "No questions were generated." };
  }

  const { data: session, error: sessionError } = await supabase
    .from("practice_sessions")
    .insert({
      course_id: courseId,
      topic_id: topicId,
      user_id: auth.user.id,
      started_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (sessionError || !session) {
    return {
      ok: false,
      error: "generation-failed",
      message: sessionError?.message ?? "Failed to create practice session.",
    };
  }

  const { data: insertedQuestions, error: questionsError } = await supabase
    .from("practice_questions")
    .insert(
      generated.map((q, index) => ({
        practice_session_id: session.id,
        question: q.question,
        choices: q.choices,
        correct_index: q.correctIndex,
        explanation: q.explanation,
        order_index: index,
      })),
    )
    .select("id, question, choices, correct_index, explanation, order_index")
    .order("order_index");

  if (questionsError || !insertedQuestions) {
    return {
      ok: false,
      error: "generation-failed",
      message: questionsError?.message ?? "Failed to save practice questions.",
    };
  }

  return {
    ok: true,
    sessionId: session.id,
    topicName: topic.name,
    questions: insertedQuestions.map((q) => ({
      id: q.id,
      question: q.question,
      choices: q.choices as string[],
      correctIndex: q.correct_index,
      explanation: q.explanation,
    })),
  };
}

export interface PracticeAnswer {
  questionId: string;
  selectedIndex: number;
}

export interface ScoredPracticeQuestion {
  id: string;
  question: string;
  choices: string[];
  correctIndex: number;
  explanation: string | null;
  selectedIndex: number | null;
  isCorrect: boolean;
}

export type SubmitPracticeResult =
  | {
      ok: true;
      score: number;
      total: number;
      mastery: number | null;
      questions: ScoredPracticeQuestion[];
    }
  | { ok: false; error: "unauthorized" | "not-found"; message?: string };

/**
 * Scores a completed practice session: records each answer, finalizes the
 * session's score/total, and recomputes the topic's mastery.
 */
export async function submitPracticeSession(
  sessionId: string,
  answers: PracticeAnswer[],
): Promise<SubmitPracticeResult> {
  const supabase = await createClient();

  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { ok: false, error: "unauthorized" };

  const { data: session } = await supabase
    .from("practice_sessions")
    .select("id, course_id, topic_id, user_id")
    .eq("id", sessionId)
    .single();

  if (!session) return { ok: false, error: "not-found" };

  const { data: existingQuestions } = await supabase
    .from("practice_questions")
    .select("id, question, choices, correct_index, explanation, order_index")
    .eq("practice_session_id", sessionId)
    .order("order_index");

  if (!existingQuestions || existingQuestions.length === 0) {
    return { ok: false, error: "not-found", message: "This session has no questions." };
  }

  const answerMap = new Map(answers.map((a) => [a.questionId, a.selectedIndex]));

  const scored: ScoredPracticeQuestion[] = existingQuestions.map((q) => {
    const selectedIndex = answerMap.has(q.id) ? answerMap.get(q.id)! : null;
    const isCorrect = selectedIndex !== null && selectedIndex === q.correct_index;
    return {
      id: q.id,
      question: q.question,
      choices: q.choices as string[],
      correctIndex: q.correct_index,
      explanation: q.explanation,
      selectedIndex,
      isCorrect,
    };
  });

  await supabase.from("practice_questions").upsert(
    scored.map((q) => ({
      id: q.id,
      practice_session_id: sessionId,
      question: q.question,
      choices: q.choices,
      correct_index: q.correctIndex,
      explanation: q.explanation,
      selected_index: q.selectedIndex,
      is_correct: q.isCorrect,
    })),
  );

  const score = scored.filter((q) => q.isCorrect).length;
  const total = scored.length;

  await supabase
    .from("practice_sessions")
    .update({ score, total, completed_at: new Date().toISOString() })
    .eq("id", sessionId);

  const mastery = await recomputeTopicMastery(supabase, {
    userId: session.user_id,
    courseId: session.course_id,
    topicId: session.topic_id,
  });

  return { ok: true, score, total, mastery, questions: scored };
}
