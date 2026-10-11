"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { Plus, X } from "lucide-react";
import { createCourse } from "@/lib/actions/courses";
import { Button } from "@/components/ui/button";

const SUBJECT_SUGGESTIONS = [
  "AP Biology",
  "Calculus",
  "Economics",
  "Chemistry",
  "History",
];

function CreateSubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Creating..." : "Create course"}
    </Button>
  );
}

export function CreateCourseButton({
  variant = "primary",
  size = "md",
  className,
  label = "New course",
}: {
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  className?: string;
  label?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        type="button"
        variant={variant}
        size={size}
        className={className}
        onClick={() => setOpen(true)}
      >
        <Plus className="h-4 w-4" />
        {label}
      </Button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-surface p-6 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-foreground">
                  Create a course
                </h2>
                <p className="text-sm text-muted mt-0.5">
                  Give it a name - you can add materials right after.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="text-muted hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form action={createCourse} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="course-name"
                  className="text-sm font-medium text-foreground"
                >
                  Course name
                </label>
                <input
                  id="course-name"
                  name="name"
                  required
                  autoFocus
                  placeholder="e.g. AP Biology"
                  className="rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-brand focus:ring-2 focus:ring-brand-soft"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="course-subject"
                  className="text-sm font-medium text-foreground"
                >
                  Subject{" "}
                  <span className="text-muted font-normal">(optional)</span>
                </label>
                <input
                  id="course-subject"
                  name="subject"
                  list="course-subject-suggestions"
                  placeholder="e.g. Biology"
                  className="rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-brand focus:ring-2 focus:ring-brand-soft"
                />
                <datalist id="course-subject-suggestions">
                  {SUBJECT_SUGGESTIONS.map((subject) => (
                    <option key={subject} value={subject} />
                  ))}
                </datalist>
              </div>

              <div className="flex justify-end gap-2 mt-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setOpen(false)}
                >
                  Cancel
                </Button>
                <CreateSubmitButton />
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
