/**
 * The shuttlecock's geometry: a feather tournament shuttle, about its own
 * origin with the cork pointing along +x. ShuttleArt.jsx turns what is built
 * here into an SVG, Shuttle.jsx owns where that SVG is and which way it
 * points, and shuttlePhysics.js collides with the shape exported at the
 * bottom. Nothing in this file touches the DOM, so the physics can load it
 * and be run without a browser.
 *
 * It is modelled in millimetres on a real shuttle and scaled to LENGTH px: 85mm
 * long, a white leather cork 27mm across and 25mm deep, a band of dark tape
 * where the feathers are set in, and sixteen feathers flaring to a 68mm skirt.
 * Each feather is bare straw-coloured quill for its first stretch, bound by
 * two rings of thread, then carries a white vane cut to a point at the tip.
 *
 * It is seen in three-quarter view, not strictly side on, turned so the cork
 * leans towards the viewer. Seen exactly side on, every near feather hides the
 * far one directly behind it and the skirt reads as a flat triangle; turned,
 * the far quills show through the gaps between the near ones and the rim of
 * the skirt curves, which is what makes it read as an object and not a sign.
 *
 * Every outline leaves here as the `d` of an SVG path, in px, worked out once
 * when the module loads.
 */

export const LENGTH = 46; // px, tip to skirt

const S = LENGTH / 85; // px per mm
// The origin sits a third of the way back from the tip, near the centre of mass.
const TIP = 85 * 0.34;
const TAIL = TIP - 85;
const CORK_R = 13.5;
const CORK_BASE = TIP - 25; // where the feathers are set in
const DOME = TIP - CORK_R; // centre of the cork's rounded nose
const BAND = 5.5; // width of the tape
const QUILL_R = 11; // radius at which the quills leave the cork
const SKIRT_R = 34;
const FEATHERS = 16; // a real shuttle has sixteen
const RINGS = [0.2, 0.42]; // the binding thread, as fractions along the quill
const VANE_FROM = 0.44; // where the vane begins along the quill
const VANE_FULL = 0.7; // where it reaches its full width
const VANE_CUT = 0.86; // where its outer edge meets the cut across the tip
const VANE_W = 16; // wider than the gap between feathers, so they overlap
const VANE_IN = 2.5; // the sliver of vane on the other side of the quill
const TURN = -0.38; // radians out of the page; negative brings the cork nearer

const COS = Math.cos(TURN);
const SIN = Math.sin(TURN);

/*
 * A point on the body, given by its distance X along the axis and its Y and Z
 * across it, with Z out of the page. Orthographic, so the turn only folds Z
 * into the horizontal; `depth` is how near the viewer the point sits.
 */
const project = (X, Y, Z) => ({ x: (X * COS + Z * SIN) * S, y: Y * S, depth: -X * SIN + Z * COS });

// A point on a circle round the axis; a = 0 faces the viewer.
const onRing = (X, r, a) => project(X, r * Math.sin(a), r * Math.cos(a));

/*
 * A point on feather `a`, a fraction t of the way from the cork to the tip and
 * w across the vane. The vane lies tangent to the cone, and every feather's
 * vane runs the same way round, so each overlaps its neighbour like shingles.
 */
const onFeather = (a, t, w) => {
  const X = CORK_BASE + (TAIL - CORK_BASE) * t;
  const r = QUILL_R + (SKIRT_R - QUILL_R) * t;
  return project(X, r * Math.sin(a) + w * Math.cos(a), r * Math.cos(a) - w * Math.sin(a));
};

const n = (v) => Number(v.toFixed(2));

const pathThrough = (points, close) =>
  points.map((pt, i) => `${i === 0 ? "M" : "L"}${n(pt.x)} ${n(pt.y)}`).join("") + (close ? "Z" : "");

const arcOf = (from, to, steps, at) => {
  const pts = [];
  for (let i = 0; i <= steps; i += 1) pts.push(at(from + ((to - from) * i) / steps));
  return pts;
};

// The vane widens from nothing into a rounded shoulder, as a trimmed feather does.
const vaneWidth = (t) => {
  const u = Math.min(Math.max((t - VANE_FROM) / (VANE_FULL - VANE_FROM), 0), 1);
  return Math.sin((u * Math.PI) / 2) ** 0.75;
};

const feathers = [];
for (let k = 0; k < FEATHERS; k += 1) {
  const a = ((k + 0.5) * Math.PI * 2) / FEATHERS;
  const outer = arcOf(VANE_FROM, VANE_CUT, 10, (t) => onFeather(a, t, VANE_W * vaneWidth(t)));
  const inner = arcOf(0.97, VANE_FROM + 0.04, 8, (t) => onFeather(a, t, -VANE_IN * vaneWidth(t)));
  const tip = onFeather(a, 1, 0);
  const base = onFeather(a, 0, 0);
  const depth = onFeather(a, VANE_FULL, VANE_W / 2).depth;
  feathers.push({
    depth,
    near: depth > 0,
    vane: pathThrough([...outer, tip, ...inner], true),
    quill: pathThrough([base, tip]),
    // The quill throws a hairline of shadow onto its own vane.
    shadow: pathThrough([onFeather(a, VANE_FROM, 0.9), onFeather(a, 1, 0.9)]),
    corners: [tip, outer[outer.length - 1], onFeather(a, VANE_FULL, VANE_W)],
  });
}
// Far feathers first, so the near ones lie over them.
feathers.sort((p, q) => p.depth - q.depth);

// Each ring of thread in two halves: the far half behind every feather, the
// near half over them.
const rings = RINGS.map((t) => {
  const X = CORK_BASE + (TAIL - CORK_BASE) * t;
  const r = QUILL_R + (SKIRT_R - QUILL_R) * t + 0.4;
  return {
    near: pathThrough(arcOf(-Math.PI / 2, Math.PI / 2, 16, (a) => onRing(X, r, a))),
    far: pathThrough(arcOf(Math.PI / 2, (Math.PI * 3) / 2, 16, (a) => onRing(X, r, a))),
  };
});

/*
 * The cork: a sphere for the nose on a short drum. A sphere projects to a
 * circle whatever the turn, and the drum's back edge to the near half of an
 * ellipse, bulging away from the nose.
 */
const domeX = DOME * COS * S;
const corkR = CORK_R * S;
const corkBack = arcOf(Math.PI / 2, -Math.PI / 2, 16, (a) => onRing(CORK_BASE, CORK_R, a));
const cork =
  `M${n(CORK_BASE * COS * S)} ${n(-corkR)}L${n(domeX)} ${n(-corkR)}` +
  `A${n(corkR)} ${n(corkR)} 0 0 1 ${n(domeX)} ${n(corkR)}` +
  corkBack.map((pt) => `L${n(pt.x)} ${n(pt.y)}`).join("") +
  "Z";

const bandFront = arcOf(-Math.PI / 2, Math.PI / 2, 16, (a) => onRing(CORK_BASE + BAND, CORK_R + 0.2, a));
const band = pathThrough(
  [...bandFront, ...arcOf(Math.PI / 2, -Math.PI / 2, 16, (a) => onRing(CORK_BASE, CORK_R + 0.2, a))],
  true,
);

/*
 * The shape shuttlePhysics.js collides with, in px about the origin: the cork's
 * nose as the circle it is, and the corners of every feather tip. Between them
 * they are the only parts that can touch a flat surface, so the shape that
 * lands is the shape you see.
 */
export const CORK = { x: domeX, r: corkR };
const rim = feathers.flatMap((f) => f.corners);
export const RIM = rim.map((pt) => [pt.x, pt.y]);

/*
 * The angle a spent shuttle lies at on the floor, cork tipped down from level.
 * Lying level, only the rim of the skirt touches: the skirt is more than twice
 * the cork's width, so the cork hangs in the air. A real one tips forward until
 * the cork's underside and the rim both rest on the ground, and this is that
 * angle. Tipping by `a` lowers the cork's underside (the CORK circle above) and
 * lifts the rim, so the gap between them only shrinks with `a`, and bisection
 * finds where it closes. The physics arrives at the same angle on its own,
 * since it rests on the same two shapes; this is the exact value it is trued
 * up to once it has stopped.
 */
const corkUnderside = (a) => CORK.x * Math.sin(a) + CORK.r;
const rimUnderside = (a) => Math.max(...RIM.map(([x, y]) => x * Math.sin(a) + y * Math.cos(a)));
let tiltLo = 0;
let tiltHi = Math.PI / 2;
for (let i = 0; i < 40; i += 1) {
  const mid = (tiltLo + tiltHi) / 2;
  if (corkUnderside(mid) < rimUnderside(mid)) tiltLo = mid;
  else tiltHi = mid;
}
export const REST_TILT = (tiltLo + tiltHi) / 2;

// The box the drawing fits in, with room for its strokes: ShuttleArt's viewBox.
const PAD = 2;
const xs = [...rim.map((pt) => pt.x), domeX + corkR];
const ys = [...rim.map((pt) => pt.y), corkR, -corkR];
const minX = Math.min(...xs) - PAD;
const minY = Math.min(...ys) - PAD;

/** Everything ShuttleArt.jsx draws, far to near. */
export const ART = {
  box: {
    x: n(minX),
    y: n(minY),
    width: n(Math.max(...xs) + PAD - minX),
    height: n(Math.max(...ys) + PAD - minY),
  },
  feathers: feathers.map(({ near, vane, quill, shadow }) => ({ near, vane, quill, shadow })),
  rings,
  cork,
  corkCenter: { x: n(domeX), r: n(corkR) },
  band,
  // Where the tape meets the leather: a line of shadow on the cork beside it,
  bandEdge: pathThrough(arcOf(-1.35, 1.35, 12, (a) => onRing(CORK_BASE + BAND + 0.7, CORK_R - 0.2, a))),
  // and the light catching the top of the tape.
  gloss: pathThrough(arcOf(-1.25, -0.45, 6, (a) => onRing(CORK_BASE + BAND * 0.5, CORK_R + 0.2, a))),
  // The span of the skirt along the axis, for the vanes' gradient.
  skirt: { from: n(CORK_BASE * COS * S), to: n(TAIL * COS * S) },
};
