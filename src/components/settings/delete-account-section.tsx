import { AlertTriangle } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// Placeholder only - real deletion needs admin/service-role access this MVP
// doesn't have. Intentionally disabled rather than silently omitted.
export function DeleteAccountSection() {
  return (
    <Card className="border-danger/30">
      <CardHeader
        title="Delete account"
        description="Permanently remove your account and all of your data"
      />
      <div className="flex items-start gap-3 rounded-xl bg-red-50 px-4 py-3">
        <AlertTriangle className="h-4 w-4 flex-shrink-0 text-danger mt-0.5" />
        <p className="text-sm text-danger">
          Account deletion isn&apos;t implemented yet in this version of StudyOS. Contact
          support if you need your account removed in the meantime.
        </p>
      </div>
      <Button
        variant="danger"
        size="sm"
        className="mt-4"
        disabled
        title="Not implemented yet"
      >
        Delete account
      </Button>
    </Card>
  );
}
