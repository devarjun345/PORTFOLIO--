let el = null;
let timer = 0;

/** Creates the live region up front so the first message is announced to screen readers too. */
export function initToast() {
  if (el) return;
  el = document.createElement('div');
  el.className = 'toast';
  el.setAttribute('role', 'status');
  el.setAttribute('aria-live', 'polite');
  document.body.append(el);
}

export function toast(message) {
  initToast();
  clearTimeout(timer);
  el.classList.remove('show');
  el.textContent = '';
  // next frame, so a repeated message is announced again and the transition restarts
  requestAnimationFrame(() => {
    el.textContent = message;
    el.classList.add('show');
  });
  timer = setTimeout(() => el.classList.remove('show'), 2400);
}
