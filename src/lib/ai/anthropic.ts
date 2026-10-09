import Anthropic from "@anthropic-ai/sdk";

let client: Anthropic | null = null;

export function getAnthropicClient(): Anthropic {
  if (!client) {
    client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return client;
}

export const AI_MODEL = process.env.ANTHROPIC_MODEL || "claude-opus-5-5";

/** Pulls the first JSON array/object out of a model response, tolerating ```json fences. */
export function extractJson<T>(text: string): T {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1] : text;
  const start = candidate.search(/[[{]/);
  const end = Math.max(candidate.lastIndexOf("]"), candidate.lastIndexOf("}"));
  const jsonSlice = start >= 0 && end >= 0 ? candidate.slice(start, end + 1) : candidate;
  return JSON.parse(jsonSlice) as T;
}

export function textFromResponse(response: Anthropic.Message): string {
  return response.content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("\n");
}
