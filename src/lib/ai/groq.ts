import Groq from "groq-sdk";

let client: Groq | null = null;

function getGroqClient(): Groq {
  if (!process.env.GROQ_API_KEY) {
    throw new AIError("AI isn't configured: GROQ_API_KEY is missing on the server.");
  }
  if (!client) {
    client = new Groq({ apiKey: process.env.GROQ_API_KEY, maxRetries: 1, timeout: 45_000 });
  }
  return client;
}

/**
 * Tried in order. Groq retires models and rate-limits each model separately
 * on the free tier, so falling through to the next one keeps the app working
 * when the preferred model is unavailable or exhausted.
 */
export const MODEL_CHAIN = [
  ...new Set(
    [
      process.env.GROQ_MODEL,
      "llama-3.3-70b-versatile",
      "openai/gpt-oss-120b",
      "openai/gpt-oss-20b",
      "llama-3.1-8b-instant",
    ].filter((m): m is string => Boolean(m)),
  ),
];

/** An AI failure with a message safe to show the student. */
export class AIError extends Error {}

/** Pulls the first JSON array/object out of a model response, tolerating ```json fences. */
export function extractJson<T>(text: string): T {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1] : text;
  const start = candidate.search(/[[{]/);
  const end = Math.max(candidate.lastIndexOf("]"), candidate.lastIndexOf("}"));
  const jsonSlice = start >= 0 && end >= 0 ? candidate.slice(start, end + 1) : candidate;
  try {
    return JSON.parse(jsonSlice) as T;
  } catch {
    throw new AIError("The AI returned an unreadable response - please try again.");
  }
}

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

/** Errors where a different model might succeed (retired, missing, rate-limited, too large, overloaded). */
function isModelSpecific(err: unknown): boolean {
  if (!(err instanceof Groq.APIError)) return false;
  const status = err.status ?? 0;
  if ([404, 413, 429, 498, 500, 502, 503].includes(status)) return true;
  return status === 400 && /model|decommission|context|token/i.test(err.message);
}

function friendlyMessage(err: unknown): string {
  if (err instanceof Groq.AuthenticationError) {
    return "The AI service rejected the API key - check GROQ_API_KEY in your deployment settings.";
  }
  if (err instanceof Groq.RateLimitError) {
    return "The free AI tier is rate-limited right now - wait a minute and try again.";
  }
  if (err instanceof Groq.APIConnectionError) {
    return "Couldn't reach the AI service - please try again.";
  }
  return "The AI service had a problem - please try again.";
}

/** Runs a chat completion, falling back through MODEL_CHAIN; returns the assistant text. */
export async function complete(
  messages: ChatMessage[],
  options?: { maxTokens?: number },
): Promise<string> {
  const groq = getGroqClient();
  let lastError: unknown;

  for (const model of MODEL_CHAIN) {
    try {
      const response = await groq.chat.completions.create({
        model,
        messages,
        max_tokens: options?.maxTokens ?? 2000,
        temperature: 0.4,
      });
      const text = response.choices[0]?.message?.content?.trim();
      if (!text) throw new AIError("The AI returned an empty response - please try again.");
      return text;
    } catch (err) {
      lastError = err;
      console.error(`[ai] ${model} failed`, err instanceof Error ? err.message : err);
      if (!isModelSpecific(err)) break;
    }
  }

  if (lastError instanceof AIError) throw lastError;
  throw new AIError(friendlyMessage(lastError));
}
