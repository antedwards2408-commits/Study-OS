import type { ReactNode } from "react";
import Link from "next/link";
import { GraduationCap } from "lucide-react";

export function AuthShell({
  title,
  description,
  children,
  footer,
}: {
  title: string;
  description: string;
  children: ReactNode;
  footer: ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div
        aria-hidden
        className="pointer-events-none fixed -top-32 left-1/2 h-[420px] w-[720px] -translate-x-1/2 rounded-full bg-brand-soft blur-3xl"
      />

      <div className="relative flex flex-1 flex-col items-center justify-center px-4 py-12">
        <Link href="/" className="mb-8 flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand text-white">
            <GraduationCap className="h-5 w-5" />
          </div>
          <span className="text-lg font-semibold tracking-tight text-foreground">
            StudyOS
          </span>
        </Link>

        <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-8 shadow-sm">
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              {title}
            </h1>
            <p className="mt-2 text-sm text-muted">{description}</p>
          </div>

          {children}
        </div>

        <p className="mt-6 text-center text-sm text-muted">{footer}</p>
      </div>
    </div>
  );
}
