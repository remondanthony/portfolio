import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import '@/components/blog/blog.css';
import '@/components/admin/admin.css';

/**
 * Everything under /admin: never indexed, never cached, never linked from the
 * public site. blog.css is loaded so previews use the real article styles.
 */
export const metadata: Metadata = {
  title: 'Vioniche CMS',
  robots: { index: false, follow: false, nocache: true },
};

export const dynamic = 'force-dynamic';

export default function AdminRoot({ children }: { children: ReactNode }) {
  return <div className="ad-root">{children}</div>;
}
