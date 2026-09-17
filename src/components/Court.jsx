/**
 * Badminton court markings behind the page.
 *
 * The proportions are chosen to sit well on a screen rather than to match a
 * real court: a true 13.4 x 6.1 court stretched to a browser window is a
 * letterbox strip with dead space above and below it. So the viewBox is a
 * plain 100 x 100 and `preserveAspectRatio="none"` lets the whole thing
 * stretch edge to edge, which means every coordinate below reads as a
 * percentage of the viewport and the layout works at any window shape without
 * a second orientation.
 *
 * Stretching a viewBox would normally distort the stroke along with it, hence
 * `vector-effect: non-scaling-stroke` (applied in the stylesheet), which keeps
 * every line the same hairline weight however wide the window gets.
 */
export default function Court() {
  return (
    <svg
      className="court pointer-events-none fixed inset-0 z-0 h-full w-full"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
    >
      <g fill="none" stroke="var(--court)" strokeWidth="3.5">
        {/* Outer boundary: doubles sidelines and back boundary lines. */}
        <rect x="3" y="4" width="94" height="92" />

        {/* Singles sidelines. These run the full length of the court, end to
            end, rather than stopping at the service courts. */}
        <line x1="3" y1="11" x2="97" y2="11" />
        <line x1="3" y1="89" x2="97" y2="89" />

        {/* Long service lines for doubles, set in from each back boundary. */}
        <line x1="10" y1="4" x2="10" y2="96" />
        <line x1="90" y1="4" x2="90" y2="96" />

        {/* Short service lines, either side of the net. */}
        <line x1="36" y1="4" x2="36" y2="96" />
        <line x1="64" y1="4" x2="64" y2="96" />

        {/* Centre line, splitting the service courts on each half only. */}
        <line x1="3" y1="50" x2="36" y2="50" />
        <line x1="64" y1="50" x2="97" y2="50" />

        {/* The net. */}
        <line x1="50" y1="4" x2="50" y2="96" strokeDasharray="1.6 1.4" />
      </g>
    </svg>
  );
}
