import Link from "next/link";
import { FileText } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { LinkButton } from "@/components/ui/button";
import { timeAgo } from "./format";
import type { MaterialStatus, MaterialType } from "@/types/database";

const STATUS_TONE: Record<MaterialStatus, "neutral" | "brand" | "success" | "warning" | "danger"> = {
  pending: "neutral",
  processing: "warning",
  ready: "success",
  error: "danger",
};

const STATUS_LABEL: Record<MaterialStatus, string> = {
  pending: "Pending",
  processing: "Processing",
  ready: "Ready",
  error: "Error",
};

export function RecentMaterials({
  materials,
}: {
  materials: {
    id: string;
    title: string;
    type: MaterialType;
    status: MaterialStatus;
    courseId: string;
    courseName: string;
    createdAt: string;
  }[];
}) {
  return (
    <Card>
      <CardHeader title="Recent materials" description="Across all your courses" />
      {materials.length === 0 ? (
        <EmptyState
          icon={<FileText className="h-8 w-8" />}
          title="No materials yet"
          description="Upload a PDF or your notes to a course to start the study loop."
          action={
            <LinkButton href="/courses" size="sm">
              Upload material
            </LinkButton>
          }
        />
      ) : (
        <ul className="flex flex-col gap-2">
          {materials.map((material) => (
            <li key={material.id}>
              <Link
                href={`/courses/${material.courseId}/materials`}
                className="flex items-center justify-between gap-3 rounded-xl border border-border px-3.5 py-2.5 transition-colors hover:border-brand hover:bg-brand-soft"
              >
                <div className="flex min-w-0 items-center gap-2.5">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-muted">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">{material.title}</p>
                    <p className="truncate text-xs text-muted">
                      {material.courseName} · {timeAgo(material.createdAt)}
                    </p>
                  </div>
                </div>
                <Badge tone={STATUS_TONE[material.status]} className="shrink-0">
                  {STATUS_LABEL[material.status]}
                </Badge>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
