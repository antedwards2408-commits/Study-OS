import { NextResponse } from "next/server";
import { extractText, getDocumentProxy } from "unpdf";
import { createClient } from "@/lib/supabase/server";
import { chunkText } from "@/lib/ai/chunk";
import { inferTopics } from "@/lib/ai/generate";

// PDF extraction + AI topic inference + DB writes can exceed the default
// serverless timeout (10s on Vercel Hobby), which kills the function
// mid-response and surfaces as an empty body on the client.
export const maxDuration = 60;

interface UploadBody {
  course_id?: unknown;
  title?: unknown;
  type?: unknown;
  storage_path?: unknown;
  text?: unknown;
}

function fail(error: string, status: number) {
  return NextResponse.json({ error }, { status });
}

interface TopicRef {
  id: string;
  name: string;
  description: string | null;
}

const STOPWORDS = new Set([
  "the", "and", "for", "with", "from", "that", "this", "into", "are", "its",
  "their", "how", "what", "why", "of", "in", "on", "to", "a", "an", "is", "by",
]);

function keywords(text: string): string[] {
  return (text.toLowerCase().match(/[a-z][a-z0-9-]{2,}/g) ?? []).filter((w) => !STOPWORDS.has(w));
}

/** Tags a chunk with the topic whose name/description terms it mentions most (name terms weigh more). */
function bestTopicFor(chunk: string, topics: TopicRef[]): string | null {
  if (topics.length === 0) return null;
  const haystack = chunk.toLowerCase();
  let best: { id: string; score: number } | null = null;

  for (const topic of topics) {
    let score = 0;
    for (const word of new Set(keywords(topic.name))) if (haystack.includes(word)) score += 3;
    for (const word of new Set(keywords(topic.description ?? ""))) if (haystack.includes(word)) score += 1;
    if (score > 0 && (!best || score > best.score)) best = { id: topic.id, score };
  }
  return best?.id ?? null;
}

/**
 * Processes a material. PDFs are uploaded by the browser straight to the
 * `materials` Storage bucket (bypassing the platform's ~4.5 MB request body
 * cap), so this route only receives the storage path, then downloads,
 * extracts, chunks, and indexes it. Pasted notes arrive inline as `text`.
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return fail("You're signed out - sign in again and retry.", 401);

  let body: UploadBody;
  try {
    body = (await request.json()) as UploadBody;
  } catch {
    return fail("Invalid request body.", 400);
  }

  const { course_id: courseId, title: titleRaw, type, storage_path: storagePath, text } = body;

  if (typeof courseId !== "string" || !courseId) return fail("course_id is required", 400);
  if (typeof titleRaw !== "string" || !titleRaw.trim()) return fail("Title is required", 400);
  if (type !== "pdf" && type !== "text") return fail("type must be 'pdf' or 'text'", 400);
  if (type === "pdf") {
    if (typeof storagePath !== "string" || !storagePath) return fail("A PDF file is required", 400);
    // RLS on storage already scopes reads to the user's own folder; checking
    // here too gives a clear 403 instead of an opaque download failure.
    if (!storagePath.startsWith(`${user.id}/`)) return fail("Invalid file path", 403);
  }
  if (type === "text" && (typeof text !== "string" || !text.trim())) {
    return fail("Pasted notes cannot be empty", 400);
  }

  const title = titleRaw.trim();

  const { data: course } = await supabase
    .from("courses")
    .select("id, name")
    .eq("id", courseId)
    .single();
  if (!course) return fail("Course not found", 404);

  const { data: material, error: insertError } = await supabase
    .from("materials")
    .insert({
      course_id: courseId,
      user_id: user.id,
      title,
      type,
      status: "processing",
      storage_path: type === "pdf" ? (storagePath as string) : null,
    })
    .select()
    .single();

  if (insertError || !material) {
    console.error("[upload] material insert failed", insertError);
    return fail(insertError?.message ?? "Failed to create material", 500);
  }

  try {
    let extractedText: string;

    if (type === "pdf") {
      const { data: blob, error: downloadError } = await supabase.storage
        .from("materials")
        .download(storagePath as string);
      if (downloadError || !blob) {
        throw new Error(`Couldn't read the uploaded PDF: ${downloadError?.message ?? "not found"}`);
      }

      const pdf = await getDocumentProxy(new Uint8Array(await blob.arrayBuffer()));
      const result = await extractText(pdf, { mergePages: true });
      extractedText = result.text.trim();

      if (!extractedText) {
        throw new Error(
          "No selectable text found in this PDF - it's probably a scanned image. Try a text-based PDF or paste the notes instead.",
        );
      }
    } else {
      extractedText = (text as string).trim();
    }

    const chunks = chunkText(extractedText);
    if (chunks.length === 0) throw new Error("No content left to process after chunking.");

    // Topic inference is best-effort: chunks stay searchable without topics,
    // so an AI hiccup shouldn't fail the whole upload.
    const topics: TopicRef[] = [];
    try {
      const inferred = await inferTopics({
        courseName: course.name,
        materialTitle: title,
        text: extractedText,
      });

      for (const topic of inferred) {
        if (!topic?.name) continue;
        const { data: existing } = await supabase
          .from("topics")
          .select("id, name, description")
          .eq("course_id", courseId)
          .eq("name", topic.name)
          .maybeSingle();
        if (existing) {
          topics.push(existing);
          continue;
        }

        const { data: created } = await supabase
          .from("topics")
          .insert({
            course_id: courseId,
            user_id: user.id,
            name: topic.name,
            description: topic.description,
          })
          .select("id, name, description")
          .single();
        if (created) topics.push(created);
      }
    } catch (err) {
      console.error("[upload] topic inference failed (continuing without topics)", err);
    }

    const { error: chunksError } = await supabase.from("material_chunks").insert(
      chunks.map((content, index) => ({
        material_id: material.id,
        course_id: courseId,
        user_id: user.id,
        chunk_index: index,
        content,
        topic_id: bestTopicFor(content, topics),
      })),
    );
    if (chunksError) throw new Error(`Failed to save content: ${chunksError.message}`);

    const { data: readyMaterial } = await supabase
      .from("materials")
      .update({ status: "ready", raw_text: extractedText, error_message: null })
      .eq("id", material.id)
      .select()
      .single();

    return NextResponse.json({ material: readyMaterial ?? material }, { status: 201 });
  } catch (err) {
    console.error("[upload] processing failed", err);
    const message = err instanceof Error ? err.message : "Processing failed";
    await supabase
      .from("materials")
      .update({ status: "error", error_message: message })
      .eq("id", material.id);
    return NextResponse.json({ error: message, materialId: material.id }, { status: 500 });
  }
}
