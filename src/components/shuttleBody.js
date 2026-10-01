/**
 * The shuttlecock itself: a feather tournament shuttle, drawn about its own
 * origin with the cork pointing along +x. Shuttle.jsx owns where it is, which
 * way it points and how fast it is going; this file owns only what it looks
 * like, so the drawing can be worked on without touching the physics.
 *
 * It is modelled in millimetres on a real shuttle and scaled to LENGTH px: 85mm
 * long, a white leather cork 27mm across and 25mm deep, a black band where the
 * feathers are set in, and sixteen feathers flaring to a 68mm skirt. Each
 * feather is bare quill for its first stretch, bound by two rings of thread,
 * then carries a vane cut at an angle across the tip.
 *
 * It is drawn in three-quarter view rather than strictly side on, turned so the
 * cork leans towards the viewer. Seen exactly side on, every near feather hides
 * the far one directly behind it and the skirt reads as a flat triangle; turned,
 * the far quills show through the gaps between the near ones and the rim of the
 * skirt curves, which is what makes it read as an object rather than a sign.
 *
 * None of the geometry changes from frame to frame, so it is all built once,
 * here, as Path2D objects, and a frame only fills and strokes them.
 */

export const LENGTH = 46; // px, tip to skirt

const S = LENGTH / 85; // px per mm
// The origin sits a third of the way back from the tip, near the centre of mass.
const TIP = 85 * 0.34;
const TAIL = TIP - 85;
const CORK_R = 13.5;
const CORK_BASE = TIP - 25; // where the feathers are set in
const DOME = TIP - CORK_R; // centre of the cork's rounded nose
const BAND = 4.5; // width of the black band
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

const pathThrough = (points, close) => {
  const p = new Path2D();
  points.forEach((pt, i) => (i === 0 ? p.moveTo(pt.x, pt.y) : p.lineTo(pt.x, pt.y)));
  if (close) p.closePath();
  return p;
};

const arcOf = (from, to, n, at) => {
  const pts = [];
  for (let i = 0; i <= n; i += 1) pts.push(at(from + ((to - from) * i) / n));
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
  feathers.push({
    depth: onFeather(a, VANE_FULL, VANE_W / 2).depth,
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
const cork = new Path2D();
cork.moveTo(CORK_BASE * COS * S, -corkR);
cork.lineTo(domeX, -corkR);
cork.arc(domeX, 0, corkR, -Math.PI / 2, Math.PI / 2);
arcOf(Math.PI / 2, -Math.PI / 2, 16, (a) => onRing(CORK_BASE, CORK_R, a)).forEach((pt) => cork.lineTo(pt.x, pt.y));
cork.closePath();

const band = pathThrough(
  [
    ...arcOf(-Math.PI / 2, Math.PI / 2, 16, (a) => onRing(CORK_BASE + BAND, CORK_R + 0.2, a)),
    ...arcOf(Math.PI / 2, -Math.PI / 2, 16, (a) => onRing(CORK_BASE, CORK_R + 0.2, a)),
  ],
  true,
);
// Light catching the top of the tape.
const gloss = pathThrough(arcOf(-1.25, -0.45, 6, (a) => onRing(CORK_BASE + BAND * 0.5, CORK_R + 0.2, a)));

/*
 * The outline Shuttle.jsx collides with, in px about the origin: the cork's
 * nose and shoulders and the corners of every feather tip, so the shape that
 * bounces is the shape you see.
 */
export const SILHOUETTE = [
  [domeX + corkR, 0],
  [domeX, -corkR],
  [domeX, corkR],
  ...feathers.flatMap((f) => f.corners.map((pt) => [pt.x, pt.y])),
];

const EDGE = "rgba(28, 28, 30, 0.42)";

export function drawBody(ctx, { cork: corkColor, band: bandColor, skirt }) {
  ctx.save();
  ctx.lineJoin = "round";
  ctx.lineCap = "round";

  ctx.strokeStyle = EDGE;
  ctx.lineWidth = 1.5;
  ctx.globalAlpha = 0.5;
  rings.forEach((ring) => ctx.stroke(ring.far));

  for (let i = 0; i < feathers.length; i += 1) {
    const f = feathers[i];
    const near = f.depth > 0;
    ctx.globalAlpha = 1;
    ctx.fillStyle = skirt;
    ctx.fill(f.vane);
    // The far feathers are seen from inside the skirt, which is in shade.
    if (!near) {
      ctx.fillStyle = "rgba(20, 20, 24, 0.16)";
      ctx.fill(f.vane);
    }
    ctx.strokeStyle = EDGE;
    ctx.lineWidth = 0.6;
    ctx.globalAlpha = near ? 0.6 : 0.45;
    ctx.stroke(f.vane);

    ctx.globalAlpha = near ? 0.32 : 0.2;
    ctx.lineWidth = 1.1;
    ctx.stroke(f.shadow);

    // Quill: a dark edge with the light shaft laid down its middle, so it reads
    // against the vane as well as against the mat. Square ends, so it stops at
    // the tip of its vane rather than poking out past it.
    ctx.lineCap = "butt";
    ctx.globalAlpha = near ? 0.75 : 0.5;
    ctx.lineWidth = 1.9;
    ctx.stroke(f.quill);
    ctx.globalAlpha = 1;
    ctx.strokeStyle = skirt;
    ctx.lineWidth = 1.1;
    ctx.stroke(f.quill);
    ctx.lineCap = "round";
  }

  // The near halves of the thread: a light cord with a dark edge either side.
  ctx.globalAlpha = 0.45;
  ctx.strokeStyle = EDGE;
  ctx.lineWidth = 1.9;
  rings.forEach((ring) => ctx.stroke(ring.near));
  ctx.globalAlpha = 1;
  ctx.strokeStyle = skirt;
  ctx.lineWidth = 1.1;
  rings.forEach((ring) => ctx.stroke(ring.near));

  // Cork: white leather, lit from above so the nose reads as round.
  ctx.fillStyle = corkColor;
  ctx.fill(cork);
  const across = ctx.createLinearGradient(0, -corkR, 0, corkR);
  across.addColorStop(0, "rgba(255, 255, 255, 0.45)");
  across.addColorStop(0.5, "rgba(0, 0, 0, 0)");
  across.addColorStop(1, "rgba(0, 0, 0, 0.13)");
  ctx.fillStyle = across;
  ctx.fill(cork);
  const round = ctx.createRadialGradient(
    domeX + corkR * 0.3,
    -corkR * 0.35,
    corkR * 0.1,
    domeX,
    0,
    corkR * 1.05,
  );
  round.addColorStop(0, "rgba(255, 255, 255, 0.6)");
  round.addColorStop(0.6, "rgba(0, 0, 0, 0)");
  round.addColorStop(1, "rgba(0, 0, 0, 0.08)");
  ctx.fillStyle = round;
  ctx.fill(cork);
  ctx.strokeStyle = EDGE;
  ctx.lineWidth = 0.8;
  ctx.stroke(cork);

  ctx.fillStyle = bandColor;
  ctx.fill(band);
  ctx.globalAlpha = 0.5;
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 0.9;
  ctx.stroke(gloss);

  ctx.restore();
}
