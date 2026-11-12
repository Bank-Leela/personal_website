/**
 * Badminton court markings painted on the mat.
 *
 * The proportions are chosen to sit well on a screen rather than to match a
 * real court: a true 13.4 x 6.1 court stretched to a browser window is a
 * letterbox strip with dead space above and below it. So the viewBox is a
 * plain 100 x 100 and `preserveAspectRatio="none"` lets the whole thing
 * stretch edge to edge of the court region, which means every coordinate below
 * reads as a percentage of it, and the stylesheet places the text against the
 * same percentages.
 *
 * Stretching a viewBox would normally distort the stroke along with it, hence
 * `vector-effect: non-scaling-stroke` (applied in the stylesheet), which keeps
 * every line the same hairline weight however wide the window gets.
 *
 * There are two drawings, and the stylesheet shows one. A court region wider
 * than it is tall gets the court lying down, net top to bottom. A taller one
 * (a phone) gets it stood up, net across the screen: stretching the lying
 * court into a portrait box ran five vertical lines down a single column of
 * text. The upright court also keeps its alleys narrower than life, 4.5 units
 * against a true 7, because on a phone the text column is everything between
 * the singles sidelines and it needs the width more than the alley does.
 */
const LINES = {
  fill: "none",
  stroke: "var(--line)",
};

export default function Court() {
  return (
    <>
      <svg
        className="court court-landscape pointer-events-none absolute inset-0 h-full w-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        aria-hidden="true"
        focusable="false"
      >
        <g {...LINES}>
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

      {/* The same court stood on end: every line above with x and y exchanged,
          and the alleys narrowed (see the note at the top). */}
      <svg
        className="court court-portrait pointer-events-none absolute inset-0 h-full w-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        aria-hidden="true"
        focusable="false"
      >
        <g {...LINES}>
          <rect x="2.5" y="3" width="95" height="94" />

          <line x1="7" y1="3" x2="7" y2="97" />
          <line x1="93" y1="3" x2="93" y2="97" />

          <line x1="2.5" y1="10" x2="97.5" y2="10" />
          <line x1="2.5" y1="90" x2="97.5" y2="90" />

          <line x1="2.5" y1="36" x2="97.5" y2="36" />
          <line x1="2.5" y1="64" x2="97.5" y2="64" />

          <line x1="50" y1="3" x2="50" y2="36" />
          <line x1="50" y1="64" x2="50" y2="97" />

          <line x1="2.5" y1="50" x2="97.5" y2="50" strokeDasharray="1.6 1.4" />
        </g>
      </svg>
    </>
  );
}
