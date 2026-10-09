const TARGET_CHUNK_SIZE = 1400;
const OVERLAP = 150;

/** Splits material text into overlapping chunks on paragraph/sentence boundaries. */
export function chunkText(text: string): string[] {
  const normalized = text.replace(/\r\n/g, "\n").trim();
  if (!normalized) return [];

  const paragraphs = normalized.split(/\n{2,}/).filter((p) => p.trim());
  const chunks: string[] = [];
  let current = "";

  for (const paragraph of paragraphs) {
    if (current.length + paragraph.length + 2 > TARGET_CHUNK_SIZE && current) {
      chunks.push(current.trim());
      const tail = current.slice(-OVERLAP);
      current = tail + "\n\n" + paragraph;
    } else {
      current = current ? current + "\n\n" + paragraph : paragraph;
    }

    while (current.length > TARGET_CHUNK_SIZE * 1.5) {
      chunks.push(current.slice(0, TARGET_CHUNK_SIZE).trim());
      current = current.slice(TARGET_CHUNK_SIZE - OVERLAP);
    }
  }

  if (current.trim()) chunks.push(current.trim());
  return chunks;
}
