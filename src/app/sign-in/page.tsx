import Link from "next/link";
import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import { SignInForm } from "@/components/auth/sign-in-form";

export const metadata: Metadata = {
  title: "Sign in - StudyOS",
  description: "Sign in to your StudyOS account to continue your study loop.",
};

export default function SignInPage() {
  return (
    <AuthShell
      title="Welcome back"
      description="Sign in to pick up right where you left off."
      footer={
        <>
          New to StudyOS?{" "}
          <Link href="/sign-up" className="font-medium text-brand hover:text-brand-light">
            Create an account
          </Link>
        </>
      }
    >
      <SignInForm />
    </AuthShell>
  );
}
