import { prefersReducedMotion } from '../lib/motion.js';

// Seeded demo data. The credential is a dummy value and is shown pre-redacted, mirroring SecureFlow's redaction rule.
// Two pull requests to choose from: the original with a leaked key and an old dependency, and the same repo after the fixes.
const SHARED_START = [
  { key: 'verify', lines: ['> HMAC-SHA256 signature verified against raw body  [OK]', '> delivery-id not seen before: scan accepted  [OK]'] },
  { key: 'queue', lines: ['> scan record created, status=queued', '> celery task dispatched via redis broker'] },
];

const SCENARIOS = {
  leaky: {
    stages: [
      { key: 'webhook', lines: ['> GitHub event received: pull_request.synchronize', '> repo=demo/shop-api  commit=3f9c2ab (immutable SHA)'] },
      ...SHARED_START,
      { key: 'scan', lines: ['> worker: non-root, no network, temp workspace mounted', '> trivy: scanning package-lock.json ... 1 vulnerable dependency', '> gitleaks: scanning snapshot ... 1 likely credential'] },
      { key: 'normalize', lines: ['> secret value redacted before storage', '> fingerprints computed, duplicates merged'] },
      { key: 'report', lines: ['> temp workspace deleted  [OK]', '> check run published: 2 findings, merge blocked'] },
    ],
    findings: [
      {
        sev: 'critical', cat: 'Secret', title: 'AWS access key in config/dev.env:12',
        meta: 'rule aws-access-token · evidence AKIA•••••••••••• (redacted)',
        fix: 'Revoke and rotate the key in AWS IAM, remove it from the repository history, and load it from a secret manager or CI secret instead.',
      },
      {
        sev: 'high', cat: 'Dependency', title: 'lodash 4.17.15 · fixed in 4.17.21',
        meta: 'CVE-2021-23337 · upgrade to a fixed version',
        fix: 'Upgrade lodash to 4.17.21 or later and commit the updated lockfile.',
      },
    ],
    counts: { critical: 1, high: 1, medium: 0 },
    blocked: true,
    verdict: 'Merge blocked',
    summary: 'Simulated scan complete: 1 critical and 1 high finding. Merge blocked.',
  },
  fixed: {
    stages: [
      { key: 'webhook', lines: ['> GitHub event received: pull_request.synchronize', '> repo=demo/shop-api  commit=b71e04d (immutable SHA)'] },
      ...SHARED_START,
      { key: 'scan', lines: ['> worker: non-root, no network, temp workspace mounted', '> trivy: scanning package-lock.json ... 0 vulnerable dependencies', '> gitleaks: scanning snapshot ... no credentials found'] },
      { key: 'normalize', lines: ['> nothing to redact, no findings to merge'] },
      { key: 'report', lines: ['> temp workspace deleted  [OK]', '> check run published: 0 findings, merge allowed'] },
    ],
    findings: [],
    counts: { critical: 0, high: 0, medium: 0 },
    blocked: false,
    verdict: 'Merge allowed',
    summary: 'Simulated scan complete: no findings. Merge allowed.',
  },
};

const LINE_MS = 320;
const STAGE_MS = 380;
const wait = (ms) => new Promise((r) => setTimeout(r, prefersReducedMotion ? 0 : ms));

function addLine(log, text) {
  const row = document.createElement('div');
  row.textContent = text;
  log.append(row);
  log.scrollTop = log.scrollHeight;
}

function count(el, to) {
  if (prefersReducedMotion || to === 0) {
    el.textContent = to;
    return;
  }
  let n = 0;
  const id = setInterval(() => {
    el.textContent = ++n;
    if (n >= to) clearInterval(id);
  }, 120);
}

function renderFindings(list, findings) {
  if (!findings.length) {
    const li = document.createElement('li');
    li.className = 'sf-finding sf-none';
    li.textContent = 'No findings. The check run passed.';
    list.replaceChildren(li);
    return;
  }
  list.replaceChildren(
    ...findings.map((f) => {
      const li = document.createElement('li');
      li.className = 'sf-finding';
      const details = document.createElement('details');
      const summary = document.createElement('summary');

      const badge = document.createElement('span');
      badge.className = `sf-sev sev-${f.sev}`;
      badge.textContent = f.sev.toUpperCase();
      const body = document.createElement('div');
      const title = document.createElement('strong');
      title.textContent = `${f.cat}: ${f.title}`;
      const meta = document.createElement('span');
      meta.className = 'sf-meta';
      meta.textContent = f.meta;
      body.append(title, meta);
      summary.append(badge, body);

      const fix = document.createElement('p');
      fix.className = 'sf-fix';
      const label = document.createElement('strong');
      label.textContent = 'How to fix';
      fix.append(label, f.fix);

      details.append(summary, fix);
      li.append(details);
      return li;
    }),
  );
}

export function initSecureflow() {
  const btn = document.getElementById('sf-run');
  const label = document.getElementById('sf-run-label');
  const log = document.getElementById('sf-log');
  const result = document.getElementById('sf-result');
  const status = document.getElementById('sf-status');
  const verdict = document.getElementById('sf-verdict');
  const chips = [...document.querySelectorAll('.sf-chip')];
  const nodes = [...document.querySelectorAll('.sf-node')];
  if (!btn || !log || !result) return;

  const idleMarkup = log.innerHTML;
  let scenario = 'leaky';
  let running = false;

  function reset() {
    log.innerHTML = idleMarkup;
    result.hidden = true;
    status.textContent = '';
    label.textContent = 'Run simulated scan';
    nodes.forEach((n) => n.classList.remove('is-active', 'is-done'));
  }

  chips.forEach((chip) => {
    chip.addEventListener('click', () => {
      if (running || chip.dataset.scenario === scenario) return;
      scenario = chip.dataset.scenario;
      chips.forEach((c) => c.setAttribute('aria-pressed', String(c === chip)));
      reset();
    });
  });

  btn.addEventListener('click', async () => {
    if (running) return;
    running = true;
    btn.disabled = true;
    chips.forEach((c) => (c.disabled = true));
    label.textContent = 'Scanning…';
    log.replaceChildren();
    result.hidden = true;
    status.textContent = '';
    ['critical', 'high', 'medium'].forEach((s) => (document.getElementById(`sf-c-${s}`).textContent = '0'));
    nodes.forEach((n) => n.classList.remove('is-active', 'is-done'));

    const run = SCENARIOS[scenario];
    for (const stage of run.stages) {
      const node = nodes.find((n) => n.dataset.stage === stage.key);
      node?.classList.add('is-active');
      for (const line of stage.lines) {
        addLine(log, line);
        await wait(LINE_MS);
      }
      node?.classList.replace('is-active', 'is-done');
      await wait(STAGE_MS);
    }

    renderFindings(document.getElementById('sf-findings'), run.findings);
    verdict.textContent = run.verdict;
    verdict.classList.toggle('is-pass', !run.blocked);
    result.hidden = false;
    Object.entries(run.counts).forEach(([sev, n]) => count(document.getElementById(`sf-c-${sev}`), n));
    status.textContent = run.summary;

    label.textContent = 'Run again';
    btn.disabled = false;
    chips.forEach((c) => (c.disabled = false));
    running = false;
  });
}
