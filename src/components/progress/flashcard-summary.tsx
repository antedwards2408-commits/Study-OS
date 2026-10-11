import { Card, CardHeader } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress-bar";

/** All-time flashcard review totals, split known vs. still learning. */
export function FlashcardSummary({ total, known }: { total: number; known: number }) {
  const notKnown = Math.max(total - known, 0);
  const knownPct = total > 0 ? Math.round((known / total) * 100) : 0;

  return (
    <Card>
      <CardHeader
        title="Flashcards reviewed"
        description="Known vs. still learning, all time"
      />
      {total === 0 ? (
        <p className="text-sm text-muted">No flashcards reviewed yet.</p>
      ) : (
        <>
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-2xl font-semibold text-foreground">{total}</span>
            <span className="text-sm text-muted">reviewed</span>
          </div>
          <ProgressBar value={knownPct} tone="success" />
          <div className="flex items-center justify-between text-xs text-muted mt-1.5">
            <span>{known} known</span>
            <span>{notKnown} still learning</span>
          </div>
        </>
      )}
    </Card>
  );
}
