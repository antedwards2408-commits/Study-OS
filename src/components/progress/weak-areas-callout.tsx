import Link from "next/link";
import { AlertTriangle, PartyPopper } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { masteryLevel, cn } from "@/lib/utils";

export interface WeakTopic {
  topicId: string;
  topicName: string;
  courseId: string;
  courseName: string;
  mastery: number;
}

/** Scannable callout of the lowest-mastery topics across every course. */
export function WeakAreasCallout({ topics }: { topics: WeakTopic[] }) {
  if (topics.length === 0) {
    return (
      <Card className="border-success/30 bg-green-50/50">
        <div className="flex items-center gap-3">
          <PartyPopper className="h-5 w-5 text-success flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-foreground">No weak areas right now</p>
            <p className="text-sm text-muted">
              Every topic you&apos;ve practiced is at a healthy mastery level. Keep it up.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader
        title="Weak areas"
        description="Your lowest-mastery topics across every course - start here"
      />
      <ul className="flex flex-col gap-2">
        {topics.map((topic) => {
          const level = masteryLevel(topic.mastery);
          return (
            <li key={topic.topicId}>
              <Link
                href={`/courses/${topic.courseId}/practice/${topic.topicId}`}
                className="flex items-center justify-between gap-3 rounded-xl border border-border px-4 py-3 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <AlertTriangle
                    className={cn(
                      "h-4 w-4 flex-shrink-0",
                      level.color === "danger" ? "text-danger" : "text-warning",
                    )}
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {topic.topicName}
                    </p>
                    <p className="text-xs text-muted truncate">{topic.courseName}</p>
                  </div>
                </div>
                <Badge tone={level.color} className="flex-shrink-0">
                  {topic.mastery}% - {level.label}
                </Badge>
              </Link>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
