/**
 * Contact form endpoint.
 *
 * Until now the form called preventDefault(), showed "Thanks — we'll reply
 * within one business day" and dropped the message on the floor. Since Contact
 * is the only call to action on the page, every enquiry the site ever received
 * was discarded while the sender was told otherwise.
 *
 * Delivery goes through Resend over plain fetch — no dependency to install and
 * nothing to keep updated. Set two environment variables in Vercel:
 *
 *   RESEND_API_KEY   from resend.com, free tier is 3,000 emails a month
 *   CONTACT_TO       where enquiries should land, e.g. admin@vioniche.com
 *
 * With those unset the route answers 503 and a machine-readable
 * `reason: "not-configured"`, which the form uses to fall back to opening the
 * visitor's mail client with the message pre-filled. That way an enquiry is
 * never silently lost, whether or not the keys are in place.
 */

export const runtime = 'edge';

type Payload = {
  name?: unknown;
  email?: unknown;
  type?: unknown;
  msg?: unknown;
  /** Honeypot. Real people never fill this; bots fill everything. */
  company?: unknown;
};

const str = (v: unknown, max: number) =>
  typeof v === 'string' ? v.trim().slice(0, max) : '';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export async function POST(req: Request) {
  let body: Payload;
  try {
    body = await req.json();
  } catch {
    return json(400, { ok: false, reason: 'bad-json' });
  }

  // A filled honeypot is a bot. Answer 200 so it learns nothing, send nothing.
  if (str(body.company, 200)) return json(200, { ok: true });

  const name = str(body.name, 120);
  const email = str(body.email, 200);
  const type = str(body.type, 80);
  const msg = str(body.msg, 5000);

  const missing = [!name && 'name', !EMAIL.test(email) && 'email', !msg && 'msg'].filter(Boolean);
  if (missing.length) return json(400, { ok: false, reason: 'invalid', fields: missing });

  const key = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_TO;
  if (!key || !to) return json(503, { ok: false, reason: 'not-configured' });

  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { authorization: `Bearer ${key}`, 'content-type': 'application/json' },
      body: JSON.stringify({
        from: process.env.CONTACT_FROM || 'Vioniche site <onboarding@resend.dev>',
        to: [to],
        reply_to: email,
        subject: `New enquiry — ${name}${type ? ` (${type})` : ''}`,
        text: [
          `Name:    ${name}`,
          `Email:   ${email}`,
          `Type:    ${type || '—'}`,
          '',
          msg,
        ].join('\n'),
      }),
    });

    if (!r.ok) {
      // Surface the provider's own message in the log, never to the visitor.
      console.error('resend rejected the send', r.status, await r.text().catch(() => ''));
      return json(502, { ok: false, reason: 'send-failed' });
    }
    return json(200, { ok: true });
  } catch (e) {
    console.error('contact send threw', e);
    return json(502, { ok: false, reason: 'send-failed' });
  }
}

function json(status: number, data: unknown) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  });
}
