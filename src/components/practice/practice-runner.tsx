"use client";

import { useState } from "react";
import { AlertTriangle, Loader2, Target } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ProgressBar } from "@/components/ui/progress-bar";
import { masteryLevel } from "@/lib/utils";
import {
  startPracticeSession,
  submitPracticeSession,
  type PracticeAnswer,
  type PracticeQuestionView,
  type ScoredPracticeQuestion,
} from "@/lib/actions/practice";
import { QuestionCard } from "@/components/practice/question-card";
import { ResultsSummary } from "@/components/practice/results-summary";

type Phase = "idle" | "starting" | "quiz" | "submitting" | "results" | "error";

interface CompletedResult {
  score: number;
  total: number;
  mastery: number | null;
  questions: ScoredPracticeQuestion[];
}

export function PracticeRunner({
  courseId,
  topicId,
  topicName,
  topicDescription,
  initialMastery,
}: {
  courseId: string;
  topicId: string;
  topicName: string;
  topicDescription: string | null;
  initialMastery: number | null;
}) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<PracticeQuestionView[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selections, setSelections] = useState<Record<string, number>>({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [result, setResult] = useState<CompletedResult | null>(null);

  const level = initialMastery !== null ? masteryLevel(initialMastery) : null;

  async function handleStart() {
    setPhase("starting");
    setErrorMessage(null);
    const res = await startPracticeSession(courseId, topicId);
    if (!res.ok) {
      setErrorMessage(
        res.error === "no-chunks"
          ? "There isn't enough tagged material for this topic yet."
          : res.message || "Something went wrong generating your practice questions.",
      );
      setPhase("error");
      return;
    }
    setSessionId(res.sessionId);
    setQuestions(res.questions);
    setCurrentIndex(0);
    setSelections({});
    setPhase("quiz");
  }

  function handleSelect(index: number) {
    const question = questions[currentIndex];
    setSelections((prev) => ({ ...prev, [question.id]: index }));
  }

  async function handleNext() {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((i) => i + 1);
      return;
    }
    if (!sessionId) return;

    setPhase("submitting");
    const answers: PracticeAnswer[] = questions.map((q) => ({
      questionId: q.id,
      selectedIndex: selections[q.id] ?? -1,
    }));
    const res = await submitPracticeSession(sessionId, answers);
    if (!res.ok) {
      setErrorMessage(res.message || "Something went wrong scoring your session.");
      setPhase("error");
      return;
    }
    setResult({
      score: res.score,
      total: res.total,
      mastery: res.mastery,
      questions: res.questions,
    });
    setPhase("results");
  }

  if (phase === "idle" || phase === "starting" || phase === "error") {
    return (
      <Card className="flex flex-col gap-4">
        <CardHeader
          title={topicName}
          description={topicDescription ?? undefined}
          action={
            level ? (
              <Badge tone={level.color}>{level.label}</Badge>
            ) : (
              <Badge tone="neutral">Not yet attempted</Badge>
            )
          }
        />

        {initialMastery !== null && (
          <div className="flex items-center gap-3 max-w-sm">
            <ProgressBar value={initialMastery} tone={level?.color ?? "brand"} className="flex-1" />
            <span className="text-sm font-medium text-foreground tabular-nums w-10 text-right">
              {initialMastery}%
            </span>
          </div>
        )}

        {phase === "error" && errorMessage && (
          <div className="flex items-start gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-danger">
            <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
            <p>{errorMessage}</p>
          </div>
        )}

        <div>
          <Button onClick={handleStart} disabled={phase === "starting"}>
            {phase === "starting" ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating questions...
              </>
            ) : (
              <>
                <Target className="h-4 w-4" />
                {phase === "error" ? "Try again" : "Start practice session"}
              </>
            )}
          </Button>
        </div>
      </Card>
    );
  }

  if (phase === "quiz" || phase === "submitting") {
    const question = questions[currentIndex];
    const isLast = currentIndex === questions.length - 1;
    const selected = selections[question.id] ?? null;

    return (
      <div className="flex flex-col gap-4">
        <QuestionCard
          question={question}
          questionNumber={currentIndex + 1}
          totalQuestions={questions.length}
          selectedIndex={selected}
          onSelect={handleSelect}
        />
        <div>
          <Button onClick={handleNext} disabled={selected === null || phase === "submitting"}>
            {phase === "submitting" ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Scoring...
              </>
            ) : isLast ? (
              "Finish"
            ) : (
              "Next"
            )}
          </Button>
        </div>
      </div>
    );
  }

  if (phase === "results" && result) {
    return (
      <ResultsSummary
        score={result.score}
        total={result.total}
        initialMastery={initialMastery}
        mastery={result.mastery}
        questions={result.questions}
        courseId={courseId}
        onPracticeAgain={() => {
          setResult(null);
          setPhase("idle");
        }}
      />
    );
  }

  return null;
}
