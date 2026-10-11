import Link from "next/link";
import { redirect } from "next/navigation";
import { FileText, Library as LibraryIcon, NotebookPen } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { UploadForm } from "@/components/materials/upload-form";
import { MaterialStatusBadge } from "@/components/materials/status-badge";

export default async function MaterialsPage({ params }: PageProps<"/courses/[courseId]/materials">) {
  const { courseId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const { data: materials } = await supabase
    .from("materials")
    .select("id, title, type, status, error_message, created_at")
    .eq("course_id", courseId)
    .order("created_at", { ascending: false });

  return (
    <div className="flex flex-col gap-6">
      <UploadForm courseId={courseId} />

      {materials && materials.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {materials.map((material) => (
            <Link key={material.id} href={`/courses/${courseId}/materials/${material.id}`}>
              <Card className="flex h-full flex-col gap-3 transition-colors hover:border-brand/40">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    {material.type === "pdf" ? (
                      <FileText className="h-4 w-4 text-muted" />
                    ) : (
                      <NotebookPen className="h-4 w-4 text-muted" />
                    )}
                    <h3 className="text-sm font-semibold text-foreground">{material.title}</h3>
                  </div>
                  <MaterialStatusBadge status={material.status} />
                </div>
                {material.status === "error" && material.error_message && (
                  <p className="text-xs text-danger">{material.error_message}</p>
                )}
                <p className="text-xs text-muted">
                  Added {new Date(material.created_at).toLocaleDateString()}
                </p>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<LibraryIcon className="h-6 w-6" />}
          title="No materials yet"
          description="Upload a PDF or paste your notes above to get started - StudyOS will extract the text and make it searchable for the AI tutor."
        />
      )}
    </div>
  );
}
