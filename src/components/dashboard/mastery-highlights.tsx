import Link from "next/link";
import { Gauge } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress-bar";
import { EmptyState } from "@/components/ui/empty-state";
import { masteryLevel } from "@/lib/utils";

const TEXT_TONE: Record<"success" | "warning" | "danger", string> = {
  success: "text-success",
  warning: "text-warning",
  danger: "text-danger",
};

export function MasteryHighlights({
  items,
}: {
  items: {
    id: string;
    topicName: string;
    courseName: string;
    courseId: string;
    mastery: number;
  }[];
}) {
  return (
    <Card>
      <CardHeader
        title="Topic mastery"
        description="Weakest topics first - keep practicing to close the gap"
      />
      {items.length === 0 ? (
        <EmptyState
          icon={<Gauge className="h-8 w-8" />}
          title="No mastery data yet"
          description="Take a quiz or practice session so we can track where you stand."
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {items.map((item) => {
            const level = masteryLevel(item.mastery);
            return (
              <li key={item.id}>
                <Link
                  href={`/courses/${item.courseId}/practice`}
                  className="block rounded-xl border border-border px-3.5 py-2.5 transition-colors hover:border-brand hover:bg-brand-soft"
                >
                  <div className="mb-1.5 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">{item.topicName}</p>
                      <p className="truncate text-xs text-muted">{item.courseName}</p>
                    </div>
                    <span className={`shrink-0 text-xs font-medium ${TEXT_TONE[level.color]}`}>
                      {level.label} · {item.mastery}%
                    </span>
                  </div>
                  <ProgressBar value={item.mastery} tone={level.color} />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
