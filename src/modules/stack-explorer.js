import { ICON } from './icons.js';

const slug = (t) => t.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

/**
 * Select a tool in the tech stack to see which projects use it. Matching tags in the project cards light up,
 * and each project in the tray is a link that scrolls to it. Uses the same data-tech keys as the project tags.
 */
export function initStackExplorer() {
  const stack = document.getElementById('stack');
  const container = stack && stack.querySelector('.container');
  const flow = stack && stack.querySelector('.flow');
  if (!container || !flow) return;

  // tech key -> projects that use it
  const uses = new Map();
  document.querySelectorAll('#projects .feature, #projects .project').forEach((el) => {
    const heading = el.querySelector('h3');
    if (!heading) return;
    const name = heading.textContent.trim();
    el.id = el.id || `project-${slug(name)}`;
    const planned = el.dataset.status === 'planned';
    el.querySelectorAll('.tags li[data-tech]').forEach((li) => {
      const key = li.dataset.tech;
      if (!uses.has(key)) uses.set(key, []);
      const list = uses.get(key);
      if (!list.some((u) => u.el === el)) list.push({ name, el, planned });
    });
  });

  const tiles = [...stack.querySelectorAll('.tile')].filter((t) => {
    const logo = t.querySelector('.tile-logo');
    return logo && uses.has(logo.dataset.logo);
  });
  if (!tiles.length) return;

  const hint = document.createElement('p');
  hint.className = 'stack-hint';
  hint.textContent = 'Tools with a glowing dot are used in my projects. Select one to see where.';
  flow.before(hint);

  const live = document.createElement('p');
  live.className = 'sr-only';
  live.setAttribute('role', 'status');

  const tray = document.createElement('div');
  tray.className = 'stack-tray';
  tray.hidden = true;
  const body = document.createElement('p');
  body.className = 'tray-body';
  const close = document.createElement('button');
  close.type = 'button';
  close.className = 'tray-close';
  close.setAttribute('aria-label', 'Clear selection');
  close.innerHTML = ICON.close;
  tray.append(body, close);
  container.append(live, tray);

  let current = null;
  let lastButton = null;

  function clear(returnFocus) {
    if (!current) return;
    current = null;
    tiles.forEach((t) => {
      t.classList.remove('is-selected');
      t.querySelector('.tile-hit').setAttribute('aria-pressed', 'false');
    });
    document.querySelectorAll('#projects .tags li.is-match').forEach((li) => li.classList.remove('is-match'));
    tray.hidden = true;
    document.body.classList.remove('has-tray');
    live.textContent = '';
    if (returnFocus && lastButton) lastButton.focus();
  }

  function select(key, label, button) {
    current = key;
    lastButton = button;
    tiles.forEach((t) => {
      const on = t.dataset.use === key;
      t.classList.toggle('is-selected', on);
      t.querySelector('.tile-hit').setAttribute('aria-pressed', String(on));
    });
    document.querySelectorAll('#projects .tags li.is-match').forEach((li) => li.classList.remove('is-match'));
    document.querySelectorAll(`#projects .tags li[data-tech="${CSS.escape(key)}"]`).forEach((li) => li.classList.add('is-match'));

    const list = uses.get(key);
    const lead = document.createElement('strong');
    lead.textContent = `${label} is used in:`;
    body.replaceChildren(lead);
    list.forEach(({ name, el, planned }) => {
      const a = document.createElement('a');
      a.className = 'tray-chip';
      a.href = `#${el.id}`;
      a.textContent = name;
      if (planned) {
        const tag = document.createElement('em');
        tag.textContent = 'planned';
        a.append(tag);
      }
      a.addEventListener('click', () => {
        el.classList.remove('is-found');
        void el.offsetWidth; // restart the highlight if it is clicked twice
        el.classList.add('is-found');
      });
      body.append(a);
    });
    tray.hidden = false;
    document.body.classList.add('has-tray');
    live.textContent = `${label} is used in ${list.map((u) => u.name + (u.planned ? ' (planned)' : '')).join(', ')}.`;
  }

  tiles.forEach((tile) => {
    const key = tile.querySelector('.tile-logo').dataset.logo;
    const name = tile.querySelector('.tile-name').textContent.trim();
    tile.dataset.use = key;
    tile.classList.add('has-use');
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'tile-hit';
    btn.setAttribute('aria-pressed', 'false');
    btn.setAttribute('aria-label', `${name}: show where I’ve used it`);
    btn.addEventListener('click', () => (current === key ? clear(false) : select(key, name, btn)));
    tile.append(btn);
  });

  close.addEventListener('click', () => clear(true));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && current && !document.querySelector('dialog[open]')) clear(true);
  });
  document.addEventListener('animationend', (e) => e.target.classList?.remove('is-found'));
}
