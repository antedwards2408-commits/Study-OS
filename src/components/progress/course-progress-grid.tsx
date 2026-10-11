import Link from "next/link";
import { Card, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProgressBar } from "@/components/ui/progress-bar";
import { masteryLevel } from "@/lib/utils";

export interface CourseProgressRow {
  courseId: string;
  courseName: string;
  topicCount: number;
  averageMastery: number | null;
}

/** Per-course summary: average topic mastery and how many topics exist. */
export function CourseProgressGrid({ courses }: { courses: CourseProgressRow[] }) {
  if (courses.length === 0) return null;

  return (
    <Card>
      <CardHeader title="Course progress" description="Average topic mastery per course" />
      <div className="grid gap-3 sm:grid-cols-2">
        {courses.map((course) => {
          const level =
            course.averageMastery !== null ? masteryLevel(course.averageMastery) : null;
          return (
            <Link
              key={course.courseId}
              href={`/courses/${course.courseId}`}
              className="rounded-xl border border-border p-4 hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <p className="text-sm font-medium text-foreground truncate">
                  {course.courseName}
                </p>
                {level && (
                  <Badge tone={level.color} className="flex-shrink-0">
                    {course.averageMastery}%
                  </Badge>
                )}
              </div>
              {course.averageMastery !== null && level ? (
                <ProgressBar value={course.averageMastery} tone={level.color} />
              ) : (
                <p className="text-xs text-muted">No mastery data yet</p>
              )}
              <p className="text-xs text-muted mt-1.5">
                {course.topicCount} topic{course.topicCount === 1 ? "" : "s"}
              </p>
            </Link>
          );
        })}
      </div>
    </Card>
  );
}
