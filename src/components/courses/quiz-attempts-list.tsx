import { ClipboardList } from "lucide-react";

export interface QuizAttemptRow {
  id: string;
  title: string;
  score: number;
  total: number;
  completedAt: string | null;
}

export function QuizAttemptsList({
  attempts,
}: {
  attempts: QuizAttemptRow[];
}) {
  return (
    <ul className="flex flex-col divide-y divide-border">
      {attempts.map((attempt) => {
        const isComplete = attempt.completedAt !== null;
        const pct =
          attempt.total > 0
            ? Math.round((attempt.score / attempt.total) * 100)
            : null;
        return (
          <li key={attempt.id} className="flex items-center gap-3 py-2.5">
            <ClipboardList className="h-4 w-4 text-muted shrink-0" />
            <span className="flex-1 text-sm text-foreground truncate">
              {attempt.title}
            </span>
            <span className="text-sm font-medium text-muted shrink-0">
              {isComplete
                ? pct !== null
                  ? `${attempt.score}/${attempt.total} · ${pct}%`
                  : `${attempt.score}/${attempt.total}`
                : "In progress"}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
