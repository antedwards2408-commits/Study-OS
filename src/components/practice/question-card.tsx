import { Card } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress-bar";
import { cn } from "@/lib/utils";
import type { PracticeQuestionView } from "@/lib/actions/practice";

export function QuestionCard({
  question,
  questionNumber,
  totalQuestions,
  selectedIndex,
  onSelect,
}: {
  question: PracticeQuestionView;
  questionNumber: number;
  totalQuestions: number;
  selectedIndex: number | null;
  onSelect: (index: number) => void;
}) {
  return (
    <Card className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between text-xs font-medium text-muted">
          <span>
            Question {questionNumber} of {totalQuestions}
          </span>
          <span>{Math.round((questionNumber / totalQuestions) * 100)}%</span>
        </div>
        <ProgressBar value={(questionNumber / totalQuestions) * 100} tone="brand" />
      </div>

      <p className="text-base font-medium text-foreground">{question.question}</p>

      <div className="flex flex-col gap-2">
        {question.choices.map((choice, index) => {
          const active = selectedIndex === index;
          return (
            <button
              key={index}
              type="button"
              onClick={() => onSelect(index)}
              className={cn(
                "text-left rounded-xl border px-4 py-3 text-sm transition-colors",
                active
                  ? "border-brand bg-brand-soft text-brand font-medium"
                  : "border-border bg-background hover:bg-slate-50 text-foreground",
              )}
            >
              {choice}
            </button>
          );
        })}
      </div>
    </Card>
  );
}
