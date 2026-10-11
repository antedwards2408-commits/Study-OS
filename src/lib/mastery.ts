import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

const HALF_LIFE_DAYS = 14;
const MAX_SAMPLES = 50;

function recencyWeight(timestamp: string, now: number): number {
  const ageDays = (now - new Date(timestamp).getTime()) / 86_400_000;
  return Math.pow(0.5, Math.max(ageDays, 0) / HALF_LIFE_DAYS);
}

/**
 * Recomputes and upserts topic_mastery for one (user, topic) pair from recent
 * quiz and practice performance. Call this after a quiz attempt is scored or
 * a practice session completes - it's the single source of truth both
 * features should use so mastery numbers stay consistent across the app.
 */
export async function recomputeTopicMastery(
  supabase: SupabaseClient<Database>,
  params: { userId: string; courseId: string; topicId: string },
): Promise<number | null> {
  const { userId, courseId, topicId } = params;
  const now = Date.now();

  const [{ data: quizAnswers }, { data: practiceSessions }] = await Promise.all([
    supabase
      .from("quiz_answers")
      .select("is_correct, answered_at")
      .eq("user_id", userId)
      .eq("topic_id", topicId)
      .order("answered_at", { ascending: false })
      .limit(MAX_SAMPLES),
    supabase
      .from("practice_sessions")
      .select("id, completed_at")
      .eq("user_id", userId)
      .eq("topic_id", topicId)
      .not("completed_at", "is", null)
      .order("completed_at", { ascending: false })
      .limit(20),
  ]);

  type Sample = { correct: boolean; at: string };
  const samples: Sample[] = (quizAnswers ?? []).map((a) => ({
    correct: a.is_correct,
    at: a.answered_at,
  }));

  const sessionIds = (practiceSessions ?? []).map((s) => s.id);
  if (sessionIds.length > 0) {
    const { data: practiceQuestions } = await supabase
      .from("practice_questions")
      .select("practice_session_id, is_correct")
      .in("practice_session_id", sessionIds)
      .not("is_correct", "is", null);

    const sessionCompletedAt = new Map(
      (practiceSessions ?? []).map((s) => [s.id, s.completed_at as string]),
    );
    for (const q of practiceQuestions ?? []) {
      const at = sessionCompletedAt.get(q.practice_session_id);
      if (at) samples.push({ correct: q.is_correct as boolean, at });
    }
  }

  if (samples.length === 0) return null;

  let weightedCorrect = 0;
  let weightTotal = 0;
  let lastAttemptAt = samples[0].at;

  for (const sample of samples) {
    const w = recencyWeight(sample.at, now);
    weightedCorrect += w * (sample.correct ? 1 : 0);
    weightTotal += w;
    if (new Date(sample.at).getTime() > new Date(lastAttemptAt).getTime()) {
      lastAttemptAt = sample.at;
    }
  }

  const mastery = Math.round((weightedCorrect / weightTotal) * 100);

  await supabase.from("topic_mastery").upsert(
    {
      user_id: userId,
      course_id: courseId,
      topic_id: topicId,
      mastery,
      attempts_count: samples.length,
      last_attempt_at: lastAttemptAt,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,topic_id" },
  );

  return mastery;
}
