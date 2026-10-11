import Link from "next/link";
import { BookOpen, FileText, Target } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ProgressBar } from "@/components/ui/progress-bar";
import { masteryLevel } from "@/lib/utils";
import { DeleteCourseButton } from "@/components/courses/delete-course-button";

export function CourseCard({
  id,
  name,
  subject,
  materialCount,
  averageMastery,
}: {
  id: string;
  name: string;
  subject: string | null;
  materialCount: number;
  averageMastery: number | null;
}) {
  return (
    <div className="relative group rounded-2xl border border-border bg-surface shadow-sm hover:shadow-md hover:border-brand-light/40 transition-all">
      <DeleteCourseButton
        courseId={id}
        courseName={name}
        className="absolute top-3 right-3 z-10 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity"
      />
      <Link href={`/courses/${id}`} className="flex flex-col gap-4 p-5">
        <div className="flex items-start gap-3 pr-8">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand">
            <BookOpen className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-foreground truncate">{name}</h3>
            {subject && (
              <Badge tone="brand" className="mt-1">
                {subject}
              </Badge>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-sm text-muted">
          <FileText className="h-4 w-4" />
          <span>
            {materialCount} {materialCount === 1 ? "material" : "materials"}
          </span>
        </div>

        {averageMastery === null ? (
          <p className="text-xs text-muted">No mastery data yet</p>
        ) : (
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1 text-muted">
                <Target className="h-3.5 w-3.5" /> Mastery
              </span>
              <span className="font-medium text-foreground">
                {averageMastery}%
              </span>
            </div>
            <ProgressBar
              value={averageMastery}
              tone={masteryLevel(averageMastery).color}
            />
          </div>
        )}
      </Link>
    </div>
  );
}
