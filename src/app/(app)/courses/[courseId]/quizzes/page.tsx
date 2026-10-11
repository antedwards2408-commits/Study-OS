import { FileText, Layers, ListChecks } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LinkButton } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { GenerateQuizForm } from "@/components/quizzes/generate-quiz-form";
import type { MaterialStatus } from "@/types/database";

function statusBadge(status: MaterialStatus) {
  const tone =
    status === "ready" ? "success" : status === "error" ? "danger" : status === "processing" ? "warning" : "neutral";
  const label = status.charAt(0).toUpperCase() + status.slice(1);
  return <Badge tone={tone}>{label}</Badge>;
}

export default async function QuizzesPage({ params }: PageProps<"/courses/[courseId]/quizzes">) {
  const { courseId } = await params;
  const supabase = await createClient();

  const [{ data: materials }, { data: quizzes }] = await Promise.all([
    supabase
      .from("materials")
      .select("id, title, status")
      .eq("course_id", courseId)
      .order("created_at", { ascending: false }),
    supabase
      .from("quizzes")
      .select("id, title, material_id, created_at")
      .eq("course_id", courseId)
      .order("created_at", { ascending: false }),
  ]);

  const materialList = materials ?? [];
  const quizList = quizzes ?? [];
  const quizIds = quizList.map((q) => q.id);

  const { data: questions } =
    quizIds.length > 0
      ? await supabase.from("quiz_questions").select("id, quiz_id").in("quiz_id", quizIds)
      : { data: [] as { id: string; quiz_id: string }[] };

  const { data: attempts } = await supabase
    .from("quiz_attempts")
    .select("id, quiz_id, score, total, completed_at")
    .eq("course_id", courseId)
    .not("completed_at", "is", null)
    .order("completed_at", { ascending: false });

  const questionCountByQuiz = new Map<string, number>();
  for (const q of questions ?? []) {
    questionCountByQuiz.set(q.quiz_id, (questionCountByQuiz.get(q.quiz_id) ?? 0) + 1);
  }

  const attemptsByQuiz = new Map<
    string,
    { id: string; score: number; total: number; completed_at: string | null }[]
  >();
  for (const a of attempts ?? []) {
    const arr = attemptsByQuiz.get(a.quiz_id) ?? [];
    arr.push(a);
    attemptsByQuiz.set(a.quiz_id, arr);
  }

  const materialTitleById = new Map(materialList.map((m) => [m.id, m.title]));

  if (materialList.length === 0) {
    return (
      <EmptyState
        icon={<Layers className="h-6 w-6" />}
        title="No materials yet"
        description="Upload course material first, then come back here to generate a quiz."
        action={<LinkButton href={`/courses/${courseId}/materials`}>Go to Materials</LinkButton>}
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader title="Generate a quiz" description="Pick a ready material and generate a multiple-choice quiz." />
        <div className="flex flex-col divide-y divide-border">
          {materialList.map((material) => (
            <div key={material.id} className="flex items-center justify-between gap-4 py-3">
              <div className="flex items-center gap-3 min-w-0">
                <FileText className="h-4 w-4 text-muted shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{material.title}</p>
                  <div className="mt-0.5">{statusBadge(material.status)}</div>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {material.status === "ready" ? (
                  <GenerateQuizForm materialId={material.id} courseId={courseId} />
                ) : (
                  <span className="text-xs text-muted">Not ready</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {quizList.length > 0 ? (
        <Card>
          <CardHeader title="Quizzes" description="Take a quiz or review past attempts." />
          <div className="flex flex-col divide-y divide-border">
            {quizList.map((quiz) => {
              const attemptsForQuiz = attemptsByQuiz.get(quiz.id) ?? [];
              const latest = attemptsForQuiz[0];
              const materialTitle = quiz.material_id ? materialTitleById.get(quiz.material_id) : undefined;
              return (
                <div key={quiz.id} className="flex items-center justify-between gap-4 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{quiz.title}</p>
                    <p className="text-xs text-muted mt-0.5">
                      {questionCountByQuiz.get(quiz.id) ?? 0} questions
                      {materialTitle ? ` • from ${materialTitle}` : ""}
                      {latest ? ` • last score ${latest.score}/${latest.total}` : ""}
                    </p>
                  </div>
                  <LinkButton
                    href={`/courses/${courseId}/quizzes/${quiz.id}`}
                    size="sm"
                    variant={attemptsForQuiz.length > 0 ? "secondary" : "primary"}
                  >
                    {attemptsForQuiz.length > 0 ? "Retake" : "Take quiz"}
                  </LinkButton>
                </div>
              );
            })}
          </div>
        </Card>
      ) : (
        <EmptyState
          icon={<ListChecks className="h-6 w-6" />}
          title="No quizzes yet"
          description="Generate a quiz from one of your ready materials above to get started."
        />
      )}
    </div>
  );
}
