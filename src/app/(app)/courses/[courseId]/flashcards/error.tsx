"use client";

import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function FlashcardsError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <div className="flex flex-col items-center text-center gap-3 py-16 px-6 rounded-2xl border border-dashed border-border">
      <AlertTriangle className="h-6 w-6 text-danger" />
      <h3 className="text-base font-semibold text-foreground">Something went wrong loading flashcards</h3>
      <p className="text-sm text-muted max-w-sm">{error.message || "Please try again."}</p>
      <Button variant="secondary" size="sm" onClick={() => retry()}>
        Try again
      </Button>
    </div>
  );
}
