// Tiny inline icons for the interactive layer (static strings, so safe to assign with innerHTML).
const icon = (paths) =>
  `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${paths}</svg>`;

export const ICON = {
  copy: icon('<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/>'),
  check: icon('<path d="m5 12.5 4.5 4.5L19 7.5"/>'),
  up: icon('<path d="M12 19V5M5 12l7-7 7 7"/>'),
  close: icon('<path d="M6 6l12 12M18 6 6 18"/>'),
};
