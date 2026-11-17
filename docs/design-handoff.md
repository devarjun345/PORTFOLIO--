# Handoff Spec: Devarjun Bhardwaj Portfolio ("Fusion Core" edition)

Stack: Vite, vanilla JS, one CSS file (`src/styles/main.css`), three.js (WebGL, lazy-loaded) for the backdrop. All values below are tokens in `:root`. Change a token, not a hard-coded value.

## Overview

A single-page portfolio for recruiters, engineers and student-community peers. Page order: hero, 01 About, 02 Leadership, 03 Projects (with the SecureFlow simulated-scan demo), 04 Tech stack, 05 Achievements, 06 Certificates, 07 Contact.

**Design direction.** A fusion reactor feeding the cloud, in the language of DevOps. Deep space-black, a full colour spectrum (cyan, violet, pink, orange, green, blue, coral), a datacenter grid on the horizon, terminals and pipelines. The tech stack is drawn the way a cloud engineer would: first the DevOps lifecycle, then an architecture diagram with dashed group boxes and animated packets.

**The backdrop tells one story.** A tokamak (a ring of magnetic coils with plasma spiralling along helical field lines) sits on the right. Scrolling *ignites* it: the plasma tightens and burns brighter. Then its energy escapes the core as a glowing *cloud network* of nodes, links and moving data packets that spreads behind the rest of the page. Fusion to cloud.

**Removed in this version:** the Greek-key dividers and wave footer, the film-style serif italics, the atom backdrop, the portrait photo, the archery game, all gold and orange-fire styling, all Devanagari text.

## Colour system (multi-colour update)

The first version used one accent (cyan) everywhere, which read as monotonous. Colour is now a system: **every section has its own accent**, the way service categories are colour-coded in a cloud console. A section sets three variables (`--accent`, `--accent-soft`, `--accent-rgb`) and everything inside follows them: title underline, section number, card top edges and hover glow, pills, timeline, tags, buttons.

| Section | Accent | Hex |
|---------|--------|-----|
| Hero | Violet | #8b7bff |
| 01 About | Cyan | #22e4ff |
| 02 Leadership | Violet | #8b7bff |
| 03 Projects | Orange | #ff8a3d |
| 04 Tech stack | Green | #35e6a0 |
| 05 Achievements | Pink | #ff4fa3 |
| 06 Certificates | Blue | #4d8dff |
| 07 Contact | Coral | #ff5d6c |

Palette tokens: `--c-cyan`, `--c-violet`, `--c-pink`, `--c-orange`, `--c-green`, `--c-blue`, `--c-coral`. Each has a lighter "soft" companion for small text.

**Live accent.** An observer in `ui.js` copies the accent of the section in view onto `<html>`, so the header button, nav underline and scroll glow change colour as you read. It also sends a `section:tint` event; the WebGL backdrop eases its haze, grid, horizon glow and network links toward that colour.

**Items inside a section get their own colour too:**

- Timeline roles: violet, cyan, pink, green, orange, blue.
- Stat cards: orange, pink, cyan, green (numbers use a white-to-accent gradient).
- Project cards: coral (Rakshak), pink (MindSet X), green (Resource Exchange), violet (AI Disease Detection). DevRank is orange and SecureFlow is blue.
- Achievement cards: orange, cyan, violet, pink, blue, green, coral. The result pill takes the card colour.
- Certificate cards: blue, cyan, violet, orange, green, pink.
- Architecture tiers: Client cyan, API violet, Data and AI green, Delivery pink, Cloud orange.
- DevOps lifecycle steps: cyan, blue, violet, pink, coral, orange, green, cyan (a spectrum across the pipeline).

**Always multi-colour:** the hero name (a hue ramp across the letters), the hero bullets, the primary hero button (cyan to violet to pink), the scroll progress line, the trace dividers, the feature-card border (a slowly turning spectrum conic gradient), cursor sparks, and all logos (brand colours at rest; very dark brand colours become white).

**Backdrop.** The plasma ring runs through a five-colour palette (cyan, violet, pink, orange, green) around its circumference and slowly cycles. Network nodes, packets and dust use the same palette. Two extra haze blobs (a pink one low left, a drifting palette one high) keep the background from being a single hue.

**Soft colour washes.** Each section has two very low-opacity radial gradients in its accent (top right, bottom left; mirrored on 02, 04 and 06). They are plain gradients, so they cost almost nothing.

**Contrast.** All accents pass AA on the page background (violet 6.1, blue 6.3, pink 6.6, coral 6.7, orange 8.6, green 12.4, cyan 13.1). Dark button text on every accent passes (lowest 6.1). Small coloured text uses the "soft" companions (at least 9.1 on cards).

**Reduced motion.** The spectrum border stops turning and the backdrop draws a still frame; colours themselves stay.

## Legibility and dark theme (readability update)

Problem found on real GPUs: the WebGL haze, bloom and anamorphic streak rendered much brighter than expected, so light body text sat on a pale blue wash and was unreadable (worst on phones). The fix is layered so no single layer can break legibility again:

1. **Quieter scene.** Haze, horizon glow, grid, network links, bloom and the light streak were all turned down (haze to roughly a third, bloom threshold raised so only real highlights glow). The reactor ring, coils and core were given their glow back, since they sit away from the text.
2. **Dimming.** The scene is dimmed after the hero (down to 0.57 on desktop) and, on screens under 768px, it is dimmer and fainter overall.
3. **Scrim.** A fixed `.scrim` layer sits between the canvas and the page: 34 to 58% black on desktop, 42 to 70% on phones. It guarantees a dark base whatever the GPU draws.
4. **Brighter text.** `--bone-dim` moved from #a9b4c9 to #cdd6e8 and `--muted` from #7886a0 to #9aa7c0. Hero lead, intros and About copy use #d6deee. Text that sits directly on the backdrop also gets a soft dark halo (`text-shadow`), and section titles and the hero name get a dark drop shadow.
5. **Solid surfaces.** Cards, tiles, lifecycle steps, form fields and the terminal tagline are 88 to 95% opaque.
6. **Quieter colour washes.** Section washes are about 7% opacity and fade out at section edges (no seam).

**Measured result** (rendered page, text hidden and the background behind it sampled; contrast of the text colour against the brightest 10% of pixels behind it): desktop 11.0 to 12.7, phone 11.0 to 12.7. WCAG AA needs 4.5. Isolated bright particles can locally dip lower; they are a few pixels wide.

If you want the scene brighter again, raise the scrim's transparency in `.scrim` first, then the `uDim` values in `src/modules/atmosphere.js`. Re-check contrast after any change.

## Layout

| Item | Spec |
|------|------|
| Container | `max-width: 1120px`, centered, padding `--gutter` |
| Section rhythm | `--section-y` padding; a pipeline-trace divider between sections; a large outlined number (01 to 07) behind each title |
| Header | Sticky, 4rem, blurred space-black, 1px rule. Inline nav from 1080px, dropdown below. A search icon opens the command palette. The "Get in touch" button hides below 520px |
| Hero | Single text column (max-width 46rem); the reactor in the backdrop fills the right side on wide screens |
| About | Two columns from 900px: copy and four stat cards, then three fact cards |
| Leadership | Single-column timeline of cards, max-width 46rem |
| Projects | DevRank feature card, 2-column project card grid from 800px, SecureFlow card |
| Tech stack | DevOps lifecycle (8 steps), then five architecture tiers, then a toolbox grid |
| Achievements, certificates | Auto-fill card grids |
| Contact | Two columns from 900px: link cards and the form card |

## Design Tokens Used

### Colour

| Token | Value | Usage |
|-------|-------|-------|
| `--ink` | #05070d | Page background |
| `--ink-2`, `--ink-3`, `--steel` | #0a0f1a, #101827, #1a2540 | Surfaces and rules |
| `--bone` | #e9eef8 | Headings, primary text |
| `--bone-dim` | #a9b4c9 | Body text |
| `--muted` | #7886a0 | Captions, metadata |
| `--ion` | #22e4ff | Primary accent: buttons, prompts, active states, packets |
| `--ion-soft` | #7df0ff | Dates, issuer labels, hover |
| `--plasma` | #7c6cf6 | Secondary accent: tier labels, learning badges, borders |
| `--plasma-light` | #b9afff | Fact titles, kicker, focus ring |
| `--warm` | #ff7a2f | The Cloud tier (AWS-style orange) and high severity |
| `--line`, `--line-strong` | rgba(190,210,255,.11), rgba(190,210,255,.24) | Hairlines, card borders |

Measured contrast on `--ink` (AA needs 4.5:1): bone 17.3, ion-soft 15.1, ion 13.1, plasma-light 10.2, bone-dim 9.6, warm 7.7, muted 5.5, plasma 5.1. On card surfaces (#0d1424): muted 5.0, plasma 4.7, all others higher. Button text (ink on ion) 13.1; tier label (dark on plasma) 4.8, (dark on warm) 7.2.

### Typography

| Token | Value | Usage |
|-------|-------|-------|
| `--font-display` | Space Grotesk 400 to 700 | Name, titles, card headings, lead text |
| `--font-label` | JetBrains Mono 400 to 600 | Nav, buttons, kickers, pills, dates, tier labels, terminal tagline |
| `--font-body` | IBM Plex Sans | Body and UI |

Hero name is clamp(2.5rem, 7.6vw, 5.9rem), uppercase, with a faint cyan and violet chromatic edge. Small uppercase labels use the mono face with tighter tracking. Fonts are self-hosted (`@fontsource`, Latin subsets); no external font request.

### Spacing, shape, easing

`--space-1` to `--space-8`: 4, 8, 12, 16, 24, 32, 48, 72 px. Card radius 14px (feature card 18px, buttons 4px). `--ease-out`: cubic-bezier(0.22, 1, 0.36, 1).

## Components

| Component | Notes |
|-----------|-------|
| Button | Mono uppercase. Solid is ion with ink text; outline is a hairline that turns cyan on hover |
| Terminal tagline | Hero line in a dark box with a cyan left edge: `~/dev $` prompt, the tagline types out, a block caret blinks |
| Card `.card` | Near-opaque panel (no backdrop blur, for scroll performance), hairline border, a light that follows the pointer, lifts 3px on hover with a cyan border. Used for stats, facts, roles, projects, achievements, certificates, contact links and the form |
| Programs marquee | Slow scrolling logo row (Microsoft, GeeksforGeeks, Google, Kaggle, AWS, GitHub, Tata, Unstop). Pauses on hover |
| Stat card | Number counts up when scrolled into view |
| Timeline | Cards on a vertical line. The line fills as you scroll; each dot ignites when reached |
| Logo | Inline SVG from `src/data/logos.js`. Monochrome at rest, brand colour on hover. Missing logos fall back to a monogram |
| DevOps lifecycle `.lifecycle` | Eight steps: Plan, Code, Build, Test, Release, Deploy, Operate, Monitor, each with an icon and the tools used there. A cyan glow travels through the steps in a 9.6s loop |
| Architecture flow | Five dashed group boxes (Client, API, Data and AI, Delivery in plasma; Cloud in warm orange) with corner labels. Tiles show logo and name; "learning" badge sits under the name. Animated packets travel between tiers (horizontal on desktop, vertical below 1100px) |
| Trace divider `.trace` | A hairline with a centre diamond; a cyan pulse runs along it every 7s |
| Achievement card | Result pill (1st place solid cyan, runner-up plasma outline, others neutral), title, host, year |
| Certificate card | Issuer logo and name, title, date |
| SecureFlow demo | Six pipeline nodes, console, findings list. Seeded data and a dummy credential, labelled as a simulation |

## States and Interactions

| Element | Behavior |
|---------|----------|
| Nav link | Hover brightens; active section shows a cyan underline |
| Nav toggle | Bars morph to a cross; `aria-expanded` mirrors state; closes on link click, Escape and outside click |
| Card, tile | Hover: lift, cyan border, spotlight, logo gains brand colour |
| Focus-visible | 2px light-violet outline, 3px offset |
| Disabled button | 50% opacity, `not-allowed` ("Live demo coming soon") |
| Form field | Hover lightens border; focus shows a violet border and glow |
| Contact form | Invalid: native bubble plus a visible error line. Valid: opens a pre-filled email, shows success, resets |
| SecureFlow button | Idle, "Scanning..." (disabled), "Run again" |
| GitHub row (hero strip) | Hidden until the public API answers; stays hidden on failure |

## Interactive layer

| Feature | Behavior |
|---------|----------|
| Command palette | `Ctrl/Cmd+K`, `/` or the header search icon. Native `<dialog>`: focus trap, Esc and inert background. Arrow keys, Enter, filter by typing. Sections, SecureFlow scan, copy or write email, GitHub, LinkedIn, back to top |
| Stack explorer | Tiles whose tech key matches a project tag get a glowing dot and become buttons. Selecting one lights the matching tags in the project cards and opens a sticky tray of project links. Esc or the close button clears it. SecureFlow is labelled "planned" |
| SecureFlow | Leaky PR (1 critical, 1 high, merge blocked) or Fixed PR (clean, merge allowed). Findings are disclosures with a "How to fix" note |
| Copy buttons | Email and phone cards, with a toast |
| Contact form | Inline field errors, live character count, and after submit a "Copy message" and "Open email again" fallback |
| Back to top | Appears after the hero. Moves above the stack tray when it is open |
| Reactor pulse | Mouse click on non-interactive space adds a plasma pulse |

## Responsive Behavior

| Breakpoint | Changes |
|------------|---------|
| 1100px and up | Lifecycle in one row of 8; architecture tiers in one row with horizontal connectors |
| 1080px and up | Inline nav; below it a dropdown |
| 900px and up | Two-column About, Contact, DevRank card; "now" strip becomes a row |
| 800px and up | Project cards in two columns |
| 640px and up | Lifecycle 4 per row; tier tiles in two columns; SecureFlow pipeline 3 columns |
| Below 520px | Header button hidden |
| Below 768px, or 4 GB device memory or less | WebGL lite mode: 3,500 plasma particles instead of 9,000, fewer nodes and dust, lower pixel ratio; the reactor is smaller and sits at the top |

## Animation / Motion

| Element | Trigger | Animation | Duration |
|---------|---------|-----------|----------|
| Opening | Page load | Black curtain parts, then a cyan-white plasma flash fades | 1.5s plus 1.7s |
| Hero name | After the curtain | Letters rise from a tilt with blur, staggered 70ms | 1.2s |
| Terminal tagline | After the name | Types out at 38ms per character | about 1.7s |
| Hero text | After the name | Fade and rise, staggered | 1s |
| Reactor | Continuous | Plasma spirals along field lines; coils glow; slow rotation; pointer parallax | Per frame |
| Reactor | Scroll | Ignition (plasma tightens, brighter), then core releases a network of nodes, links and packets | Eased |
| Horizon grid | Continuous | Datacenter grid scrolls toward the viewer | Per frame |
| Post effects | Always | Bloom, anamorphic streak, chromatic aberration, vignette, film grain; the scene dims after the hero so text stays readable | n/a |
| Cursor | Mouse move or click (fine pointers) | Cyan and violet spark trail | 0.5 to 1.1s each |
| Section titles | Scroll into view | Letters rise with blur; words never break across lines | 1s, staggered 45ms |
| Section numbers | Scroll | Drift at 12% of scroll speed | Per frame |
| Cards, tiles, stats | Scroll into view | Fade, rise and de-blur, staggered | 0.95s |
| Stat numbers | Scroll into view | Count up | 1.4s |
| Timeline | Scroll | Line fills, dots ignite | Per frame |
| Lifecycle | Continuous | Glow passes through each step | 9.6s loop |
| Flow packets, trace pulse, marquee | Continuous | Slow loops | 2.2s to 40s |

**Reduced motion.** With `prefers-reduced-motion: reduce`: the curtain is removed, all CSS animation stops, the tagline appears fully typed, titles and cards appear immediately, counters and cursor sparks are off, and the backdrop draws a still frame that updates on scroll.

## Performance and fallbacks

- three.js (about 126 KB gzipped) loads lazily after the page is interactive, so content never waits for it.
- Adaptive quality: if the first 90 frames average slower than 34ms, bloom turns off, the pixel ratio drops to 1 and particle counts fall to 40%.
- Time-based easing means slow devices settle at the same speed.
- No WebGL: a CSS violet and cyan glow replaces the backdrop; everything else works.
- Pixel ratio is capped at 1.6 (1.25 in lite mode). Rendering pauses when the tab is hidden.
- Logos are inline SVG (about 55 KB before gzip) generated by `scripts/build-logos.mjs`.

## Edge Cases

- **Missing logo:** the tile shows a monogram ("IN" for Infotact Solutions, "SQL"). No broken images.
- **Missing year on an achievement:** the year label is absent.
- **"Monitor" step:** it says "on the roadmap" because no monitoring tool is listed in your skills yet. Edit it in `index.html` once you have one.
- **GitHub API rate limit (60 per hour per IP):** the live stats row stays hidden.
- **No JavaScript:** content and anchors remain readable; logos, the backdrop, the typing effect, the demo and the nav toggle do not work.
- **Touch devices:** no cursor sparks, no tilt or spotlight.
- **Long titles:** card titles wrap; nothing truncates.

## Accessibility Notes

- **Focus order:** skip link, brand, nav, "Get in touch", then content in source order.
- **Landmarks and headings:** `header`, `nav` (labelled), `main`, `footer`; one `h1`, `h2` per section, `h3` per card.
- **Split titles:** words and letters are `aria-hidden`; the element keeps an `aria-label` with the full text.
- **Terminal tagline:** the full sentence is in the HTML; the prompt and caret are `aria-hidden`.
- **Decorative layers** (backdrop, spark canvas, curtain, section numbers, trace dividers) are hidden from assistive technology.
- **Lifecycle and architecture:** labelled groups; each step and tile has a visible text name. "learning" is stated in text, not colour alone.
- **SecureFlow demo:** visual log is `aria-hidden`; a status line announces the result; severity always has a text label.
- **Form:** visible labels, status in a `role="status"` region.

## Content Notes for Owner

- Logos belong to their owners and are used only to show tools, programs and certifications you actually use or hold.
- There is no Resume button until `public/resume.pdf` exists.
- Rakshak has no link because the profile URL in the original file did not match your GitHub username.
