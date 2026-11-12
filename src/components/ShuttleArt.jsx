import { forwardRef } from "react";
import { ART } from "./shuttleBody";

/**
 * The shuttlecock as an SVG: the outlines worked out in shuttleBody.js, given
 * the materials of a real one. White goose-feather vanes that grey a little
 * towards the cork, where they sit in each other's shade; straw quills; white
 * thread; a leather cork lit from above and to the front, with a band of dark
 * green tape round it.
 *
 * It is a real element, not a drawing on the canvas, so it stays sharp at any
 * pixel density. Shuttle.jsx moves it by writing a transform straight onto it
 * each frame; nothing here re-renders. The origin of that transform is the
 * shuttle's own origin, which the viewBox puts at (-box.x, -box.y).
 *
 * Gradients only, no filters: a blur would have to be rasterised again every
 * frame the shuttle is stretched by its speed.
 */

const { box, feathers, rings, cork, corkCenter, band, bandEdge, gloss, skirt } = ART;

const EDGE = "rgba(40, 40, 46, 0.5)"; // the hairline round a white thing on a pale mat
const STRAW = "#ecd9ae";
const STRAW_EDGE = "#9c8250";

const ShuttleArt = forwardRef(function ShuttleArt(_, ref) {
  return (
    <svg
      ref={ref}
      aria-hidden="true"
      focusable="false"
      viewBox={`${box.x} ${box.y} ${box.width} ${box.height}`}
      width={box.width}
      height={box.height}
      className="pointer-events-none fixed left-0 top-0 z-20"
      style={{
        // Hidden until Shuttle.jsx has placed it; with reduced motion it never
        // does, and there is no shuttle at all.
        visibility: "hidden",
        overflow: "visible",
        transformOrigin: `${-box.x}px ${-box.y}px`,
        willChange: "transform",
      }}
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <defs>
        {/* Along the skirt: shaded where the feathers crowd in at the cork,
            clean white out at the tips. */}
        <linearGradient id="shuttle-vane" gradientUnits="userSpaceOnUse" x1={skirt.from} y1="0" x2={skirt.to} y2="0">
          <stop offset="0.3" stopColor="#dcdcd6" />
          <stop offset="0.62" stopColor="#f7f7f3" />
          <stop offset="1" stopColor="#ffffff" />
        </linearGradient>
        {/* The far feathers are seen from inside the skirt, which is in shade. */}
        <linearGradient id="shuttle-vane-far" gradientUnits="userSpaceOnUse" x1={skirt.from} y1="0" x2={skirt.to} y2="0">
          <stop offset="0.3" stopColor="#aeb1b3" />
          <stop offset="1" stopColor="#d9dcdd" />
        </linearGradient>
        {/* Leather on a sphere: the light sits up and forward of centre and
            falls away to the underside. */}
        <radialGradient
          id="shuttle-cork"
          gradientUnits="userSpaceOnUse"
          cx={corkCenter.x + corkCenter.r * 0.25}
          cy={-corkCenter.r * 0.4}
          r={corkCenter.r * 1.7}
        >
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.45" stopColor="#f3f1ea" />
          <stop offset="0.8" stopColor="#d5d1c6" />
          <stop offset="1" stopColor="#b3aea2" />
        </radialGradient>
        <linearGradient id="shuttle-band" gradientUnits="userSpaceOnUse" x1="0" y1={-corkCenter.r} x2="0" y2={corkCenter.r}>
          <stop offset="0" stopColor="#2f7359" />
          <stop offset="0.35" stopColor="#17493a" />
          <stop offset="1" stopColor="#0a2a20" />
        </linearGradient>
      </defs>

      <g stroke="#8d8f90" strokeWidth="0.9" opacity="0.7">
        {rings.map((ring) => (
          <path key={ring.far} d={ring.far} />
        ))}
      </g>

      {feathers.map((f) => (
        <g key={f.vane}>
          <path
            d={f.vane}
            fill={f.near ? "url(#shuttle-vane)" : "url(#shuttle-vane-far)"}
            stroke={EDGE}
            strokeWidth="0.5"
            strokeOpacity={f.near ? 0.9 : 0.7}
          />
          {/* The quill throws a hairline of shadow onto its own vane. */}
          <path d={f.shadow} stroke="#3c3c44" strokeWidth="1" opacity={f.near ? 0.16 : 0.1} />
          {/* Quill: a darker edge with the pale shaft laid down its middle.
              Square ends, so it stops at the tip of its vane and not past it. */}
          <path d={f.quill} stroke={STRAW_EDGE} strokeWidth="1.5" strokeLinecap="butt" opacity={f.near ? 1 : 0.75} />
          <path d={f.quill} stroke={f.near ? STRAW : "#c9b88f"} strokeWidth="0.9" strokeLinecap="butt" />
        </g>
      ))}

      {/* The near halves of the thread: a white cord with a dark edge. */}
      {rings.map((ring) => (
        <g key={ring.near}>
          <path d={ring.near} stroke="#77735f" strokeWidth="1.7" />
          <path d={ring.near} stroke="#fbfaf4" strokeWidth="1" />
        </g>
      ))}

      <path d={cork} fill="url(#shuttle-cork)" stroke={EDGE} strokeWidth="0.7" />
      <path d={bandEdge} stroke="#2a2a26" strokeWidth="1.1" opacity="0.2" />
      <path d={band} fill="url(#shuttle-band)" stroke="rgba(8, 26, 20, 0.7)" strokeWidth="0.5" />
      <path d={gloss} stroke="#ffffff" strokeWidth="0.8" opacity="0.4" />
    </svg>
  );
});

export default ShuttleArt;
