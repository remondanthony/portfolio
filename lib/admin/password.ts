import { randomBytes, scrypt, timingSafeEqual, type ScryptOptions } from 'node:crypto';

/**
 * Password hashing with scrypt, which Node ships — no native module, no extra
 * dependency. The stored form carries its own parameters:
 *
 *   scrypt:N:r:p:<salt base64>:<key base64>
 *
 * Colons, not dollar signs: Next's .env loader expands "$name" sequences,
 * which would silently corrupt a hash pasted into .env.local.
 *
 * Generate one with `node scripts/hash-password.mjs` and put it in
 * ADMIN_PASSWORD_HASH. The plain password is never stored anywhere.
 */

const derive = (password: string, salt: Buffer, keylen: number, opts: ScryptOptions) =>
  new Promise<Buffer>((resolve, reject) =>
    scrypt(password, salt, keylen, opts, (err, key) => (err ? reject(err) : resolve(key))),
  );

export async function hashPassword(password: string) {
  const N = 16384, r = 8, p = 1;
  const salt = randomBytes(16);
  const key = await derive(password, salt, 64, { N, r, p });
  return `scrypt:${N}:${r}:${p}:${salt.toString('base64')}:${key.toString('base64')}`;
}

export async function verifyPassword(password: string, stored: string | undefined) {
  if (!stored) return false;
  const [scheme, N, r, p, salt, key] = stored.split(':');
  if (scheme !== 'scrypt' || !N || !r || !p || !salt || !key) return false;
  const expected = Buffer.from(key, 'base64');
  try {
    const actual = await derive(password, Buffer.from(salt, 'base64'), expected.length, {
      N: Number(N), r: Number(r), p: Number(p), maxmem: 64 * 1024 * 1024,
    });
    return timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}
