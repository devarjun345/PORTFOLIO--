import { prefersReducedMotion } from '../lib/motion.js';

const SPARKS = ['34,228,255', '139,123,255', '255,79,163', '255,138,61', '53,230,160'];

/** A trail of glowing embers that follows a mouse pointer. Skipped on touch and for reduced motion. */
export function initCursorEmbers() {
  if (prefersReducedMotion || !window.matchMedia('(pointer: fine)').matches) return;

  const canvas = document.getElementById('embers');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  canvas.hidden = true; // while no sparks are alive the full-screen blended layer is removed from the page entirely
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  let w = 0;
  let h = 0;
  const parts = [];
  let running = false;
  let last = 0;
  let lastX = -100;
  let lastY = -100;

  function resize() {
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function emit(x, y, n) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = 10 + Math.random() * 28;
      parts.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 22, life: 0, max: 0.55 + Math.random() * 0.6, size: 1 + Math.random() * 2.2, hot: Math.random() });
    }
    if (!running) {
      running = true;
      canvas.hidden = false;
      last = performance.now();
      requestAnimationFrame(tick);
    }
  }

  function tick(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    ctx.clearRect(0, 0, w, h);
    ctx.globalCompositeOperation = 'lighter';
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i];
      p.life += dt;
      if (p.life >= p.max) { parts.splice(i, 1); continue; }
      p.vy -= 30 * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      const k = 1 - p.life / p.max;
      const r = p.size * (0.6 + k) * 3;
      const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r);
      const c = SPARKS[Math.floor(p.hot * SPARKS.length) % SPARKS.length];
      g.addColorStop(0, `rgba(${c},${0.9 * k})`);
      g.addColorStop(1, `rgba(${c},0)`);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
      ctx.fill();
    }
    if (parts.length) requestAnimationFrame(tick);
    else { running = false; ctx.clearRect(0, 0, w, h); canvas.hidden = true; }
  }

  resize();
  window.addEventListener('resize', resize);
  window.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;
    if (dx * dx + dy * dy < 140) return;
    lastX = e.clientX;
    lastY = e.clientY;
    emit(e.clientX, e.clientY, 2);
  }, { passive: true });
  window.addEventListener('pointerdown', (e) => { if (e.pointerType === 'mouse') emit(e.clientX, e.clientY, 14); }, { passive: true });
}
