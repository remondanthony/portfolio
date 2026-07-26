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
    let lastY = window.scrollY;

    // ---- nav: shrink on scroll, hide going down, reveal going up ----
    const onScroll = () => {
      const y = window.scrollY;
      nav.classList.toggle('scrolled', y > 8);
      totop.classList.toggle('show', y > 700);
      if (!menu.classList.contains('open')) {
        if (y > lastY && y > 120) nav.classList.add('hide');
        else if (y < lastY) nav.classList.remove('hide');
      }
      if (y <= 8) nav.classList.remove('hide');
      lastY = y;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    cleanups.push(() => window.removeEventListener('scroll', onScroll));
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
    if (form) {
      const onSubmit = (e: Event) => {
        e.preventDefault();
        if (!form.checkValidity()) {
          form.reportValidity();
          return;
        }
        document.getElementById('formOk')?.classList.add('show');
        const submit = form.querySelector('button[type=submit]') as HTMLElement | null;
        if (submit) submit.style.display = 'none';
        form.reset();
      };
      form.addEventListener('submit', onSubmit);
      cleanups.push(() => form.removeEventListener('submit', onSubmit));
    }

    return () => cleanups.forEach((fn) => fn());
  }, []);

  return null;
}
