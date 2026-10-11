import { FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { MaterialStatus } from "@/types/database";

const STATUS_TONE: Record<
  MaterialStatus,
  "neutral" | "brand" | "success" | "warning" | "danger"
> = {
  pending: "neutral",
  processing: "warning",
  ready: "success",
  error: "danger",
};

export interface RecentMaterialRow {
  id: string;
  title: string;
  status: MaterialStatus;
}

export function RecentMaterialsList({
  materials,
}: {
  materials: RecentMaterialRow[];
}) {
  return (
    <ul className="flex flex-col divide-y divide-border">
      {materials.map((material) => (
        <li key={material.id} className="flex items-center gap-3 py-2.5">
          <FileText className="h-4 w-4 text-muted shrink-0" />
          <span className="flex-1 text-sm text-foreground truncate">
            {material.title}
          </span>
          <Badge tone={STATUS_TONE[material.status]}>{material.status}</Badge>
        </li>
      ))}
    </ul>
  );
}
