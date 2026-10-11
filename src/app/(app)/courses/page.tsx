import { BookOpen } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/ui/empty-state";
import { CourseCard } from "@/components/courses/course-card";
import { CreateCourseButton } from "@/components/courses/create-course-button";

export default async function CoursesPage() {
  const supabase = await createClient();

  const [{ data: courses }, { data: materials }, { data: masteryRows }] =
    await Promise.all([
      supabase
        .from("courses")
        .select("id, name, subject, created_at")
        .order("created_at", { ascending: false }),
      supabase.from("materials").select("course_id"),
      supabase.from("topic_mastery").select("course_id, mastery"),
    ]);

  const materialCounts = new Map<string, number>();
  for (const material of materials ?? []) {
    materialCounts.set(
      material.course_id,
      (materialCounts.get(material.course_id) ?? 0) + 1,
    );
  }

  const masteryTotals = new Map<string, { sum: number; count: number }>();
  for (const row of masteryRows ?? []) {
    const entry = masteryTotals.get(row.course_id) ?? { sum: 0, count: 0 };
    entry.sum += row.mastery;
    entry.count += 1;
    masteryTotals.set(row.course_id, entry);
  }

  const courseList = courses ?? [];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-foreground">
            Your courses
          </h1>
          <p className="text-sm text-muted mt-0.5">
            Organize materials, flashcards, and quizzes by course.
          </p>
        </div>
        {courseList.length > 0 && <CreateCourseButton />}
      </div>

      {courseList.length === 0 ? (
        <EmptyState
          icon={<BookOpen className="h-10 w-10" />}
          title="Create your first course"
          description="Courses are where everything lives. Add one for each class - AP Biology, Calculus, Economics - then upload materials, ask AI questions, and build flashcards and quizzes from them."
          action={
            <CreateCourseButton label="Create your first course" size="lg" />
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {courseList.map((course) => {
            const totals = masteryTotals.get(course.id);
            const averageMastery = totals
              ? Math.round(totals.sum / totals.count)
              : null;
            return (
              <CourseCard
                key={course.id}
                id={course.id}
                name={course.name}
                subject={course.subject}
                materialCount={materialCounts.get(course.id) ?? 0}
                averageMastery={averageMastery}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
