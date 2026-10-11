import { notFound, redirect } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card, CardHeader } from "@/components/ui/card";
import { MaterialStatusBadge } from "@/components/materials/status-badge";
import { ChatPanel, type ChatPanelMessage } from "@/components/tutor/chat-panel";

export default async function MaterialDetailPage({
  params,
}: PageProps<"/courses/[courseId]/materials/[materialId]">) {
  const { courseId, materialId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const { data: material } = await supabase
    .from("materials")
    .select("*")
    .eq("id", materialId)
    .eq("course_id", courseId)
    .single();

  if (!material) notFound();

  let pdfUrl: string | null = null;
  if (material.type === "pdf" && material.storage_path) {
    const { data: signed } = await supabase.storage
      .from("materials")
      .createSignedUrl(material.storage_path, 60 * 60);
    pdfUrl = signed?.signedUrl ?? null;
  }

  const { data: messageRows } = await supabase
    .from("chat_messages")
    .select("id, role, content")
    .eq("material_id", materialId)
    .order("created_at", { ascending: true });

  const initialMessages: ChatPanelMessage[] = (messageRows ?? []).map((m) => ({
    id: m.id,
    role: m.role,
    content: m.content,
  }));

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card className="flex flex-col gap-4">
        <CardHeader
          title={material.title}
          description={material.type === "pdf" ? "Uploaded PDF" : "Pasted notes"}
          action={<MaterialStatusBadge status={material.status} />}
        />

        {material.status === "error" && material.error_message && (
          <p className="rounded-xl border border-danger/30 bg-red-50 px-3.5 py-2.5 text-sm text-danger">
            {material.error_message}
          </p>
        )}

        {pdfUrl && (
          <a
            href={pdfUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 self-start text-sm font-medium text-brand hover:text-brand-light"
          >
            View original PDF <ExternalLink className="h-3.5 w-3.5" />
          </a>
        )}

        <div className="max-h-[60vh] overflow-y-auto whitespace-pre-wrap rounded-xl border border-border bg-background p-4 text-sm text-foreground">
          {material.raw_text ||
            (material.status === "processing" || material.status === "pending"
              ? "Processing - extracted text will appear here once ready."
              : "No extracted text available.")}
        </div>
      </Card>

      <Card className="flex h-[70vh] flex-col">
        <CardHeader
          title="Ask AI about this material"
          description="Answers are grounded in this document's content."
        />
        <ChatPanel
          scope={{ type: "material", courseId, materialId }}
          initialMessages={initialMessages}
          placeholder={`Ask about ${material.title}...`}
          emptyHint={`Ask a question about "${material.title}" - I'll answer from this document first.`}
        />
      </Card>
    </div>
  );
}
