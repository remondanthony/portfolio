import { notFound } from 'next/navigation';
import { evaluate } from '@mdx-js/mdx';
import * as runtime from 'react/jsx-runtime';
import ArticleView from '@/components/blog/ArticleView';
import { requireSession } from '@/lib/admin/session';
import { SLUG, problems, type PostMeta } from '@/lib/blog/model';
import { asPost, catalog, relatedFor } from '@/lib/cms/catalog';
import { bodyProblems } from '@/lib/cms/safety';
import { getStore } from '@/lib/cms/store';
import { useMDXComponents } from '@/mdx-components';

/**
 * The saved version of an article, rendered with the public article view.
 * Signed-in only, never indexed (admin layout), never in the sitemap — and
 * drafts here are exactly what the public site will not build.
 */
export default async function PreviewArticle({ params }: { params: Promise<{ slug: string }> }) {
  await requireSession();
  const { slug } = await params;
  if (!SLUG.test(slug)) notFound();
  const store = getStore();
  if (!store) notFound();

  const entries = await catalog(store);
  const entry = entries.find((e) => e.slug === slug);
  if (!entry) notFound();

  const issues = entry.error ? [entry.error] : [...problems(slug, entry.meta), ...bodyProblems(entry.body)];
  if (issues.length) {
    return (
      <div className="ad-note ad-note--error">
        <p>This article cannot be previewed until these are fixed:</p>
        <ul>{issues.map((i) => <li key={i}>{i}</li>)}</ul>
        <a href={`/admin/blog/${slug}/edit`}>Open in the editor →</a>
      </div>
    );
  }

  const post = asPost(slug, entry.meta as PostMeta, entry.source);
  const { default: Content } = await evaluate(entry.body, { ...runtime, baseUrl: import.meta.url });

  return (
    <div className="ad-preview-page">
      <div className="ad-preview-bar">
        <span>
          <b>Preview</b> — {post.draft ? 'draft, not public' : 'saved version'}
          {store.kind === 'github' && ' (as committed; the live site updates after deployment)'}
        </span>
        <a href={`/admin/blog/${slug}/edit`} className="ad-btn">Edit</a>
      </div>
      <div className="ad-preview">
        <ArticleView post={post} related={relatedFor(post, entries)}>
          <Content components={useMDXComponents()} />
        </ArticleView>
      </div>
    </div>
  );
}
