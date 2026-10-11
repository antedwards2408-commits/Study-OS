"use client";

import { useActionState } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { generateQuizAction, type GenerateQuizState } from "@/lib/actions/quizzes";

const initialState: GenerateQuizState = { error: null };

export function GenerateQuizForm({ materialId, courseId }: { materialId: string; courseId: string }) {
  const [state, formAction, pending] = useActionState(generateQuizAction, initialState);

  return (
    <form action={formAction} className="flex flex-col items-end gap-1.5">
      <input type="hidden" name="materialId" value={materialId} />
      <input type="hidden" name="courseId" value={courseId} />
      <Button type="submit" variant="secondary" size="sm" disabled={pending}>
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
        {pending ? "Generating..." : "Generate quiz"}
      </Button>
      {state.error && (
        <p className="text-xs text-danger max-w-[220px] text-right">{state.error}</p>
      )}
    </form>
  );
}
