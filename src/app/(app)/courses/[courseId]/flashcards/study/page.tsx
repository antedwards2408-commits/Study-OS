import { Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { LinkButton } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { FlashcardStudySession, type StudyCard } from "@/components/flashcards/flashcard-study-session";

export default async function FlashcardsStudyPage({
  params,
  searchParams,
}: PageProps<"/courses/[courseId]/flashcards/study">) {
  const { courseId } = await params;
  const sp = await searchParams;
  const materialId = typeof sp.materialId === "string" ? sp.materialId : undefined;

  const supabase = await createClient();

  let query = supabase
    .from("flashcards")
    .select("id, question, answer, difficulty, topic_id, material_id")
    .eq("course_id", courseId)
    .order("created_at", { ascending: true });

  if (materialId) {
    query = query.eq("material_id", materialId);
  }

  const [{ data: flashcards }, { data: topics }] = await Promise.all([
    query,
    supabase.from("topics").select("id, name").eq("course_id", courseId),
  ]);

  const topicNameById = new Map((topics ?? []).map((t) => [t.id, t.name]));

  const cards: StudyCard[] = (flashcards ?? []).map((card) => ({
    id: card.id,
    question: card.question,
    answer: card.answer,
    difficulty: card.difficulty,
    topicName: card.topic_id ? topicNameById.get(card.topic_id) ?? null : null,
  }));

  if (cards.length === 0) {
    return (
      <EmptyState
        icon={<Sparkles className="h-6 w-6" />}
        title="No flashcards to study"
        description={
          materialId
            ? "This material doesn't have any flashcards generated yet."
            : "Generate a deck from one of your materials first."
        }
        action={<LinkButton href={`/courses/${courseId}/flashcards`}>Back to flashcards</LinkButton>}
      />
    );
  }

  return <FlashcardStudySession courseId={courseId} cards={cards} />;
}
