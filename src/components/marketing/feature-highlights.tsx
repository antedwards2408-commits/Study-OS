import { BookOpen, Brain, LineChart } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
}

const FEATURES: Feature[] = [
  {
    icon: BookOpen,
    title: "Grounded in your own coursework",
    description:
      "Every answer, flashcard, and quiz question is generated from the materials you actually uploaded for your actual class.",
  },
  {
    icon: Brain,
    title: "Built around how memory works",
    description:
      "Flashcards and practice sessions are organized by topic, so review time goes where it actually moves your grade.",
  },
  {
    icon: LineChart,
    title: "Mastery you can see",
    description:
      "A clear, topic-by-topic view of what you know cold and what still needs work, updated after every session.",
  },
];

export function FeatureHighlights() {
  return (
    <section className="border-y border-border bg-surface">
      <div className="mx-auto max-w-6xl px-4 py-16 md:px-8 md:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Not just another note-taking app.
          </h2>
          <p className="mt-4 text-lg text-muted">
            StudyOS is built to close the loop between reading something once
            and actually knowing it on exam day.
          </p>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-8 sm:grid-cols-3">
          {FEATURES.map((feature) => {
            const Icon = feature.icon;
            return (
              <div key={feature.title} className="text-center sm:text-left">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-brand-soft text-brand sm:mx-0">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="mt-5 text-lg font-semibold text-foreground">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
