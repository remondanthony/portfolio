import { compile } from '@mdx-js/mdx';

/**
 * What an article body written through the CMS may contain.
 *
 * MDX is code: `import`, `export` and `{expressions}` run when the site is
 * built and when a preview renders. The CMS therefore accepts Markdown plus
 * the one component the blog provides, <Figure />, with literal attributes
 * only. That is everything the articles need, and it keeps the editor from
 * becoming a way to run code on the build server.
 *
 * Code inside fenced or inline code is ignored — it is shown, not run.
 */

const ALLOWED_TAGS = new Set(['Figure']);
const FIGURE_ATTRS = new Set(['src', 'alt', 'width', 'height', 'caption']);

const stripCode = (s: string) =>
  s.replace(/^(```|~~~)[\s\S]*?^\1\s*$/gm, '').replace(/`[^`\n]*`/g, '');

export function bodyProblems(body: string): string[] {
  const problems: string[] = [];
  const text = stripCode(body);

  if (/^\s*(import|export)\s/m.test(text)) {
    problems.push('The body cannot contain import or export statements.');
  }

  // Tags: <Name …>. Lowercase HTML tags are refused too — MDX treats them as
  // JSX, and Markdown covers every formatting need here.
  for (const m of text.matchAll(/<\/?([A-Za-z][\w.-]*)/g)) {
    if (!ALLOWED_TAGS.has(m[1])) {
      problems.push(`<${m[1]}> is not allowed. Use Markdown, or <Figure /> for images.`);
      break;
    }
  }

  // Figure attributes: strings, or numbers in braces. Nothing else.
  const figures = [...text.matchAll(/<Figure\b([\s\S]*?)\/>/g)];
  for (const f of figures) {
    const attrs = f[1];
    const leftover = attrs
      .replace(/\b([a-z]+)="([^"]*)"/g, (_, name: string, value: string) => {
        if (!FIGURE_ATTRS.has(name)) problems.push(`<Figure> does not take "${name}".`);
        if (name === 'src' && !/^\/[a-z0-9/_.-]+\.(jpe?g|png|webp|avif|gif)$/i.test(value)) {
          problems.push(`<Figure> src must be a site image path like /blog/slug/image.jpg (got "${value}").`);
        }
        if (name === 'src' && value.includes('..')) problems.push('<Figure> src cannot contain "..".');
        return '';
      })
      .replace(/\b(width|height)=\{\d{1,5}\}/g, '')
      .trim();
    if (leftover) problems.push(`<Figure> attributes must be "text" or {numbers} (could not read: ${leftover.slice(0, 40)}).`);
    if (!/\balt="[^"]+"/.test(attrs)) problems.push('Every <Figure> needs alt text.');
    if (!/\bwidth=\{\d+\}/.test(attrs) || !/\bheight=\{\d+\}/.test(attrs)) {
      problems.push('Every <Figure> needs width={…} and height={…}.');
    }
  }

  // Any other brace is an expression. Comments ({/* … */}) are harmless.
  const outsideFigures = text.replace(/<Figure\b[\s\S]*?\/>/g, '').replace(/\{\/\*[\s\S]*?\*\/\}/g, '');
  if (/(^|[^\\])\{/.test(outsideFigures)) {
    problems.push('Curly braces run code in MDX. Write \\{ to show a literal brace.');
  }

  return [...new Set(problems)];
}

/** Compiles the body as MDX; returns the compiler's message if it does not compile. */
export async function compileProblem(body: string): Promise<string | null> {
  try {
    await compile(body, { outputFormat: 'function-body' });
    return null;
  } catch (e) {
    const err = e as { message?: string; line?: number; place?: { line?: number } };
    const line = err.line ?? err.place?.line;
    return `MDX does not compile${line ? ` (line ${line})` : ''}: ${String(err.message ?? e).split('\n')[0]}`;
  }
}

/** Compiled body for the editor's live preview. Callers check bodyProblems first. */
export async function compileForPreview(body: string) {
  return String(await compile(body, { outputFormat: 'function-body' }));
}
