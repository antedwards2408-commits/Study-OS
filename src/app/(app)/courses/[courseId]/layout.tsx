import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CourseTabs } from "@/components/course/course-tabs";
import { Badge } from "@/components/ui/badge";

export default async function CourseLayout({
  children,
  params,
}: LayoutProps<"/courses/[courseId]">) {
  const { courseId } = await params;
  const supabase = await createClient();

  const { data: course } = await supabase
    .from("courses")
    .select("id, name, subject")
    .eq("id", courseId)
    .single();

  if (!course) notFound();

  return (
    <div className="flex flex-col gap-5">
      <div>
        <div className="flex items-center gap-2 flex-wrap">
          <h1 className="text-xl font-semibold text-foreground">{course.name}</h1>
          {course.subject && <Badge tone="brand">{course.subject}</Badge>}
        </div>
      </div>
      <CourseTabs courseId={course.id} />
      <div>{children}</div>
    </div>
  );
}
