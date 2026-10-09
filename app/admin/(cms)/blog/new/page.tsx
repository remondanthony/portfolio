import { notFound } from 'next/navigation';
import Editor from '@/components/admin/Editor';
import { requireSession } from '@/lib/admin/session';
import { SLUG } from '@/lib/blog/model';
import { blankArticle, duplicateArticle } from '@/lib/cms/article';
import { catalog, catalogItems } from '@/lib/cms/catalog';
import { getStore } from '@/lib/cms/store';

/**
 * A new article — blank, or, with ?from=<slug>, a copy of an existing one.
 * A copy is only a starting point in the editor: an unsaved draft under a
 * free slug. It is written, as a draft, only when the admin saves it.
 */
export default async function NewArticle({ searchParams }: { searchParams: Promise<{ from?: string }> }) {
  await requireSession();
  const { from } = await searchParams;
  const store = getStore();
  const entries = store ? await catalog(store) : [];

  let initial = blankArticle();
  let copyOf: { slug: string; title: string } | undefined;
  if (from !== undefined) {
    const source = SLUG.test(from) ? entries.find((e) => e.slug === from && !e.error) : undefined;
    if (!source) notFound();
    initial = duplicateArticle(source.slug, source.source, entries.map((e) => e.slug));
    copyOf = { slug: source.slug, title: source.meta.title ?? source.slug };
  }

  return <Editor initial={initial} others={catalogItems(entries)} storeKind={store?.kind ?? null} copyOf={copyOf} />;
}
