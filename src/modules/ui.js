import { createIcons, Activity, ClipboardList, Code, FlaskConical, Github, Hammer, Linkedin, Lock, Mail, Package, Phone, Rocket, Server, Shield, ShieldCheck } from 'lucide';
import { prefersReducedMotion } from '../lib/motion.js';
import { ICON } from './icons.js';

export function initIcons() {
  createIcons({ icons: { Activity, ClipboardList, Code, FlaskConical, Github, Hammer, Linkedin, Lock, Mail, Package, Phone, Rocket, Server, Shield, ShieldCheck } });
}

function splitInto(el, offset = 0) {
  const text = el.textContent;
  el.setAttribute('aria-label', text);
  let i = offset;
  const parts = [];
  text.split(/(\s+)/).forEach((chunk) => {
    if (!chunk) return;
    if (/^\s+$/.test(chunk)) { parts.push(document.createTextNode(' ')); return; }
    // each word is an unbreakable unit, so a line can only wrap between words
    const word = document.createElement('span');
    word.className = 'word';
    word.setAttribute('aria-hidden', 'true');
    [...chunk].forEach((ch) => {
      const s = document.createElement('span');
      s.className = 'char';
      s.style.setProperty('--i', String(i++));
      s.textContent = ch;
      word.append(s);
    });
    parts.push(word);
  });
  el.replaceChildren(...parts);
}

/** Hero name animates on load; section titles animate when scrolled into view. */
export function initTitleSplit() {
  document.querySelectorAll('[data-split]').forEach((el, n) => splitInto(el, n * 7));
  const titles = [...document.querySelectorAll('[data-split-scroll]')];
  titles.forEach((el) => splitInto(el));
  document.documentElement.classList.add('title-ready');

  if (prefersReducedMotion || !('IntersectionObserver' in window)) {
    titles.forEach((el) => el.classList.add('in'));
    return;
  }
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { rootMargin: '0px 0px -12% 0px' });
  titles.forEach((el) => io.observe(el));
}

const REVEAL = '.section-intro, .about-copy > *, .card, .feature, .tier, .toolbox .tile, .stat, .programs, .sub-title';

export function initReveal() {
  const items = document.querySelectorAll(REVEAL);
  items.forEach((el) => el.classList.add('reveal'));
  if (prefersReducedMotion || !('IntersectionObserver' in window)) {
    items.forEach((el) => el.classList.add('in'));
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('in');
        io.unobserve(entry.target);
      });
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.06 },
  );
  items.forEach((el) => {
    const siblings = [...el.parentElement.children].filter((c) => c.classList.contains('reveal'));
    el.style.setProperty('--d', `${Math.min(siblings.indexOf(el), 6) * 70}ms`);
    io.observe(el);
  });
}

/** Counts [data-count] numbers up when they scroll into view. */
export function initCounters() {
  const els = document.querySelectorAll('[data-count]');
  if (prefersReducedMotion || !('IntersectionObserver' in window)) return;
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      io.unobserve(entry.target);
      const el = entry.target;
      const to = Number(el.dataset.count);
      const start = performance.now();
      const dur = 1400;
      const step = (now) => {
        const k = Math.min(1, (now - start) / dur);
        el.textContent = Math.round(to * (1 - Math.pow(1 - k, 3)));
        if (k < 1) requestAnimationFrame(step);
      };
      el.textContent = '0';
      requestAnimationFrame(step);
    });
  }, { threshold: 0.6 });
  els.forEach((el) => io.observe(el));
}

/**
 * A light that follows the pointer on cards; the DevRank panel also tilts in 3D (fine pointers only).
 * One delegated listener with one style write per frame, instead of a listener on every card and tile.
 */
export function initTilt() {
  if (!window.matchMedia('(pointer: fine)').matches) return;
  const SELECTOR = '.card, .feature';
  let current = null;
  let raf = 0;
  let cx = 0;
  let cy = 0;

  const resetTilt = (el) => {
    if (!el || !el.matches('[data-tilt]')) return;
    el.style.setProperty('--ry', '0deg');
    el.style.setProperty('--rx', '0deg');
  };

  function apply() {
    raf = 0;
    if (!current) return;
    const r = current.getBoundingClientRect();
    const px = (cx - r.left) / r.width;
    const py = (cy - r.top) / r.height;
    current.style.setProperty('--mx', `${px * 100}%`);
    current.style.setProperty('--my', `${py * 100}%`);
    if (!prefersReducedMotion && current.matches('[data-tilt]')) {
      current.style.setProperty('--ry', `${(px - 0.5) * 5}deg`);
      current.style.setProperty('--rx', `${(0.5 - py) * 4}deg`);
    }
  }

  document.addEventListener('pointermove', (e) => {
    if (e.pointerType === 'touch') return;
    const el = e.target instanceof Element ? e.target.closest(SELECTOR) : null;
    if (el !== current) {
      resetTilt(current);
      current = el;
    }
    cx = e.clientX;
    cy = e.clientY;
    if (current && !raf) raf = requestAnimationFrame(apply);
  }, { passive: true });

  document.documentElement.addEventListener('pointerleave', () => {
    resetTilt(current);
    current = null;
  });
}

/** Removes the opening curtain once its animation is done. */
export function initIntro() {
  const intro = document.getElementById('intro');
  if (!intro) return;
  const remove = () => intro.remove();
  if (prefersReducedMotion) return remove();
  intro.addEventListener('animationend', (e) => { if (e.target.classList.contains('flash')) remove(); });
  setTimeout(remove, 4000);
}

/** Sets the page-wide accent (header, progress glow, backdrop tint) to the colour of the section in view. */
function applyAccent(section) {
  const cs = getComputedStyle(section);
  const rgb = cs.getPropertyValue('--accent-rgb').trim();
  if (!rgb) return;
  const root = document.documentElement.style;
  root.setProperty('--accent', cs.getPropertyValue('--accent').trim());
  root.setProperty('--accent-soft', cs.getPropertyValue('--accent-soft').trim());
  root.setProperty('--accent-rgb', rgb);
  const [r, g, b] = rgb.split(',').map((n) => Number(n) / 255);
  window.dispatchEvent(new CustomEvent('section:tint', { detail: { rgb: [r, g, b] } }));
}

export function initActiveNav() {
  const links = document.querySelectorAll('.nav-link');
  // the hero has no id: when it is the current section, no link is highlighted
  const targets = [document.querySelector('.hero'), ...document.querySelectorAll('main section[id]')].filter(Boolean);
  if (!links.length || !('IntersectionObserver' in window)) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const id = entry.target.id;
        applyAccent(entry.target);
        links.forEach((link) => {
          const active = Boolean(id) && link.getAttribute('href') === `#${id}`;
          link.classList.toggle('active', active);
          if (active) link.setAttribute('aria-current', 'true');
          else link.removeAttribute('aria-current');
        });
      });
    },
    { rootMargin: '-20% 0px -60% 0px', threshold: 0 },
  );
  targets.forEach((section) => observer.observe(section));
}

export function initNavMenu() {
  const toggle = document.getElementById('nav-toggle');
  const menu = document.getElementById('nav-links');
  if (!toggle || !menu) return;

  const setOpen = (open) => {
    toggle.setAttribute('aria-expanded', String(open));
    menu.classList.toggle('is-open', open);
  };
  toggle.addEventListener('click', () => setOpen(toggle.getAttribute('aria-expanded') !== 'true'));
  menu.addEventListener('click', (e) => { if (e.target.closest('a')) setOpen(false); });
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape' || toggle.getAttribute('aria-expanded') !== 'true') return;
    setOpen(false);
    toggle.focus();
  });
  document.addEventListener('click', (e) => { if (!e.target.closest('.nav-container')) setOpen(false); });
}

/**
 * Types the hero tagline like a terminal. The full text is in the HTML, so nothing is lost without JS or with
 * reduced motion. The box keeps its finished height while typing, so narrow phones don't reflow the page.
 */
export function initTyping() {
  const host = document.querySelector('[data-typing]');
  const out = document.getElementById('typed');
  if (!host || !out || prefersReducedMotion) return;
  const text = host.dataset.typing;
  const started = performance.now();
  const fontsReady = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();

  fontsReady.then(() => {
    host.style.minHeight = `${host.offsetHeight}px`; // measured with the full sentence still in place
    out.textContent = '';
    let i = 0;
    setTimeout(() => {
      const id = setInterval(() => {
        out.textContent = text.slice(0, ++i);
        if (i >= text.length) {
          clearInterval(id);
          host.style.minHeight = '';
        }
      }, 38);
    }, Math.max(0, 2100 - (performance.now() - started)));
  });
}

/** A round "back to top" link that appears once the hero is behind you. */
export function initToTop() {
  const link = document.createElement('a');
  link.className = 'to-top';
  link.href = '#top';
  link.setAttribute('aria-label', 'Back to top');
  link.innerHTML = ICON.up;
  document.body.append(link);

  let ticking = false;
  const update = () => {
    ticking = false;
    link.classList.toggle('show', window.scrollY > window.innerHeight * 1.1);
  };
  window.addEventListener('scroll', () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(update);
    }
  }, { passive: true });
  update();
}
