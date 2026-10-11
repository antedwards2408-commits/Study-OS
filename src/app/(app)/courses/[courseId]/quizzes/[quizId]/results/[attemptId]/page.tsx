import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LinkButton } from "@/components/ui/button";
import { ProgressBar } from "@/components/ui/progress-bar";
import { cn } from "@/lib/utils";

export default async function QuizResultsPage({
  params,
}: PageProps<"/courses/[courseId]/quizzes/[quizId]/results/[attemptId]">) {
  const { courseId, quizId, attemptId } = await params;
  const supabase = await createClient();

  const [{ data: attempt }, { data: quiz }, { data: answers }, { data: questions }, { data: topics }] =
    await Promise.all([
      supabase
        .from("quiz_attempts")
        .select("id, score, total, completed_at, started_at")
        .eq("id", attemptId)
        .eq("quiz_id", quizId)
        .single(),
      supabase.from("quizzes").select("id, title").eq("id", quizId).eq("course_id", courseId).single(),
      supabase
        .from("quiz_answers")
        .select("id, question_id, topic_id, selected_index, is_correct")
        .eq("attempt_id", attemptId),
      supabase
        .from("quiz_questions")
        .select("id, question, choices, correct_index, explanation, order_index")
        .eq("quiz_id", quizId),
      supabase.from("topics").select("id, name").eq("course_id", courseId),
    ]);

  if (!attempt || !quiz) notFound();

  const questionById = new Map((questions ?? []).map((q) => [q.id, q]));
  const topicNameById = new Map((topics ?? []).map((t) => [t.id, t.name]));

  const rows = (answers ?? [])
    .map((answer) => {
      const question = questionById.get(answer.question_id);
      if (!question) return null;
      return {
        id: answer.id,
        selectedIndex: answer.selected_index,
        isCorrect: answer.is_correct,
        topicName: answer.topic_id ? topicNameById.get(answer.topic_id) ?? null : null,
        question: question.question,
        choices: question.choices,
        correctIndex: question.correct_index,
        explanation: question.explanation,
        orderIndex: question.order_index,
      };
    })
    .filter((r): r is NonNullable<typeof r> => r !== null)
    .sort((a, b) => a.orderIndex - b.orderIndex);

  const missedTopics = [
    ...new Set(rows.filter((r) => !r.isCorrect && r.topicName).map((r) => r.topicName as string)),
  ];

  const percent = attempt.total > 0 ? Math.round((attempt.score / attempt.total) * 100) : 0;
  const tone = percent >= 75 ? "success" : percent >= 55 ? "warning" : "danger";

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader title={quiz.title} description="Quiz results" />
        <div className="flex items-center gap-6">
          <div>
            <p className="text-3xl font-semibold text-foreground">
              {attempt.score}/{attempt.total}
            </p>
            <p className="text-sm text-muted">{percent}% correct</p>
          </div>
          <ProgressBar value={percent} tone={tone} className="flex-1" />
        </div>

        {missedTopics.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="text-sm text-muted">Topics to review:</span>
            {missedTopics.map((topic) => (
              <Badge key={topic} tone="warning">
                {topic}
              </Badge>
            ))}
          </div>
        )}

        <div className="mt-5 flex gap-2">
          <LinkButton href={`/courses/${courseId}/quizzes/${quizId}`} variant="secondary" size="sm">
            Retake quiz
          </LinkButton>
          <LinkButton href={`/courses/${courseId}/quizzes`} variant="ghost" size="sm">
            Back to quizzes
          </LinkButton>
        </div>
      </Card>

      <div className="flex flex-col gap-3">
        {rows.map((row, i) => (
          <Card key={row.id} className={cn("border-l-4", row.isCorrect ? "border-l-success" : "border-l-danger")}>
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-medium text-foreground">
                {i + 1}. {row.question}
              </p>
              {row.isCorrect ? <Badge tone="success">Correct</Badge> : <Badge tone="danger">Missed</Badge>}
            </div>
            <div className="mt-3 flex flex-col gap-1.5">
              {row.choices.map((choice, ci) => (
                <div
                  key={ci}
                  className={cn(
                    "px-3 py-1.5 rounded-lg border text-sm",
                    ci === row.correctIndex
                      ? "border-success bg-green-50 text-success font-medium"
                      : ci === row.selectedIndex
                        ? "border-danger bg-red-50 text-danger"
                        : "border-border text-muted",
                  )}
                >
                  {choice}
                </div>
              ))}
            </div>
            {row.explanation && <p className="mt-3 text-sm text-muted">{row.explanation}</p>}
            {row.topicName && (
              <Badge tone="brand" className="mt-2">
                {row.topicName}
              </Badge>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
