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
 * Base units are CSS pixels and seconds, tuned for a 1440px-wide viewport, then
 * scaled by `k` so the flight keeps its shape on any screen: velocity and
 * gravity scale with `k`, and drag, a reciprocal length, scales against it.
 */

const GRAVITY = 1150; // px/s^2 at k = 1
const DRAG = 0.0011; // 1/px at k = 1
const SMASH = 3300; // px/s, the impulse behind a pane change or the Smash button
const MAX_SPEED = 7000; // px/s, cap on a thrown shuttle
const BOUNCE_FLOOR = 0.46; // the skirt collapses on impact, so the floor is dead
const BOUNCE_WALL = 0.6;
const FRICTION = 0.86; // per second, once it is sliding on the floor
const SLEEP_SPEED = 26; // px/s below which it is considered at rest
const SLEEP_AFTER = 500; // ms at rest before the frame loop is released
const GRAB_RADIUS = 30;
const TRAIL = 22;
const HIT_SAMPLE = 3; // sample the text under the shuttle every Nth frame
const HIT_SPEED = 420; // px/s below which it stops lighting words
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
    let k = 1;

    const shuttle = {
      x: width * 0.5,
      y: height * 0.35,
      vx: 0,
      vy: 0,
      angle: Math.PI / 2,
    };
    const trail = [];

    let frame = 0;
    let ticks = 0;
    let last = performance.now();
    let restingSince = 0;
    let grabbed = false;
    let pointerId = null;
    const samples = [];

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      width = window.innerWidth;
      height = window.innerHeight;
      k = Math.min(Math.max(width / 1440, 0.34), 1.3);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      // A shrinking window must not strand the shuttle outside the viewport.
      shuttle.x = Math.min(Math.max(shuttle.x, RADIUS), width - RADIUS);
      shuttle.y = Math.min(Math.max(shuttle.y, RADIUS), height - RADIUS);
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

    // --- drawing ---------------------------------------------------------
    const drawShuttle = (speed) => {
      const { cork, skirt } = colorsRef.current;
      // Stretch along the axis of travel rather than blurring: cheaper, and it
      // reads as speed at 60fps.
      const stretch = 1 + Math.min(speed / (SMASH * k), 1) * 0.8;
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
        const fast = Math.min(trail[i].speed / (SMASH * k), 1);
        ctx.globalAlpha = t * fast * 0.4;
        ctx.lineWidth = 1 + 7 * t * fast;
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
      ticks += 1;

      if (!grabbed) {
        const speed = Math.hypot(shuttle.vx, shuttle.vy);
        const decel = (DRAG / k) * speed * dt;
        shuttle.vx -= shuttle.vx * decel;
        shuttle.vy -= shuttle.vy * decel;
        shuttle.vy += GRAVITY * k * dt;
        shuttle.x += shuttle.vx * dt;
        shuttle.y += shuttle.vy * dt;

        const floor = height - RADIUS;
        if (shuttle.y > floor) {
          shuttle.y = floor;
          shuttle.vy = -shuttle.vy * BOUNCE_FLOOR;
          shuttle.vx *= FRICTION;
          // Kill the micro-bounces rather than letting it buzz on the floor.
          if (Math.abs(shuttle.vy) < 60 * k) shuttle.vy = 0;
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
          shuttle.vx *= Math.pow(FRICTION, dt * 6);
        }
      }

      const speed = Math.hypot(shuttle.vx, shuttle.vy);

      // Cork leads while it is travelling, and points at the floor once it is
      // slow, which is how a shuttle sits at rest.
      const target = speed > SLEEP_SPEED ? Math.atan2(shuttle.vy, shuttle.vx) : Math.PI / 2;
      let delta = target - shuttle.angle;
      while (delta > Math.PI) delta -= Math.PI * 2;
      while (delta < -Math.PI) delta += Math.PI * 2;
      shuttle.angle += delta * Math.min(1, dt * (grabbed ? 9 : 20));

      if (speed > HIT_SPEED && ticks % HIT_SAMPLE === 0) clipWordAt(shuttle.x, shuttle.y);

      trail.push({ x: shuttle.x, y: shuttle.y, speed });
      if (trail.length > TRAIL) trail.shift();

      render(speed);

      // Release the frame loop once it has genuinely settled; any interaction
      // wakes it again.
      if (!grabbed && speed < SLEEP_SPEED && shuttle.y >= height - RADIUS - 1) {
        if (!restingSince) restingSince = now;
        if (now - restingSince > SLEEP_AFTER) {
          shuttle.vx = 0;
          shuttle.vy = 0;
          trail.length = 0;
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
      // single previous frame, so a flick reads as a flick.
      const now = performance.now();
      const recent = samples.filter((s) => now - s.t < 90);
      const first = recent[0];
      const lastSample = recent[recent.length - 1];
      if (first && lastSample && lastSample.t > first.t) {
        const seconds = (lastSample.t - first.t) / 1000;
        const vx = ((lastSample.x - first.x) / seconds) * 1.15;
        const vy = ((lastSample.y - first.y) / seconds) * 1.15;
        const speed = Math.hypot(vx, vy);
        const cap = MAX_SPEED * k;
        const scale = speed > cap ? cap / speed : 1;
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
      const angle = 0.18 + Math.random() * 0.22;
      const speed = SMASH * k * (0.9 + Math.random() * 0.2);
      shuttle.vx = speed * Math.cos(angle) * dir;
      shuttle.vy = -speed * Math.sin(angle);
      trail.length = 0;
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
