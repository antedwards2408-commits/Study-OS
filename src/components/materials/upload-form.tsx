"use client";

import { useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { FileText, Loader2, NotebookPen, Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";

type Mode = "pdf" | "text";

/**
 * Client-side upload form for the materials list. Posts FormData to the
 * upload Route Handler via fetch so we can show a real "processing..."
 * state (PDF extraction + topic inference can take a few seconds) and then
 * refresh the server-rendered list on success.
 */
export function UploadForm({ courseId }: { courseId: string }) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [mode, setMode] = useState<Mode>("pdf");
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError("Give this material a title.");
      return;
    }
    if (mode === "pdf" && !file) {
      setError("Choose a PDF file to upload.");
      return;
    }
    if (mode === "text" && !text.trim()) {
      setError("Paste some notes first.");
      return;
    }

    const formData = new FormData();
    formData.set("course_id", courseId);
    formData.set("title", title.trim());
    formData.set("type", mode);
    if (mode === "pdf" && file) {
      formData.set("file", file);
    } else {
      formData.set("text", text);
    }

    setBusy(true);
    try {
      const res = await fetch("/api/materials/upload", { method: "POST", body: formData });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        throw new Error(data.error ?? "Upload failed");
      }

      setTitle("");
      setText("");
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <CardHeader
        title="Upload material"
        description="Add a PDF or paste notes - StudyOS extracts the text, finds topics, and makes it searchable for the AI tutor."
      />

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex gap-2">
          <ModeButton active={mode === "pdf"} onClick={() => setMode("pdf")} icon={FileText} label="PDF file" />
          <ModeButton active={mode === "text"} onClick={() => setMode("text")} icon={NotebookPen} label="Paste notes" />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="material-title" className="text-sm font-medium text-foreground">
            Title
          </label>
          <input
            id="material-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Chapter 4 - Cell Division"
            disabled={busy}
            className="rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand/30 disabled:opacity-60"
          />
        </div>

        {mode === "pdf" ? (
          <div className="flex flex-col gap-1.5">
            <label htmlFor="material-file" className="text-sm font-medium text-foreground">
              PDF file
            </label>
            <input
              id="material-file"
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              disabled={busy}
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm text-foreground outline-none file:mr-3 file:rounded-lg file:border-0 file:bg-brand-soft file:px-3 file:py-1.5 file:text-brand file:text-sm file:font-medium disabled:opacity-60"
            />
          </div>
        ) : (
          <div className="flex flex-col gap-1.5">
            <label htmlFor="material-text" className="text-sm font-medium text-foreground">
              Notes
            </label>
            <textarea
              id="material-text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={6}
              disabled={busy}
              placeholder="Paste your notes here..."
              className="rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand/30 disabled:opacity-60"
            />
          </div>
        )}

        {error && <p className="text-sm text-danger">{error}</p>}

        <Button type="submit" disabled={busy} className="self-start">
          {busy ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Processing...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4" /> Upload
            </>
          )}
        </Button>
      </form>
    </Card>
  );
}

function ModeButton({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof FileText;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-sm font-medium transition-colors",
        active
          ? "border-brand bg-brand-soft text-brand"
          : "border-border bg-surface text-muted hover:text-foreground",
      )}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}
