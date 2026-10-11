import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function CtaSection() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16 md:px-8 md:py-24">
      <div className="relative overflow-hidden rounded-3xl bg-brand px-6 py-14 text-center shadow-sm sm:px-16">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-2xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-24 -left-16 h-64 w-64 rounded-full bg-white/10 blur-2xl"
        />

        <h2 className="relative text-3xl font-semibold tracking-tight text-white sm:text-4xl">
          Stop re-reading. Start mastering.
        </h2>
        <p className="relative mx-auto mt-4 max-w-xl text-lg text-white/80">
          Create your free StudyOS account and turn today&apos;s reading into
          tomorrow&apos;s flashcards, quizzes, and a clear mastery score.
        </p>
        <div className="relative mt-8 flex justify-center">
          <Link
            href="/sign-up"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3 text-base font-medium text-brand shadow-sm transition-colors hover:bg-slate-50"
          >
            Create your free account
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
