import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { toOrSearchQuery } from "./search-query";

/**
 * Material text for a topic: chunks explicitly tagged with it first, then a
 * full-text search on the topic's name/description across the course for
 * topics that ended up with no tagged chunks.
 */
export async function getTopicChunks(
  supabase: SupabaseClient<Database>,
  params: { courseId: string; topicId: string; topicName: string; topicDescription?: string | null; limit: number },
): Promise<string[]> {
  const { data: tagged } = await supabase.rpc("chunks_for_topic", {
    p_topic_id: params.topicId,
    p_limit: params.limit,
  });
  if (tagged && tagged.length > 0) return tagged.map((c) => c.content);

  const { data: searched } = await supabase.rpc("search_course_chunks", {
    p_course_id: params.courseId,
    p_query: toOrSearchQuery(`${params.topicName} ${params.topicDescription ?? ""}`),
    p_limit: params.limit,
  });
  return (searched ?? []).map((c) => c.content);
}
