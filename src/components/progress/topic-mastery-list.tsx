import Link from "next/link";
import { Card, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProgressBar } from "@/components/ui/progress-bar";
import { masteryLevel } from "@/lib/utils";
import { formatRelativeTime } from "@/components/progress/format";

export interface TopicMasteryRow {
  topicId: string;
  topicName: string;
  courseId: string;
  courseName: string;
  mastery: number;
  attemptsCount: number;
  lastAttemptAt: string | null;
}

/** Every assessed topic across every course, sorted weakest first. */
export function TopicMasteryList({ rows }: { rows: TopicMasteryRow[] }) {
  if (rows.length === 0) {
    return (
      <Card>
        <CardHeader title="Topic mastery" description="Across every course" />
        <p className="text-sm text-muted">
          No topics have been assessed yet. Take a quiz or practice session to start
          building mastery data.
        </p>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader
        title="Topic mastery"
        description="Every topic you've been assessed on, weakest first"
      />
      <ul className="flex flex-col gap-3">
        {rows.map((row) => {
          const level = masteryLevel(row.mastery);
          return (
            <li key={row.topicId}>
              <Link
                href={`/courses/${row.courseId}/practice/${row.topicId}`}
                className="block rounded-xl border border-border px-4 py-3 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center justify-between gap-3 mb-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {row.topicName}
                    </p>
                    <p className="text-xs text-muted truncate">{row.courseName}</p>
                  </div>
                  <Badge tone={level.color} className="flex-shrink-0">
                    {row.mastery}%
                  </Badge>
                </div>
                <ProgressBar value={row.mastery} tone={level.color} />
                <p className="text-xs text-muted mt-1.5">
                  {row.attemptsCount} attempt{row.attemptsCount === 1 ? "" : "s"}
                  {row.lastAttemptAt && ` - last ${formatRelativeTime(row.lastAttemptAt)}`}
                </p>
              </Link>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
