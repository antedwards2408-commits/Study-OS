import {
  UploadCloud,
  MessageCircleQuestion,
  Layers,
  ListChecks,
  Target,
  TrendingUp,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface Step {
  icon: LucideIcon;
  title: string;
  description: string;
}

const STEPS: Step[] = [
  {
    icon: UploadCloud,
    title: "Upload your materials",
    description:
      "Drop in PDFs, slides, or typed notes for any course. StudyOS reads and organizes them by topic.",
  },
  {
    icon: MessageCircleQuestion,
    title: "Ask questions",
    description:
      "Chat directly with your material. Get answers grounded in your own notes, not generic web results.",
  },
  {
    icon: Layers,
    title: "Generate flashcards",
    description:
      "Turn dense readings into bite-sized flashcards automatically, ready to review whenever you have a spare minute.",
  },
  {
    icon: ListChecks,
    title: "Generate quizzes",
    description:
      "Test yourself with quizzes built from what you actually uploaded, not a generic question bank.",
  },
  {
    icon: Target,
    title: "Practice weak topics",
    description:
      "StudyOS flags the topics you keep missing and queues up focused practice until they stick.",
  },
  {
    icon: TrendingUp,
    title: "Track your mastery",
    description:
      "Watch topic-by-topic mastery scores climb over the semester, so you know you're ready before the exam does.",
  },
];

export function StudyLoop() {
  return (
    <section id="how-it-works" className="mx-auto max-w-6xl px-4 py-16 md:px-8 md:py-24">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          One upload. A full study loop.
        </h2>
        <p className="mt-4 text-lg text-muted">
          Every piece of StudyOS feeds the next, so studying stops being a
          pile of disconnected tasks and becomes one continuous habit.
        </p>
      </div>

      <ol className="mt-14 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {STEPS.map((step, index) => {
          const Icon = step.icon;
          return (
            <li
              key={step.title}
              className="relative rounded-2xl border border-border bg-surface p-6 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand">
                  <Icon className="h-5 w-5" />
                </div>
                <span className="text-sm font-medium text-muted">
                  Step {index + 1}
                </span>
              </div>
              <h3 className="mt-4 text-lg font-semibold text-foreground">
                {step.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                {step.description}
              </p>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
