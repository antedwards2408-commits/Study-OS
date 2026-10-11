import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { ProgressBar } from "@/components/ui/progress-bar";
import { Badge } from "@/components/ui/badge";
import { masteryLevel } from "@/lib/utils";

export interface TopicMasteryRow {
  id: string;
  name: string;
  mastery: number | null;
}

export function TopicMasteryList({
  courseId,
  topics,
}: {
  courseId: string;
  topics: TopicMasteryRow[];
}) {
  return (
    <ul className="flex flex-col gap-2.5">
      {topics.map((topic) => {
        const started = topic.mastery !== null;
        const level = started ? masteryLevel(topic.mastery as number) : null;
        return (
          <li key={topic.id}>
            <Link
              href={`/courses/${courseId}/practice/${topic.id}`}
              className="flex items-center gap-4 rounded-xl border border-border p-3 hover:border-brand-light hover:bg-brand-soft/40 transition-colors group"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <span className="text-sm font-medium text-foreground truncate">
                    {topic.name}
                  </span>
                  {level ? (
                    <Badge tone={level.color}>{level.label}</Badge>
                  ) : (
                    <Badge tone="neutral">Not started</Badge>
                  )}
                </div>
                <ProgressBar
                  value={started ? (topic.mastery as number) : 0}
                  tone={level?.color ?? "brand"}
                />
              </div>
              <div className="text-sm font-medium text-muted w-10 text-right shrink-0">
                {started ? `${topic.mastery}%` : "--"}
              </div>
              <ChevronRight className="h-4 w-4 text-muted group-hover:text-brand shrink-0" />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
