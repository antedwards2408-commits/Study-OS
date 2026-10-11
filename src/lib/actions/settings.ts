"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type UpdateProfileState = {
  status: "idle" | "success" | "error";
  message?: string;
};

/** Updates the signed-in user's display name (profiles.full_name). */
export async function updateProfile(
  _prevState: UpdateProfileState,
  formData: FormData,
): Promise<UpdateProfileState> {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  const user = authData.user;

  if (!user) {
    return { status: "error", message: "You must be signed in to update your profile." };
  }

  const rawName = formData.get("full_name");
  const fullName = typeof rawName === "string" ? rawName.trim() : "";

  const { error } = await supabase
    .from("profiles")
    .update({ full_name: fullName.length > 0 ? fullName : null })
    .eq("id", user.id);

  if (error) {
    return { status: "error", message: error.message };
  }

  revalidatePath("/settings");
  return { status: "success" };
}
