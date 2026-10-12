import { NextResponse, type NextRequest } from 'next/server';
import { checkFlow, connectionCookie, exchangeCode, FLOW_COOKIE, GoogleError, oauthConfig, seal, CALLBACK_PATH, type Connection } from '@/lib/cms/google-oauth';
import { getProject } from '@/lib/cms/projects';

/**
 * Where Google sends the admin back after the consent screen.
 *
 * This is Google's redirect, a navigation that starts on another site, so the
 * admin's SameSite=Strict session cookie is not sent with it. Authority comes
 * instead from the flow cookie set when the signed-in admin pressed Connect:
 * sealed by the server, bound to that admin, the project, and a random state
 * that must equal the one Google echoes back, with a PKCE verifier, valid for
 * ten minutes and used once. Anything else is refused.
 *
 * The response never redirects straight into /admin: it is a small page that
 * moves on by itself, which makes the next request same-site, so the admin
 * arrives signed in. Only fixed status words travel in that URL — never a
 * code, token or message from the request.
 */

export const dynamic = 'force-dynamic';

type Outcome = 'connected' | 'cancelled' | 'state' | 'invalid' | 'denied' | 'error' | 'config';

function finish(outcome: Outcome, connection?: { name: string; value: string }) {
  const target = `/admin/seo/search-console?gsc=${outcome}`;
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="robots" content="noindex,nofollow">`
    + `<meta http-equiv="refresh" content="0;url=${target}"><title>Search Console</title></head>`
    + `<body style="font:15px system-ui;padding:40px"><p>Returning to the CMS… <a href="${target}">Continue</a></p></body></html>`;
  const res = new NextResponse(html, {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow', 'Referrer-Policy': 'no-referrer' },
  });
  // The flow cookie is single-use, whatever the outcome.
  res.cookies.set(FLOW_COOKIE, '', { path: CALLBACK_PATH, maxAge: 0, httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production' });
  if (connection) {
    res.cookies.set(connection.name, connection.value, {
      httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', path: '/admin', maxAge: 180 * 86_400,
    });
  }
  return res;
}

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams;
  const flow = checkFlow(req.cookies.get(FLOW_COOKIE)?.value, q.get('state'));
  // State first: without a matching flow nothing else in the request is looked at.
  if (!flow) return finish('state');
  const project = getProject(flow.project);
  if (!project?.features.searchConsole) return finish('invalid');

  const error = q.get('error');
  if (error) return finish(error === 'access_denied' ? 'cancelled' : 'denied');
  const code = q.get('code');
  if (!code || code.length > 2048 || !/^[\w\-./]+$/.test(code)) return finish('invalid');

  const config = oauthConfig();
  if ('problem' in config) return finish('config');
  try {
    const tokens = await exchangeCode(config, code, flow.verifier);
    const name = connectionCookie(project.id);
    const connection: Connection = { v: 1, project: project.id, sub: flow.sub, refreshToken: tokens.refreshToken, scope: tokens.scope, connectedAt: new Date().toISOString() };
    const value = seal(connection, name);
    if (!value) return finish('config');
    return finish('connected', { name, value });
  } catch (e) {
    return finish(e instanceof GoogleError && e.kind === 'permission' ? 'denied' : 'error');
  }
}
