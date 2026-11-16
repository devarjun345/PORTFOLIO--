import { prefersReducedMotion } from '../lib/motion.js';

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

/**
 * Scroll-driven motion, written once per frame:
 *  - [data-parallax] elements drift at a fraction of scroll speed
 *  - the thin progress line at the top of the page
 *  - the leadership timeline fill and its dots
 *
 * Layout is measured in measure() (on load, resize and when the page changes size), never while scrolling,
 * so a scroll frame is plain arithmetic plus a few style writes. Positions come from layout offsets, which
 * ignore transforms, so the drift is a pure function of scroll position and cannot feed back on itself.
 */
export function initParallax() {
  const bar = document.getElementById('scroll-progress');
  const layers = [...document.querySelectorAll('[data-parallax]')].map((el) => ({
    el,
    k: Number(el.dataset.parallax) || 0.1,
    mid: 0,
    half: 0,
    last: '',
  }));
  const timeline = document.querySelector('.timeline');
  const items = timeline ? [...timeline.querySelectorAll(':scope > li')] : [];

  let vh = window.innerHeight;
  let maxScroll = 0;
  let tlTop = 0;
  let tlHeight = 1;
  let itemTops = [];
  let lastP = -1;
  let ticking = false;

  function measure() {
    vh = window.innerHeight;
    const sy = window.scrollY;
    maxScroll = Math.max(0, document.documentElement.scrollHeight - vh);

    layers.forEach((l) => {
      const parent = l.el.offsetParent || l.el.parentElement;
      l.half = l.el.offsetHeight / 2;
      l.mid = parent.getBoundingClientRect().top + sy + l.el.offsetTop + l.half;
    });

    if (timeline) {
      tlTop = timeline.getBoundingClientRect().top + sy;
      tlHeight = timeline.offsetHeight || 1;
      itemTops = items.map((li) => tlTop + li.offsetTop);
    }
  }

  function update() {
    ticking = false;
    const sy = window.scrollY;
    if (bar) bar.style.transform = `scaleX(${maxScroll > 0 ? clamp(sy / maxScroll, 0, 1) : 0})`;
    if (prefersReducedMotion) return;

    for (const l of layers) {
      if (l.mid - l.half - sy > vh + 200 || l.mid + l.half - sy < -200) continue; // off screen
      const y = ((vh / 2 - (l.mid - sy)) * l.k).toFixed(1);
      if (y !== l.last) {
        l.last = y;
        l.el.style.transform = `translate3d(0, ${y}px, 0)`;
      }
    }

    if (timeline) {
      const p = clamp((vh * 0.6 - (tlTop - sy)) / tlHeight, 0, 1);
      if (p !== lastP) {
        lastP = p;
        timeline.style.setProperty('--p', p.toFixed(3));
      }
      items.forEach((li, i) => li.classList.toggle('reached', itemTops[i] - sy < vh * 0.65));
    }
  }

  const request = () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(update);
    }
  };

  // With reduced motion nothing drifts or fills gradually: the timeline is simply shown complete.
  if (prefersReducedMotion && timeline) {
    timeline.style.setProperty('--p', '1');
    items.forEach((li) => li.classList.add('reached'));
  }

  window.addEventListener('scroll', request, { passive: true });
  window.addEventListener('resize', () => { measure(); request(); });
  if ('ResizeObserver' in window) {
    new ResizeObserver(() => { measure(); request(); }).observe(document.body);
  }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { measure(); request(); });

  measure();
  update();
}
