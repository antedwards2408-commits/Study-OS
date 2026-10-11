import { cn } from "@/lib/utils";

const fillClasses = {
  danger: "bg-danger",
  warning: "bg-warning",
  success: "bg-success",
  brand: "bg-brand",
};

export function ProgressBar({
  value,
  tone = "brand",
  className,
}: {
  value: number;
  tone?: keyof typeof fillClasses;
  className?: string;
}) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div
      className={cn("h-2 w-full rounded-full bg-slate-100 overflow-hidden", className)}
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={cn("h-full rounded-full transition-all", fillClasses[tone])}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
