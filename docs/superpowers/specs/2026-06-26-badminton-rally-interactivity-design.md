# Badminton Rally Interactivity — Design

Date: 2026-06-26
Status: Approved (design phase)

## Goal

Make the personal site more interactive with ideas tied to badminton, building on
the badminton motifs that already exist (shuttlecock loader, Konami shuttlecock-rain
easter egg, Badminton hobby, Badminton Tracker project) rather than duplicating them.

Deliver **one polished interactive centerpiece** (a playable "Rally" toy) plus **two
small on-theme accents**. The CompEng hero (`HeroCircuit`) stays untouched — badminton
lives in the Hobbies section where it belongs.

## Scope

In scope:
- A playable drag-and-flick shuttlecock "Rally" toy on a mini court.
- Accent 1: shuttle micro-animation on hover of the Badminton hobby card.
- Accent 2: the Hobbies section header divider rendered as a faint dashed "net" line.

Out of scope (YAGNI):
- Any change to the hero / `HeroCircuit`.
- Multiplayer, leaderboards, backend, or persistence beyond a local best score.
- New routes/pages.

## Centerpiece — "Rally" panel

### Placement
A new panel inside the existing `#hobbies` section in `src/App.jsx`, positioned
**after the 3-card hobby grid and before the "On Repeat / Music" panel**. It reuses
the visual shell of the Music panel (`rounded-2xl border ... bg-[var(--color-pill)] p-6 md:p-8`)
for consistency, with an eyebrow label (e.g. `PLAY A RALLY`) and a short caption.

### Interaction
- A shuttlecock rests on the near side of the court.
- **Drag-and-flick** (pointer down on/near the shuttle, drag, release):
  - Drag direction sets the launch angle.
  - Drag length / release velocity sets power.
- On release the shuttle launches and flies under physics until it lands.
- A persistent on-screen **Serve** button performs a serve with a slight randomized
  aim/power. This is the accessible/keyboard floor; drag is the skill-expression path.
- After landing, a result is shown and the shuttle resets to the near side for the
  next serve.

### Physics (shuttlecock-accurate)
Shuttlecocks have very high aerodynamic drag, so they decelerate hard and drop
near-vertically — that signature shape is the point, not a lazy parabola.

- Model: 2D projectile with gravity + quadratic-ish air drag.
  `step(state, dt)`: `v += gravity*dt`; `v -= drag*|v|*v*dt`; `pos += v*dt`.
- Tunable constants (gravity, drag coefficient, launch scale) chosen so a normal
  flick produces a satisfying arc that clears the net and lands in-court.
- All physics live in a **pure module** `src/lib/shuttlePhysics.js` exporting pure
  functions (`createShuttle`/`launch`/`step` + a `classifyLanding` helper). Pure =
  deterministic and unit-testable with no canvas/DOM.

### Scoring
- Landing zones on the far court drive feedback:
  - In the back third with steep, fast descent → `SMASH!` (bonus).
  - Otherwise inside court bounds → `IN +1`.
  - Past the baseline / into the net / wide → `OUT` (rally resets).
- **Rally streak** increments on each successful (`IN`/`SMASH`) landing; resets on `OUT`.
- **Best streak** persisted in `localStorage` under a dedicated key
  (e.g. `rally-best`), mirroring the existing `theme` localStorage pattern.

### Rendering
- A single `<canvas>` (2D context), matching the approach already used by
  `HeroCircuit` (DPR-aware sizing, themed colors read from CSS variables).
- Court: accent-colored boundary + service lines, a dashed net across the middle.
- Shuttle: reuse the feather-skirt + cork SVG shape from `Loader` (drawn to canvas
  or rendered as a positioned SVG over the canvas — implementer's choice, keep one
  source of truth for the shape).
- Colors derived from `--color-accent` / `--color-border` / `--color-text-muted`
  so light/dark themes both work; re-read on `theme` prop change.

### Performance
- `requestAnimationFrame` runs **only while a shuttle is in flight**; the toy is
  idle (no rAF) at rest. This differs from `HeroCircuit`, which needs a permanent
  loop — the Rally toy must not.
- Pause/stop on `document.visibilitychange` (tab hidden).
- `dt` clamped after long frames / tab resume (same guard as `HeroCircuit`).
- `touch-action: none` on the canvas so a drag gesture does not scroll the page on
  mobile.

### Responsive / touch
- Pointer Events API unifies mouse + touch (single code path).
- Canvas sized responsively to its container; court geometry computed from canvas
  size so it scales cleanly at 375 / 768 / 1024 / 1440 px.
- Whole canvas is the drag surface, so touch targets are comfortably large.

### Reduced motion
- When `prefers-reduced-motion: reduce` (via existing `usePrefersReducedMotion`):
  - No flight animation and no rAF loop.
  - The court + score still render; **Serve / drag teleports the shuttle directly to
    its computed landing point** and shows the result. Still interactive, zero motion.

### Accessibility
- The interactive region has a descriptive `aria-label`.
- A visually-hidden `aria-live="polite"` region announces each result
  (e.g. "Shuttle landed in. Rally 3.").
- The **Serve** button is a real focusable `<button>` so keyboard users can play.
- Color is never the only signal — text labels (`IN`, `SMASH!`, `OUT`) accompany it.

## Accents

### Accent 1 — Badminton hobby card hover shuttle
- The Badminton hobby card (first card in the `#hobbies` grid) gains a small
  shuttlecock that spins / arcs on hover, layered on top of the existing
  grayscale→color + scale image transition. Pure CSS/transform where possible;
  respects reduced motion.

### Accent 2 — Dashed "net" divider
- The Hobbies section header divider (currently `h-[1px] ... bg-[var(--color-border)]`)
  becomes a faint dashed line evoking a badminton net, keeping the existing
  group-hover accent-color behavior. Scoped to the Hobbies header only so it reads
  as intentional theming, not site-wide clutter.

## Component / file plan
- `src/lib/shuttlePhysics.js` — new, pure physics + landing classification.
- `src/components/RallyCourt.jsx` — new, the playable toy (canvas, pointer, score,
  localStorage best, reduced-motion + a11y handling). Props: `{ theme }`.
- `src/App.jsx` — mount `<RallyCourt theme={theme} />` in the Hobbies section between
  the hobby grid and the Music panel; apply the dashed-net divider class to the
  Hobbies header.
- Badminton hobby card hover shuttle — small additions in `App.jsx` (hobby card
  markup) and/or `src/index.css` (keyframes), following existing animation patterns
  (`shuttle-bob`, `shuttle-fall`).
- `src/index.css` — any new keyframes for the accents, guarded by the existing
  `prefers-reduced-motion` block.

## Testing
- Unit tests for `src/lib/shuttlePhysics.js`: launch produces forward+upward motion;
  `step` decelerates horizontal velocity over time (drag); a steep fast back-court
  landing classifies as `SMASH`; an out-of-bounds / net hit classifies as `OUT`.
- Manual verification: drag-flick on desktop, touch-flick on mobile viewport, Serve
  button via keyboard, reduced-motion mode (no animation, result still shows), light
  + dark themes, best-streak persists across reload.

## Risks / mitigations
- **Physics feel** is subjective → constants are isolated/tunable in one module;
  expect a tuning pass during implementation.
- **Mobile scroll fighting the drag** → `touch-action: none` on the canvas.
- **Perf regressions** → rAF only during flight, paused when tab hidden.
- **Reduced-motion correctness** → explicit no-rAF path that still lets users play.
