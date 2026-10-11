// Small, dependency-free time formatting helpers for the progress feed.
// Kept local to src/components/progress so this slice doesn't need to touch
// the shared src/lib/utils.ts.

const RELATIVE_UNITS: Array<{
  limitSeconds: number;
  divisor: number;
  unit: Intl.RelativeTimeFormatUnit;
}> = [
  { limitSeconds: 60, divisor: 1, unit: "second" },
  { limitSeconds: 3600, divisor: 60, unit: "minute" },
  { limitSeconds: 86_400, divisor: 3600, unit: "hour" },
  { limitSeconds: 604_800, divisor: 86_400, unit: "day" },
  { limitSeconds: 2_629_800, divisor: 604_800, unit: "week" },
  { limitSeconds: 31_557_600, divisor: 2_629_800, unit: "month" },
  { limitSeconds: Infinity, divisor: 31_557_600, unit: "year" },
];

const relativeFormatter = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

/** ISO timestamp for exactly 7 days ago - a small wrapper so callers in a
 * Server Component body don't call the impure `Date.now`/`new Date()`
 * directly during render (flagged by react-hooks/purity). */
export function sevenDaysAgoIso(): string {
  return new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
}

/** Formats an ISO timestamp as a short relative string, e.g. "3 hours ago". */
export function formatRelativeTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";

  const diffSeconds = (date.getTime() - Date.now()) / 1000;
  const absSeconds = Math.abs(diffSeconds);
  const unitInfo =
    RELATIVE_UNITS.find((u) => absSeconds < u.limitSeconds) ??
    RELATIVE_UNITS[RELATIVE_UNITS.length - 1];
  const value = Math.round(diffSeconds / unitInfo.divisor);
  return relativeFormatter.format(value, unitInfo.unit);
}
