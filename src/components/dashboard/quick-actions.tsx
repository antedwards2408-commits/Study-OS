import Link from "next/link";
import { Sparkles, Layers, ListChecks, Target, type LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";

const ACTIONS: {
  slug: string;
  label: string;
  description: string;
  icon: LucideIcon;
}[] = [
  { slug: "tutor", label: "Ask AI", description: "Get answers from your materials", icon: Sparkles },
  { slug: "flashcards", label: "Flashcards", description: "Review with spaced repetition", icon: Layers },
  { slug: "quizzes", label: "Quiz", description: "Test what you've learned", icon: ListChecks },
  { slug: "practice", label: "Practice", description: "Drill your weakest topics", icon: Target },
];

export function QuickActions({ courseId }: { courseId: string }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {ACTIONS.map((action) => {
        const Icon = action.icon;
        return (
          <Link key={action.slug} href={`/courses/${courseId}/${action.slug}`} className="group block">
            <Card className="h-full transition-colors group-hover:border-brand group-hover:bg-brand-soft">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-soft text-brand transition-colors group-hover:bg-brand group-hover:text-white">
                <Icon className="h-5 w-5" />
              </div>
              <p className="mt-3 text-sm font-semibold text-foreground">{action.label}</p>
              <p className="mt-0.5 text-xs text-muted">{action.description}</p>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
