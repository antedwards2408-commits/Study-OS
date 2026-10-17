import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { AIError, MODEL_CHAIN, complete } from "@/lib/ai/groq";

/** Signed-in-only AI smoke test: open /api/health/ai in the browser to see whether the AI provider responds. */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in first." }, { status: 401 });

  const started = Date.now();
  try {
    const reply = await complete([{ role: "user", content: "Reply with exactly: OK" }], { maxTokens: 50 });
    return NextResponse.json({
      ok: true,
      reply,
      latencyMs: Date.now() - started,
      modelChain: MODEL_CHAIN,
    });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof AIError ? err.message : "Unexpected error - check the function logs.",
        keyConfigured: Boolean(process.env.GROQ_API_KEY),
        modelChain: MODEL_CHAIN,
      },
      { status: 502 },
    );
  }
}
