import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { MaterialStatus } from "@/types/database";

const CONFIG: Record<MaterialStatus, { tone: "neutral" | "brand" | "success" | "danger"; label: string }> = {
  pending: { tone: "neutral", label: "Pending" },
  processing: { tone: "brand", label: "Processing" },
  ready: { tone: "success", label: "Ready" },
  error: { tone: "danger", label: "Error" },
};

export function MaterialStatusBadge({ status }: { status: MaterialStatus }) {
  const { tone, label } = CONFIG[status];
  return (
    <Badge tone={tone} className="inline-flex items-center gap-1">
      {status === "processing" && <Loader2 className="h-3 w-3 animate-spin" />}
      {label}
    </Badge>
  );
}
