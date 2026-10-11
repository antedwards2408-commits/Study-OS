export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

/** Maps a 0-100 mastery score to a semantic color token and label. */
export function masteryLevel(score: number): {
  color: "danger" | "warning" | "success";
  label: string;
} {
  if (score < 55) return { color: "danger", label: "Needs work" };
  if (score < 75) return { color: "warning", label: "Developing" };
  return { color: "success", label: "Strong" };
}
