import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { QuizRunner } from "@/components/quizzes/quiz-runner";

export default async function QuizPage({ params }: PageProps<"/courses/[courseId]/quizzes/[quizId]">) {
  const { courseId, quizId } = await params;
  const supabase = await createClient();

  const [{ data: quiz }, { data: questions }, { data: attempts }] = await Promise.all([
    supabase.from("quizzes").select("id, title, material_id").eq("id", quizId).eq("course_id", courseId).single(),
    supabase
      .from("quiz_questions")
      .select("id, question, choices, order_index")
      .eq("quiz_id", quizId)
      .order("order_index", { ascending: true }),
    supabase
      .from("quiz_attempts")
      .select("id, score, total, completed_at")
      .eq("quiz_id", quizId)
      .not("completed_at", "is", null)
      .order("completed_at", { ascending: false }),
  ]);

  if (!quiz) notFound();

  const questionList = questions ?? [];

  if (questionList.length === 0) {
    return (
      <Card>
        <CardHeader title={quiz.title} description="This quiz has no questions yet." />
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-lg font-semibold text-foreground">{quiz.title}</h2>
        <Badge tone="brand">
          {questionList.length} question{questionList.length === 1 ? "" : "s"}
        </Badge>
      </div>

      {attempts && attempts.length > 0 && (
        <Card>
          <CardHeader title="Past attempts" />
          <div className="flex flex-col divide-y divide-border">
            {attempts.map((attempt) => (
              <Link
                key={attempt.id}
                href={`/courses/${courseId}/quizzes/${quizId}/results/${attempt.id}`}
                className="flex items-center justify-between py-2.5 text-sm text-foreground hover:text-brand"
              >
                <span className="text-muted">
                  {attempt.completed_at ? new Date(attempt.completed_at).toLocaleString() : "In progress"}
                </span>
                <span className="font-medium">
                  {attempt.score}/{attempt.total}
                </span>
              </Link>
            ))}
          </div>
        </Card>
      )}

      <QuizRunner
        quizId={quiz.id}
        courseId={courseId}
        questions={questionList.map((q) => ({ id: q.id, question: q.question, choices: q.choices }))}
      />
    </div>
  );
}
