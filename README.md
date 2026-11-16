# Devarjun Bhardwaj — Portfolio

Static site built with Vite and vanilla JS, with a three.js backdrop (a tokamak fusion reactor that ignites as you scroll and releases a cloud network). Fonts (Space Grotesk, IBM Plex Sans, JetBrains Mono) are bundled locally.

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # outputs to dist/
npm run preview    # serve the production build locally
```

Opening `index.html` directly from disk will not work (ES modules need a server) — use the commands above.

## Structure

```
index.html              Page markup
public/                 Static files copied as-is (favicon; add resume.pdf here)
src/
  main.js               Entry point; starts each module in isolation
  styles/main.css       All styles
  lib/motion.js         prefers-reduced-motion helper
  lib/clipboard.js      Copy helper with a fallback
  data/logos.js         Inline brand logos (generated, see scripts/build-logos.mjs)
  modules/
    atmosphere.js       WebGL backdrop: tokamak plasma, coils, cloud network, datacenter grid, bloom (lazy-loaded)
    parallax.js         Chapter numeral parallax, timeline progress, scroll line
    logos.js            Injects logos into tiles, cards and tags
    ui.js               Icons, split titles, typing tagline, reveals, counters, spotlight and tilt, nav, back to top
    palette.js          Command palette: Ctrl/Cmd+K or "/" (native <dialog>), sections and actions
    stack-explorer.js   Select a tool in the stack to see which projects use it
    toast.js            Small status messages (copy confirmations)
    icons.js            Inline icons for the interactive layer
    cursor-embers.js    Spark trail that follows the mouse
    now-building.js     Live GitHub stats in the hero strip (cached 30 minutes)
    secureflow.js       SecureFlow simulated-scan demo (two seeded scenarios, expandable fixes)
    contact.js          Contact form (validation, counter, copy fallback) and copy buttons
scripts/
  build-logos.mjs       Rebuilds src/data/logos.js from simple-icons and iconify logos
docs/                   Design handoff spec, PRD and original design export (not shipped)
```

## Interactions

- **Command palette**: `Ctrl/Cmd + K`, `/`, or the search button in the header.
- **Stack explorer**: tools with a glowing dot are used in projects; select one to see which.
- **SecureFlow**: choose the Leaky or Fixed pull request, run the scan, open a finding for the fix.
- **Contact**: copy buttons beside email and phone; the form validates as you type and offers a copy fallback.
- **Reactor**: click empty space to pulse the plasma (mouse only).

## Deploy

`npm run build`, then upload `dist/` to Vercel, Netlify or GitHub Pages (the base path is relative, so sub-paths work).

## To do on your side

- Add `public/resume.pdf`, then add a Resume link (with the `download` attribute) in the header or hero.
- Contact form uses `mailto:`. For a hosted form (e.g. Resend/Formspree), change `src/modules/contact.js`.
