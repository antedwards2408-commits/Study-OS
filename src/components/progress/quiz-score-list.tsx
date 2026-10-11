import { Card, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { masteryLevel } from "@/lib/utils";
import { formatRelativeTime } from "@/components/progress/format";

export interface QuizScoreRow {
  id: string;
  quizTitle: string;
  courseName: string;
  score: number;
  total: number;
  completedAt: string;
}

/** Recent quiz attempts with score - a lightweight trend view for the MVP. */
export function QuizScoreList({ attempts }: { attempts: QuizScoreRow[] }) {
  return (
    <Card>
      <CardHeader title="Recent quiz scores" description="Your last few quiz attempts" />
      {attempts.length === 0 ? (
        <p className="text-sm text-muted">No quizzes taken yet.</p>
      ) : (
        <ul className="flex flex-col gap-1">
          {attempts.map((attempt) => {
            const pct =
              attempt.total > 0 ? Math.round((attempt.score / attempt.total) * 100) : 0;
            const level = masteryLevel(pct);
            return (
              <li
                key={attempt.id}
                className="flex items-center justify-between gap-3 rounded-lg px-2 py-2 hover:bg-slate-50"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {attempt.quizTitle}
                  </p>
                  <p className="text-xs text-muted truncate">
                    {attempt.courseName} - {formatRelativeTime(attempt.completedAt)}
                  </p>
                </div>
                <Badge tone={level.color} className="flex-shrink-0">
                  {attempt.score}/{attempt.total} ({pct}%)
                </Badge>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
