import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 h-[520px] w-[920px] -translate-x-1/2 rounded-full bg-brand-soft blur-3xl"
      />

      <div className="relative mx-auto max-w-6xl px-4 pt-16 pb-20 md:px-8 md:pt-24 md:pb-28">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-brand shadow-sm">
            <Sparkles className="h-3.5 w-3.5" />
            From messy notes to mastered material
          </div>

          <h1 className="text-4xl font-semibold leading-tight tracking-tight text-foreground sm:text-5xl md:text-6xl">
            Turn your coursework into your{" "}
            <span className="text-brand">personal study system.</span>
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-muted">
            Upload your lecture slides, readings, and notes. StudyOS turns them
            into a connected loop of questions, flashcards, and quizzes &mdash;
            so you always know exactly what to study next.
          </p>

          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/sign-up"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-6 py-3 text-base font-medium text-white shadow-sm transition-colors hover:bg-brand-light sm:w-auto"
            >
              Start studying free
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/sign-in"
              className="inline-flex w-full items-center justify-center rounded-xl border border-border bg-surface px-6 py-3 text-base font-medium text-foreground transition-colors hover:bg-slate-50 sm:w-auto"
            >
              Sign in
            </Link>
          </div>

          <p className="mt-5 text-sm text-muted">
            Free to start &middot; No credit card required
          </p>
        </div>
      </div>
    </section>
  );
}
