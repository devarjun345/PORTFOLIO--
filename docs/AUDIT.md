# Audit log

## Fixed
- Seven sections had `aria-labelledby` pointing at heading ids that did not exist; the headings now have them.
- Nav highlight stayed on the last section after scrolling back to the top; the hero is now observed too.
- With reduced motion the leadership timeline never filled; it is now shown complete.
- Hero tagline box grew from 48px to 70px while typing on 360px phones, pushing the page; height is locked while typing.
- Chapter-numeral parallax measured elements after its own transform had moved them (feedback), and forced layout several times per scroll frame; it now measures once and does arithmetic per frame.
- "learning" badges (Azure, AWS, Docker) were mis-placed in the grid; Azure's overflowed its tile by about 41px. Tile tracks fixed.
- SecureFlow panel tilted in 3D under the pointer while hosting a button; tilt removed there.
- Escape on the mobile menu now returns focus to its toggle.
- GitHub stats: 30 minute cache, 6s timeout, stale numbers kept if the API is rate limited.
- Contact form was reset immediately after opening `mailto:`, losing the draft if no mail app opened; a copy fallback is kept.

## Smoothness
- 38 elements used `backdrop-filter` over the live WebGL canvas; now 1 (the header).
- 12 CSS animations moved layout properties (`left`) every frame; now transforms.
- Hover lifts only apply where hover exists (no stuck state after a tap on phones).
- Large panels no longer animate a blur filter on reveal.
- Spark canvas is removed from the page while idle (it used `mix-blend-mode` over the full viewport).
- Pointer spotlight uses one delegated listener and one write per frame.
- Mobile: address-bar resizes no longer rebuild the bloom render targets. (atmosphere.js, not run through a real build here; see notes.)

## Still to do on your side
- Add `public/resume.pdf` and a Resume link.
- Set `og:image` and `og:url` to absolute URLs once the domain is known.
- Your phone number and email are public in the HTML (scrapable). Consider removing the phone number.
- Education says "Dewan VS Institute of Engineering and Technology"; Technophilia says "Dewan VS Group of Institutions". Check both are intended.


## Colour update

- Added a per-section colour system (see `docs/design-handoff.md`, "Colour system"). The live accent is set on `<html>` by `initActiveNav` and mirrored into the WebGL backdrop through the `section:tint` event.
- Fixed a race: the lazy-loaded backdrop could miss the first `section:tint` event, so it now reads the current `--accent-rgb` when it starts.
- Verified in a browser: WebGL scene compiles with no shader errors, every section shows its own accent, reveals complete, no horizontal scroll at 390px, reduced motion shows all content.


## Readability update

- Text and backdrop had become the same brightness on real GPUs (reported on laptop and phone). Fixed with a quieter scene, a `.scrim` layer, brighter text tokens, text halos and near-opaque surfaces. See `docs/design-handoff.md`, "Legibility and dark theme".
- Measured contrast of body text on the rendered page: 11.0 to 12.7 on desktop and on a 390px phone viewport.
- Kept the deploy files from the uploaded project (`.git`, the Google Search Console verification file and `sitemap.xml`) untouched.
