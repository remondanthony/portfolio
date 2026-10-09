#!/usr/bin/env node
/**
 * Prints an ADMIN_PASSWORD_HASH for the Vioniche CMS.
 *
 *   node scripts/hash-password.mjs
 *
 * The password is read from the terminal without echoing and is never
 * written anywhere. The output uses the same scrypt format that
 * lib/admin/password.ts verifies.
 */
import { randomBytes, scrypt } from 'node:crypto';
import { stdin, stdout } from 'node:process';

// Input arrives in chunks, not keystrokes: a pasted password (often with its
// newline) or piped input comes as one string. Characters are consumed one at
// a time from a shared buffer, so whatever is left after one answer carries
// over to the next prompt.
let pending = '';
let ended = false;
const waiting = [];
stdin.setEncoding('utf8');
stdin.on('data', (chunk) => { pending += chunk; drain(); });
stdin.on('end', () => { ended = true; drain(); });

function drain() {
  while (waiting.length) {
    const w = waiting[0];
    let done = false;
    while (pending && !done) {
      const ch = pending[0];
      pending = pending.slice(1);
      if (ch === '\r' || ch === '\n' || ch === '\u0004') {
        done = true;
        if (ch === '\r' && pending[0] === '\n') pending = pending.slice(1);
      } else if (ch === '\u0003') {
        stdin.setRawMode?.(false);
        process.exit(130);
      } else if (ch === '\u007f' || ch === '\b') {
        w.value = w.value.slice(0, -1);
      } else {
        w.value += ch;
      }
    }
    if (!done && !ended) return;
    waiting.shift();
    stdin.setRawMode?.(false);
    if (!waiting.length) stdin.pause();
    stdout.write('\n');
    w.resolve(w.value);
  }
}

function ask(prompt) {
  stdout.write(prompt);
  stdin.setRawMode?.(true);
  stdin.resume();
  return new Promise((resolve) => {
    waiting.push({ value: '', resolve });
    drain();
  });
}

const password = await ask('Admin password: ');
const confirm = await ask('Repeat password: ');
if (password !== confirm) {
  console.error('Passwords do not match.');
  process.exit(1);
}
if (password.length < 12) {
  console.error('Use at least 12 characters.');
  process.exit(1);
}

const N = 16384, r = 8, p = 1;
const salt = randomBytes(16);
scrypt(password, salt, 64, { N, r, p }, (err, key) => {
  if (err) throw err;
  console.log(`\nADMIN_PASSWORD_HASH=scrypt:${N}:${r}:${p}:${salt.toString('base64')}:${key.toString('base64')}`);
});
