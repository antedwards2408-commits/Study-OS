import { CheckCircle2, XCircle, TrendingUp } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button, LinkButton } from "@/components/ui/button";
import { masteryLevel } from "@/lib/utils";
import type { ScoredPracticeQuestion } from "@/lib/actions/practice";

export function ResultsSummary({
  score,
  total,
  initialMastery,
  mastery,
  questions,
  courseId,
  onPracticeAgain,
}: {
  score: number;
  total: number;
  initialMastery: number | null;
  mastery: number | null;
  questions: ScoredPracticeQuestion[];
  courseId: string;
  onPracticeAgain: () => void;
}) {
  const missed = questions.filter((q) => !q.isCorrect);
  const level = mastery !== null ? masteryLevel(mastery) : null;
  const delta =
    mastery !== null && initialMastery !== null ? mastery - initialMastery : null;

  return (
    <div className="flex flex-col gap-4">
      <Card className="flex flex-col gap-4">
        <CardHeader
          title="Session complete"
          description={`You got ${score} out of ${total} questions correct.`}
        />

        {mastery !== null && (
          <div className="flex items-center gap-3 rounded-xl bg-brand-soft px-4 py-3">
            <TrendingUp className="h-5 w-5 text-brand shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-foreground">
                Updated mastery:{" "}
                <span className="font-semibold">{mastery}%</span>
                {delta !== null && (
                  <span className="text-muted">
                    {" "}
                    ({delta >= 0 ? "+" : ""}
                    {delta} from {initialMastery}%)
                  </span>
                )}
              </p>
            </div>
            {level && <Badge tone={level.color}>{level.label}</Badge>}
          </div>
        )}

        <div className="flex gap-2">
          <Button onClick={onPracticeAgain} variant="secondary">
            Practice again
          </Button>
          <LinkButton href={`/courses/${courseId}/practice`} variant="ghost">
            Back to topics
          </LinkButton>
        </div>
      </Card>

      {missed.length > 0 && (
        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-semibold text-foreground">
            Questions to review ({missed.length})
          </h3>
          {missed.map((q) => (
            <Card key={q.id} className="flex flex-col gap-2">
              <div className="flex items-start gap-2">
                <XCircle className="h-4 w-4 text-danger mt-0.5 shrink-0" />
                <p className="text-sm font-medium text-foreground">{q.question}</p>
              </div>
              <div className="pl-6 flex flex-col gap-1 text-sm">
                <p className="text-danger">
                  Your answer:{" "}
                  {q.selectedIndex !== null ? q.choices[q.selectedIndex] : "(no answer)"}
                </p>
                <p className="text-success">Correct answer: {q.choices[q.correctIndex]}</p>
                {q.explanation && <p className="text-muted mt-1">{q.explanation}</p>}
              </div>
            </Card>
          ))}
        </div>
      )}

      {missed.length === 0 && (
        <Card className="flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-success shrink-0" />
          <p className="text-sm text-foreground">Perfect score - nice work!</p>
        </Card>
      )}
    </div>
  );
}
