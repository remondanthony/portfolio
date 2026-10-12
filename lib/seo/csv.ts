/**
 * Reading keyword exports.
 *
 * Built for what the tools actually produce:
 *   - Google Keyword Planner "Download keyword ideas": UTF-16 (or UTF-8),
 *     TAB-separated, with two title lines before the header row, and
 *     columns like "Avg. monthly searches" and "Competition".
 *   - Search Console, Ahrefs and Semrush CSV exports, and hand-made CSVs
 *     with the columns named in the CMS (Keyword, Search Volume, …).
 *
 * The header row is found, not assumed: it is the first row with a keyword
 * column. Columns are matched by name; unknown columns are ignored. Nothing
 * here touches the server — it runs in the browser on the chosen file, and
 * the server validates every row again before anything is saved.
 *
 * Pure and browser-safe.
 */

export const MAX_IMPORT_ROWS = 2000;

/** Bytes of an uploaded file → text, honouring a UTF-16 or UTF-8 byte-order mark. */
export function decodeExport(bytes: Uint8Array): string {
  if (bytes[0] === 0xff && bytes[1] === 0xfe) return new TextDecoder('utf-16le').decode(bytes.subarray(2));
  if (bytes[0] === 0xfe && bytes[1] === 0xff) return new TextDecoder('utf-16be').decode(bytes.subarray(2));
  const text = new TextDecoder('utf-8').decode(bytes);
  return text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
}

/** RFC 4180 rows: quoted fields, doubled quotes, embedded delimiters and newlines, CRLF or LF. */
export function parseDelimited(text: string, delimiter: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; } else quoted = false;
      } else field += ch;
      continue;
    }
    if (ch === '"' && field === '') quoted = true;
    else if (ch === delimiter) { row.push(field); field = ''; }
    else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      row.push(field); rows.push(row); row = []; field = '';
    } else field += ch;
  }
  if (field !== '' || row.length) { row.push(field); rows.push(row); }
  return rows.filter((r) => r.some((c) => c.trim() !== ''));
}

/**
 * A column name in comparable form: lower case, punctuation and repeated
 * spaces removed. "Avg. monthly searches", "avg monthly  searches" and
 * "AVG MONTHLY SEARCHES" all become "avg monthly searches".
 */
export const normHeader = (s: string) =>
  s.normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}%]+/gu, ' ').replace(/\s+/g, ' ').trim();

/** Column name → CMS field, for the general import. Matched in normHeader form. */
const HEADERS: Record<string, string> = {
  keyword: 'keyword', keywords: 'keyword', 'search term': 'keyword', query: 'keyword', 'top queries': 'keyword', 'keyword text': 'keyword',
  'search volume': 'volume', volume: 'volume', 'avg. monthly searches': 'volume', 'avg monthly searches': 'volume', 'monthly searches': 'volume',
  competition: 'competition',
  cpc: 'cpc', 'avg. cpc': 'cpc', 'cpc (usd)': 'cpc', 'avg cpc': 'cpc',
  'keyword difficulty': 'difficulty', difficulty: 'difficulty', kd: 'difficulty', 'kd %': 'difficulty', 'kd%': 'difficulty',
  'search intent': 'intent', intent: 'intent', intents: 'intent',
  location: 'location', 'target location': 'location', city: 'location',
  country: 'country',
  source: 'source',
  notes: 'notes', note: 'notes',
  type: 'type', 'keyword type': 'type',
  status: 'status',
};

export type ParsedExport = {
  /** Source columns that were recognised, in file order, with their CMS field. */
  columns: { name: string; field: string }[];
  /** Columns present but not used, so the preview can say so. */
  ignored: string[];
  rows: { line: number; values: Record<string, string> }[];
  /** True when more rows than MAX_IMPORT_ROWS were present. */
  truncated: boolean;
  error?: string;
};

const normalizedMap = (m: Record<string, string>) => Object.fromEntries(Object.entries(m).map(([k, v]) => [normHeader(k), v]));
const GENERAL = normalizedMap(HEADERS);

/**
 * Reads an export with a given column map (general import by default; the
 * Keyword Planner import passes its own). Same decoding, delimiter detection
 * and header search for every import.
 */
export function parseKeywordExport(text: string, headers: Record<string, string> = GENERAL): ParsedExport {
  const firstLines = text.split(/\r?\n/, 6).join('\n');
  const delimiter = (firstLines.match(/\t/g)?.length ?? 0) > (firstLines.match(/,/g)?.length ?? 0) ? '\t' : ',';
  const table = parseDelimited(text, delimiter);
  const field = (name: string) => headers[normHeader(name)];
  const headerIndex = table.findIndex((r) => r.some((c) => field(c) === 'keyword'));
  if (headerIndex < 0) {
    return { columns: [], ignored: [], rows: [], truncated: false, error: 'No "Keyword" column found. The first row of the table must name its columns.' };
  }
  const header = table[headerIndex].map((c) => c.trim());
  const used = new Set<string>();
  const map = header.map((name) => {
    const f = field(name);
    // First column wins if two map to the same field.
    if (!f || used.has(f)) return null;
    used.add(f);
    return f;
  });
  const columns = header.flatMap((name, i) => (map[i] ? [{ name, field: map[i]! }] : []));
  const ignored = header.filter((name, i) => name && !map[i]);
  const body = table.slice(headerIndex + 1);
  const rows = body.slice(0, MAX_IMPORT_ROWS).map((r, i) => {
    const values: Record<string, string> = {};
    map.forEach((field, c) => { if (field) values[field] = (r[c] ?? '').trim(); });
    return { line: headerIndex + i + 2, values };
  });
  return { columns, ignored, rows, truncated: body.length > MAX_IMPORT_ROWS };
}

/**
 * One spreadsheet-safe CSV cell: quoted, with text that a spreadsheet would
 * run as a formula (=, +, -, @, tab, CR at the start) neutralised by a leading
 * apostrophe. Numbers — including negative ones — are left as numbers.
 */
export function csvCell(v: unknown): string {
  let t = v === undefined || v === null ? '' : String(v);
  if (typeof v !== 'number' && /^[=+\-@\t\r]/.test(t)) t = `'${t}`;
  return `"${t.replace(/"/g, '""')}"`;
}

/** Builds a column map for parseKeywordExport from readable names. */
export const columnMap = (m: Record<string, string>) => normalizedMap(m);

/** True when decoding produced many replacement characters — the file is not UTF-8 or UTF-16. */
export const looksMisencoded = (text: string) => (text.match(/\ufffd/g)?.length ?? 0) > Math.max(3, text.length / 200);
