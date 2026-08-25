import { useEffect, useRef } from "react";
import usePrefersReducedMotion from "../hooks/usePrefersReducedMotion";

// Parse a CSS color (#hex or rgb()) into [r,g,b]; falls back to dark accent.
function parseAccent(raw) {
  const value = (raw || "").trim();
  const fallback = [229, 72, 77];
  if (!value) return fallback;
  if (value[0] === "#") {
    let hex = value.slice(1);
    if (hex.length === 3) hex = hex.split("").map((c) => c + c).join("");
    if (hex.length >= 6) {
      const r = parseInt(hex.slice(0, 2), 16);
      const g = parseInt(hex.slice(2, 4), 16);
      const b = parseInt(hex.slice(4, 6), 16);
      if (![r, g, b].some(Number.isNaN)) return [r, g, b];
    }
    return fallback;
  }
  const m = value.match(/(\d+(?:\.\d+)?)/g);
  if (m && m.length >= 3) return [Number(m[0]), Number(m[1]), Number(m[2])];
  return fallback;
}

const GRID = 22; // routing pitch (px)
const CURSOR_RADIUS = 160; // px within which traces brighten

const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);

/**
 * Generative die plot: orthogonal (Manhattan) routing laid out on a grid the
 * way chip interconnect is, with signal pulses travelling the traces and via
 * pads at every bend. Traces brighten near the cursor.
 *
 * The motion is motivated rather than decorative: the page is about VLSI and
 * computer architecture, and this is the subject matter drawing itself. It is
 * scoped to its own bounded panel, listens for pointer events on that panel
 * only, and parks the animation loop whenever the panel scrolls out of view or
 * the tab is hidden. Under reduced motion it renders a single static frame so
 * the hero composition keeps its right-hand mass instead of collapsing.
 */
export default function HeroCircuit({ theme = "dark", className = "" }) {
  const reduceMotion = usePrefersReducedMotion();
  const canvasRef = useRef(null);
  const accentRef = useRef([229, 72, 77]);
  const mouseRef = useRef({ x: -9999, y: -9999, active: false });
  const tracesRef = useRef([]);
  const redrawRef = useRef(null);

  // Recompute accent from the active theme, then repaint if we are static.
  useEffect(() => {
    if (typeof window === "undefined" || !document?.documentElement) return;
    const raw = getComputedStyle(document.documentElement)
      .getPropertyValue("--color-accent")
      .trim();
    accentRef.current = parseAccent(raw);
    redrawRef.current?.();
  }, [theme]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const parent = canvas.parentElement;
    if (!parent || typeof window === "undefined") return undefined;
    const ctx = canvas.getContext("2d");
    if (!ctx) return undefined;

    let width = 0;
    let height = 0;
    let dpr = 1;
    let rafId = null;
    let last = 0;
    let visible = true;

    // Build a set of orthogonal traces snapped to the grid.
    const buildTraces = () => {
      const cols = Math.max(2, Math.floor(width / GRID));
      const rows = Math.max(2, Math.floor(height / GRID));
      const count = clamp(Math.round((width * height) / 5200), 24, 110);
      const traces = [];

      for (let i = 0; i < count; i += 1) {
        let cx = Math.floor(Math.random() * (cols + 1));
        let cy = Math.floor(Math.random() * (rows + 1));
        const pts = [[cx * GRID, cy * GRID]];
        let horizontal = Math.random() < 0.5;
        const segCount = 2 + Math.floor(Math.random() * 4); // 2-5 bends

        for (let s = 0; s < segCount; s += 1) {
          const len = 1 + Math.floor(Math.random() * 5); // 1-5 cells
          const dir = Math.random() < 0.5 ? -1 : 1;
          if (horizontal) cx = clamp(cx + dir * len, 0, cols);
          else cy = clamp(cy + dir * len, 0, rows);
          const next = [cx * GRID, cy * GRID];
          const prev = pts[pts.length - 1];
          if (next[0] !== prev[0] || next[1] !== prev[1]) pts.push(next);
          horizontal = !horizontal;
        }
        if (pts.length < 2) continue;

        const segments = [];
        let total = 0;
        for (let k = 0; k < pts.length - 1; k += 1) {
          const a = pts[k];
          const b = pts[k + 1];
          const L = Math.hypot(b[0] - a[0], b[1] - a[1]);
          segments.push({ a, b, L, acc: total });
          total += L;
        }
        if (total < GRID) continue;

        traces.push({
          pts,
          segments,
          total,
          // Trace weight varies like real routing layers: a few fat power rails
          // among many thin signal nets.
          weight: Math.random() < 0.18 ? 1.9 : 1,
          hasPulse: Math.random() < 0.5,
          pulse: Math.random() * total,
          speed: 26 + Math.random() * 34, // px/s
        });
      }
      tracesRef.current = traces;
    };

    // Position of a pulse a distance `p` along a trace's polyline.
    const pointAt = (trace, p) => {
      for (const seg of trace.segments) {
        if (p <= seg.acc + seg.L) {
          const t = seg.L === 0 ? 0 : (p - seg.acc) / seg.L;
          return [seg.a[0] + (seg.b[0] - seg.a[0]) * t, seg.a[1] + (seg.b[1] - seg.a[1]) * t];
        }
      }
      const lastPt = trace.pts[trace.pts.length - 1];
      return [lastPt[0], lastPt[1]];
    };

    const draw = (dt) => {
      const [r, g, b] = accentRef.current;
      const rgb = `${r}, ${g}, ${b}`;
      const mouse = mouseRef.current;
      ctx.clearRect(0, 0, width, height);
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      for (const trace of tracesRef.current) {
        // Brightness boost from cursor proximity (nearest vertex).
        let boost = 0;
        if (mouse.active) {
          let minD = Infinity;
          for (const p of trace.pts) {
            const d = Math.hypot(p[0] - mouse.x, p[1] - mouse.y);
            if (d < minD) minD = d;
          }
          if (minD < CURSOR_RADIUS) boost = 1 - minD / CURSOR_RADIUS;
        }

        // Trace lines.
        ctx.lineWidth = trace.weight * (1 + boost * 0.5);
        ctx.strokeStyle = `rgba(${rgb}, ${0.2 + boost * 0.55})`;
        ctx.beginPath();
        ctx.moveTo(trace.pts[0][0], trace.pts[0][1]);
        for (let k = 1; k < trace.pts.length; k += 1) ctx.lineTo(trace.pts[k][0], trace.pts[k][1]);
        ctx.stroke();

        // Via pads at each bend.
        ctx.fillStyle = `rgba(${rgb}, ${0.3 + boost * 0.55})`;
        for (const p of trace.pts) {
          const size = 2.4 + boost * 1.8;
          ctx.fillRect(p[0] - size / 2, p[1] - size / 2, size, size);
        }

        // Travelling signal pulse.
        if (trace.hasPulse) {
          if (dt > 0) trace.pulse = (trace.pulse + trace.speed * dt) % trace.total;
          const [px, py] = pointAt(trace, trace.pulse);
          ctx.save();
          ctx.shadowBlur = 9 + boost * 6;
          ctx.shadowColor = `rgba(${rgb}, 0.9)`;
          ctx.fillStyle = `rgba(${rgb}, ${0.9 + boost * 0.1})`;
          ctx.beginPath();
          ctx.arc(px, py, 1.8 + boost * 0.9, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }

      // Soft glow that follows the cursor.
      if (mouse.active) {
        const grad = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, CURSOR_RADIUS);
        grad.addColorStop(0, `rgba(${rgb}, 0.12)`);
        grad.addColorStop(1, `rgba(${rgb}, 0)`);
        ctx.fillStyle = grad;
        ctx.fillRect(mouse.x - CURSOR_RADIUS, mouse.y - CURSOR_RADIUS, CURSOR_RADIUS * 2, CURSOR_RADIUS * 2);
      }
    };

    // Repaint a single frame with no time advance (used for the static path and
    // after a theme change).
    redrawRef.current = () => {
      if (width > 0 && height > 0) draw(0);
    };

    const resize = () => {
      const w = parent.clientWidth;
      const h = parent.clientHeight;
      if (w <= 0 || h <= 0) return;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = w;
      height = h;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      buildTraces();
      // Always paint one frame immediately. The animation loop refuses to start
      // in a hidden tab or an off-screen panel, so without this the panel would
      // stay blank for anyone who opened the page in a background tab.
      draw(0);
    };

    const loop = (now) => {
      let dt = last ? (now - last) / 1000 : 0;
      last = now;
      if (dt > 0.1) dt = 0.016; // clamp after tab resume / long frames
      draw(dt);
      rafId = window.requestAnimationFrame(loop);
    };

    const start = () => {
      if (reduceMotion || rafId != null || !visible || document.hidden) return;
      last = 0;
      rafId = window.requestAnimationFrame(loop);
    };
    const stop = () => {
      if (rafId != null) {
        window.cancelAnimationFrame(rafId);
        rafId = null;
      }
    };

    // Pointer tracking is scoped to the panel, so moving the mouse anywhere
    // else on the page costs nothing.
    const onPointerMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        active: true,
      };
      if (reduceMotion) draw(0);
    };
    const onPointerLeave = () => {
      mouseRef.current = { x: -9999, y: -9999, active: false };
      if (reduceMotion) draw(0);
    };
    const onVisibility = () => (document.hidden ? stop() : start());

    resize();

    let ro = null;
    if (typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(resize);
      ro.observe(parent);
    } else {
      window.addEventListener("resize", resize);
    }

    // Park the loop entirely once the hero is scrolled past.
    let io = null;
    if (typeof IntersectionObserver !== "undefined") {
      io = new IntersectionObserver(
        (entries) => {
          visible = entries.some((entry) => entry.isIntersecting);
          if (visible) start();
          else stop();
        },
        { threshold: 0 }
      );
      io.observe(parent);
    }

    parent.addEventListener("pointermove", onPointerMove);
    parent.addEventListener("pointerleave", onPointerLeave);
    document.addEventListener("visibilitychange", onVisibility);

    start();

    return () => {
      stop();
      redrawRef.current = null;
      parent.removeEventListener("pointermove", onPointerMove);
      parent.removeEventListener("pointerleave", onPointerLeave);
      document.removeEventListener("visibilitychange", onVisibility);
      if (io) io.disconnect();
      if (ro) ro.disconnect();
      else window.removeEventListener("resize", resize);
    };
  }, [reduceMotion]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={`absolute inset-0 h-full w-full ${className}`}
    />
  );
}
