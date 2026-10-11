import Groq from "groq-sdk";

let client: Groq | null = null;

export function getGroqClient(): Groq {
  if (!client) {
    client = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }
  return client;
}

// Groq's free-tier lineup changes over time - check console.groq.com/docs/models
// for the current list and override via GROQ_MODEL if this default is retired.
export const AI_MODEL = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

/** Pulls the first JSON array/object out of a model response, tolerating ```json fences. */
export function extractJson<T>(text: string): T {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1] : text;
  const start = candidate.search(/[[{]/);
  const end = Math.max(candidate.lastIndexOf("]"), candidate.lastIndexOf("}"));
  const jsonSlice = start >= 0 && end >= 0 ? candidate.slice(start, end + 1) : candidate;
  return JSON.parse(jsonSlice) as T;
}

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

/** Thin wrapper over chat.completions.create that returns the assistant's text. */
export async function complete(
  messages: ChatMessage[],
  options?: { maxTokens?: number },
): Promise<string> {
  const client = getGroqClient();
  const response = await client.chat.completions.create({
    model: AI_MODEL,
    messages,
    max_tokens: options?.maxTokens ?? 2000,
  });
  return response.choices[0]?.message?.content ?? "";
}
