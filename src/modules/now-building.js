const GITHUB_USER = 'devarjun345';
const CACHE_KEY = 'portfolio:github:v1';
const CACHE_TTL = 30 * 60 * 1000; // the public API allows 60 unauthenticated requests an hour per IP; campus networks share one
const TIMEOUT_MS = 6000;

function timeAgo(iso) {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (days < 1) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  return months < 12 ? `${months} mo ago` : `${Math.floor(months / 12)} yr ago`;
}

function readCache() {
  try {
    const c = JSON.parse(localStorage.getItem(CACHE_KEY));
    return c && typeof c.at === 'number' && c.data ? c : null;
  } catch {
    return null;
  }
}

function writeCache(data) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), data }));
  } catch {
    /* storage unavailable: the row still renders, it just isn't cached */
  }
}

function render({ repos, followers, last }) {
  document.getElementById('gh-repos').textContent = repos;
  document.getElementById('gh-followers').textContent = followers;
  if (last) document.getElementById('gh-last').textContent = `Last push: ${last.name}, ${timeAgo(last.pushedAt)}`;
  document.getElementById('now-github').hidden = false;
}

async function getJSON(url, signal) {
  const res = await fetch(url, { signal, headers: { Accept: 'application/vnd.github+json' } });
  if (!res.ok) throw new Error(`GitHub responded ${res.status}`);
  return res.json();
}

async function loadGithub() {
  if (!document.getElementById('now-github')) return;

  const cached = readCache();
  if (cached && Date.now() - cached.at < CACHE_TTL) {
    render(cached.data);
    return;
  }

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const base = `https://api.github.com/users/${GITHUB_USER}`;
    const [user, repoList] = await Promise.all([
      getJSON(base, ctrl.signal),
      getJSON(`${base}/repos?sort=pushed&per_page=1`, ctrl.signal).catch(() => []),
    ]);
    const [latest] = repoList;
    const data = {
      repos: user.public_repos,
      followers: user.followers,
      last: latest ? { name: latest.name, pushedAt: latest.pushed_at } : null,
    };
    writeCache(data);
    render(data);
  } catch (err) {
    if (cached) render(cached.data); // slightly old numbers beat an empty row
    else throw err;
  } finally {
    clearTimeout(timer);
  }
}

// Live data is a bonus: if GitHub is unreachable or rate-limited, the row simply stays hidden.
export function initNowBuilding() {
  loadGithub().catch(() => {});
}
