import { Brain, ClipboardList, Layers, Sparkles, TrendingUp } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/ui/empty-state";
import { LinkButton } from "@/components/ui/button";
import { StatTile } from "@/components/progress/stat-tile";
import { WeakAreasCallout, type WeakTopic } from "@/components/progress/weak-areas-callout";
import {
  TopicMasteryList,
  type TopicMasteryRow,
} from "@/components/progress/topic-mastery-list";
import {
  CourseProgressGrid,
  type CourseProgressRow,
} from "@/components/progress/course-progress-grid";
import { QuizScoreList, type QuizScoreRow } from "@/components/progress/quiz-score-list";
import { FlashcardSummary } from "@/components/progress/flashcard-summary";
import {
  RecentActivityFeed,
  type ActivityItem,
} from "@/components/progress/recent-activity-feed";
import { sevenDaysAgoIso } from "@/components/progress/format";

// This is the GLOBAL progress view, aggregated across every one of the
// student's courses - distinct from the per-course Overview tab. Cache
// Components / PPR is disabled project-wide, so this is a plain dynamic
// Server Component that reads fresh, per-user data on every request.
export default async function ProgressPage() {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  const user = authData.user;

  if (!user) {
    return (
      <EmptyState
        title="Sign in to see your progress"
        description="Your study activity will show up here once you're signed in."
      />
    );
  }

  const weekAgoIso = sevenDaysAgoIso();

  const [
    { data: courses },
    { data: topics },
    { data: mastery },
    { data: quizAttempts },
    { data: practiceSessions },
    { data: materials },
    { data: flashcardReviews },
    { count: totalQuizAttempts },
    { count: totalPracticeSessions },
    { count: totalFlashcardReviews },
    { count: totalFlashcardsKnown },
    { count: totalMaterials },
    { count: quizAttemptsThisWeek },
    { count: practiceSessionsThisWeek },
    { count: flashcardReviewsThisWeek },
  ] = await Promise.all([
    supabase.from("courses").select("id, name, subject, color").eq("user_id", user.id),
    supabase.from("topics").select("id, course_id, name").eq("user_id", user.id),
    supabase
      .from("topic_mastery")
      .select("id, course_id, topic_id, mastery, attempts_count, last_attempt_at")
      .eq("user_id", user.id)
      .order("mastery", { ascending: true }),
    supabase
      .from("quiz_attempts")
      .select("id, quiz_id, course_id, score, total, completed_at")
      .eq("user_id", user.id)
      .not("completed_at", "is", null)
      .order("completed_at", { ascending: false })
      .limit(10),
    supabase
      .from("practice_sessions")
      .select("id, course_id, topic_id, score, total, completed_at")
      .eq("user_id", user.id)
      .not("completed_at", "is", null)
      .order("completed_at", { ascending: false })
      .limit(10),
    supabase
      .from("materials")
      .select("id, course_id, title, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10),
    supabase
      .from("flashcard_reviews")
      .select("id, flashcard_id, known, reviewed_at")
      .eq("user_id", user.id)
      .order("reviewed_at", { ascending: false })
      .limit(30),
    supabase
      .from("quiz_attempts")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .not("completed_at", "is", null),
    supabase
      .from("practice_sessions")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .not("completed_at", "is", null),
    supabase
      .from("flashcard_reviews")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id),
    supabase
      .from("flashcard_reviews")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("known", true),
    supabase
      .from("materials")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id),
    supabase
      .from("quiz_attempts")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .not("completed_at", "is", null)
      .gte("completed_at", weekAgoIso),
    supabase
      .from("practice_sessions")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .not("completed_at", "is", null)
      .gte("completed_at", weekAgoIso),
    supabase
      .from("flashcard_reviews")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("reviewed_at", weekAgoIso),
  ]);

  const coursesData = courses ?? [];
  const topicsData = topics ?? [];
  const masteryData = mastery ?? [];
  const quizAttemptsData = quizAttempts ?? [];
  const practiceSessionsData = practiceSessions ?? [];
  const materialsData = materials ?? [];
  const flashcardReviewsData = flashcardReviews ?? [];

  const hasAnyActivity =
    coursesData.length > 0 ||
    (totalQuizAttempts ?? 0) > 0 ||
    (totalPracticeSessions ?? 0) > 0 ||
    (totalFlashcardReviews ?? 0) > 0 ||
    (totalMaterials ?? 0) > 0;

  if (!hasAnyActivity) {
    return (
      <EmptyState
        icon={<Sparkles className="h-8 w-8" />}
        title="No progress yet"
        description="Upload a course material to start the study loop - ask questions, make flashcards, take quizzes, and track mastery here as you go."
        action={<LinkButton href="/courses">Go to courses</LinkButton>}
      />
    );
  }

  // Lookup maps to join the flat tables above without relying on PostgREST
  // embedded-resource typing (the shared Database type declares no FK
  // Relationships, so manual joins keep this fully type-safe).
  const courseNameById = new Map(coursesData.map((c) => [c.id, c.name]));
  const topicNameById = new Map(topicsData.map((t) => [t.id, t.name]));

  // ---- Topic mastery (every assessed topic, weakest first) ----
  const topicMasteryRows: TopicMasteryRow[] = masteryData.map((m) => ({
    topicId: m.topic_id,
    topicName: topicNameById.get(m.topic_id) ?? "Unknown topic",
    courseId: m.course_id,
    courseName: courseNameById.get(m.course_id) ?? "Unknown course",
    mastery: Math.round(m.mastery),
    attemptsCount: m.attempts_count,
    lastAttemptAt: m.last_attempt_at,
  }));

  const weakTopics: WeakTopic[] = topicMasteryRows
    .filter((t) => t.mastery < 75)
    .slice(0, 5)
    .map((t) => ({
      topicId: t.topicId,
      topicName: t.topicName,
      courseId: t.courseId,
      courseName: t.courseName,
      mastery: t.mastery,
    }));

  // ---- Per-course progress summary ----
  const topicCountByCourse = new Map<string, number>();
  for (const t of topicsData) {
    topicCountByCourse.set(t.course_id, (topicCountByCourse.get(t.course_id) ?? 0) + 1);
  }

  const masteryValuesByCourse = new Map<string, number[]>();
  for (const m of masteryData) {
    const arr = masteryValuesByCourse.get(m.course_id) ?? [];
    arr.push(m.mastery);
    masteryValuesByCourse.set(m.course_id, arr);
  }

  const courseProgress: CourseProgressRow[] = coursesData.map((c) => {
    const masteries = masteryValuesByCourse.get(c.id) ?? [];
    const averageMastery =
      masteries.length > 0
        ? Math.round(masteries.reduce((sum, v) => sum + v, 0) / masteries.length)
        : null;
    return {
      courseId: c.id,
      courseName: c.name,
      topicCount: topicCountByCourse.get(c.id) ?? 0,
      averageMastery,
    };
  });

  // ---- Recent quiz scores ----
  const quizIds = Array.from(new Set(quizAttemptsData.map((a) => a.quiz_id)));
  const { data: quizzesData } =
    quizIds.length > 0
      ? await supabase.from("quizzes").select("id, title").in("id", quizIds)
      : { data: [] as { id: string; title: string }[] };
  const quizTitleById = new Map((quizzesData ?? []).map((q) => [q.id, q.title]));

  const quizScoreRows: QuizScoreRow[] = quizAttemptsData.map((a) => ({
    id: a.id,
    quizTitle: quizTitleById.get(a.quiz_id) ?? "Quiz",
    courseName: courseNameById.get(a.course_id) ?? "Unknown course",
    score: a.score,
    total: a.total,
    completedAt: a.completed_at as string,
  }));

  // ---- Recent activity feed (merge + sort every source) ----
  const quizActivity: ActivityItem[] = quizScoreRows.map((q) => ({
    id: `quiz-${q.id}`,
    kind: "quiz",
    title: `Scored ${q.score}/${q.total} on "${q.quizTitle}"`,
    subtitle: q.courseName,
    timestamp: q.completedAt,
  }));

  const practiceActivity: ActivityItem[] = practiceSessionsData.map((p) => ({
    id: `practice-${p.id}`,
    kind: "practice",
    title: `Practiced "${topicNameById.get(p.topic_id) ?? "a topic"}" - ${p.score}/${p.total}`,
    subtitle: courseNameById.get(p.course_id) ?? "Unknown course",
    timestamp: p.completed_at as string,
  }));

  const materialActivity: ActivityItem[] = materialsData.map((m) => ({
    id: `material-${m.id}`,
    kind: "material",
    title: `Uploaded "${m.title}"`,
    subtitle: courseNameById.get(m.course_id) ?? "Unknown course",
    timestamp: m.created_at,
  }));

  // Flashcard reviews have no "session" concept in the schema, so group
  // same-day, same-course reviews into one feed entry to keep the feed
  // readable instead of flooding it with one row per card.
  const flashcardIds = Array.from(new Set(flashcardReviewsData.map((r) => r.flashcard_id)));
  const { data: flashcardsData } =
    flashcardIds.length > 0
      ? await supabase.from("flashcards").select("id, course_id").in("id", flashcardIds)
      : { data: [] as { id: string; course_id: string }[] };
  const flashcardCourseById = new Map((flashcardsData ?? []).map((f) => [f.id, f.course_id]));

  interface FlashcardGroup {
    courseId: string;
    count: number;
    known: number;
    latest: string;
  }
  const flashcardGroups = new Map<string, FlashcardGroup>();
  for (const review of flashcardReviewsData) {
    const courseId = flashcardCourseById.get(review.flashcard_id) ?? "unknown";
    const day = review.reviewed_at.slice(0, 10);
    const key = `${courseId}-${day}`;
    const existing = flashcardGroups.get(key);
    if (existing) {
      existing.count += 1;
      if (review.known) existing.known += 1;
      if (review.reviewed_at > existing.latest) existing.latest = review.reviewed_at;
    } else {
      flashcardGroups.set(key, {
        courseId,
        count: 1,
        known: review.known ? 1 : 0,
        latest: review.reviewed_at,
      });
    }
  }

  const flashcardActivity: ActivityItem[] = Array.from(flashcardGroups.entries()).map(
    ([key, g]) => ({
      id: `flashcards-${key}`,
      kind: "flashcard",
      title: `Reviewed ${g.count} flashcard${g.count === 1 ? "" : "s"} (${g.known} known)`,
      subtitle: courseNameById.get(g.courseId) ?? "Unknown course",
      timestamp: g.latest,
    }),
  );

  const recentActivity = [...quizActivity, ...practiceActivity, ...flashcardActivity, ...materialActivity]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 15);

  const activityThisWeek =
    (quizAttemptsThisWeek ?? 0) + (practiceSessionsThisWeek ?? 0) + (flashcardReviewsThisWeek ?? 0);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Progress</h1>
        <p className="text-sm text-muted mt-1">
          Your academic progress across every course, in one place.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          icon={<ClipboardList className="h-4 w-4" />}
          label="Quiz attempts"
          value={totalQuizAttempts ?? 0}
        />
        <StatTile
          icon={<Layers className="h-4 w-4" />}
          label="Flashcards reviewed"
          value={totalFlashcardReviews ?? 0}
          hint={`${totalFlashcardsKnown ?? 0} known`}
        />
        <StatTile
          icon={<Brain className="h-4 w-4" />}
          label="Practice sessions"
          value={totalPracticeSessions ?? 0}
        />
        <StatTile
          icon={<TrendingUp className="h-4 w-4" />}
          label="Activity this week"
          value={activityThisWeek}
        />
      </div>

      <WeakAreasCallout topics={weakTopics} />

      <div className="grid gap-4 lg:grid-cols-2">
        <QuizScoreList attempts={quizScoreRows} />
        <FlashcardSummary total={totalFlashcardReviews ?? 0} known={totalFlashcardsKnown ?? 0} />
      </div>

      <CourseProgressGrid courses={courseProgress} />

      <TopicMasteryList rows={topicMasteryRows} />

      <RecentActivityFeed items={recentActivity} />
    </div>
  );
}
