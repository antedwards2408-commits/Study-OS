import { redirect } from "next/navigation";
import { io } from "next/cache";
import { BookOpen, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/ui/empty-state";
import { LinkButton } from "@/components/ui/button";
import { ContinueStudyingCard } from "@/components/dashboard/continue-studying-card";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { CoursesOverview } from "@/components/dashboard/courses-overview";
import { RecentMaterials } from "@/components/dashboard/recent-materials";
import { ActivitySummary } from "@/components/dashboard/activity-summary";
import { QuizPerformance } from "@/components/dashboard/quiz-performance";
import { MasteryHighlights } from "@/components/dashboard/mastery-highlights";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  const user = auth.user;
  if (!user) redirect("/sign-in");

  const [{ data: profile }, { data: courses }, { data: materials }] = await Promise.all([
    supabase.from("profiles").select("full_name, email").eq("id", user.id).single(),
    supabase
      .from("courses")
      .select("id, name, subject, color, created_at, updated_at")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false }),
    supabase
      .from("materials")
      .select("id, course_id, title, type, status, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
  ]);

  const rawName = profile?.full_name || profile?.email || user.email || "there";
  const firstName = rawName.includes("@") ? rawName.split("@")[0] : rawName.split(" ")[0];

  const courseList = courses ?? [];
  const materialList = materials ?? [];
  const hasCourses = courseList.length > 0;

  const courseNameById = new Map(courseList.map((c) => [c.id, c.name]));
  const materialCountByCourse = new Map<string, number>();
  for (const material of materialList) {
    materialCountByCourse.set(
      material.course_id,
      (materialCountByCourse.get(material.course_id) ?? 0) + 1,
    );
  }

  const recentMaterials = materialList.slice(0, 5);

  // `io()` is the documented way to read a non-deterministic value (the
  // current time) in a Server Component - see node_modules/next/dist/docs/
  // 01-app/03-api-reference/04-functions/io.md. Cache Components is off for
  // this app, so it resolves immediately and has no runtime effect; the
  // static react-hooks/purity rule can't see that, so it's silenced here.
  await io();
  // eslint-disable-next-line react-hooks/purity -- see comment above
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [
    { count: quizAttemptCount },
    { count: flashcardReviewCount },
    { count: practiceSessionCount },
    { data: recentAttempts },
    { data: masteryRows },
  ] = await Promise.all([
    supabase
      .from("quiz_attempts")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("started_at", sevenDaysAgo),
    supabase
      .from("flashcard_reviews")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("reviewed_at", sevenDaysAgo),
    supabase
      .from("practice_sessions")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("started_at", sevenDaysAgo),
    supabase
      .from("quiz_attempts")
      .select("id, quiz_id, course_id, score, total, completed_at")
      .eq("user_id", user.id)
      .not("completed_at", "is", null)
      .order("completed_at", { ascending: false })
      .limit(5),
    supabase
      .from("topic_mastery")
      .select("id, course_id, topic_id, mastery, attempts_count, last_attempt_at")
      .eq("user_id", user.id)
      .order("mastery", { ascending: true })
      .limit(6),
  ]);

  const quizIds = Array.from(new Set((recentAttempts ?? []).map((a) => a.quiz_id)));
  const topicIds = Array.from(new Set((masteryRows ?? []).map((t) => t.topic_id)));

  let quizzesData: { id: string; title: string }[] = [];
  let topicsData: { id: string; name: string }[] = [];

  const lookupQueries: PromiseLike<void>[] = [];
  if (quizIds.length > 0) {
    lookupQueries.push(
      supabase
        .from("quizzes")
        .select("id, title")
        .in("id", quizIds)
        .then(({ data }) => {
          quizzesData = data ?? [];
        }),
    );
  }
  if (topicIds.length > 0) {
    lookupQueries.push(
      supabase
        .from("topics")
        .select("id, name")
        .in("id", topicIds)
        .then(({ data }) => {
          topicsData = data ?? [];
        }),
    );
  }
  await Promise.all(lookupQueries);

  const quizTitleById = new Map(quizzesData.map((q) => [q.id, q.title]));
  const topicNameById = new Map(topicsData.map((t) => [t.id, t.name]));

  const primaryCourseId = recentMaterials[0]?.course_id ?? courseList[0]?.id ?? null;
  const continueMaterialTitle = recentMaterials[0]?.title ?? null;
  const continueCourseName = primaryCourseId ? courseNameById.get(primaryCourseId) ?? "" : "";

  const courseItems = courseList.map((course) => ({
    id: course.id,
    name: course.name,
    subject: course.subject,
    materialCount: materialCountByCourse.get(course.id) ?? 0,
  }));

  const recentMaterialItems = recentMaterials.map((material) => ({
    id: material.id,
    title: material.title,
    type: material.type,
    status: material.status,
    courseId: material.course_id,
    courseName: courseNameById.get(material.course_id) ?? "",
    createdAt: material.created_at,
  }));

  const quizPerformanceItems = (recentAttempts ?? []).map((attempt) => ({
    id: attempt.id,
    quizTitle: quizTitleById.get(attempt.quiz_id) ?? "Quiz",
    courseName: courseNameById.get(attempt.course_id) ?? "",
    courseId: attempt.course_id,
    score: attempt.score,
    total: attempt.total,
    completedAt: attempt.completed_at as string,
  }));

  const masteryItems = (masteryRows ?? []).map((row) => ({
    id: row.id,
    topicName: topicNameById.get(row.topic_id) ?? "Topic",
    courseName: courseNameById.get(row.course_id) ?? "",
    courseId: row.course_id,
    mastery: Number(row.mastery),
  }));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Welcome back, {firstName}</h1>
        <p className="mt-1 text-muted">Here&apos;s where you left off.</p>
      </div>

      {!hasCourses ? (
        <EmptyState
          icon={<BookOpen className="h-10 w-10" />}
          title="Create your first course to get started"
          description="Courses keep your materials, flashcards, quizzes and practice organized. Add one, then upload a PDF or your notes to start the study loop: upload, ask AI, generate flashcards and quizzes, then practice your weak spots."
          action={
            <LinkButton href="/courses">
              <Plus className="h-4 w-4" />
              Create a course
            </LinkButton>
          }
        />
      ) : (
        <>
          {primaryCourseId && (
            <ContinueStudyingCard
              courseId={primaryCourseId}
              courseName={continueCourseName}
              materialTitle={continueMaterialTitle}
            />
          )}

          {primaryCourseId && <QuickActions courseId={primaryCourseId} />}

          <div className="grid gap-6 lg:grid-cols-2">
            <CoursesOverview courses={courseItems} />
            <RecentMaterials materials={recentMaterialItems} />
          </div>

          <ActivitySummary
            quizAttempts={quizAttemptCount ?? 0}
            flashcardReviews={flashcardReviewCount ?? 0}
            practiceSessions={practiceSessionCount ?? 0}
          />

          <div className="grid gap-6 lg:grid-cols-2">
            <QuizPerformance attempts={quizPerformanceItems} />
            <MasteryHighlights items={masteryItems} />
          </div>
        </>
      )}
    </div>
  );
}
