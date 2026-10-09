import type { ReactNode } from 'react';
import { getSession } from '@/lib/admin/session';
import { logout } from '@/lib/cms/actions';
import { getStore } from '@/lib/cms/store';

/**
 * The signed-in shell. It shows the bar only to a signed-in admin, but it is
 * not the security check — layouts do not re-run on every navigation, so
 * each page under it verifies the session itself.
 */
export default async function CmsShell({ children }: { children: ReactNode }) {
  const session = await getSession();
  const store = getStore();
  return (
    <>
      {session && (
        <header className="ad-top">
          <div className="ad-top-inner">
            <a href="/admin/dashboard" className="ad-brand">
              <img src="/logo.png" alt="" width={26} height={26} />
              <span>VIONICHE <b>CMS</b></span>
            </a>
            <nav className="ad-nav" aria-label="Admin">
              <a href="/admin/dashboard">Dashboard</a>
              <a href="/admin/blog">Articles</a>
              <a href="/admin/blog/new">New article</a>
              <a href="/admin/media">Media</a>
            </nav>
            <div className="ad-top-right">
              <span className={`ad-store ad-store--${store?.kind ?? 'none'}`} title={store?.describe ?? 'Not connected'}>
                {store?.kind === 'github' ? 'GitHub' : store?.kind === 'local' ? 'Local' : 'Not connected'}
              </span>
              <a href="/blog" className="ad-link" target="_blank" rel="noopener noreferrer">View blog ↗</a>
              <form action={logout}>
                <button type="submit" className="ad-btn">Sign out</button>
              </form>
            </div>
          </div>
        </header>
      )}
      <main className="ad-main">{children}</main>
    </>
  );
}
