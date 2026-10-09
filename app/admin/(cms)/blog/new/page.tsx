import Editor from '@/components/admin/Editor';
import { requireSession } from '@/lib/admin/session';
import { blankArticle } from '@/lib/cms/article';
import { catalog } from '@/lib/cms/catalog';
import { getStore } from '@/lib/cms/store';

export default async function NewArticle() {
  await requireSession();
  const store = getStore();
  const entries = store ? await catalog(store) : [];
  return (
    <Editor
      initial={blankArticle()}
      others={entries.map((e) => ({ slug: e.slug, title: e.meta.title ?? e.slug, draft: Boolean(e.meta.draft) }))}
      storeKind={store?.kind ?? null}
    />
  );
}
