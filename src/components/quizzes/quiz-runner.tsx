"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress-bar";
import { cn } from "@/lib/utils";
import { submitQuizAttempt } from "@/lib/actions/quizzes";

export interface RunnerQuestion {
  id: string;
  question: string;
  choices: string[];
}

export function QuizRunner({
  quizId,
  courseId,
  questions,
}: {
  quizId: string;
  courseId: string;
  questions: RunnerQuestion[];
}) {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const total = questions.length;
  const current = questions[index];
  const isLast = index === total - 1;
  const selected = answers[current.id];
  const answeredCount = Object.keys(answers).length;

  function selectChoice(choiceIndex: number) {
    setAnswers((prev) => ({ ...prev, [current.id]: choiceIndex }));
  }

  function goNext() {
    if (!isLast) setIndex((i) => i + 1);
  }

  function goPrev() {
    if (index > 0) setIndex((i) => i - 1);
  }

  function handleSubmit() {
    setError(null);
    startTransition(async () => {
      try {
        const payload = questions.map((q) => ({
          questionId: q.id,
          selectedIndex: answers[q.id] ?? null,
        }));
        const { attemptId } = await submitQuizAttempt({ quizId, courseId, answers: payload });
        router.push(`/courses/${courseId}/quizzes/${quizId}/results/${attemptId}`);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to submit quiz.");
      }
    });
  }

  return (
    <Card className="flex flex-col gap-5">
      <div>
        <div className="flex items-center justify-between text-xs text-muted mb-1.5">
          <span>
            Question {index + 1} of {total}
          </span>
          <span>
            {answeredCount} of {total} answered
          </span>
        </div>
        <ProgressBar value={((index + 1) / total) * 100} />
      </div>

      <div>
        <h3 className="text-base font-medium text-foreground">{current.question}</h3>
        <div className="flex flex-col gap-2 mt-4">
          {current.choices.map((choice, i) => (
            <button
              key={i}
              type="button"
              onClick={() => selectChoice(i)}
              disabled={isPending}
              className={cn(
                "text-left px-4 py-2.5 rounded-xl border text-sm transition-colors disabled:opacity-60",
                selected === i
                  ? "border-brand bg-brand-soft text-brand font-medium"
                  : "border-border hover:bg-slate-50 text-foreground",
              )}
            >
              {choice}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}

      <div className="flex items-center justify-between pt-1">
        <Button variant="secondary" size="sm" onClick={goPrev} disabled={index === 0 || isPending}>
          <ChevronLeft className="h-4 w-4" /> Previous
        </Button>
        {isLast ? (
          <Button size="sm" onClick={handleSubmit} disabled={isPending}>
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            {isPending ? "Submitting..." : "Submit quiz"}
          </Button>
        ) : (
          <Button size="sm" onClick={goNext} disabled={isPending}>
            Next <ChevronRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </Card>
  );
}
