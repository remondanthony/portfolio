import { NextResponse, type NextRequest } from 'next/server';
import { SESSION_COOKIE, verifyToken } from '@/lib/admin/token';

/**
 * An early, optimistic check for the admin: anyone without a valid session
 * cookie is sent to the login page before any admin page starts rendering.
 *
 * This is not the security boundary. Every admin page and Server Action
 * verifies the session again itself (lib/admin/session.ts), as the Next.js
 * authentication guide recommends.
 *
 * Runs only under /admin; the public site never passes through it.
 */
export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const signedIn = Boolean(verifyToken(req.cookies.get(SESSION_COOKIE)?.value));
  const onLogin = pathname === '/admin/login';

  if (!signedIn && !onLogin) return NextResponse.redirect(new URL('/admin/login', req.url));
  if (signedIn && onLogin) return NextResponse.redirect(new URL('/admin/dashboard', req.url));

  const res = NextResponse.next();
  // Belt and braces with the pages' own robots metadata.
  res.headers.set('X-Robots-Tag', 'noindex, nofollow');
  res.headers.set('Cache-Control', 'no-store');
  return res;
}

export const config = {
  matcher: ['/admin', '/admin/:path*'],
};
