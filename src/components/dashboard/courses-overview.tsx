import Link from "next/link";
import { BookOpen } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/card";
import { LinkButton } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function CoursesOverview({
  courses,
}: {
  courses: {
    id: string;
    name: string;
    subject: string | null;
    materialCount: number;
  }[];
}) {
  return (
    <Card>
      <CardHeader
        title="Your courses"
        description={`${courses.length} course${courses.length === 1 ? "" : "s"}`}
        action={
          <LinkButton href="/courses" variant="ghost" size="sm">
            View all
          </LinkButton>
        }
      />
      <ul className="flex flex-col gap-2">
        {courses.map((course) => (
          <li key={course.id}>
            <Link
              href={`/courses/${course.id}`}
              className="flex items-center justify-between gap-3 rounded-xl border border-border px-3.5 py-2.5 transition-colors hover:border-brand hover:bg-brand-soft"
            >
              <div className="flex min-w-0 items-center gap-2.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-brand">
                  <BookOpen className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">{course.name}</p>
                  {course.subject && <Badge className="mt-1">{course.subject}</Badge>}
                </div>
              </div>
              <span className="shrink-0 text-xs text-muted">
                {course.materialCount} material{course.materialCount === 1 ? "" : "s"}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </Card>
  );
}
