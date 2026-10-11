"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { Loader2, Send, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { sendChatMessage, type ChatScope } from "@/lib/actions/chat";

export interface ChatPanelMessage {
  id?: string;
  role: "user" | "assistant";
  content: string;
}

/**
 * Chat UI shared by the material-level and course-level "Ask AI" surfaces.
 * `scope` decides what gets retrieved and how the turn is persisted -
 * everything else about the UI is identical.
 */
export function ChatPanel({
  scope,
  initialMessages,
  placeholder,
  emptyHint,
}: {
  scope: ChatScope;
  initialMessages: ChatPanelMessage[];
  placeholder?: string;
  emptyHint?: string;
}) {
  const [messages, setMessages] = useState<ChatPanelMessage[]>(initialMessages);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, pending]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const question = input.trim();
    if (!question || pending) return;

    setInput("");
    setError(null);
    setMessages((prev) => [...prev, { role: "user", content: question }]);
    setPending(true);

    const result = await sendChatMessage(scope, question);
    setPending(false);

    if ("error" in result) {
      setError(result.error);
      return;
    }
    setMessages((prev) => [...prev, { role: "assistant", content: result.answer }]);
  }

  return (
    <div className="flex flex-1 flex-col min-h-0">
      <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-3 py-2">
        {messages.length === 0 && (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 py-8 text-center text-muted">
            <Sparkles className="h-6 w-6" />
            <p className="max-w-xs text-sm">
              {emptyHint ?? "Ask a question - answers are grounded in your uploaded material first."}
            </p>
          </div>
        )}

        {messages.map((m, i) => (
          <div
            key={m.id ?? i}
            className={cn(
              "max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm",
              m.role === "user"
                ? "self-end bg-brand text-white"
                : "self-start border border-border bg-background text-foreground",
            )}
          >
            {m.content}
          </div>
        ))}

        {pending && (
          <div className="flex items-center gap-2 self-start text-sm text-muted">
            <Loader2 className="h-4 w-4 animate-spin" /> Thinking...
          </div>
        )}
      </div>

      {error && <p className="pt-2 text-sm text-danger">{error}</p>}

      <form onSubmit={handleSubmit} className="mt-2 flex items-center gap-2 border-t border-border pt-3">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={placeholder ?? "Ask a question..."}
          disabled={pending}
          className="flex-1 rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-brand/30 disabled:opacity-60"
        />
        <Button type="submit" disabled={pending || !input.trim()} aria-label="Send">
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
