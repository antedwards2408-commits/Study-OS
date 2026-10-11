import Link from "next/link";
import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import { SignUpForm } from "@/components/auth/sign-up-form";

export const metadata: Metadata = {
  title: "Sign up - StudyOS",
  description: "Create your free StudyOS account and start your study loop.",
};

export default function SignUpPage() {
  return (
    <AuthShell
      title="Create your account"
      description="Start turning your coursework into a personal study system."
      footer={
        <>
          Already have an account?{" "}
          <Link href="/sign-in" className="font-medium text-brand hover:text-brand-light">
            Sign in
          </Link>
        </>
      }
    >
      <SignUpForm />
    </AuthShell>
  );
}
