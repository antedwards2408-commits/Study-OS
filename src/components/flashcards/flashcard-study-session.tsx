"use client";

import { useMemo, useState, useTransition } from "react";
import { RotateCcw, Check, X, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button, LinkButton } from "@/components/ui/button";
import { ProgressBar } from "@/components/ui/progress-bar";
import { cn } from "@/lib/utils";
import { recordFlashcardReview } from "@/lib/actions/flashcards";
import type { Difficulty } from "@/types/database";

export interface StudyCard {
  id: string;
  question: string;
  answer: string;
  difficulty: Difficulty;
  topicName: string | null;
}

const difficultyTone: Record<Difficulty, "success" | "warning" | "danger"> = {
  easy: "success",
  medium: "warning",
  hard: "danger",
};

export function FlashcardStudySession({
  courseId,
  cards,
}: {
  courseId: string;
  cards: StudyCard[];
}) {
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [known, setKnown] = useState(0);
  const [missed, setMissed] = useState(0);
  const [finished, setFinished] = useState(false);
  const [isPending, startTransition] = useTransition();

  const total = cards.length;
  const current = cards[index];
  const reviewed = known + missed;
  const progress = useMemo(() => (total > 0 ? (reviewed / total) * 100 : 0), [reviewed, total]);

  function handleAnswer(didKnow: boolean) {
    if (isPending) return;
    startTransition(async () => {
      try {
        await recordFlashcardReview(current.id, didKnow);
      } catch {
        // Non-fatal for the study session - we still advance locally.
      }

      if (didKnow) setKnown((k) => k + 1);
      else setMissed((m) => m + 1);

      if (index + 1 >= total) {
        setFinished(true);
      } else {
        setIndex((i) => i + 1);
        setRevealed(false);
      }
    });
  }

  function restart() {
    setIndex(0);
    setRevealed(false);
    setKnown(0);
    setMissed(0);
    setFinished(false);
  }

  if (finished) {
    const pct = total > 0 ? Math.round((known / total) * 100) : 0;
    return (
      <Card className="flex flex-col items-center text-center gap-4 py-10">
        <Sparkles className="h-8 w-8 text-brand" />
        <div>
          <h3 className="text-lg font-semibold text-foreground">Session complete</h3>
          <p className="text-sm text-muted mt-1">
            You knew {known} of {total} cards ({pct}%).
          </p>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <span className="flex items-center gap-1.5 text-success">
            <Check className="h-4 w-4" /> {known} knew it
          </span>
          <span className="flex items-center gap-1.5 text-danger">
            <X className="h-4 w-4" /> {missed} didn&apos;t know
          </span>
        </div>
        <div className="flex gap-2 mt-2">
          <Button variant="secondary" size="sm" onClick={restart}>
            <RotateCcw className="h-4 w-4" /> Study again
          </Button>
          <LinkButton href={`/courses/${courseId}/flashcards`} variant="ghost" size="sm">
            Back to flashcards
          </LinkButton>
        </div>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <div className="flex items-center justify-between text-xs text-muted mb-1.5">
          <span>
            Card {index + 1} of {total}
          </span>
          <span className="flex items-center gap-3">
            <span className="text-success">{known} knew it</span>
            <span className="text-danger">{missed} missed</span>
          </span>
        </div>
        <ProgressBar value={progress} />
      </div>

      <Card className="flex flex-col gap-5 min-h-[260px]">
        <div className="flex items-center justify-between">
          <Badge tone={difficultyTone[current.difficulty]}>{current.difficulty}</Badge>
          {current.topicName && <Badge tone="brand">{current.topicName}</Badge>}
        </div>

        <div className="flex-1 flex flex-col items-center justify-center text-center gap-4 py-6">
          <p className="text-lg font-medium text-foreground">{current.question}</p>
          {revealed && (
            <p className="text-base text-muted border-t border-border pt-4 w-full">{current.answer}</p>
          )}
        </div>

        {!revealed ? (
          <Button onClick={() => setRevealed(true)} className="self-center">
            Reveal answer
          </Button>
        ) : (
          <div className="flex items-center justify-center gap-3">
            <Button
              variant="danger"
              onClick={() => handleAnswer(false)}
              disabled={isPending}
              className={cn(isPending && "opacity-70")}
            >
              <X className="h-4 w-4" /> Didn&apos;t know it
            </Button>
            <Button
              variant="primary"
              onClick={() => handleAnswer(true)}
              disabled={isPending}
              className={cn(isPending && "opacity-70")}
            >
              <Check className="h-4 w-4" /> Knew it
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
