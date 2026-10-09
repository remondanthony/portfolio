/**
 * Shapes shared by the editor (browser) and the CMS actions (server).
 * Nothing here may import server code.
 */

export type EditorData = {
  /** The slug the article was loaded under; null for a new article. */
  originalSlug: string | null;
  /** Version of the file when it was loaded, to catch edits made elsewhere. */
  baseVersion: string | null;
  /** Whether the stored file is currently published (draft: false). */
  wasPublished: boolean;

  slug: string;
  title: string;
  description: string;
  excerpt: string;
  published: string;
  updated: string;
  author: string;
  category: string;
  tags: string[];
  image: { src: string; alt: string; width: number; height: number };
  canonical: string;
  related: string[];
  caseStudies: string[];
  services: string[];
  primaryKeyword: string;
  secondaryKeywords: string[];
  searchIntent: string;
  /** The article's popup CTA overrides, carried through unchanged (not edited here yet). */
  cta: Record<string, string> | null;
  body: string;
};

export type CheckLevel = 'pass' | 'warn' | 'error';
export type Check = { level: CheckLevel; label: string };

export type Intent = 'draft' | 'publish';

export type Step = { label: string; done: boolean };

export type SaveResult = {
  ok: boolean;
  message: string;
  checks: Check[];
  steps: Step[];
  slug?: string;
  version?: string;
  wasPublished?: boolean;
  commit?: { sha?: string; url?: string };
  store?: 'github' | 'local';
  /** Set when the saved article now uses an uploaded image. */
  image?: EditorData['image'];
};
