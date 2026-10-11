import Link from "next/link";
import { FileText, ClipboardList, Target } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { LinkButton } from "@/components/ui/button";
import { StatCard } from "@/components/courses/stat-card";
import { TopicMasteryList } from "@/components/courses/topic-mastery-list";
import { RecentMaterialsList } from "@/components/courses/recent-materials-list";
import { QuizAttemptsList } from "@/components/courses/quiz-attempts-list";

export default async function CourseOverviewPage(
  props: PageProps<"/courses/[courseId]">,
) {
  const { courseId } = await props.params;
  const supabase = await createClient();

  const [
    { count: materialCount },
    { data: recentMaterials },
    { count: quizAttemptCount },
    { data: recentAttempts },
    { data: topics },
    { data: masteryRows },
  ] = await Promise.all([
    supabase
      .from("materials")
      .select("id", { count: "exact", head: true })
      .eq("course_id", courseId),
    supabase
      .from("materials")
      .select("id, title, status")
      .eq("course_id", courseId)
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("quiz_attempts")
      .select("id", { count: "exact", head: true })
      .eq("course_id", courseId),
    supabase
      .from("quiz_attempts")
      .select("id, quiz_id, score, total, completed_at")
      .eq("course_id", courseId)
      .order("started_at", { ascending: false })
      .limit(5),
    supabase
      .from("topics")
      .select("id, name")
      .eq("course_id", courseId)
      .order("name", { ascending: true }),
    supabase
      .from("topic_mastery")
      .select("topic_id, mastery")
      .eq("course_id", courseId),
  ]);

  if ((materialCount ?? 0) === 0) {
    return (
      <EmptyState
        icon={<FileText className="h-10 w-10" />}
        title="Add your first material to get started"
        description="Upload a PDF or paste in notes from the Materials tab. Once you have material, you can ask AI questions, generate flashcards and quizzes, and track mastery here."
        action={
          <LinkButton href={`/courses/${courseId}/materials`}>
            Go to Materials
          </LinkButton>
        }
      />
    );
  }

  const quizIds = Array.from(
    new Set((recentAttempts ?? []).map((attempt) => attempt.quiz_id)),
  );
  const { data: quizzes } =
    quizIds.length > 0
      ? await supabase.from("quizzes").select("id, title").in("id", quizIds)
      : { data: [] as { id: string; title: string }[] };
  const quizTitleById = new Map(
    (quizzes ?? []).map((quiz) => [quiz.id, quiz.title]),
  );

  const masteryByTopic = new Map(
    (masteryRows ?? []).map((row) => [row.topic_id, row.mastery]),
  );

  const topicRows = (topics ?? [])
    .map((topic) => ({
      id: topic.id,
      name: topic.name,
      mastery: masteryByTopic.get(topic.id) ?? null,
    }))
    .sort((a, b) => {
      const aStarted = a.mastery !== null;
      const bStarted = b.mastery !== null;
      if (aStarted && bStarted) return (a.mastery as number) - (b.mastery as number);
      if (aStarted) return -1;
      if (bStarted) return 1;
      return a.name.localeCompare(b.name);
    });

  const attemptedTopics = topicRows.filter((topic) => topic.mastery !== null);
  const overallMastery =
    attemptedTopics.length > 0
      ? Math.round(
          attemptedTopics.reduce(
            (sum, topic) => sum + (topic.mastery as number),
            0,
          ) / attemptedTopics.length,
        )
      : null;

  const attemptRows = (recentAttempts ?? []).map((attempt) => ({
    id: attempt.id,
    title: quizTitleById.get(attempt.quiz_id) ?? "Quiz",
    score: attempt.score,
    total: attempt.total,
    completedAt: attempt.completed_at,
  }));

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          icon={<FileText className="h-5 w-5" />}
          label="Materials"
          value={String(materialCount ?? 0)}
        />
        <StatCard
          icon={<ClipboardList className="h-5 w-5" />}
          label="Quiz attempts"
          value={String(quizAttemptCount ?? 0)}
        />
        <StatCard
          icon={<Target className="h-5 w-5" />}
          label="Overall mastery"
          value={overallMastery !== null ? `${overallMastery}%` : "--"}
          hint={
            overallMastery === null
              ? "Take a quiz or practice session to see this"
              : undefined
          }
        />
      </div>

      <Card>
        <CardHeader
          title="Topic mastery"
          description="Weakest topics first - tap one to practice it."
        />
        {topicRows.length === 0 ? (
          <p className="text-sm text-muted">
            No topics yet. Topics appear automatically as you add materials
            and take quizzes.
          </p>
        ) : (
          <TopicMasteryList courseId={courseId} topics={topicRows} />
        )}
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader
            title="Recent materials"
            action={
              <Link
                href={`/courses/${courseId}/materials`}
                className="text-sm font-medium text-brand hover:underline"
              >
                View all
              </Link>
            }
          />
          {recentMaterials && recentMaterials.length > 0 ? (
            <RecentMaterialsList materials={recentMaterials} />
          ) : (
            <p className="text-sm text-muted">No materials yet.</p>
          )}
        </Card>

        <Card>
          <CardHeader
            title="Recent quiz attempts"
            action={
              <Link
                href={`/courses/${courseId}/quizzes`}
                className="text-sm font-medium text-brand hover:underline"
              >
                View all
              </Link>
            }
          />
          {attemptRows.length > 0 ? (
            <QuizAttemptsList attempts={attemptRows} />
          ) : (
            <p className="text-sm text-muted">No quizzes taken yet.</p>
          )}
        </Card>
      </div>
    </div>
  );
}
