import { CORK, LENGTH, RIM } from "./shuttleBody";

/**
 * How the shuttlecock moves. No DOM and no drawing in here: Shuttle.jsx owns
 * the frame loop, the pointer and the canvas, and calls `substep` to advance a
 * plain state object, so the motion can be run and measured without a browser.
 *
 * The shuttle is a rigid body with a position, a heading and a spin. Three
 * things act on it.
 *
 * Air. Drag grows with the square of speed, which is what makes a shuttle a
 * shuttle: it leaves the racket faster than anything else in sport and has shed
 * most of that a few metres later. The same air turns it. The skirt drags and
 * the cork does not, so the body weathervanes cork-first into whatever
 * direction it is travelling, as a spring that stiffens with speed: struck, or
 * turned round by a wall, it swings through, overshoots a little and settles,
 * within a few of its own lengths however fast it is going.
 *
 * Gravity. The court is one viewport long, which fixes a px/metre scale, and
 * gravity and terminal velocity are a real shuttle's at that scale. But the
 * shuttle is drawn about five times life size, and a thing that big falling at
 * true speed looks as if it is sinking through water, worst of all on a phone,
 * where a screen is a short court. So the clock runs fast (`timeScale`), by
 * whatever factor makes it fall at FEEL_GRAVITY on screen. Every trajectory
 * keeps its true shape; it is only played back quicker.
 *
 * Surfaces. The cork is a circle and the skirt is the ring of its feather
 * tips, and those two shapes meet the floor, the walls and the ceiling as
 * contacts with friction. That is where falling over comes from. Nothing
 * animates it: a shuttle stood on its cork is an unstable thing with its weight
 * above a round foot, so it tips, picks up speed as it goes, slaps the rim of
 * its skirt down, rocks once and lies still on cork and rim together.
 *
 * Two rules sit on top of the physics, because they read better than what a
 * strictly rigid body does:
 *
 *   A hard hit bounces without spin. Taken literally, a cork striking the
 *   floor a few degrees off square is kicked into a fast tumble. Here it
 *   springs straight back with the heading it arrived at.
 *
 *   The floor returns one bounce. Off that first touch it hops, holding its
 *   heading with the air switched off (`rebounding`), so it neither flips
 *   cork-up to follow its own rise nor starts to fall over in mid-air. The
 *   next touch is dead, and only then, on the ground, does it topple. (A
 *   shuttle hurled at the floor, harder than it could ever fall, is not a
 *   landing: it comes off like it would off a wall, the air turns it over on
 *   the way up, and it lands properly when it comes back down.)
 */

export const COURT_M = 13.4; // a badminton court, end to end
const GRAVITY_MS2 = 9.81;
const TERMINAL_MS = 6.7; // a real shuttle's terminal velocity, which fixes drag
const FEEL_GRAVITY = 2400; // px/s^2 on screen, whatever the px/metre scale

const TURN_PX = LENGTH * 3; // travel in which the weathervane swings round once
const TURN_DAMPING = 0.4; // of critical: one visible overshoot, then settled
const SPIN_DRAG = 1.5; // per second; still air on the skirt
const GROUND_SPIN_DRAG = 2.5; // per second; a skirt rocking on the floor
const SPIN_MAX = 40; // rad/s; nothing here should ever strobe

const GYRATION2 = (LENGTH * 0.26) ** 2; // radius of gyration squared, px^2
// The cork is a smooth leather dome and slides; the feather tips scrape. With
// the cork gripping as hard as the skirt, a shuttle that landed still moving
// was tripped by its own nose: it stood up straight, hung there, and only
// then fell, the long way over.
const FRICTION_CORK = 0.15;
const FRICTION_SKIRT = 0.6;
const BOUNCE_FLOOR = 0.5; // the cork's one bounce off the floor
const BOUNCE_WALL = 0.55; // the cork off a wall or the ceiling
const BOUNCE_SKIRT = 0.3; // the skirt, hitting anything hard
const ROCK = 0.2; // the skirt's rim slapping down as it falls over
const GRIP_FLOOR = 0.7; // sideways speed kept through the floor bounce
const GRIP_WALL = 0.85;
const DEAD_BOUNCE_MS = 0.55; // m/s of bounce not worth keeping
const HARD_MS = 1; // m/s into a wall above which it bounces, not leans
const SLAM = 1.5; // times terminal velocity; faster than this is thrown, not fallen
const ROCK_MS = 0.3; // m/s below which the rim just stays down
const NUDGE = 4.5; // rad/s; the least a landed shuttle starts falling over at
const SLOP = 1; // px within which a second point is about to touch
const SOLVER_PASSES = 4;

/** Everything that depends on the size of the window. */
export function makeWorld(width, height) {
  // The longer side is the court's length, so a phone held upright still gets
  // a full flight up its screen rather than a court squeezed across it.
  const ppm = Math.max(width, height) / COURT_M;
  const gravity = GRAVITY_MS2 * ppm;
  return {
    width,
    height,
    ppm,
    gravity,
    drag: GRAVITY_MS2 / (TERMINAL_MS * TERMINAL_MS) / ppm,
    timeScale: Math.max(1, Math.sqrt(FEEL_GRAVITY / gravity)),
    deadBounce: DEAD_BOUNCE_MS * ppm,
    hardSpeed: HARD_MS * ppm,
    slamSpeed: SLAM * TERMINAL_MS * ppm,
    rockSpeed: ROCK_MS * ppm,
  };
}

export function makeBody(x, y) {
  return {
    x,
    y,
    vx: 0,
    vy: 0,
    angle: Math.PI / 2, // the way the cork points; this is straight down
    spin: 0,
    canBounce: true, // the floor still owes it its one bounce
    rebounding: false, // in the air off that bounce
    grounded: false, // resting or rolling on the floor, as of the last substep
  };
}

/** Sent flying (a smash, a throw): the floor owes it a bounce again. */
export function launch(body) {
  body.canBounce = true;
  body.rebounding = false;
  body.grounded = false;
}

// Inward normal (nx, ny) and offset k, so that nx*x + ny*y + k is the distance
// of a point inside the room from that surface.
const surfaces = (w) => [
  { nx: 0, ny: -1, k: w.height, floor: true },
  { nx: 0, ny: 1, k: 0, floor: false },
  { nx: 1, ny: 0, k: 0, floor: false },
  { nx: -1, ny: 0, k: w.width, floor: false },
];

const wrap = (a) => {
  let d = a;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
};

/**
 * One contact point against one surface: stop it sinking in, and let friction
 * act on whatever it is sliding at. `r` is the point's offset from the centre
 * of mass. Mass is 1, so an impulse is a change of velocity, and it turns the
 * body by its moment about the centre over GYRATION2.
 *
 * `room` is the speed at which the point would only just arrive this step
 * (its gap over the step). A point still short of the surface is slowed to
 * that and no further, so it comes to rest on the surface, not hovering at
 * whatever height it was first noticed.
 */
function resolve(s, nx, ny, rx, ry, bounce, room, friction) {
  const vn = (s.vx - s.spin * ry) * nx + (s.vy + s.spin * rx) * ny;
  if (vn + room >= 0) return;
  const rn = rx * ny - ry * nx;
  const jn = -(vn + room + bounce * vn) / (1 + (rn * rn) / GYRATION2);
  s.vx += jn * nx;
  s.vy += jn * ny;
  s.spin += (rn * jn) / GYRATION2;

  const tx = -ny;
  const ty = nx;
  const vt = (s.vx - s.spin * ry) * tx + (s.vy + s.spin * rx) * ty;
  const rt = rx * ty - ry * tx;
  const limit = friction * jn;
  const jt = Math.max(-limit, Math.min(limit, -vt / (1 + (rt * rt) / GYRATION2)));
  s.vx += jt * tx;
  s.vy += jt * ty;
  s.spin += (rt * jt) / GYRATION2;
}

/** Advance the body by `h` seconds of its own (already scaled) time. */
export function substep(s, w, h, random = Math.random) {
  // --- air ---------------------------------------------------------------
  const speed = Math.hypot(s.vx, s.vy);
  const slow = 1 / (1 + w.drag * speed * h);
  s.vx *= slow;
  s.vy = s.vy * slow + w.gravity * h;

  if (s.rebounding) {
    s.spin = 0;
  } else if (s.grounded) {
    // Down on the floor the air has nothing to say: the speeds are a crawl,
    // and a weathervane strong enough to matter there would hold the shuttle
    // up against its own fall.
    s.spin /= 1 + GROUND_SPIN_DRAG * h;
  } else {
    let damping = SPIN_DRAG;
    if (speed > 1) {
      const off = wrap(Math.atan2(s.vy, s.vx) - s.angle);
      // Travelling skirt-first it is turned with full force, either way round;
      // sin() alone would leave it balanced when it is exactly backwards.
      const bite = Math.abs(off) < Math.PI / 2 ? Math.sin(off) : Math.sign(off) || 1;
      const rate = ((Math.PI * 2) / TURN_PX) * speed;
      s.spin += rate * rate * bite * h;
      damping += 2 * TURN_DAMPING * rate;
    }
    s.spin /= 1 + damping * h;
  }

  s.x += s.vx * h;
  s.y += s.vy * h;
  s.angle = wrap(s.angle + s.spin * h);

  // --- surfaces ----------------------------------------------------------
  const wasGrounded = s.grounded;
  s.grounded = false;
  const planes = surfaces(w);
  for (let p = 0; p < planes.length; p += 1) {
    const { nx, ny, k, floor } = planes[p];
    const c = Math.cos(s.angle);
    const sn = Math.sin(s.angle);

    // The cork's nose, a circle, and whichever feather tip is nearest.
    const cx = CORK.x * c;
    const cy = CORK.x * sn;
    let corkGap = nx * (s.x + cx) + ny * (s.y + cy) + k - CORK.r;
    let rimGap = Infinity;
    let rx = 0;
    let ry = 0;
    for (let i = 0; i < RIM.length; i += 1) {
      const ox = RIM[i][0] * c - RIM[i][1] * sn;
      const oy = RIM[i][0] * sn + RIM[i][1] * c;
      const gap = nx * (s.x + ox) + ny * (s.y + oy) + k;
      if (gap < rimGap) {
        rimGap = gap;
        rx = ox;
        ry = oy;
      }
    }

    const deepest = Math.min(corkGap, rimGap);
    if (deepest >= 0) continue;
    const corkFirst = corkGap <= rimGap;
    s.x -= nx * deepest;
    s.y -= ny * deepest;
    corkGap -= deepest;
    rimGap -= deepest;

    const approach = -(s.vx * nx + s.vy * ny);
    const bounce = !corkFirst ? BOUNCE_SKIRT : floor ? BOUNCE_FLOOR : BOUNCE_WALL;
    const slam = approach > w.slamSpeed;
    const hard = floor
      ? slam || (s.canBounce && approach * bounce > w.deadBounce)
      : approach > w.hardSpeed;

    if (hard) {
      // Straight back off the surface, keeping its heading (see the top).
      s.vx += (1 + bounce) * approach * nx;
      s.vy += (1 + bounce) * approach * ny;
      const along = s.vx * -ny + s.vy * nx;
      const lost = (1 - (floor ? GRIP_FLOOR : GRIP_WALL)) * along;
      s.vx -= lost * -ny;
      s.vy -= lost * nx;
      if (floor) {
        s.canBounce = false;
        s.rebounding = !slam;
        if (!slam) s.spin = 0;
      }
      continue;
    }

    // Resting, rolling, rocking or leaning: the points in touch push back and
    // grip, and the body turns about them as its weight dictates.
    for (let pass = 0; pass < SOLVER_PASSES; pass += 1) {
      if (corkGap < SLOP) resolve(s, nx, ny, cx - CORK.r * nx, cy - CORK.r * ny, 0, corkGap / h, FRICTION_CORK);
      if (rimGap < SLOP) {
        const slap = pass === 0 && -((s.vx - s.spin * ry) * nx + (s.vy + s.spin * rx) * ny) > w.rockSpeed;
        resolve(s, nx, ny, rx, ry, slap ? ROCK : 0, rimGap / h, FRICTION_SKIRT);
      }
    }

    // Leaving counts for nothing: a shuttle smashed up off the floor brushes
    // it on the way out, and that must not use up the bounce it is owed. The
    // margin is for a body at rest, which the solver leaves drifting a hair
    // either way from one step to the next.
    if (floor && approach > -w.deadBounce) {
      s.grounded = true;
      s.canBounce = false;
      s.rebounding = false;
      // Down for good on its cork: it falls over now, not after it has
      // dithered. Whichever way it is already going, else the way it leans,
      // and if it has come down dead square, either way: a shuttle balanced on
      // its cork is a coin toss.
      if (!wasGrounded && corkFirst && sn > 0.5 && Math.abs(s.spin) < NUDGE) {
        let side;
        if (Math.abs(s.spin) > 0.5) side = Math.sign(s.spin);
        else if (Math.abs(c) > 0.1) side = c > 0 ? -1 : 1;
        else side = random() < 0.5 ? -1 : 1;
        s.spin = side * NUDGE;
      }
    }
  }

  s.spin = Math.max(-SPIN_MAX, Math.min(SPIN_MAX, s.spin));
}
