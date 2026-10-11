"use client";

import { useActionState } from "react";
import { updateProfile, type UpdateProfileState } from "@/lib/actions/settings";
import { Button } from "@/components/ui/button";

const initialState: UpdateProfileState = { status: "idle" };

export function ProfileForm({ initialFullName }: { initialFullName: string }) {
  const [state, formAction, pending] = useActionState(updateProfile, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <div>
        <label htmlFor="full_name" className="block text-sm font-medium text-foreground mb-1">
          Display name
        </label>
        <input
          id="full_name"
          name="full_name"
          type="text"
          defaultValue={initialFullName}
          placeholder="Your name"
          maxLength={120}
          className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brand"
        />
      </div>
      <div className="flex items-center gap-3">
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Saving..." : "Save changes"}
        </Button>
        {state.status === "success" && <span className="text-sm text-success">Saved</span>}
        {state.status === "error" && (
          <span className="text-sm text-danger">{state.message}</span>
        )}
      </div>
    </form>
  );
}
