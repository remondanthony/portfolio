import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * Admin session tokens: a small JSON payload and an HMAC-SHA256 signature
 * over it, keyed with SESSION_SECRET.
 *
 * Nothing secret is inside — only who and until when — and the signature is
 * what makes it trustworthy. Rotating SESSION_SECRET, or changing
 * ADMIN_USER_ID, signs every existing session out.
 *
 * No request objects here, so proxy.ts and the server code share it.
 */

export const SESSION_COOKIE = 'vcms_session';
export const SESSION_HOURS = 8;

type Payload = { sub: string; iat: number; exp: number };

const b64 = (s: string | Buffer) => Buffer.from(s).toString('base64url');

function secret() {
  const s = process.env.SESSION_SECRET ?? '';
  // 32 characters is the floor; `openssl rand -base64 48` gives plenty.
  return s.length >= 32 ? s : null;
}

const sign = (data: string, key: string) => createHmac('sha256', key).update(data).digest();

export function createToken(userId: string, now = Date.now()): string | null {
  const key = secret();
  if (!key) return null;
  const payload: Payload = { sub: userId, iat: now, exp: now + SESSION_HOURS * 3600_000 };
  const body = b64(JSON.stringify(payload));
  return `${body}.${b64(sign(body, key))}`;
}

/** The user ID the token was issued to, or null if it is forged, expired or for someone else. */
export function verifyToken(token: string | undefined, now = Date.now()): string | null {
  const key = secret();
  const admin = process.env.ADMIN_USER_ID?.trim();
  if (!key || !admin || !token) return null;

  const [body, sig] = token.split('.');
  if (!body || !sig) return null;
  const expected = sign(body, key);
  const given = Buffer.from(sig, 'base64url');
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null;

  try {
    const p = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as Payload;
    if (typeof p.exp !== 'number' || p.exp <= now) return null;
    if (p.sub !== admin) return null;
    return p.sub;
  } catch {
    return null;
  }
}
