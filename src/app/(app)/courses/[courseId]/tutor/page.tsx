import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, CardHeader } from "@/components/ui/card";
import { ChatPanel, type ChatPanelMessage } from "@/components/tutor/chat-panel";

export default async function CourseTutorPage({ params }: PageProps<"/courses/[courseId]/tutor">) {
  const { courseId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const { data: course } = await supabase
    .from("courses")
    .select("name")
    .eq("id", courseId)
    .single();
  if (!course) notFound();

  const { data: messageRows } = await supabase
    .from("chat_messages")
    .select("id, role, content")
    .eq("course_id", courseId)
    .is("material_id", null)
    .order("created_at", { ascending: true });

  const initialMessages: ChatPanelMessage[] = (messageRows ?? []).map((m) => ({
    id: m.id,
    role: m.role,
    content: m.content,
  }));

  return (
    <Card className="flex h-[75vh] flex-col">
      <CardHeader
        title="AI Tutor"
        description={`Ask anything about ${course.name} - answers prioritize your uploaded materials across the whole course.`}
      />
      <ChatPanel
        scope={{ type: "course", courseId }}
        initialMessages={initialMessages}
        placeholder={`Ask a question about ${course.name}...`}
        emptyHint={`Ask anything about ${course.name} - I'll pull from your uploaded materials first.`}
      />
    </Card>
  );
}
