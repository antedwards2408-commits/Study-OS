import { BookOpen, Brain, ClipboardList, Layers, type LucideIcon } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { formatRelativeTime } from "@/components/progress/format";

export type ActivityKind = "quiz" | "practice" | "flashcard" | "material";

export interface ActivityItem {
  id: string;
  kind: ActivityKind;
  title: string;
  subtitle: string;
  timestamp: string;
}

const ICONS: Record<ActivityKind, LucideIcon> = {
  quiz: ClipboardList,
  practice: Brain,
  flashcard: Layers,
  material: BookOpen,
};

const ICON_TONES: Record<ActivityKind, string> = {
  quiz: "text-brand bg-brand-soft",
  practice: "text-warning bg-amber-50",
  flashcard: "text-success bg-green-50",
  material: "text-muted bg-slate-100",
};

/** Reverse-chronological feed merging quizzes, practice, flashcards and uploads. */
export function RecentActivityFeed({ items }: { items: ActivityItem[] }) {
  return (
    <Card>
      <CardHeader
        title="Recent activity"
        description="Everything you've done, most recent first"
      />
      {items.length === 0 ? (
        <p className="text-sm text-muted">Nothing here yet.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {items.map((item) => {
            const Icon = ICONS[item.kind];
            return (
              <li key={item.id} className="flex items-start gap-3">
                <div
                  className={cn(
                    "flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full",
                    ICON_TONES[item.kind],
                  )}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground truncate">{item.title}</p>
                  <p className="text-xs text-muted truncate">{item.subtitle}</p>
                </div>
                <span className="text-xs text-muted flex-shrink-0 whitespace-nowrap">
                  {formatRelativeTime(item.timestamp)}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
