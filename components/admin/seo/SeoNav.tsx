import type { Project } from '@/lib/cms/projects';

/**
 * Tabs across the SEO section. Plain links: each is its own server-rendered
 * page. Tabs a project does not have are not shown.
 */
const TABS: { href: string; label: string; needs?: 'pageSeo' | 'searchConsole' }[] = [
  { href: '/admin/seo', label: 'Overview' },
  { href: '/admin/seo/search-console', label: 'Search Console', needs: 'searchConsole' },
  { href: '/admin/seo/research', label: 'Research providers' },
  { href: '/admin/seo/keywords', label: 'Keywords' },
  { href: '/admin/seo/clusters', label: 'Clusters' },
  { href: '/admin/seo/pages', label: 'Pages & articles', needs: 'pageSeo' },
  { href: '/admin/seo/import', label: 'Import CSV' },
];

export default function SeoNav({ current, project }: { current: string; project: Project }) {
  return (
    <nav className="ad-tabs" aria-label={`SEO — ${project.name}`} data-testid="seo-nav">
      {TABS.filter((t) => !t.needs || project.features[t.needs]).map((t) => (
        <a key={t.href} href={t.href} aria-current={t.href === current ? 'page' : undefined}>{t.label}</a>
      ))}
    </nav>
  );
}
