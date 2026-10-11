"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Creates a course for the logged-in user and redirects to its detail page.
 * Invoked directly as a <form action={createCourse}> - receives FormData.
 */
export async function createCourse(formData: FormData) {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) {
    throw new Error("You must be signed in to create a course.");
  }

  const name = formData.get("name")?.toString().trim();
  const subjectRaw = formData.get("subject")?.toString().trim();

  if (!name) {
    throw new Error("Course name is required.");
  }

  const { data: course, error } = await supabase
    .from("courses")
    .insert({
      user_id: auth.user.id,
      name,
      subject: subjectRaw ? subjectRaw : null,
    })
    .select("id")
    .single();

  if (error || !course) {
    throw new Error(error?.message ?? "Failed to create course.");
  }

  revalidatePath("/courses");
  redirect(`/courses/${course.id}`);
}

/**
 * Deletes a course owned by the logged-in user. RLS scopes the delete to the
 * owner, and `on delete cascade` in the schema removes everything under it
 * (topics, materials, flashcards, quizzes, mastery, etc).
 * Invoked directly as a <form action={deleteCourse}> with a hidden
 * "courseId" field - receives FormData.
 */
export async function deleteCourse(formData: FormData) {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) {
    throw new Error("You must be signed in to delete a course.");
  }

  const courseId = formData.get("courseId")?.toString();
  if (!courseId) {
    throw new Error("Missing courseId.");
  }

  const { error } = await supabase
    .from("courses")
    .delete()
    .eq("id", courseId)
    .eq("user_id", auth.user.id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/courses");
}
