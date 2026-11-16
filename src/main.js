import '@fontsource/space-grotesk/latin-400.css';
import '@fontsource/space-grotesk/latin-500.css';
import '@fontsource/space-grotesk/latin-600.css';
import '@fontsource/space-grotesk/latin-700.css';
import '@fontsource/ibm-plex-sans/latin-400.css';
import '@fontsource/ibm-plex-sans/latin-500.css';
import '@fontsource/ibm-plex-sans/latin-600.css';
import '@fontsource/jetbrains-mono/latin-400.css';
import '@fontsource/jetbrains-mono/latin-500.css';
import '@fontsource/jetbrains-mono/latin-600.css';
import './styles/main.css';
import { initNowBuilding } from './modules/now-building.js';
import { initContactForm, initCopyButtons } from './modules/contact.js';
import { initToast } from './modules/toast.js';
import { initStackExplorer } from './modules/stack-explorer.js';
import { initPalette } from './modules/palette.js';
import { initSecureflow } from './modules/secureflow.js';
import { initParallax } from './modules/parallax.js';
import { initCursorEmbers } from './modules/cursor-embers.js';
import { initLogos } from './modules/logos.js';
import { initIcons, initTitleSplit, initReveal, initCounters, initTilt, initActiveNav, initNavMenu, initIntro, initTyping, initToTop } from './modules/ui.js';

function safely(name, fn) {
  try {
    fn();
  } catch (err) {
    console.error(`[portfolio] ${name} failed:`, err);
  }
}

// Content and interaction first, so the page is fully usable even if a visual effect fails.
safely('intro', initIntro);
safely('logos', initLogos);
safely('icons', initIcons);
safely('title', initTitleSplit);
safely('typing', initTyping);
safely('nav menu', initNavMenu);
safely('active nav', initActiveNav);
safely('contact form', initContactForm);
safely('secureflow demo', initSecureflow);
safely('github stats', initNowBuilding);
safely('toast', initToast);
safely('copy buttons', initCopyButtons);
safely('stack explorer', initStackExplorer);
safely('command palette', initPalette);
safely('back to top', initToTop);
safely('reveal', initReveal);
safely('counters', initCounters);
safely('tilt and spotlight', initTilt);
safely('parallax', initParallax);
safely('cursor embers', initCursorEmbers);

// The WebGL backdrop is loaded last and lazily; three.js never blocks first paint.
import('./modules/atmosphere.js')
  .then((m) => safely('atmosphere', m.initAtmosphere))
  .catch((err) => console.error('[portfolio] atmosphere failed to load:', err));
