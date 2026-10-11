import Link from "next/link";
import { ClipboardCheck } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { timeAgo } from "./format";
import { masteryLevel } from "@/lib/utils";

export function QuizPerformance({
  attempts,
}: {
  attempts: {
    id: string;
    quizTitle: string;
    courseName: string;
    courseId: string;
    score: number;
    total: number;
    completedAt: string;
  }[];
}) {
  return (
    <Card>
      <CardHeader title="Recent quiz performance" description="Your last few completed quizzes" />
      {attempts.length === 0 ? (
        <EmptyState
          icon={<ClipboardCheck className="h-8 w-8" />}
          title="No quizzes taken yet"
          description="Generate a quiz from your materials to test what you know."
        />
      ) : (
        <ul className="flex flex-col gap-2">
          {attempts.map((attempt) => {
            const pct = attempt.total > 0 ? Math.round((attempt.score / attempt.total) * 100) : 0;
            const level = masteryLevel(pct);
            return (
              <li key={attempt.id}>
                <Link
                  href={`/courses/${attempt.courseId}/quizzes`}
                  className="flex items-center justify-between gap-3 rounded-xl border border-border px-3.5 py-2.5 transition-colors hover:border-brand hover:bg-brand-soft"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">{attempt.quizTitle}</p>
                    <p className="truncate text-xs text-muted">
                      {attempt.courseName} · {timeAgo(attempt.completedAt)}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="text-sm font-medium text-foreground">
                      {attempt.score}/{attempt.total}
                    </span>
                    <Badge tone={level.color}>{pct}%</Badge>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
