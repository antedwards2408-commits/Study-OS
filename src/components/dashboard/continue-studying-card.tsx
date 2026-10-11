import { ArrowRight, PlayCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { LinkButton } from "@/components/ui/button";

export function ContinueStudyingCard({
  courseId,
  courseName,
  materialTitle,
}: {
  courseId: string;
  courseName: string;
  materialTitle: string | null;
}) {
  return (
    <Card className="flex flex-col gap-4 border-brand/30 bg-brand-soft sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand text-white">
          <PlayCircle className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-brand">
            Continue studying
          </p>
          <p className="mt-0.5 truncate text-base font-semibold text-foreground">
            {courseName}
          </p>
          {materialTitle && (
            <p className="mt-0.5 truncate text-sm text-muted">
              Pick up where you left off: {materialTitle}
            </p>
          )}
        </div>
      </div>
      <LinkButton href={`/courses/${courseId}`} size="sm" className="shrink-0">
        Continue
        <ArrowRight className="h-4 w-4" />
      </LinkButton>
    </Card>
  );
}
