/**
 * Keyword Ideas — free keyword discovery from Google's search suggestions.
 *
 * Google's autocomplete endpoint is unofficial and Google restricted access
 * to it in 2015 ("Update on the Autocomplete API", Search Central blog), so
 * the CMS never calls it — or any Google service. Instead it works alongside
 * you in your own browser:
 *   1. it builds the seed and its a–z variations as ordinary google.com
 *      searches (27 links), which you open yourself;
 *   2. you copy the suggestions Google shows you (in the search box as you
 *      click into it, and under "Related searches") and paste them here;
 *   3. the CMS cleans the list, removes duplicates, marks what is already in
 *      the keyword library, and saves what you choose.
 *
 * This is discovery only: no search volume, difficulty or CPC is produced or
 * estimated. Links always point at www.google.com and are built here from
 * validated input — no URL is ever taken from the user.
 *
 * Pure and browser-safe.
 */
import { keywordProblems, normalizeKeyword } from './keywords';

export const IDEA_REGIONS = {
  US: 'United States',
  IN: 'India',
  GB: 'United Kingdom',
  CA: 'Canada',
  AU: 'Australia',
} as const;
export type IdeaRegion = keyof typeof IDEA_REGIONS;

export const IDEA_LANGUAGES = { en: 'English', hi: 'Hindi' } as const;
export type IdeaLanguage = keyof typeof IDEA_LANGUAGES;

export const SEED_MAX = 80;
/** Seed + a–z. Fixed: never more searches than this per seed. */
export const MAX_IDEA_QUERIES = 27;
/** Pasted suggestions handled per research. */
export const MAX_IDEAS = 500;
export const MAX_PASTE_CHARS = 40_000;

export const isRegion = (v: unknown): v is IdeaRegion => typeof v === 'string' && Object.prototype.hasOwnProperty.call(IDEA_REGIONS, v);
export const isLanguage = (v: unknown): v is IdeaLanguage => typeof v === 'string' && Object.prototype.hasOwnProperty.call(IDEA_LANGUAGES, v);

/** Problems with a seed keyword, in the editor's words. */
export function seedProblems(seed: unknown): string[] {
  const raw = typeof seed === 'string' ? seed.trim() : '';
  // Checked as sent: a line break or tab means it was not typed into the seed field.
  if (/[\n\r\t]/.test(raw)) return ['Enter a plain keyword — not a web address, markup or formula.'];
  const s = raw.replace(/\s+/g, ' ');
  if (!s) return ['Enter a keyword to research.'];
  if (s.length > SEED_MAX) return [`The seed keyword must be ${SEED_MAX} characters or fewer.`];
  if (/[<>\n\r\t]/.test(s) || /:\/\/|^www\.|^[=+\-@]/i.test(s)) return ['Enter a plain keyword — not a web address, markup or formula.'];
  return [];
}

/** The searches to run for a seed, in order: the seed, then seed + a … z. */
export function ideaQueries(seed: string): string[] {
  const s = seed.trim().replace(/\s+/g, ' ');
  return [s, ...'abcdefghijklmnopqrstuvwxyz'.split('').map((c) => `${s} ${c}`)].slice(0, MAX_IDEA_QUERIES);
}

/** An ordinary Google search for one of those queries, in the chosen region and language. */
export function googleSearchUrl(query: string, region: IdeaRegion, language: IdeaLanguage): string {
  const q = new URLSearchParams({ q: query, hl: language, gl: region.toLowerCase() });
  return `https://www.google.com/search?${q.toString()}`;
}

export type Idea = { keyword: string; problems: string[] };

/**
 * Pasted suggestions → a clean list. One idea per line; list markers,
 * numbering and stray symbols that copying adds are removed; repeats (by the
 * library's own normalisation: case, spacing, punctuation) are kept once.
 * Lines that are not valid keywords are returned with the reason.
 */
export function parseIdeas(text: unknown): { ideas: Idea[]; duplicates: number; truncated: boolean } {
  const raw = typeof text === 'string' ? text.slice(0, MAX_PASTE_CHARS) : '';
  const lines = raw.split(/\r?\n/)
    .map((l) => l.replace(/[\u0000-\u0008\u000b-\u001f\u007f]/g, '')
      .replace(/^\s*(?:[-*•·◦▪>]+|\d+[.)])\s*/, '')
      .replace(/[\s ]+/g, ' ')
      .replace(/\s*[×✕]\s*$/, '')
      .trim())
    .filter(Boolean);
  const seen = new Set<string>();
  const ideas: Idea[] = [];
  let duplicates = 0;
  for (const line of lines) {
    const key = normalizeKeyword(line);
    if (!key) continue;
    if (seen.has(key)) { duplicates++; continue; }
    seen.add(key);
    ideas.push({ keyword: line, problems: keywordProblems({ keyword: line, type: 'related', source: 'google-autocomplete', status: 'idea' }) });
  }
  return { ideas: ideas.slice(0, MAX_IDEAS), duplicates, truncated: ideas.length > MAX_IDEAS || raw.length < (typeof text === 'string' ? text.length : 0) };
}
