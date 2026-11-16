import { LOGOS } from '../data/logos.js';

function renderLogo(el, key) {
  const l = LOGOS[key];
  if (!l) return false;
  el.innerHTML = l.t === 'm'
    ? `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="${l.d}"/></svg>`
    : `<svg viewBox="0 0 ${l.w} ${l.h}" aria-hidden="true" focusable="false">${l.b}</svg>`;
  el.classList.add(l.t === 'm' ? 'logo-m' : 'logo-c');
  if (l.c) el.style.setProperty('--brand', l.c);
  return true;
}

/** Inlines brand logos. Unknown logos fall back to a monogram. At rest all logos are monochrome; hover brings the colour. */
export function initLogos() {
  document.querySelectorAll('[data-logo]').forEach((el) => {
    if (!renderLogo(el, el.dataset.logo)) {
      el.textContent = el.dataset.mono || el.dataset.logo.slice(0, 2).toUpperCase();
      el.classList.add('logo-text');
    }
  });

  // technology tags: prepend a small logo when one exists
  document.querySelectorAll('.tags li[data-tech]').forEach((li) => {
    const span = document.createElement('span');
    span.className = 'tag-logo';
    span.setAttribute('aria-hidden', 'true');
    if (renderLogo(span, li.dataset.tech)) li.prepend(span);
  });
}
