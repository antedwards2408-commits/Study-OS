"use client";

import { Trash2 } from "lucide-react";
import { deleteCourse } from "@/lib/actions/courses";
import { cn } from "@/lib/utils";

export function DeleteCourseButton({
  courseId,
  courseName,
  className,
}: {
  courseId: string;
  courseName: string;
  className?: string;
}) {
  return (
    <form
      action={deleteCourse}
      onSubmit={(event) => {
        const confirmed = window.confirm(
          `Delete "${courseName}"? This permanently removes its materials, flashcards, quizzes, and progress. This can't be undone.`,
        );
        if (!confirmed) {
          event.preventDefault();
        }
      }}
      className={cn("inline-flex", className)}
    >
      <input type="hidden" name="courseId" value={courseId} />
      <button
        type="submit"
        aria-label={`Delete ${courseName}`}
        className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-surface text-muted shadow-sm hover:border-danger hover:text-danger transition-colors"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </form>
  );
}
