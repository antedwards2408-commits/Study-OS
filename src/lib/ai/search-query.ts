const STOPWORDS = new Set([
  "a", "an", "and", "are", "as", "at", "be", "between", "but", "by", "can", "could",
  "did", "do", "does", "explain", "for", "from", "give", "how", "i", "in", "is", "it",
  "its", "me", "of", "on", "or", "please", "tell", "that", "the", "their", "there",
  "this", "to", "was", "what", "when", "where", "which", "who", "why", "with", "would",
  "you", "your", "about", "difference", "differences", "mean", "means",
]);

/**
 * Builds a `websearch_to_tsquery` string that ORs the question's key terms.
 * Plain websearch syntax ANDs every word, so a natural question like "what's
 * the difference between meiosis I and II?" matches almost nothing; OR-ing
 * lets ts_rank surface the chunks that mention the most relevant terms.
 */
export function toOrSearchQuery(question: string): string {
  const terms = (question.toLowerCase().match(/[a-z0-9]+/g) ?? []).filter(
    (term) => !STOPWORDS.has(term) && (term.length > 1 || /\d/.test(term)),
  );
  const unique = [...new Set(terms)].slice(0, 12);
  return unique.length > 0 ? unique.join(" or ") : question;
}
