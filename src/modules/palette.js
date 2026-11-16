import { copyText } from '../lib/clipboard.js';
import { prefersReducedMotion } from '../lib/motion.js';
import { toast } from './toast.js';

const isApple = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent || '');

const SECTIONS = [
  ['About', '#about', '01', 'bio education coursework'],
  ['Leadership & experience', '#leadership', '02', 'roles timeline microsoft geeksforgeeks president intern'],
  ['Projects', '#projects', '03', 'devrank rakshak mindset work'],
  ['SecureFlow demo', '#secureflow', '', 'devsecops scan security pipeline'],
  ['Tech stack', '#stack', '04', 'tools skills react node cloud devops'],
  ['Achievements', '#achievements', '05', 'hackathon winner awards'],
  ['Certificates', '#certifications', '06', 'certifications courses'],
  ['Contact', '#contact', '07', 'hire email message'],
];

/** Ctrl/⌘ + K (or "/") opens a searchable list of sections and actions. Built on <dialog>, so focus trapping and Esc are native. */
export function initPalette() {
  const trigger = document.getElementById('palette-open');
  if (typeof HTMLDialogElement !== 'function') return;

  const hrefOf = (sel) => document.querySelector(sel)?.getAttribute('href') || '';
  const email = hrefOf('a[href^="mailto:"]').replace('mailto:', '');
  const github = hrefOf('a[href*="github.com/"]');
  const linkedin = hrefOf('a[href*="linkedin.com/"]');
  const strip = (u) => u.replace(/^https?:\/\/(www\.)?/, '');

  const go = (hash) => {
    const el = document.querySelector(hash);
    if (!el) return;
    el.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'start' });
    history.replaceState(null, '', hash);
  };

  const items = [
    ...SECTIONS.filter(([, hash]) => document.querySelector(hash)).map(([label, hash, hint, kw]) => ({
      group: 'Go to', label, hint, kw, run: () => go(hash),
    })),
    { group: 'Actions', label: 'Run SecureFlow simulated scan', kw: 'demo security trivy gitleaks', run: () => { go('#secureflow'); setTimeout(() => document.getElementById('sf-run')?.click(), prefersReducedMotion ? 0 : 700); } },
    email && { group: 'Actions', label: 'Copy email address', hint: email, kw: 'mail contact', run: async () => toast((await copyText(email)) ? 'Email copied' : 'Couldn’t copy. Please select it manually.') },
    email && { group: 'Actions', label: 'Write an email', hint: email, kw: 'mail contact hire', run: () => { window.location.href = `mailto:${email}`; } },
    github && { group: 'Links', label: 'GitHub', hint: strip(github), kw: 'code repositories', run: () => window.open(github, '_blank', 'noopener,noreferrer') },
    linkedin && { group: 'Links', label: 'LinkedIn', hint: 'linkedin.com/in/devarjun-bhardwaj', kw: 'profile network', run: () => window.open(linkedin, '_blank', 'noopener,noreferrer') },
    { group: 'Actions', label: 'Back to top', kw: 'start hero', run: () => go('#top') },
  ].filter(Boolean);

  // ----- markup -----
  const dlg = document.createElement('dialog');
  dlg.className = 'palette';
  dlg.setAttribute('aria-label', 'Command palette');

  const field = document.createElement('div');
  field.className = 'palette-field';
  const prompt = document.createElement('span');
  prompt.className = 'palette-prompt';
  prompt.setAttribute('aria-hidden', 'true');
  prompt.textContent = '>';
  const input = document.createElement('input');
  input.className = 'palette-input';
  input.type = 'text';
  input.placeholder = 'Search or jump to…';
  input.autocomplete = 'off';
  input.spellcheck = false;
  input.setAttribute('role', 'combobox');
  input.setAttribute('aria-label', 'Search sections and actions');
  input.setAttribute('aria-expanded', 'true');
  input.setAttribute('aria-controls', 'palette-list');
  input.setAttribute('aria-autocomplete', 'list');
  const esc = document.createElement('kbd');
  esc.textContent = 'Esc';
  field.append(prompt, input, esc);

  const list = document.createElement('ul');
  list.className = 'palette-list';
  list.id = 'palette-list';
  list.setAttribute('role', 'listbox');
  list.setAttribute('aria-label', 'Results');
  const empty = document.createElement('p');
  empty.className = 'palette-empty';
  empty.hidden = true;
  empty.textContent = 'No match. Try “projects” or “email”.';
  const live = document.createElement('p');
  live.className = 'sr-only';
  live.setAttribute('role', 'status');

  const foot = document.createElement('p');
  foot.className = 'palette-foot';
  [['↑ ↓', 'navigate'], ['Enter', 'run']].forEach(([k, t]) => {
    const s = document.createElement('span');
    const kbd = document.createElement('kbd');
    kbd.textContent = k;
    s.append(kbd, t);
    foot.append(s);
  });

  dlg.append(field, list, empty, live, foot);
  document.body.append(dlg);

  // ----- behaviour -----
  let results = items;
  let active = 0;
  let query = '';

  const rank = (it, terms) => {
    const label = it.label.toLowerCase();
    return label.startsWith(terms[0]) ? 0 : label.includes(terms[0]) ? 1 : 2;
  };

  function filter(q) {
    const terms = q.toLowerCase().split(/\s+/).filter(Boolean);
    if (!terms.length) return items;
    return items
      .filter((it) => {
        const hay = `${it.label} ${it.kw || ''} ${it.group}`.toLowerCase();
        return terms.every((t) => hay.includes(t));
      })
      .sort((a, b) => rank(a, terms) - rank(b, terms));
  }

  function setActive(i, scroll = true) {
    active = i;
    const options = list.querySelectorAll('[role="option"]');
    options.forEach((el, idx) => el.setAttribute('aria-selected', String(idx === i)));
    const el = options[i];
    input.setAttribute('aria-activedescendant', el ? el.id : '');
    if (scroll && el) el.scrollIntoView({ block: 'nearest' });
  }

  function render() {
    list.replaceChildren();
    let lastGroup = '';
    results.forEach((it, i) => {
      if (!query && it.group !== lastGroup) {
        lastGroup = it.group;
        const h = document.createElement('li');
        h.className = 'palette-group';
        h.setAttribute('role', 'presentation');
        h.textContent = it.group;
        list.append(h);
      }
      const li = document.createElement('li');
      li.id = `palette-opt-${i}`;
      li.className = 'palette-item';
      li.setAttribute('role', 'option');
      li.setAttribute('aria-selected', 'false');
      const name = document.createElement('span');
      name.textContent = it.label;
      li.append(name);
      if (it.hint) {
        const hint = document.createElement('span');
        hint.className = 'palette-hint';
        hint.textContent = it.hint;
        li.append(hint);
      }
      li.addEventListener('click', () => choose(i));
      li.addEventListener('pointermove', () => { if (active !== i) setActive(i, false); });
      list.append(li);
    });
    empty.hidden = results.length > 0;
    live.textContent = results.length ? `${results.length} result${results.length === 1 ? '' : 's'}` : 'No results';
    setActive(0, false);
  }

  function choose(i) {
    const it = results[i];
    if (!it) return;
    dlg.close();
    it.run();
  }

  function open() {
    if (dlg.open) return;
    input.value = '';
    query = '';
    results = items;
    render();
    dlg.showModal();
    input.focus();
  }

  input.addEventListener('input', () => {
    query = input.value.trim();
    results = filter(query);
    render();
  });

  input.addEventListener('keydown', (e) => {
    if (e.isComposing) return;
    const n = results.length;
    if (e.key === 'ArrowDown') { e.preventDefault(); if (n) setActive((active + 1) % n); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); if (n) setActive((active - 1 + n) % n); }
    else if (e.key === 'Home') { e.preventDefault(); setActive(0); }
    else if (e.key === 'End') { e.preventDefault(); if (n) setActive(n - 1); }
    else if (e.key === 'Enter') { e.preventDefault(); choose(active); }
  });

  dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); }); // click on the backdrop

  document.addEventListener('keydown', (e) => {
    const t = e.target;
    const typing = t instanceof Element && (/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) || t.isContentEditable);
    if ((e.ctrlKey || e.metaKey) && !e.altKey && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      if (dlg.open) dlg.close();
      else open();
    } else if (e.key === '/' && !typing && !e.ctrlKey && !e.metaKey && !e.altKey && !dlg.open) {
      e.preventDefault();
      open();
    }
  });

  if (trigger) {
    trigger.hidden = false;
    trigger.title = `Command palette (${isApple ? '⌘K' : 'Ctrl K'})`;
    trigger.addEventListener('click', open);
  }
}
