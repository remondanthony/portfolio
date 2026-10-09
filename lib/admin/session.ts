import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { SESSION_COOKIE, SESSION_HOURS, createToken, verifyToken } from './token';

/**
 * The admin's data access layer for identity. Every admin page, Server Action
 * and route handler calls one of these before doing anything — proxy.ts only
 * redirects early and is never the only check.
 */

export async function getSession(): Promise<{ userId: string } | null> {
  const userId = verifyToken((await cookies()).get(SESSION_COOKIE)?.value);
  return userId ? { userId } : null;
}

/** For pages: send anyone without a valid session to the login page. */
export async function requireSession() {
  const session = await getSession();
  if (!session) redirect('/admin/login');
  return session;
}

/** For Server Actions: throw rather than redirect, so the caller sees a failure. */
export async function assertSession() {
  const session = await getSession();
  if (!session) throw new Error('Not signed in. Sign in again and retry.');
  return session;
}

export async function startSession(userId: string) {
  const token = createToken(userId);
  if (!token) throw new Error('SESSION_SECRET is missing or shorter than 32 characters.');
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    // Strict: the admin is only ever reached from itself, so the cookie never
    // needs to travel on a request that started on another site.
    sameSite: 'strict',
    path: '/',
    maxAge: SESSION_HOURS * 3600,
  });
}

export async function endSession() {
  (await cookies()).delete(SESSION_COOKIE);
}

/** Whether the deployment has admin credentials configured at all. */
export const adminConfigured = () =>
  Boolean(process.env.ADMIN_USER_ID?.trim() && process.env.ADMIN_PASSWORD_HASH && (process.env.SESSION_SECRET ?? '').length >= 32);
