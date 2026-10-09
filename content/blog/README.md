# Vioniche blog — content

Each article is one `.mdx` file in this folder. The file name is the slug and
the URL: `technical-seo-checklist.mdx` → `/blog/technical-seo-checklist`.
Start from `_template.mdx`. Files beginning with `_` are never published.

The article's metadata is the `export const post = { ... }` at the top. It is
checked when the site builds, and a missing description, unknown category or
missing image on a published article stops the build with the file and the
problem named.

## Workflow

| Step | Where it lives |
|---|---|
| Topic | One of the five categories (below) |
| Search intent | `searchIntent` |
| Primary keyword | `primaryKeyword` |
| Secondary keywords | `secondaryKeywords` |
| Article brief | The fields above, plus notes kept with the draft |
| Draft | The `.mdx` file with `draft: true` — visible only in `npm run dev` |
| SEO review | Checklist below |
| Internal links | Links in the body, plus `related`, `caseStudies`, `services` |
| Popup CTA | Automatic. Optional `cta: { … }` overrides; templates in `lib/blog/cta.ts` |
| Schema | Generated from `post` — BlogPosting and BreadcrumbList |
| Publish | Remove `draft: true`, commit, deploy |
| Sitemap | Added automatically once published |
| Google Search Console | Inspect the new URL and request indexing |

The planning fields are never rendered and never output as meta keywords.
They are there so the brief stays attached to the article it produced.

## Categories

Website Development · Technical SEO · Automation · AI & AI Agents · Web Technology

Defined in `lib/blog/model.ts`. Change them there, not per article.

## SEO review checklist

- Title says what the article is, and is unique across the site.
- Description is 140–160 characters and promises only what the article delivers.
- The body starts at `##`; headings describe their sections.
- The primary keyword appears where it reads naturally — title, opening, a heading — and nowhere it doesn't.
- Every claim about results is one Vioniche can show. No invented figures.
- Featured image has alt text describing what it shows.
- At least one link to a related article, case study or service where it genuinely helps the reader.
- Internal links use real routes only. Available keys are in `lib/blog/links.ts`.
- `updated` is set when an article is materially revised, not for typo fixes.
