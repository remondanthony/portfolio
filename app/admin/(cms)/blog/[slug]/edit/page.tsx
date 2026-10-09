import { notFound } from 'next/navigation';
import Editor from '@/components/admin/Editor';
import { requireSession } from '@/lib/admin/session';
import { SLUG } from '@/lib/blog/model';
import { fromSource } from '@/lib/cms/article';
import { catalog, catalogItems } from '@/lib/cms/catalog';
import { getStore } from '@/lib/cms/store';

export default async function EditArticle({ params }: { params: Promise<{ slug: string }> }) {
  await requireSession();
  const { slug } = await params;
  if (!SLUG.test(slug)) notFound();
  const store = getStore();
  if (!store) notFound();

  const entries = await catalog(store);
  const entry = entries.find((e) => e.slug === slug);
  if (!entry) notFound();
  if (entry.error) {
    return (
      <p className="ad-note ad-note--error">
        <code>content/blog/{slug}.mdx</code> could not be read: {entry.error}. Fix the file in the repository, then reload.
      </p>
    );
  }

  return (
    <Editor
      initial={fromSource(slug, entry.source, entry.version)}
      others={catalogItems(entries, slug)}
      storeKind={store.kind}
    />
  );
}
