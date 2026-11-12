import { useEffect, useRef } from "react";
import ShuttleArt from "./ShuttleArt";
import { ART, LENGTH, REST_TILT } from "./shuttleBody";
import { launch, makeBody, makeWorld, substep } from "./shuttlePhysics";

/**
 * A shuttlecock that lives on the page permanently. You can grab it, throw it,
 * and watch it behave the way a shuttle actually behaves.
 *
 * How it moves is in shuttlePhysics.js: the drag that makes it scream off and
 * then drop on a steep tail, the way it swings cork-first into its own flight,
 * and how it lands, falls over and lies. What it looks like is in
 * shuttleBody.js and ShuttleArt.jsx: the shuttle is an SVG element, and this
 * file moves it. The rest is here too: the frame loop, the hand that picks it
 * up and throws it, the streak behind it (on a canvas under the shuttle), and
 * the words it lights and knocks about on its way through.
 *
 * It never leaves the viewport, and it always ends up at rest on the floor.
 * Once it is asleep the animation frame is released entirely.
 *
 * Words it flies through are lit for a moment through the CSS Custom Highlight
 * API, which needs no DOM mutation.
 *
 * A smash is launched at 500 km/h, near the fastest ever recorded, and the
 * physics does the rest: it is down to roughly 107 km/h a tenth of a second of
 * its own time later and 48 km/h by three tenths, which is the same collapse a
 * real smash undergoes crossing a court.
 *
 * At that speed a frame covers some 250px, so each frame is integrated in
 * substeps fine enough to keep drag stable and to land contacts in the right
 * place, and the text underneath is sampled along the path travelled rather
 * than at a single point, or the shuttle would skip whole words.
 */

const SMASH_KMH = 500; // near the fastest smash ever recorded
const MAX_THROW_KMH = 500; // a thrown shuttle cannot beat the hardest smash
const THROW_GAIN = 4.2; // pointer speed to shuttle speed
const SLEEP_MS = 0.25; // m/s below which it counts as at rest
const SLEEP_SPIN = 0.5; // rad/s below which it counts as no longer turning
const HIT_MS = 3; // m/s below which it stops lighting words
const SHOVE_MS = 9; // m/s below which it lights words but cannot move them
const SUBSTEP_PX = 18; // integrate in steps no coarser than this,
const SUBSTEP_HZ = 200; // nor, when it is slow, longer than 1/200s of its time
const MAX_SUBSTEPS = 32;
const HIT_STRIDE_PX = 26; // sample the text this often along the path
const MAX_HITS_PER_FRAME = 10; // caret lookups force layout, so bound them
const SLEEP_AFTER = 350; // ms at rest before the frame loop is released
const GRAB_RADIUS = LENGTH * 0.88;
const TRAIL_MS = 130; // the streak is time-based, so speed sets its length
const MAX_TRAIL = 160;
const HIT_LINGER = 620; // ms a clipped word stays lit
const SHOVE_GAP = 220; // ms before the same block can be knocked again
const SHOVE_MAX = 64; // px a single full-speed hit moves a block
const SHOVE_LIMIT = 280; // px a block can end up from where it started
// Coarse radius, for the grab test and for clamping a dragged shuttle only.
const RADIUS = LENGTH * 0.65;
// In the hand it hangs cork-down, as anything held by its light end does, and
// trails the hand like a pendulum. HANG is the hand speed (px/s) that swings it
// out to 45 degrees; the other two are the pendulum's spring and its damping.
const HANG = 900;
const HELD_STIFF = 190;
const HELD_DAMP = 9;

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

export default function Shuttle({ smashToken = 0, court }) {
  const canvasRef = useRef(null);
  const artRef = useRef(null);
  const trailColorRef = useRef("#ff4d1f");
  const smashRef = useRef(null);
  const repaintRef = useRef(null);

  /*
   * The streak's colour is read from the stylesheet rather than passed in, so
   * a change of court can restyle it without restarting the simulation.
   *
   * A settled shuttle has released its animation frame, so nothing would
   * redraw the canvas on its own. Hence the explicit repaint.
   */
  useEffect(() => {
    const styles = getComputedStyle(document.documentElement);
    trailColorRef.current = styles.getPropertyValue("--shuttle-trail").trim() || "#ff4d1f";
    repaintRef.current?.();
  }, [court]);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const canvas = canvasRef.current;
    const art = artRef.current;
    if (reduced || !canvas || !art) return undefined;

    const ctx = canvas.getContext("2d");
    let width = window.innerWidth;
    let height = window.innerHeight;

    // Everything below is derived from the px/metre scale, so the shuttle obeys
    // the same real quantities whatever the window size.
    let world = makeWorld(width, height);
    let smashSpeed = (SMASH_KMH / 3.6) * world.ppm;
    let maxThrow = (MAX_THROW_KMH / 3.6) * world.ppm;
    let sleepSpeed = SLEEP_MS * world.ppm;
    let hitSpeed = HIT_MS * world.ppm;
    let shoveSpeed = SHOVE_MS * world.ppm;

    // It drops in on load and lies where it lands. Down the middle that is
    // clear floor on a wide window, but on a phone the surface picker sits
    // there, and it came to rest on top of it; the bottom left is the bare
    // corner at that width.
    const shuttle = makeBody(width * (width < 600 ? 0.16 : 0.5), height * 0.35);
    let trail = [];

    let frame = 0;
    let last = performance.now();
    let restingSince = 0;
    let grabbed = false;
    let heldSpin = 0; // rad/s of real time, while it swings in the hand
    let pointerId = null;
    const samples = [];

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const prevPpm = world.ppm;
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      world = makeWorld(width, height);
      smashSpeed = (SMASH_KMH / 3.6) * world.ppm;
      maxThrow = (MAX_THROW_KMH / 3.6) * world.ppm;
      sleepSpeed = SLEEP_MS * world.ppm;
      hitSpeed = HIT_MS * world.ppm;
      shoveSpeed = SHOVE_MS * world.ppm;

      // Carry the shuttle's real speed across the rescale rather than letting a
      // resize quietly speed it up or slow it down.
      const ratio = world.ppm / prevPpm;
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
    const shoved = new Map();

    /*
     * Knock a block of text along the shuttle's trajectory and leave it where
     * it lands. Hits accumulate, so a block driven into repeatedly keeps going
     * until it reaches SHOVE_LIMIT from where it started, at which point it
     * stops rather than disappearing off the page. Switching panes remounts the
     * content and everything returns to its proper place.
     *
     * The offset is written to `translate`, which is its own property in modern
     * CSS, so it composes with the `transform` that Motion owns on these same
     * elements rather than fighting it for control.
     */
    const shove = (node, vx, vy, speed) => {
      // Only a shuttle that has been hit moves anything. One that is merely
      // falling tops out under 7 m/s, and when that was enough, the drop on
      // page load came down the middle of a phone's single column and left
      // every block it passed out of place before the visitor had done a thing.
      if (speed < shoveSpeed) return;
      const start = node.parentElement;
      if (!start) return;
      // Knock whole entries. Targeting the individual paragraph or heading
      // tore an entry apart, leaving its title stranded from its own body.
      const block = start.closest(".knock");
      const main = document.querySelector("main");
      if (!block || !main || !main.contains(block)) return;

      // Blocks from a pane that has since been swapped out are dead weight.
      shoved.forEach((_, el) => {
        if (!el.isConnected) shoved.delete(el);
      });

      const now = performance.now();
      const prev = shoved.get(block) || { x: 0, y: 0, t: 0 };
      if (now - prev.t < SHOVE_GAP) return;

      const len = Math.hypot(vx, vy) || 1;
      const mag = 6 + SHOVE_MAX * Math.min(speed / smashSpeed, 1);
      let x = prev.x + (vx / len) * mag;
      let y = prev.y + (vy / len) * mag;
      const dist = Math.hypot(x, y);
      if (dist > SHOVE_LIMIT) {
        x = (x / dist) * SHOVE_LIMIT;
        y = (y / dist) * SHOVE_LIMIT;
      }
      shoved.set(block, { x, y, t: now });

      block.style.transition = "translate 340ms cubic-bezier(0.16, 1, 0.3, 1)";
      block.style.translate = `${x}px ${y}px`;
      // The stylesheet lifts a knocked block over its neighbours.
      block.dataset.shoved = "";
    };

    const clipWordAt = (x, y, vx, vy, speed) => {
      const hit = wordRangeAt(x, y);
      if (!hit) return;
      shove(hit.node, vx, vy, speed);
      if (!highlight) return;
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
    const clipAlong = (x0, y0, x1, y1, vx, vy, speed) => {
      const len = Math.hypot(x1 - x0, y1 - y0);
      const n = Math.min(MAX_HITS_PER_FRAME, Math.max(1, Math.round(len / HIT_STRIDE_PX)));
      for (let i = 1; i <= n; i += 1) {
        const t = i / n;
        clipWordAt(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, vx, vy, speed);
      }
    };

    // --- drawing ---------------------------------------------------------
    // The body is the SVG in ShuttleArt.jsx; this places it. Its transform
    // origin is the shuttle's own origin, so it is moved there, turned, and
    // then stretched along its axis.
    const drawShuttle = (speed) => {
      // Stretch along the axis of travel rather than blurring: cheaper, and it
      // reads as speed at 60fps.
      const stretch = 1 + Math.min(speed / smashSpeed, 1) * 2.4;
      art.style.transform =
        `translate3d(${shuttle.x + ART.box.x}px, ${shuttle.y + ART.box.y}px, 0) ` +
        `rotate(${shuttle.angle}rad) scaleX(${stretch})`;
      art.style.visibility = "visible";
    };

    const render = (speed) => {
      ctx.clearRect(0, 0, width, height);

      ctx.lineCap = "round";
      ctx.strokeStyle = trailColorRef.current;
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
        // for stable quadratic drag, and contacts would land late. The clock
        // runs fast (see shuttlePhysics.js), so a frame is more than a frame.
        const span = dt * world.timeScale;
        const entrySpeed = Math.hypot(shuttle.vx, shuttle.vy);
        const steps = Math.min(
          MAX_SUBSTEPS,
          Math.max(Math.ceil((entrySpeed * span) / SUBSTEP_PX), Math.ceil(span * SUBSTEP_HZ)),
        );
        const h = span / steps;

        for (let i = 0; i < steps; i += 1) {
          substep(shuttle, world, h);
          trail.push({
            x: shuttle.x,
            y: shuttle.y,
            speed: Math.hypot(shuttle.vx, shuttle.vy),
            t: now,
          });
        }
      } else {
        // In the hand: the cork hangs, and swings out behind a moving hand
        // into the direction it is being carried, so it leaves the hand
        // already pointing the way it is thrown.
        const hand = handVelocity(now);
        let off = Math.atan2(hand.y + HANG, hand.x) - shuttle.angle;
        while (off > Math.PI) off -= Math.PI * 2;
        while (off < -Math.PI) off += Math.PI * 2;
        heldSpin += (HELD_STIFF * off - HELD_DAMP * heldSpin) * dt;
        shuttle.angle += heldSpin * dt;
        trail.push({ x: shuttle.x, y: shuttle.y, speed: 0, t: now });
      }

      // The streak is a fixed slice of time, so its length on screen is set by
      // how fast the shuttle is actually going.
      while (trail.length && (now - trail[0].t > TRAIL_MS || trail.length > MAX_TRAIL)) {
        trail.shift();
      }

      const speed = Math.hypot(shuttle.vx, shuttle.vy);

      if (speed > hitSpeed) clipAlong(fromX, fromY, shuttle.x, shuttle.y, shuttle.vx, shuttle.vy, speed);

      render(speed);

      // Release the frame loop once it has genuinely settled; any interaction
      // wakes it again.
      const still = shuttle.grounded && speed < sleepSpeed && Math.abs(shuttle.spin) < SLEEP_SPIN;
      if (!grabbed && still) {
        if (!restingSince) restingSince = now;
        if (now - restingSince > SLEEP_AFTER) {
          shuttle.vx = 0;
          shuttle.vy = 0;
          shuttle.spin = 0;
          // Lying on cork and rim, it is within a hair of REST_TILT already;
          // true it up, so it sleeps in exactly the pose it was drawn for.
          // Propped against a wall it is at some other angle, and stays there.
          const lean = Math.atan2(Math.sin(shuttle.angle), Math.abs(Math.cos(shuttle.angle)));
          if (Math.abs(lean - REST_TILT) < 0.03) {
            shuttle.angle = Math.cos(shuttle.angle) > 0 ? REST_TILT : Math.PI - REST_TILT;
          }
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
    // Hand speed in px per real second, from the last stretch of pointer
    // travel, not the single previous event, so a flick reads as a flick.
    const handVelocity = (now) => {
      const recent = samples.filter((sample) => now - sample.t < 90);
      const first = recent[0];
      const latest = recent[recent.length - 1];
      if (!first || latest.t <= first.t) return { x: 0, y: 0 };
      const seconds = (latest.t - first.t) / 1000;
      return { x: (latest.x - first.x) / seconds, y: (latest.y - first.y) / seconds };
    };

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
      heldSpin = 0;
      shuttle.spin = 0;
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

      // The gain is what turns a human-speed drag into a shot, capped at the
      // hardest smash. It leaves with whatever swing it had in the hand.
      const hand = handVelocity(performance.now());
      const vx = hand.x * THROW_GAIN;
      const vy = hand.y * THROW_GAIN;
      const speed = Math.hypot(vx, vy);
      const scale = speed > maxThrow ? maxThrow / speed : 1;
      shuttle.vx = vx * scale;
      shuttle.vy = vy * scale;
      shuttle.spin = heldSpin / world.timeScale;
      samples.length = 0;
      launch(shuttle);
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

    repaintRef.current = () => render(Math.hypot(shuttle.vx, shuttle.vy));

    smashRef.current = () => {
      const dir = shuttle.x > width * 0.5 ? -1 : 1;
      // Flat and hard across a wide window. An upright one is a short court
      // across and a long one up, so there it is lifted, to fly the length of
      // the screen and come down, where a flat one only rattled between the
      // two side walls.
      const lift = height > width ? 0.95 + Math.random() * 0.3 : 0.16 + Math.random() * 0.14;
      shuttle.vx = smashSpeed * Math.cos(lift) * dir;
      shuttle.vy = -smashSpeed * Math.sin(lift);
      trail = [];
      launch(shuttle);
      wake();
    };

    resize();
    wake();

    return () => {
      cancelAnimationFrame(frame);
      smashRef.current = null;
      repaintRef.current = null;
      window.removeEventListener("pointermove", onHover);
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("pointercancel", onUp);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVisibility);
      lit.forEach((entry) => window.clearTimeout(entry.timer));
      lit.clear();
      shoved.forEach((_, block) => {
        block.style.transition = "";
        block.style.translate = "";
        delete block.dataset.shoved;
      });
      shoved.clear();
      if (highlight) {
        highlight.clear();
        CSS.highlights.delete("shuttle-hit");
      }
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      art.style.visibility = "hidden";
    };
  }, []);

  useEffect(() => {
    if (smashToken > 0) smashRef.current?.();
  }, [smashToken]);

  // The canvas carries the streak and takes the pointer; the shuttle itself
  // is the SVG over it, which lets every pointer event through.
  return (
    <>
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="fixed inset-0 z-20 h-full w-full"
        style={{ pointerEvents: "none" }}
      />
      <ShuttleArt ref={artRef} />
    </>
  );
}
