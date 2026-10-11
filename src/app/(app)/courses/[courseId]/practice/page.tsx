import { Target, Upload } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProgressBar } from "@/components/ui/progress-bar";
import { LinkButton } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { masteryLevel } from "@/lib/utils";

interface TopicWithMastery {
  id: string;
  name: string;
  description: string | null;
  mastery: number | null;
  attemptsCount: number;
  lastAttemptAt: string | null;
}

export default async function PracticePage(props: PageProps<"/courses/[courseId]/practice">) {
  const { courseId } = await props.params;
  const supabase = await createClient();

  const [{ data: topics }, { data: masteryRows }] = await Promise.all([
    supabase
      .from("topics")
      .select("id, name, description")
      .eq("course_id", courseId)
      .order("name"),
    supabase
      .from("topic_mastery")
      .select("topic_id, mastery, attempts_count, last_attempt_at")
      .eq("course_id", courseId),
  ]);

  const masteryByTopic = new Map((masteryRows ?? []).map((row) => [row.topic_id, row]));

  const combined: TopicWithMastery[] = (topics ?? []).map((topic) => {
    const row = masteryByTopic.get(topic.id);
    return {
      id: topic.id,
      name: topic.name,
      description: topic.description,
      mastery: row ? Number(row.mastery) : null,
      attemptsCount: row?.attempts_count ?? 0,
      lastAttemptAt: row?.last_attempt_at ?? null,
    };
  });

  // Weakest-first: topics never attempted have no mastery signal yet, so they
  // need attention just as much as (if not more than) a known-weak topic -
  // they're sorted ahead of any attempted topic, then by ascending mastery.
  combined.sort((a, b) => {
    if (a.mastery === null && b.mastery === null) return a.name.localeCompare(b.name);
    if (a.mastery === null) return -1;
    if (b.mastery === null) return 1;
    return a.mastery - b.mastery;
  });

  if (combined.length === 0) {
    return (
      <EmptyState
        icon={<Upload className="h-8 w-8" />}
        title="No topics yet"
        description="Practice is organized by topic, and topics are detected from your course material. Upload something first to get started."
        action={
          <LinkButton href={`/courses/${courseId}/materials`}>Upload material</LinkButton>
        }
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Practice weak topics</h2>
        <p className="text-sm text-muted mt-0.5">
          Topics are sorted so the ones that need the most work show up first.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {combined.map((topic) => {
          const level = topic.mastery !== null ? masteryLevel(topic.mastery) : null;
          return (
            <Card key={topic.id} className="flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm font-semibold text-foreground truncate">{topic.name}</h3>
                  {level ? (
                    <Badge tone={level.color}>{level.label}</Badge>
                  ) : (
                    <Badge tone="neutral">Not yet attempted</Badge>
                  )}
                </div>
                {topic.description && (
                  <p className="text-sm text-muted mt-0.5 truncate">{topic.description}</p>
                )}

                <div className="mt-3 flex items-center gap-3 max-w-sm">
                  <ProgressBar
                    value={topic.mastery ?? 0}
                    tone={level?.color ?? "brand"}
                    className="flex-1"
                  />
                  <span className="text-sm font-medium text-foreground tabular-nums w-10 text-right">
                    {topic.mastery !== null ? `${topic.mastery}%` : "—"}
                  </span>
                </div>
                {topic.attemptsCount > 0 && (
                  <p className="text-xs text-muted mt-1.5">
                    {topic.attemptsCount} attempt{topic.attemptsCount === 1 ? "" : "s"} so far
                  </p>
                )}
              </div>

              <LinkButton
                href={`/courses/${courseId}/practice/${topic.id}`}
                size="sm"
                className="shrink-0"
              >
                <Target className="h-4 w-4" />
                Start practice
              </LinkButton>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
