/**
 * Slows password guessing: five failed sign-ins per address per fifteen
 * minutes.
 *
 * In memory, so it is per server instance and resets on deploy. That is a
 * speed bump rather than a wall — the real protection is a long password
 * hashed with scrypt — but it stops a script hammering one instance.
 */

const WINDOW = 15 * 60_000;
const LIMIT = 5;
const failures = new Map<string, { count: number; until: number }>();

export function isLimited(key: string, now = Date.now()) {
  const f = failures.get(key);
  if (!f || f.until <= now) return false;
  return f.count >= LIMIT;
}

export function recordFailure(key: string, now = Date.now()) {
  const f = failures.get(key);
  if (!f || f.until <= now) failures.set(key, { count: 1, until: now + WINDOW });
  else f.count += 1;
  if (failures.size > 5000) for (const [k, v] of failures) if (v.until <= now) failures.delete(k);
}

export const clearFailures = (key: string) => failures.delete(key);
