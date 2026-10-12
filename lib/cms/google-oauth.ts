import { createCipheriv, createDecipheriv, createHash, hkdfSync, randomBytes } from 'node:crypto';
import { cookies } from 'next/headers';
import type { ProjectId } from './projects';

/**
 * Google OAuth for Search Console — server only, never 'use server'.
 *
 * Google's documented web-server flow with PKCE and a state value:
 *   connect → accounts.google.com (consent) → /api/search-console/callback
 *   → code exchanged here for tokens → the refresh token is encrypted and
 *   kept in an httpOnly cookie for that one project.
 *
 * Scope: webmasters.readonly — read Search Console data, nothing else.
 *
 * Where tokens live. This CMS has no database and the Vioniche repository
 * is public, so a token committed there would be public forever. The refresh
 * token is instead sealed with AES-256-GCM (key derived from SESSION_SECRET
 * with HKDF, used for nothing else) and stored in an httpOnly, Secure,
 * SameSite=Strict cookie scoped to /admin: page JavaScript cannot read it,
 * other sites cannot send it, and without the server's key it is noise.
 * Access tokens stay in server memory only. Nothing here is ever returned to
 * the browser, logged, or written to a repository.
 */

export const SCOPE = 'https://www.googleapis.com/auth/webmasters.readonly';
export const CALLBACK_PATH = '/api/search-console/callback';

const GOOGLE = {
  auth: 'https://accounts.google.com/o/oauth2/v2/auth',
  token: 'https://oauth2.googleapis.com/token',
  revoke: 'https://oauth2.googleapis.com/revoke',
  api: 'https://searchconsole.googleapis.com/webmasters/v3',
};

/**
 * Google's endpoints. SEARCH_CONSOLE_TEST_API_BASE exists for automated
 * tests against a local mock and is honoured only for a loopback address,
 * so it can never send credentials to another host.
 */
export function endpoints() {
  const base = process.env.SEARCH_CONSOLE_TEST_API_BASE;
  if (!base) return GOOGLE;
  let u: URL;
  try { u = new URL(base); } catch { return GOOGLE; }
  if (u.protocol !== 'http:' || !['127.0.0.1', 'localhost', '[::1]'].includes(u.hostname)) return GOOGLE;
  const b = u.origin;
  return { auth: `${b}/o/oauth2/v2/auth`, token: `${b}/token`, revoke: `${b}/revoke`, api: `${b}/webmasters/v3` };
}

export type OAuthConfig = { clientId: string; clientSecret: string; redirectUri: string };

/**
 * Client ID, secret and the exact redirect URI registered in Google Cloud.
 * The redirect URI is configuration, never taken from the request's Host.
 */
export function oauthConfig(): OAuthConfig | { problem: string } {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET?.trim();
  const redirectUri = process.env.GOOGLE_OAUTH_REDIRECT_URI?.trim();
  if (!clientId || !clientSecret || !redirectUri) return { problem: 'Google OAuth is not configured on this deployment: set GOOGLE_OAUTH_CLIENT_ID, GOOGLE_OAUTH_CLIENT_SECRET and GOOGLE_OAUTH_REDIRECT_URI (see docs/cms-setup.md).' };
  let u: URL;
  try { u = new URL(redirectUri); } catch { return { problem: 'GOOGLE_OAUTH_REDIRECT_URI is not a valid URL.' }; }
  const local = u.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(u.hostname);
  if ((u.protocol !== 'https:' && !local) || u.pathname !== CALLBACK_PATH || u.search || u.hash || u.username || u.password) {
    return { problem: `GOOGLE_OAUTH_REDIRECT_URI must be https://<your domain>${CALLBACK_PATH} (http://localhost only in development).` };
  }
  if (!sealKey()) return { problem: 'SESSION_SECRET must be set (32+ characters) to protect the Search Console connection.' };
  return { clientId, clientSecret, redirectUri };
}

/* ---------- sealing (AES-256-GCM) ---------- */

function sealKey(): Buffer | null {
  const s = process.env.SESSION_SECRET ?? '';
  if (s.length < 32) return null;
  return Buffer.from(hkdfSync('sha256', s, 'vcms-search-console', 'cookie-seal-v1', 32));
}

/** Encrypts and authenticates `data`, bound to `purpose` (the cookie name) so one sealed value cannot be replayed as another. */
export function seal(data: unknown, purpose: string): string | null {
  const key = sealKey();
  if (!key) return null;
  const iv = randomBytes(12);
  const c = createCipheriv('aes-256-gcm', key, iv);
  c.setAAD(Buffer.from(purpose));
  const body = Buffer.concat([c.update(JSON.stringify(data), 'utf8'), c.final()]);
  return Buffer.concat([iv, c.getAuthTag(), body]).toString('base64url');
}

export function unseal<T>(value: string | undefined, purpose: string): T | null {
  const key = sealKey();
  if (!key || !value || value.length > 6000) return null;
  try {
    const raw = Buffer.from(value, 'base64url');
    if (raw.length < 29) return null;
    const d = createDecipheriv('aes-256-gcm', key, raw.subarray(0, 12));
    d.setAAD(Buffer.from(purpose));
    d.setAuthTag(raw.subarray(12, 28));
    return JSON.parse(Buffer.concat([d.update(raw.subarray(28)), d.final()]).toString('utf8')) as T;
  } catch {
    return null;
  }
}

/* ---------- the OAuth flow cookie (state + PKCE) ---------- */

export const FLOW_COOKIE = 'vcms_gsc_flow';
const FLOW_MINUTES = 10;

type Flow = { state: string; verifier: string; project: ProjectId; sub: string; exp: number };

/**
 * Starts a connection: a fresh state and PKCE verifier, sealed in a short-
 * lived cookie that only the callback path receives. SameSite=Lax, because
 * Google's redirect back is a top-level navigation from another site.
 */
export async function beginFlow(project: ProjectId, sub: string, c: OAuthConfig): Promise<string | null> {
  const state = randomBytes(32).toString('base64url');
  const verifier = randomBytes(48).toString('base64url');
  const sealed = seal({ state, verifier, project, sub, exp: Date.now() + FLOW_MINUTES * 60_000 } satisfies Flow, FLOW_COOKIE);
  if (!sealed) return null;
  (await cookies()).set(FLOW_COOKIE, sealed, {
    httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: CALLBACK_PATH, maxAge: FLOW_MINUTES * 60,
  });
  const q = new URLSearchParams({
    client_id: c.clientId,
    redirect_uri: c.redirectUri,
    response_type: 'code',
    scope: SCOPE,
    access_type: 'offline',
    // Ask every time, so Google issues a refresh token on reconnect too.
    prompt: 'consent select_account',
    include_granted_scopes: 'false',
    state,
    code_challenge: createHash('sha256').update(verifier).digest('base64url'),
    code_challenge_method: 'S256',
  });
  return `${endpoints().auth}?${q.toString()}`;
}

/** States already used on this server, until they would have expired anyway. */
const usedStates = new Map<string, number>();

/**
 * The flow, if the cookie is genuine, unexpired, for this admin, its state
 * equals the one Google returned, and that state has not been used before.
 */
export function checkFlow(cookieValue: string | undefined, state: string | null): Flow | null {
  const f = unseal<Flow>(cookieValue, FLOW_COOKIE);
  if (!f || typeof f.state !== 'string' || typeof state !== 'string' || f.exp < Date.now()) return null;
  const a = Buffer.from(f.state), b = Buffer.from(state);
  if (a.length !== b.length || !a.equals(b)) return null;
  const admin = process.env.ADMIN_USER_ID?.trim();
  if (!admin || f.sub !== admin) return null;
  for (const [s, exp] of usedStates) if (exp < Date.now()) usedStates.delete(s);
  if (usedStates.has(f.state)) return null;
  usedStates.set(f.state, f.exp);
  return f;
}

/* ---------- the connection cookie ---------- */

export type Connection = {
  v: 1;
  project: ProjectId;
  sub: string;
  refreshToken: string;
  scope: string;
  connectedAt: string;
  property?: string;
  lastSync?: string;
  lastError?: { at: string; message: string };
};

export const connectionCookie = (project: ProjectId) => `vcms_gsc_${project}`;
const CONNECTION_DAYS = 180;

export async function readConnection(project: ProjectId): Promise<Connection | null> {
  const name = connectionCookie(project);
  const c = unseal<Connection>((await cookies()).get(name)?.value, name);
  const admin = process.env.ADMIN_USER_ID?.trim();
  // Sealed for another project or another admin: not this project's connection.
  if (!c || c.v !== 1 || c.project !== project || !admin || c.sub !== admin || typeof c.refreshToken !== 'string') return null;
  return c;
}

/** Stores the connection. Callable only where cookies may be set: Server Actions and Route Handlers. */
export async function writeConnection(c: Connection, jar?: { set: (name: string, value: string, o: object) => unknown }) {
  const name = connectionCookie(c.project);
  const sealed = seal(c, name);
  if (!sealed) throw new Error('Cannot protect the connection: SESSION_SECRET is missing.');
  (jar ?? (await cookies())).set(name, sealed, {
    httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', path: '/admin', maxAge: CONNECTION_DAYS * 86_400,
  });
}

export async function deleteConnection(project: ProjectId) {
  (await cookies()).delete({ name: connectionCookie(project), path: '/admin' });
}

/* ---------- tokens ---------- */

export type GoogleErrorKind = 'revoked' | 'permission' | 'rate-limit' | 'temporary' | 'invalid-response' | 'not-found' | 'config';

export class GoogleError extends Error {
  readonly kind: GoogleErrorKind;
  readonly status: number;
  constructor(message: string, kind: GoogleErrorKind, status = 0) {
    super(message);
    this.kind = kind;
    this.status = status;
  }
}

const post = (url: string, form: Record<string, string>) =>
  fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
    body: new URLSearchParams(form).toString(),
    cache: 'no-store',
    redirect: 'error',
    signal: AbortSignal.timeout(15_000),
  });

/** Exchanges the authorization code (with its PKCE verifier) for tokens. */
export async function exchangeCode(c: OAuthConfig, code: string, verifier: string) {
  let res: Response;
  try {
    res = await post(endpoints().token, { code, client_id: c.clientId, client_secret: c.clientSecret, redirect_uri: c.redirectUri, grant_type: 'authorization_code', code_verifier: verifier });
  } catch {
    throw new GoogleError('Google could not be reached to finish connecting. Try again.', 'temporary');
  }
  const body = (await res.json().catch(() => null)) as { refresh_token?: unknown; access_token?: unknown; expires_in?: unknown; scope?: unknown; error?: unknown } | null;
  if (!res.ok || !body) throw new GoogleError(res.status === 400 ? 'Google did not accept the authorization. Connect again.' : 'Google could not finish connecting. Try again.', res.status === 400 ? 'revoked' : 'temporary', res.status);
  if (typeof body.refresh_token !== 'string' || typeof body.access_token !== 'string') throw new GoogleError('Google did not return a long-lived authorization. Connect again and approve access.', 'invalid-response');
  const scope = typeof body.scope === 'string' ? body.scope : '';
  if (!scope.split(' ').includes(SCOPE)) throw new GoogleError('Search Console access was not granted. Connect again and allow "View Search Console data".', 'permission');
  remember(body.refresh_token, body.access_token, Number(body.expires_in) || 3600);
  return { refreshToken: body.refresh_token, scope };
}

/** Access tokens by a hash of their refresh token, in memory only, until shortly before they expire. */
const accessTokens = new Map<string, { token: string; expires: number }>();
const tokenKey = (refresh: string) => createHash('sha256').update(refresh).digest('hex');
function remember(refresh: string, access: string, seconds: number) {
  accessTokens.set(tokenKey(refresh), { token: access, expires: Date.now() + Math.max(60, seconds - 120) * 1000 });
}
export const forgetAccess = (refresh: string) => accessTokens.delete(tokenKey(refresh));

export async function accessToken(refresh: string, force = false): Promise<string> {
  const cached = accessTokens.get(tokenKey(refresh));
  if (!force && cached && cached.expires > Date.now()) return cached.token;
  const c = oauthConfig();
  if ('problem' in c) throw new GoogleError(c.problem, 'config');
  let res: Response;
  try {
    res = await post(endpoints().token, { client_id: c.clientId, client_secret: c.clientSecret, refresh_token: refresh, grant_type: 'refresh_token' });
  } catch {
    throw new GoogleError('Google could not be reached. Try again in a moment.', 'temporary');
  }
  const body = (await res.json().catch(() => null)) as { access_token?: unknown; expires_in?: unknown; error?: unknown } | null;
  if (res.status === 400 || res.status === 401) {
    accessTokens.delete(tokenKey(refresh));
    throw new GoogleError('The Google authorization has expired or was revoked. Connect Google Search Console again.', 'revoked', res.status);
  }
  if (res.status === 429) throw new GoogleError('Google is limiting requests right now. Try again in a few minutes.', 'rate-limit', 429);
  if (!res.ok || !body || typeof body.access_token !== 'string') throw new GoogleError('Google could not refresh the authorization. Try again in a moment.', 'temporary', res.status);
  remember(refresh, body.access_token, Number(body.expires_in) || 3600);
  return body.access_token;
}

/** Revokes the grant at Google. Best effort: the cookie is removed either way. */
export async function revoke(refresh: string) {
  forgetAccess(refresh);
  try {
    await post(endpoints().revoke, { token: refresh });
  } catch {}
}
