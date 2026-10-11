import { NextResponse } from "next/server";
import { PDFParse } from "pdf-parse";
import { createClient } from "@/lib/supabase/server";
import { chunkText } from "@/lib/ai/chunk";
import { inferTopics } from "@/lib/ai/generate";
import type { MaterialType } from "@/types/database";

// Route Handlers are not cached by default, and POST is never cached - this
// always runs the full upload + extraction pipeline at request time.
export async function POST(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Expected multipart/form-data" }, { status: 400 });
  }

  const courseId = formData.get("course_id");
  const titleRaw = formData.get("title");
  const type = formData.get("type");
  const file = formData.get("file");
  const text = formData.get("text");

  if (typeof courseId !== "string" || !courseId) {
    return NextResponse.json({ error: "course_id is required" }, { status: 400 });
  }
  if (typeof titleRaw !== "string" || !titleRaw.trim()) {
    return NextResponse.json({ error: "title is required" }, { status: 400 });
  }
  if (type !== "pdf" && type !== "text") {
    return NextResponse.json({ error: "type must be 'pdf' or 'text'" }, { status: 400 });
  }
  if (type === "pdf" && !(file instanceof File)) {
    return NextResponse.json({ error: "A PDF file is required" }, { status: 400 });
  }
  if (type === "text" && (typeof text !== "string" || !text.trim())) {
    return NextResponse.json({ error: "Pasted notes cannot be empty" }, { status: 400 });
  }

  const title = titleRaw.trim();
  const materialType: MaterialType = type;

  // Confirm the course exists and belongs to this user (RLS would also
  // enforce this, but failing fast here gives a clean 404 instead of a
  // confusing downstream insert error).
  const { data: course, error: courseError } = await supabase
    .from("courses")
    .select("id, name")
    .eq("id", courseId)
    .single();

  if (courseError || !course) {
    return NextResponse.json({ error: "Course not found" }, { status: 404 });
  }

  const { data: material, error: insertError } = await supabase
    .from("materials")
    .insert({
      course_id: courseId,
      user_id: user.id,
      title,
      type: materialType,
      status: "pending",
    })
    .select()
    .single();

  if (insertError || !material) {
    return NextResponse.json(
      { error: insertError?.message ?? "Failed to create material" },
      { status: 500 },
    );
  }

  try {
    await supabase.from("materials").update({ status: "processing" }).eq("id", material.id);

    let extractedText: string;
    let storagePath: string | null = null;

    if (materialType === "pdf") {
      const pdfFile = file as File;
      const buffer = Buffer.from(await pdfFile.arrayBuffer());

      storagePath = `${user.id}/${material.id}/${pdfFile.name}`;
      const { error: uploadError } = await supabase.storage
        .from("materials")
        .upload(storagePath, buffer, {
          contentType: pdfFile.type || "application/pdf",
          upsert: true,
        });
      if (uploadError) {
        throw new Error(`Failed to store the PDF: ${uploadError.message}`);
      }

      const parser = new PDFParse({ data: buffer });
      try {
        const result = await parser.getText();
        extractedText = result.text.trim();
      } finally {
        await parser.destroy();
      }

      if (!extractedText) {
        throw new Error(
          "No extractable text was found in this PDF (it may be a scanned image without OCR).",
        );
      }
    } else {
      extractedText = (text as string).trim();
    }

    const chunks = chunkText(extractedText);
    if (chunks.length === 0) {
      throw new Error("No content left to process after chunking.");
    }

    // Best-effort topic inference: a failure here shouldn't sink the whole
    // upload, since chunks are still searchable without topic tags.
    const topicIdByName = new Map<string, string>();
    try {
      const inferred = await inferTopics({
        courseName: course.name,
        materialTitle: title,
        text: extractedText,
      });

      for (const topic of inferred) {
        const { data: existing } = await supabase
          .from("topics")
          .select("id")
          .eq("course_id", courseId)
          .eq("name", topic.name)
          .maybeSingle();

        if (existing) {
          topicIdByName.set(topic.name, existing.id);
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
          .select("id")
          .single();

        if (created) topicIdByName.set(topic.name, created.id);
      }
    } catch {
      // Ignore - topics are a nice-to-have for this MVP, chunks remain
      // fully searchable via full-text search regardless of topic_id.
    }

    const chunkRows = chunks.map((content, index) => ({
      material_id: material.id,
      course_id: courseId,
      user_id: user.id,
      chunk_index: index,
      content,
      topic_id: null as string | null,
    }));

    const { error: chunksError } = await supabase.from("material_chunks").insert(chunkRows);
    if (chunksError) {
      throw new Error(`Failed to save content chunks: ${chunksError.message}`);
    }

    const { data: readyMaterial } = await supabase
      .from("materials")
      .update({
        status: "ready",
        raw_text: extractedText,
        storage_path: storagePath,
        error_message: null,
      })
      .eq("id", material.id)
      .select()
      .single();

    return NextResponse.json({ material: readyMaterial ?? material }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Processing failed";
    await supabase
      .from("materials")
      .update({ status: "error", error_message: message })
      .eq("id", material.id);

    return NextResponse.json({ error: message, materialId: material.id }, { status: 500 });
  }
}
