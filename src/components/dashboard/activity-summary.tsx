import { ListChecks, Layers, Target, type LucideIcon } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/card";

export function ActivitySummary({
  quizAttempts,
  flashcardReviews,
  practiceSessions,
}: {
  quizAttempts: number;
  flashcardReviews: number;
  practiceSessions: number;
}) {
  const total = quizAttempts + flashcardReviews + practiceSessions;

  const stats: { label: string; value: number; icon: LucideIcon }[] = [
    { label: "Quiz attempts", value: quizAttempts, icon: ListChecks },
    { label: "Flashcards reviewed", value: flashcardReviews, icon: Layers },
    { label: "Practice sessions", value: practiceSessions, icon: Target },
  ];

  return (
    <Card>
      <CardHeader
        title="This week's activity"
        description={
          total > 0
            ? `${total} study action${total === 1 ? "" : "s"} in the last 7 days`
            : "No study activity in the last 7 days yet"
        }
      />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="flex items-center gap-3 rounded-xl border border-border px-3.5 py-3"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-brand">
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-lg font-semibold leading-none text-foreground">{stat.value}</p>
                <p className="mt-0.5 text-xs text-muted">{stat.label}</p>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
