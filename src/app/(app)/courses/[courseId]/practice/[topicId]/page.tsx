import { notFound } from "next/navigation";
import { FileQuestion } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getTopicChunks } from "@/lib/ai/topic-chunks";
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

  const chunks = await getTopicChunks(supabase, {
    courseId,
    topicId,
    topicName: topic.name,
    topicDescription: topic.description,
    limit: 1,
  });

  if (chunks.length === 0) {
    return (
      <EmptyState
        icon={<FileQuestion className="h-8 w-8" />}
        title="Not enough material for this topic yet"
        description={`We couldn't find material covering "${topic.name}" in this course. Upload notes or a PDF that covers it, then try again.`}
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
