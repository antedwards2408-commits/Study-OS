import { FileText, Layers, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LinkButton } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { GenerateFlashcardsForm } from "@/components/flashcards/generate-flashcards-form";
import type { MaterialStatus } from "@/types/database";

function statusBadge(status: MaterialStatus) {
  const tone =
    status === "ready" ? "success" : status === "error" ? "danger" : status === "processing" ? "warning" : "neutral";
  const label = status.charAt(0).toUpperCase() + status.slice(1);
  return <Badge tone={tone}>{label}</Badge>;
}

export default async function FlashcardsPage({ params }: PageProps<"/courses/[courseId]/flashcards">) {
  const { courseId } = await params;
  const supabase = await createClient();

  const [{ data: materials }, { data: flashcards }] = await Promise.all([
    supabase
      .from("materials")
      .select("id, title, status")
      .eq("course_id", courseId)
      .order("created_at", { ascending: false }),
    supabase.from("flashcards").select("id, material_id, difficulty").eq("course_id", courseId),
  ]);

  const materialList = materials ?? [];
  const cardList = flashcards ?? [];

  const countsByMaterial = new Map<string, number>();
  for (const card of cardList) {
    countsByMaterial.set(card.material_id, (countsByMaterial.get(card.material_id) ?? 0) + 1);
  }

  if (materialList.length === 0) {
    return (
      <EmptyState
        icon={<Layers className="h-6 w-6" />}
        title="No materials yet"
        description="Upload course material first, then come back here to turn it into flashcards."
        action={<LinkButton href={`/courses/${courseId}/materials`}>Go to Materials</LinkButton>}
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader
          title="Generate flashcards"
          description="Pick a ready material and turn it into a study deck."
        />
        <div className="flex flex-col divide-y divide-border">
          {materialList.map((material) => {
            const count = countsByMaterial.get(material.id) ?? 0;
            return (
              <div key={material.id} className="flex items-center justify-between gap-4 py-3">
                <div className="flex items-center gap-3 min-w-0">
                  <FileText className="h-4 w-4 text-muted shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{material.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {statusBadge(material.status)}
                      {count > 0 && (
                        <span className="text-xs text-muted">
                          {count} card{count === 1 ? "" : "s"}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {count > 0 && (
                    <LinkButton
                      href={`/courses/${courseId}/flashcards/study?materialId=${material.id}`}
                      variant="ghost"
                      size="sm"
                    >
                      Study
                    </LinkButton>
                  )}
                  {material.status === "ready" ? (
                    <GenerateFlashcardsForm materialId={material.id} courseId={courseId} />
                  ) : (
                    <span className="text-xs text-muted">Not ready</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {cardList.length > 0 ? (
        <Card>
          <CardHeader
            title="Your flashcards"
            description={`${cardList.length} card${cardList.length === 1 ? "" : "s"} across ${countsByMaterial.size} set${countsByMaterial.size === 1 ? "" : "s"}.`}
            action={
              <LinkButton href={`/courses/${courseId}/flashcards/study`} size="sm">
                Study all
              </LinkButton>
            }
          />
          <p className="text-sm text-muted">
            Study any individual set above, or study everything from this course at once.
          </p>
        </Card>
      ) : (
        <EmptyState
          icon={<Sparkles className="h-6 w-6" />}
          title="No flashcards yet"
          description="Generate a deck from one of your ready materials above to get started."
        />
      )}
    </div>
  );
}
