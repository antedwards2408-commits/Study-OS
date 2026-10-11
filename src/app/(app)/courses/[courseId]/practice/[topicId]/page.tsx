import { notFound } from "next/navigation";
import { FileQuestion } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/ui/empty-state";
import { LinkButton } from "@/components/ui/button";
import { PracticeRunner } from "@/components/practice/practice-runner";

export default async function PracticeTopicPage(
  props: PageProps<"/courses/[courseId]/practice/[topicId]">,
) {
  const { courseId, topicId } = await props.params;
  const supabase = await createClient();

  const { data: topic } = await supabase
    .from("topics")
    .select("id, name, description")
    .eq("id", topicId)
    .eq("course_id", courseId)
    .single();

  if (!topic) notFound();

  const { data: masteryRow } = await supabase
    .from("topic_mastery")
    .select("mastery")
    .eq("course_id", courseId)
    .eq("topic_id", topicId)
    .maybeSingle();

  const { data: chunkRows } = await supabase.rpc("chunks_for_topic", {
    p_topic_id: topicId,
    p_limit: 1,
  });

  if (!chunkRows || chunkRows.length === 0) {
    return (
      <EmptyState
        icon={<FileQuestion className="h-8 w-8" />}
        title="Not enough material for this topic yet"
        description={`"${topic.name}" doesn't have any tagged material chunks yet. Upload more material for this course, or check back once processing finishes.`}
        action={
          <LinkButton href={`/courses/${courseId}/materials`}>Go to materials</LinkButton>
        }
      />
    );
  }

  return (
    <PracticeRunner
      courseId={courseId}
      topicId={topicId}
      topicName={topic.name}
      topicDescription={topic.description}
      initialMastery={masteryRow ? Number(masteryRow.mastery) : null}
    />
  );
}
