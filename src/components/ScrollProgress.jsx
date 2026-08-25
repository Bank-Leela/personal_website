// Reading-position bar pinned under the top edge of the viewport.
//
// Driven entirely by a CSS scroll-driven animation (`animation-timeline:
// scroll(root block)` in index.css), so there is no scroll listener, no React
// state, and no per-frame main-thread work. Browsers that lack scroll-timeline
// support hide the bar outright, which is the right degradation for a purely
// decorative indicator.
export default function ScrollProgress() {
  return (
    <div
      aria-hidden="true"
      className="scroll-progress pointer-events-none fixed left-0 top-0 z-[60] h-0.5 w-full origin-left bg-[var(--color-accent)]"
    />
  );
}
