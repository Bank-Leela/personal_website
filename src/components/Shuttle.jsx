import { useEffect, useRef } from "react";

/**
 * A shuttlecock that lives on the page permanently. You can grab it, throw it,
 * and watch it behave the way a shuttle actually behaves.
 *
 * The motion is the point. A shuttle leaves the racket faster than any other
 * projectile in sport and then sheds that speed almost immediately, because the
 * feather skirt drags against the square of velocity. So acceleration is
 * `-DRAG * |v| * v` plus gravity: fling it hard and it screams off, flattens
 * out, and drops on a steep tail. That asymmetry is what makes it read as a
 * shuttle rather than a ball.
 *
 * It never leaves the viewport. All four edges bounce, and the skirt eats most
 * of the energy each time, so it settles on the floor cork-down instead of
 * bouncing forever. Once it is asleep the animation frame is released entirely.
 *
 * Words it flies through are lit for a moment through the CSS Custom Highlight
 * API, which needs no DOM mutation.
 *
 * The simulation runs in real units rather than invented ones. The viewport
 * width is taken to be one badminton court end to end, which fixes a px/metre
 * scale; gravity is 9.81 m/s^2 and the drag coefficient falls out of a real
 * shuttle's 6.7 m/s terminal velocity, since terminal = sqrt(g/k). A smash is
 * launched at 500 km/h, near the fastest ever recorded, and the physics does the
 * rest: it is down to roughly 107 km/h a tenth of a second later and 48 km/h by
 * three tenths, which is the same collapse a real smash undergoes crossing a
 * court.
 *
 * At that speed a frame covers some 250px, so each frame is integrated in
 * substeps fine enough to keep drag stable and to land wall contacts in the
 * right place, and the text underneath is sampled along the path travelled
 * rather than at a single point, or the shuttle would skip whole words.
 */

const COURT_M = 13.4; // a badminton court, end to end; the viewport spans one
const GRAVITY_MS2 = 9.81;
const TERMINAL_MS = 6.7; // a real shuttle's terminal velocity, which fixes drag
const SMASH_KMH = 500; // near the fastest smash ever recorded
const MAX_THROW_KMH = 500; // a thrown shuttle cannot beat the hardest smash
const THROW_GAIN = 4.2; // pointer speed to shuttle speed
const SLEEP_MS = 0.25; // m/s below which it counts as at rest
const DEAD_BOUNCE_MS = 0.55; // m/s of vertical bounce not worth keeping
const HIT_MS = 3; // m/s below which it stops lighting words
const SUBSTEP_PX = 18; // integrate in steps no coarser than this
const MAX_SUBSTEPS = 24;
const HIT_STRIDE_PX = 26; // sample the text this often along the path
const MAX_HITS_PER_FRAME = 10; // caret lookups force layout, so bound them
const BOUNCE_FLOOR = 0.5; // the skirt collapses on impact, so the floor is dead
const BOUNCE_WALL = 0.72;
const FRICTION = 0.86; // per second, once it is sliding on the floor
const SLEEP_AFTER = 500; // ms at rest before the frame loop is released
const GRAB_RADIUS = 30;
const TRAIL_MS = 130; // the streak is time-based, so speed sets its length
const MAX_TRAIL = 64;
const HIT_LINGER = 620; // ms a clipped word stays lit
const RADIUS = 13; // collision radius

const canHighlight = () =>
  typeof CSS !== "undefined" &&
  CSS.highlights &&
  typeof window !== "undefined" &&
  typeof window.Highlight === "function";

/**
 * The word sitting under a viewport point, as a Range, or null.
 *
 * Both caret APIs snap to the nearest text when the point is over empty space,
 * so the candidate is verified against its own client rects before it counts as
 * a hit. Without that check the shuttle lights up paragraphs it is nowhere near.
 */
function wordRangeAt(x, y) {
  let node = null;
  let offset = 0;

  if (document.caretPositionFromPoint) {
    const pos = document.caretPositionFromPoint(x, y);
    if (!pos) return null;
    node = pos.offsetNode;
    offset = pos.offset;
  } else if (document.caretRangeFromPoint) {
    const caret = document.caretRangeFromPoint(x, y);
    if (!caret) return null;
    node = caret.startContainer;
    offset = caret.startOffset;
  } else {
    return null;
  }

  if (!node || node.nodeType !== Node.TEXT_NODE) return null;
  const text = node.data;
  if (!text || !text.trim()) return null;

  let start = Math.min(offset, text.length);
  let end = start;
  while (start > 0 && !/\s/.test(text[start - 1])) start -= 1;
  while (end < text.length && !/\s/.test(text[end])) end += 1;
  if (end <= start) return null;

  const range = document.createRange();
  range.setStart(node, start);
  range.setEnd(node, end);

  const rects = range.getClientRects();
  for (let i = 0; i < rects.length; i += 1) {
    const r = rects[i];
    if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) {
      return { range, start, end, node };
    }
  }
  return null;
}

export default function Shuttle({ smashToken = 0, theme }) {
  const canvasRef = useRef(null);
  const colorsRef = useRef({ cork: "#b5522a", skirt: "#201d18" });
  const smashRef = useRef(null);

  // Colours are read from the stylesheet rather than passed in, so a theme
  // change repaints the shuttle without restarting the simulation.
  useEffect(() => {
    const styles = getComputedStyle(document.documentElement);
    colorsRef.current = {
      cork: styles.getPropertyValue("--shuttle-cork").trim() || "#b5522a",
      skirt: styles.getPropertyValue("--shuttle-skirt").trim() || "#201d18",
    };
  }, [theme]);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const canvas = canvasRef.current;
    if (reduced || !canvas) return undefined;

    const ctx = canvas.getContext("2d");
    let width = window.innerWidth;
    let height = window.innerHeight;

    // Everything below is derived from the px/metre scale, so the shuttle obeys
    // the same real quantities whatever the window size.
    let ppm = width / COURT_M;
    let gravity = GRAVITY_MS2 * ppm;
    let drag = GRAVITY_MS2 / (TERMINAL_MS * TERMINAL_MS) / ppm;
    let smashSpeed = (SMASH_KMH / 3.6) * ppm;
    let maxThrow = (MAX_THROW_KMH / 3.6) * ppm;
    let sleepSpeed = SLEEP_MS * ppm;
    let deadBounce = DEAD_BOUNCE_MS * ppm;
    let hitSpeed = HIT_MS * ppm;

    const shuttle = {
      x: width * 0.5,
      y: height * 0.35,
      vx: 0,
      vy: 0,
      angle: Math.PI / 2,
    };
    let trail = [];

    let frame = 0;
    let last = performance.now();
    let restingSince = 0;
    let grabbed = false;
    let pointerId = null;
    const samples = [];

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const prevPpm = ppm;
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      ppm = width / COURT_M;
      gravity = GRAVITY_MS2 * ppm;
      drag = GRAVITY_MS2 / (TERMINAL_MS * TERMINAL_MS) / ppm;
      smashSpeed = (SMASH_KMH / 3.6) * ppm;
      maxThrow = (MAX_THROW_KMH / 3.6) * ppm;
      sleepSpeed = SLEEP_MS * ppm;
      deadBounce = DEAD_BOUNCE_MS * ppm;
      hitSpeed = HIT_MS * ppm;

      // Carry the shuttle's real speed across the rescale rather than letting a
      // resize quietly speed it up or slow it down.
      const ratio = ppm / prevPpm;
      shuttle.vx *= ratio;
      shuttle.vy *= ratio;

      // A shrinking window must not strand the shuttle outside the viewport.
      shuttle.x = Math.min(Math.max(shuttle.x, RADIUS), width - RADIUS);
      shuttle.y = Math.min(Math.max(shuttle.y, RADIUS), height - RADIUS);
      trail = [];
      wake();
    };

    // --- lit words -------------------------------------------------------
    const highlight = canHighlight() ? new window.Highlight() : null;
    if (highlight) CSS.highlights.set("shuttle-hit", highlight);
    const lit = new Map();
    const nodeIds = new WeakMap();
    let nextNodeId = 0;

    const clipWordAt = (x, y) => {
      if (!highlight) return;
      const hit = wordRangeAt(x, y);
      if (!hit) return;
      let id = nodeIds.get(hit.node);
      if (id === undefined) {
        id = nextNodeId;
        nextNodeId += 1;
        nodeIds.set(hit.node, id);
      }
      const key = `${id}:${hit.start}-${hit.end}`;
      if (lit.has(key)) return;
      highlight.add(hit.range);
      lit.set(key, {
        timer: window.setTimeout(() => {
          highlight.delete(hit.range);
          lit.delete(key);
        }, HIT_LINGER),
      });
    };

    /*
     * At 500 km/h a single frame covers a quarter of the screen, so sampling the
     * text at one point per frame would skip whole paragraphs. Walk the segment
     * actually travelled instead. Each lookup forces layout, hence the cap.
     */
    const clipAlong = (x0, y0, x1, y1) => {
      if (!highlight) return;
      const len = Math.hypot(x1 - x0, y1 - y0);
      const n = Math.min(MAX_HITS_PER_FRAME, Math.max(1, Math.round(len / HIT_STRIDE_PX)));
      for (let i = 1; i <= n; i += 1) {
        const t = i / n;
        clipWordAt(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t);
      }
    };

    // --- drawing ---------------------------------------------------------
    const drawShuttle = (speed) => {
      const { cork, skirt } = colorsRef.current;
      // Stretch along the axis of travel rather than blurring: cheaper, and it
      // reads as speed at 60fps.
      const stretch = 1 + Math.min(speed / smashSpeed, 1) * 2.4;
      const length = 26;
      const corkR = 5.5;
      const skirtR = 10;
      const nose = length * 0.34;
      const tail = -length * 0.66;

      ctx.save();
      ctx.translate(shuttle.x, shuttle.y);
      ctx.rotate(shuttle.angle);
      ctx.scale(stretch, 1);

      // Feather skirt: a flared cone trailing the cork.
      ctx.beginPath();
      ctx.moveTo(nose - corkR * 0.4, -corkR);
      ctx.lineTo(tail, -skirtR);
      ctx.lineTo(tail, skirtR);
      ctx.lineTo(nose - corkR * 0.4, corkR);
      ctx.closePath();
      ctx.fillStyle = skirt;
      ctx.globalAlpha = 0.16;
      ctx.fill();

      ctx.globalAlpha = 0.7;
      ctx.strokeStyle = skirt;
      ctx.lineWidth = 1;
      ctx.stroke();

      // Individual feathers, plus the thread that binds them.
      ctx.globalAlpha = 0.34;
      ctx.beginPath();
      for (let i = -2; i <= 2; i += 1) {
        const t = i / 2;
        ctx.moveTo(nose - corkR * 0.4, corkR * t);
        ctx.lineTo(tail, skirtR * t);
      }
      ctx.moveTo(tail + (nose - tail) * 0.45, -skirtR * 0.66);
      ctx.lineTo(tail + (nose - tail) * 0.45, skirtR * 0.66);
      ctx.stroke();

      // Cork, always leading.
      ctx.globalAlpha = 1;
      ctx.beginPath();
      ctx.arc(nose, 0, corkR, 0, Math.PI * 2);
      ctx.fillStyle = cork;
      ctx.fill();
      ctx.restore();
    };

    const render = (speed) => {
      const { cork } = colorsRef.current;
      ctx.clearRect(0, 0, width, height);

      ctx.lineCap = "round";
      ctx.strokeStyle = cork;
      for (let i = 1; i < trail.length; i += 1) {
        const t = i / trail.length;
        const fast = Math.min(trail[i].speed / smashSpeed, 1);
        ctx.globalAlpha = t * Math.sqrt(fast) * 0.45;
        ctx.lineWidth = 1 + 9 * t * Math.sqrt(fast);
        ctx.beginPath();
        ctx.moveTo(trail[i - 1].x, trail[i - 1].y);
        ctx.lineTo(trail[i].x, trail[i].y);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      drawShuttle(speed);
    };

    // --- simulation ------------------------------------------------------
    const step = (now) => {
      // Clamp dt so a backgrounded tab does not resume with one huge jump.
      const dt = Math.min((now - last) / 1000, 1 / 30);
      last = now;

      const fromX = shuttle.x;
      const fromY = shuttle.y;

      if (!grabbed) {
        // Integrate in substeps: at full speed a whole frame is far too coarse
        // for stable quadratic drag, and wall contacts would land late.
        const entrySpeed = Math.hypot(shuttle.vx, shuttle.vy);
        const steps = Math.min(
          MAX_SUBSTEPS,
          Math.max(1, Math.ceil((entrySpeed * dt) / SUBSTEP_PX)),
        );
        const h = dt / steps;

        for (let i = 0; i < steps; i += 1) {
          const speed = Math.hypot(shuttle.vx, shuttle.vy);
          const decel = drag * speed * h;
          shuttle.vx -= shuttle.vx * decel;
          shuttle.vy -= shuttle.vy * decel;
          shuttle.vy += gravity * h;
          shuttle.x += shuttle.vx * h;
          shuttle.y += shuttle.vy * h;

          const floor = height - RADIUS;
          if (shuttle.y > floor) {
            shuttle.y = floor;
            shuttle.vy = -shuttle.vy * BOUNCE_FLOOR;
            shuttle.vx *= FRICTION;
            // Kill the micro-bounces rather than letting it buzz on the floor.
            if (Math.abs(shuttle.vy) < deadBounce) shuttle.vy = 0;
          }
          if (shuttle.y < RADIUS) {
            shuttle.y = RADIUS;
            shuttle.vy = -shuttle.vy * BOUNCE_WALL;
          }
          if (shuttle.x < RADIUS) {
            shuttle.x = RADIUS;
            shuttle.vx = -shuttle.vx * BOUNCE_WALL;
          }
          if (shuttle.x > width - RADIUS) {
            shuttle.x = width - RADIUS;
            shuttle.vx = -shuttle.vx * BOUNCE_WALL;
          }
          if (shuttle.vy === 0 && shuttle.y >= floor) {
            shuttle.vx *= Math.pow(FRICTION, h * 6);
          }

          trail.push({ x: shuttle.x, y: shuttle.y, speed, t: now });
        }
      } else {
        trail.push({ x: shuttle.x, y: shuttle.y, speed: 0, t: now });
      }

      // The streak is a fixed slice of time, so its length on screen is set by
      // how fast the shuttle is actually going.
      while (trail.length && (now - trail[0].t > TRAIL_MS || trail.length > MAX_TRAIL)) {
        trail.shift();
      }

      const speed = Math.hypot(shuttle.vx, shuttle.vy);

      // Cork leads while it is travelling, and points at the floor once it is
      // slow, which is how a shuttle sits at rest.
      const target = speed > sleepSpeed ? Math.atan2(shuttle.vy, shuttle.vx) : Math.PI / 2;
      let delta = target - shuttle.angle;
      while (delta > Math.PI) delta -= Math.PI * 2;
      while (delta < -Math.PI) delta += Math.PI * 2;
      shuttle.angle += delta * Math.min(1, dt * (grabbed ? 9 : 26));

      if (speed > hitSpeed) clipAlong(fromX, fromY, shuttle.x, shuttle.y);

      render(speed);

      // Release the frame loop once it has genuinely settled; any interaction
      // wakes it again.
      if (!grabbed && speed < sleepSpeed && shuttle.y >= height - RADIUS - 1) {
        if (!restingSince) restingSince = now;
        if (now - restingSince > SLEEP_AFTER) {
          shuttle.vx = 0;
          shuttle.vy = 0;
          trail = [];
          render(0);
          frame = 0;
          return;
        }
      } else {
        restingSince = 0;
      }

      frame = requestAnimationFrame(step);
    };

    function wake() {
      restingSince = 0;
      if (!frame) {
        last = performance.now();
        frame = requestAnimationFrame(step);
      }
    }

    // --- pointer ---------------------------------------------------------
    const near = (x, y) => Math.hypot(x - shuttle.x, y - shuttle.y) <= GRAB_RADIUS;

    /*
     * The canvas covers the page, so it only accepts pointer events while the
     * pointer is actually over the shuttle. Everywhere else it stays
     * transparent to clicks and every link underneath keeps working.
     */
    const onHover = (e) => {
      if (grabbed) return;
      const over = near(e.clientX, e.clientY);
      canvas.style.pointerEvents = over ? "auto" : "none";
      canvas.style.cursor = over ? "grab" : "auto";
    };

    const onDown = (e) => {
      if (!near(e.clientX, e.clientY)) return;
      grabbed = true;
      pointerId = e.pointerId;
      canvas.setPointerCapture(pointerId);
      canvas.style.cursor = "grabbing";
      samples.length = 0;
      samples.push({ x: e.clientX, y: e.clientY, t: performance.now() });
      shuttle.vx = 0;
      shuttle.vy = 0;
      trail = [];
      e.preventDefault();
      wake();
    };

    const onMove = (e) => {
      if (!grabbed || e.pointerId !== pointerId) return;
      shuttle.x = Math.min(Math.max(e.clientX, RADIUS), width - RADIUS);
      shuttle.y = Math.min(Math.max(e.clientY, RADIUS), height - RADIUS);
      samples.push({ x: e.clientX, y: e.clientY, t: performance.now() });
      if (samples.length > 8) samples.shift();
      e.preventDefault();
    };

    const onUp = (e) => {
      if (!grabbed || e.pointerId !== pointerId) return;
      grabbed = false;
      canvas.style.cursor = "auto";
      canvas.style.pointerEvents = "none";
      if (pointerId !== null && canvas.hasPointerCapture(pointerId)) {
        canvas.releasePointerCapture(pointerId);
      }
      pointerId = null;

      // Throw velocity comes from the last stretch of pointer travel, not the
      // single previous frame, so a flick reads as a flick. The gain is what
      // turns a human-speed drag into a shot, capped at the hardest smash.
      const now = performance.now();
      const recent = samples.filter((s) => now - s.t < 90);
      const first = recent[0];
      const lastSample = recent[recent.length - 1];
      if (first && lastSample && lastSample.t > first.t) {
        const seconds = (lastSample.t - first.t) / 1000;
        const vx = ((lastSample.x - first.x) / seconds) * THROW_GAIN;
        const vy = ((lastSample.y - first.y) / seconds) * THROW_GAIN;
        const speed = Math.hypot(vx, vy);
        const scale = speed > maxThrow ? maxThrow / speed : 1;
        shuttle.vx = vx * scale;
        shuttle.vy = vy * scale;
      }
      samples.length = 0;
      wake();
    };

    window.addEventListener("pointermove", onHover, { passive: true });
    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerup", onUp);
    canvas.addEventListener("pointercancel", onUp);
    window.addEventListener("resize", resize);

    const onVisibility = () => {
      if (document.hidden) {
        cancelAnimationFrame(frame);
        frame = 0;
      } else {
        wake();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    smashRef.current = () => {
      const dir = shuttle.x > width * 0.5 ? -1 : 1;
      const angle = 0.16 + Math.random() * 0.14;
      shuttle.vx = smashSpeed * Math.cos(angle) * dir;
      shuttle.vy = -smashSpeed * Math.sin(angle);
      trail = [];
      wake();
    };

    resize();
    wake();

    return () => {
      cancelAnimationFrame(frame);
      smashRef.current = null;
      window.removeEventListener("pointermove", onHover);
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("pointercancel", onUp);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVisibility);
      lit.forEach((entry) => window.clearTimeout(entry.timer));
      lit.clear();
      if (highlight) {
        highlight.clear();
        CSS.highlights.delete("shuttle-hit");
      }
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    };
  }, []);

  useEffect(() => {
    if (smashToken > 0) smashRef.current?.();
  }, [smashToken]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="fixed inset-0 z-20 h-full w-full"
      style={{ pointerEvents: "none" }}
    />
  );
}
