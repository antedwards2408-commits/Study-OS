"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { MailCheck, TriangleAlert } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/auth/form-field";

export function SignUpForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkEmail, setCheckEmail] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const formData = new FormData(event.currentTarget);
    const fullName = String(formData.get("full_name") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");
    const confirmPassword = String(formData.get("confirm_password") ?? "");

    if (password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }

    setLoading(true);
    const supabase = createClient();

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
      },
    });

    setLoading(false);

    if (signUpError) {
      setError(signUpError.message);
      return;
    }

    // If email confirmation is required, Supabase returns a user but no
    // active session yet - send the person to check their inbox instead of
    // assuming they're logged in.
    if (!data.session) {
      setCheckEmail(true);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  if (checkEmail) {
    return (
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-soft text-brand">
          <MailCheck className="h-6 w-6" />
        </div>
        <p className="text-sm text-foreground">
          Check your email to confirm your account.
        </p>
        <p className="text-sm text-muted">
          We sent a confirmation link to your inbox. Once confirmed, you can
          sign in and start uploading your first course.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {error && (
        <div className="flex items-start gap-2 rounded-xl bg-red-50 px-3.5 py-3 text-sm text-danger">
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <FormField
        label="Full name"
        id="full_name"
        type="text"
        autoComplete="name"
        placeholder="Ada Lovelace"
        required
      />
      <FormField
        label="Email"
        id="email"
        type="email"
        autoComplete="email"
        placeholder="you@school.edu"
        required
      />
      <FormField
        label="Password"
        id="password"
        type="password"
        autoComplete="new-password"
        placeholder="At least 6 characters"
        minLength={6}
        required
      />
      <FormField
        label="Confirm password"
        id="confirm_password"
        type="password"
        autoComplete="new-password"
        placeholder="Re-enter your password"
        minLength={6}
        required
      />

      <Button type="submit" size="lg" disabled={loading} className="mt-2 w-full">
        {loading ? "Creating account..." : "Create your account"}
      </Button>
    </form>
  );
}
