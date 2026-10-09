/**
 * Words a reader actually reads: the metadata export, imports, JSX tags and
 * code blocks are taken out before counting. 225 words a minute, rounded,
 * never less than one.
 */
export function measure(source: string) {
  const text = source
    .replace(/export\s+const\s+post\s*=\s*\{[\s\S]*?\n\};?/, '')
    .replace(/^import\s.*$/gm, '')
    .replace(/```[\s\S]*?```/g, '')
    .replace(/<[^>]+>/g, ' ');
  const wordCount = (text.match(/[\p{L}\p{N}][\p{L}\p{N}'’-]*/gu) ?? []).length;
  return { wordCount, readingMinutes: Math.max(1, Math.round(wordCount / 225)) };
}
