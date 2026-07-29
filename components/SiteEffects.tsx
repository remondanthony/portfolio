'use client';

import { useEffect } from 'react';

export default function SiteEffects() {
  useEffect(() => {
    const nav = document.getElementById('nav');
    const totop = document.getElementById('totop');
    const ham = document.getElementById('ham');
    const menu = document.getElementById('mobileMenu');
    const form = document.getElementById('contactForm') as HTMLFormElement | null;
    if (!nav || !totop || !ham || !menu) return;

    const cleanups: Array<() => void> = [];

    // ---- nav: always visible, solid only once past the hero ----
    /**
     * The bar stays put. It only swaps to its solid treatment once the hero —
     * including the distance its pinned build consumes — has left the top of
     * the screen, so the crisp white type reads against the dark hero for the
     * whole story instead of flipping to dark-on-glass after 8px of scroll.
     */
    let solidAt = 0;
    const measure = () => {
      const hero = document.querySelector<HTMLElement>('.hero-blank');
      if (!hero) {
        solidAt = 8;
        return;
      }
      // ScrollTrigger wraps a pinned element in .pin-spacer; that spacer is
      // what actually occupies the scroll, so measure whichever is outermost.
      const box = (hero.closest('.pin-spacer') as HTMLElement) ?? hero;
      solidAt = box.offsetTop + box.offsetHeight - nav.offsetHeight;
    };
    measure();

    const onScroll = () => {
      const y = window.scrollY;
      nav.classList.toggle('scrolled', y > solidAt);
      // Also gated on the hero: the pinned build inflates scrollY far past
      // any fixed threshold while the visitor is still in the first screen.
      totop.classList.toggle('show', y > solidAt + 200);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', measure, { passive: true });
    cleanups.push(() => window.removeEventListener('scroll', onScroll));
    cleanups.push(() => window.removeEventListener('resize', measure));
    // The pin spacer only exists once GSAP has laid it out.
    const remeasure = () => {
      measure();
      onScroll();
    };
    const raf = requestAnimationFrame(() => requestAnimationFrame(remeasure));
    window.addEventListener('load', remeasure);
    cleanups.push(() => {
      cancelAnimationFrame(raf);
      window.removeEventListener('load', remeasure);
    });
    onScroll();

    const toTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });
    totop.addEventListener('click', toTop);
    cleanups.push(() => totop.removeEventListener('click', toTop));

    // ---- mobile menu ----
    const onHam = () => {
      const open = menu.classList.toggle('open');
      ham.setAttribute('aria-expanded', String(open));
    };
    ham.addEventListener('click', onHam);
    cleanups.push(() => ham.removeEventListener('click', onHam));

    const closeMenu = () => {
      menu.classList.remove('open');
      ham.setAttribute('aria-expanded', 'false');
    };
    menu.querySelectorAll('a').forEach((a) => {
      a.addEventListener('click', closeMenu);
      cleanups.push(() => a.removeEventListener('click', closeMenu));
    });

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // ---- reveal-on-scroll ----
    if ('IntersectionObserver' in window && !reduce) {
      const io = new IntersectionObserver(
        (entries) => {
          entries.forEach((e) => {
            if (e.isIntersecting) {
              e.target.classList.add('in');
              io.unobserve(e.target);
            }
          });
        },
        { threshold: 0.12 }
      );
      document.querySelectorAll('.reveal').forEach((el) => io.observe(el));
      cleanups.push(() => io.disconnect());
    } else {
      document.querySelectorAll('.reveal').forEach((el) => el.classList.add('in'));
    }

    // ---- animated stat counters ----
    const animate = (el: Element) => {
      const target = parseFloat(el.getAttribute('data-count') || '0');
      const isFloat = target % 1 !== 0;
      const valEl = el.querySelector('.val');
      if (!valEl) return;
      if (reduce) {
        valEl.textContent = isFloat ? target.toFixed(1) : String(target);
        return;
      }
      let start: number | null = null;
      const dur = 1400;
      const frame = (t: number) => {
        if (start === null) start = t;
        const p = Math.min((t - start) / dur, 1);
        const v = target * (1 - Math.pow(1 - p, 3));
        valEl.textContent = isFloat ? v.toFixed(1) : String(Math.round(v));
        if (p < 1) requestAnimationFrame(frame);
      };
      requestAnimationFrame(frame);
    };

    if ('IntersectionObserver' in window) {
      const so = new IntersectionObserver(
        (entries) => {
          entries.forEach((e) => {
            if (e.isIntersecting) {
              animate(e.target);
              so.unobserve(e.target);
            }
          });
        },
        { threshold: 0.6 }
      );
      document.querySelectorAll('.v[data-count]').forEach((el) => so.observe(el));
      cleanups.push(() => so.disconnect());
    }

    // ---- contact form ----
    /**
     * This used to call preventDefault(), show "Thanks — we'll reply within one
     * business day" and do nothing else. The message was never sent anywhere.
     *
     * It now posts to /api/contact. The success note appears only when the send
     * actually succeeded. If the endpoint has no mail credentials yet, or the
     * provider fails, it opens the visitor's mail client with everything they
     * typed already in it — so the enquiry survives either way rather than
     * being swallowed behind a thank-you.
     */
    if (form) {
      const status = document.getElementById('formOk');
      const submit = form.querySelector('button[type=submit]') as HTMLElement | null;

      const say = (text: string, tone: 'ok' | 'warn' | 'error') => {
        if (!status) return;
        const label = status.querySelector('[data-status-text]');
        if (label) label.textContent = text;
        else status.textContent = text;
        status.dataset.tone = tone;
        status.classList.add('show');
      };

      const mailtoFallback = (d: Record<string, string>) => {
        const to = 'hello@vioniche.studio';
        const subject = `New enquiry — ${d.name}${d.type ? ` (${d.type})` : ''}`;
        const lines = [`Name: ${d.name}`, `Email: ${d.email}`, `Type: ${d.type || '—'}`, '', d.msg];
        window.location.href =
          `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines.join('\n'))}`;
      };

      const onSubmit = async (e: Event) => {
        e.preventDefault();
        if (!form.checkValidity()) {
          form.reportValidity();
          return;
        }

        const fd = new FormData(form);
        const data = {
          name: String(fd.get('name') || ''),
          email: String(fd.get('email') || ''),
          type: String(fd.get('type') || ''),
          msg: String(fd.get('msg') || ''),
          company: String(fd.get('company') || ''), // honeypot
        };

        // innerHTML, not textContent: the button holds an arrow span that
        // textContent would flatten away and never restore.
        if (submit) {
          submit.setAttribute('disabled', 'true');
          submit.dataset.label ??= submit.innerHTML;
          submit.textContent = 'Sending…';
        }

        try {
          const r = await fetch('/api/contact', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify(data),
          });
          const out = await r.json().catch(() => ({}));

          if (r.ok && out.ok) {
            say('Thanks — we’ll reply within one business day.', 'ok');
            if (submit) submit.style.display = 'none';
            form.reset();
            return;
          }

          // Anything else: hand the message to their mail client rather than
          // pretending it went somewhere.
          say('Opening your email app so this reaches us…', 'warn');
          mailtoFallback(data);
        } catch {
          say('Network problem — opening your email app instead…', 'warn');
          mailtoFallback(data);
        } finally {
          if (submit && submit.style.display !== 'none') {
            submit.removeAttribute('disabled');
            if (submit.dataset.label) submit.innerHTML = submit.dataset.label;
          }
        }
      };

      form.addEventListener('submit', onSubmit);
      cleanups.push(() => form.removeEventListener('submit', onSubmit));
    }

    return () => cleanups.forEach((fn) => fn());
  }, []);

  return null;
}
