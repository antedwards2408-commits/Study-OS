import Link from "next/link";
import { GraduationCap } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-4 py-10 text-center md:flex-row md:justify-between md:px-8 md:text-left">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand text-white">
            <GraduationCap className="h-4 w-4" />
          </div>
          <span className="text-sm font-semibold tracking-tight text-foreground">
            StudyOS
          </span>
        </div>

        <p className="text-sm text-muted">
          Built for students who want their notes to work as hard as they do.
        </p>

        <div className="flex items-center gap-6 text-sm text-muted">
          <Link href="/sign-in" className="hover:text-foreground transition-colors">
            Sign in
          </Link>
          <Link href="/sign-up" className="hover:text-foreground transition-colors">
            Sign up
          </Link>
        </div>
      </div>
      <div className="border-t border-border py-4 text-center text-xs text-muted">
        &copy; {new Date().getFullYear()} StudyOS. All rights reserved.
      </div>
    </footer>
  );
}
