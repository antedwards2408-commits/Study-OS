import Link from "next/link";
import { redirect } from "next/navigation";
import { FileText, Library as LibraryIcon, NotebookPen } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { MaterialStatusBadge } from "@/components/materials/status-badge";

export default async function LibraryPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const [{ data: materials }, { data: courses }] = await Promise.all([
    supabase
      .from("materials")
      .select("id, course_id, title, type, status, error_message, created_at")
      .order("created_at", { ascending: false }),
    supabase.from("courses").select("id, name, subject"),
  ]);

  const courseById = new Map((courses ?? []).map((c) => [c.id, c]));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Library</h1>
        <p className="mt-1 text-sm text-muted">
          Every material you&apos;ve uploaded, across all of your courses.
        </p>
      </div>

      {materials && materials.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {materials.map((material) => {
            const course = courseById.get(material.course_id);
            return (
              <Link key={material.id} href={`/courses/${material.course_id}/materials/${material.id}`}>
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

                  {course && <Badge tone="neutral">{course.name}</Badge>}

                  {material.status === "error" && material.error_message && (
                    <p className="text-xs text-danger">{material.error_message}</p>
                  )}

                  <p className="text-xs text-muted">
                    Added {new Date(material.created_at).toLocaleDateString()}
                  </p>
                </Card>
              </Link>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={<LibraryIcon className="h-6 w-6" />}
          title="Your library is empty"
          description="Upload materials from a course's Materials tab and they'll show up here, grouped across all your courses."
        />
      )}
    </div>
  );
}
