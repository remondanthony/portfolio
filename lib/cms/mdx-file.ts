import vm from 'node:vm';
import type { PostMeta } from '@/lib/blog/model';

/**
 * Reading and writing article files in the format the blog already uses:
 *
 *   export const post = { ...metadata... };
 *
 *   Markdown body…
 *
 * The CMS writes the metadata as JSON — valid JavaScript, so the existing
 * loader, validation and reading-time code read it unchanged — and leaves the
 * body exactly as written. Anything before the export (the template's
 * instructions, for example) is kept.
 */

export type ParsedFile = { meta: Partial<PostMeta>; body: string; preamble: string };

/** Index just past the object literal that starts at `open`, skipping strings and comments. */
function endOfObject(src: string, open: number): number {
  let depth = 0;
  for (let i = open; i < src.length; i++) {
    const c = src[i];
    if (c === '"' || c === "'" || c === '`') {
      for (i++; i < src.length && src[i] !== c; i++) if (src[i] === '\\') i++;
    } else if (c === '/' && src[i + 1] === '/') {
      i = src.indexOf('\n', i); if (i < 0) return -1;
    } else if (c === '/' && src[i + 1] === '*') {
      i = src.indexOf('*/', i + 2) + 1; if (i <= 0) return -1;
    } else if (c === '{') depth++;
    else if (c === '}' && --depth === 0) return i + 1;
  }
  return -1;
}

export function parseArticle(source: string): ParsedFile {
  const m = /export\s+const\s+post\s*=\s*/.exec(source);
  if (!m) throw new Error('No `export const post = { ... }` found.');
  const open = m.index + m[0].length;
  if (source[open] !== '{') throw new Error('`post` must be an object literal.');
  const close = endOfObject(source, open);
  if (close < 0) throw new Error('The `post` object is not closed.');

  // Evaluated in an empty context with a time limit: the literal may use
  // single quotes or comments, so JSON.parse is not enough, and nothing in it
  // should be able to reach the server's globals.
  const value = vm.runInNewContext(`(${source.slice(open, close)})`, Object.create(null), { timeout: 100 });
  const meta = JSON.parse(JSON.stringify(value)) as Partial<PostMeta>;

  let rest = source.slice(close);
  rest = rest.replace(/^\s*;/, '');
  return { meta, body: rest.replace(/^\s*\n/, '').replace(/\s+$/, ''), preamble: source.slice(0, m.index) };
}

/** Field order in the written file, so diffs stay readable. Empty optional fields are left out. */
const ORDER: (keyof PostMeta)[] = [
  'title', 'description', 'excerpt', 'published', 'updated', 'author', 'category', 'tags', 'image',
  'canonical', 'draft', 'related', 'caseStudies', 'services', 'cta', 'primaryKeyword', 'secondaryKeywords', 'searchIntent',
];

export function serializeArticle(meta: PostMeta, body: string, preamble = ''): string {
  const out: Record<string, unknown> = {};
  for (const k of ORDER) {
    const v = meta[k];
    if (v === undefined || v === null || v === '' || v === false) continue;
    if (Array.isArray(v) && v.length === 0 && k !== 'tags') continue;
    out[k] = v;
  }
  return `${preamble}export const post = ${JSON.stringify(out, null, 2)};\n\n${body.trim()}\n`;
}
