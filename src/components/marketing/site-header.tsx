import Link from "next/link";
import { GraduationCap } from "lucide-react";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-background/80 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 md:px-8">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand text-white">
            <GraduationCap className="h-5 w-5" />
          </div>
          <span className="font-semibold tracking-tight text-foreground">
            StudyOS
          </span>
        </Link>

        <nav className="flex items-center gap-2 sm:gap-4">
          <Link
            href="/sign-in"
            className="rounded-xl px-3 py-2 text-sm font-medium text-muted transition-colors hover:text-foreground"
          >
            Sign in
          </Link>
          <Link
            href="/sign-up"
            className="inline-flex items-center justify-center rounded-xl bg-brand px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-brand-light"
          >
            Get started free
          </Link>
        </nav>
      </div>
    </header>
  );
}
