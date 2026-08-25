import { useEffect, useRef, useState } from "react";
import usePrefersReducedMotion from "../hooks/usePrefersReducedMotion";

const DURATION = 450; // ms for the progress fill
const R = 44; // ring radius in the 100x100 viewBox
const C = 2 * Math.PI * R;
const SESSION_KEY = "intro-seen";

const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

/**
 * Has the intro already played in this browsing session?
 *
 * Read once, synchronously, so the very first render already knows whether to
 * show the overlay. Wrapped because Safari's private mode throws on
 * sessionStorage access.
 */
export function introAlreadySeen() {
  try {
    return window.sessionStorage.getItem(SESSION_KEY) === "1";
  } catch (e) {
    return false;
  }
}

function markIntroSeen() {
  try {
    window.sessionStorage.setItem(SESSION_KEY, "1");
  } catch (e) {
    /* storage unavailable; the intro simply plays again next navigation */
  }
}

/**
 * Intro moment styled as a chip boot: a shuttlecock core inside a progress ring
 * that genuinely fills, with a signal dot leading the arc to echo the hero
 * routing.
 *
 * It is deliberately short and single-shot. The page itself is fully rendered
 * and painted underneath the whole time, so this is an overlay rather than a
 * gate, and it never replays on a repeat navigation within the same session.
 */
export default function Loader({ onComplete }) {
  const reduceMotion = usePrefersReducedMotion();
  const [progress, setProgress] = useState(reduceMotion ? 1 : 0);
  const doneRef = useRef(false);
  const completeRef = useRef(onComplete);
  completeRef.current = onComplete;

  useEffect(() => {
    // Mark the session as soon as the intro starts, not when it finishes. If
    // the visitor opens the site in a background tab the animation never runs
    // to completion, and tying the flag to completion would replay the intro on
    // every later navigation in that session.
    markIntroSeen();

    const finish = () => {
      if (doneRef.current) return;
      doneRef.current = true;
      completeRef.current?.();
    };

    if (reduceMotion) {
      setProgress(1);
      finish();
      return undefined;
    }

    let raf = null;
    let start = null;
    const step = (now) => {
      if (start === null) start = now;
      const t = Math.min((now - start) / DURATION, 1);
      setProgress(easeOutCubic(t));
      if (t < 1) raf = requestAnimationFrame(step);
      else finish();
    };
    raf = requestAnimationFrame(step);

    // requestAnimationFrame does not run in a hidden tab, so without a timer
    // backstop the overlay would sit over the page until the tab is focused.
    // setTimeout still fires (throttled) in the background.
    const backstop = window.setTimeout(finish, DURATION + 600);

    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.clearTimeout(backstop);
    };
  }, [reduceMotion]);

  const pct = Math.round(progress * 100);
  const offset = C * (1 - progress);
  // Leading tip of the arc (svg is rotated -90deg, so angle 0 sits at top).
  const theta = progress * 2 * Math.PI;
  const tipX = 50 + R * Math.cos(theta);
  const tipY = 50 + R * Math.sin(theta);

  return (
    <div className="flex flex-col items-center gap-7">
      <div className="relative flex h-28 w-28 items-center justify-center">
        <svg
          className="absolute inset-0 h-full w-full -rotate-90"
          viewBox="0 0 100 100"
          aria-hidden="true"
        >
          <circle cx="50" cy="50" r={R} fill="none" stroke="var(--color-border)" strokeWidth="2" />
          <circle
            cx="50"
            cy="50"
            r={R}
            fill="none"
            stroke="var(--color-accent)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray={C}
            strokeDashoffset={offset}
          />
          {!reduceMotion && progress > 0.01 && progress < 0.999 && (
            <>
              <circle cx={tipX} cy={tipY} r="4" fill="var(--color-accent)" opacity="0.35" />
              <circle cx={tipX} cy={tipY} r="2" fill="var(--color-accent)" />
            </>
          )}
        </svg>

        <div className="shuttle-bob">
          <svg viewBox="0 0 40 48" className="h-14 w-14" aria-hidden="true" fill="none">
            {/* feather skirt */}
            <path
              d="M13 33 L5 8 Q20 2 35 8 L27 33 Z"
              fill="var(--color-accent-soft)"
              stroke="var(--color-accent)"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
            {/* feather ribs */}
            <g stroke="var(--color-accent)" strokeWidth="1" strokeLinecap="round" opacity="0.7">
              <path d="M20 32 L6 9" />
              <path d="M20 32 L13 5" />
              <path d="M20 32 L20 4" />
              <path d="M20 32 L27 5" />
              <path d="M20 32 L34 9" />
            </g>
            {/* binding thread */}
            <path d="M10 20 Q20 23 30 20" stroke="var(--color-accent)" strokeWidth="1" opacity="0.6" />
            {/* cork */}
            <circle cx="20" cy="38" r="6" fill="var(--color-accent)" />
          </svg>
        </div>
      </div>

      <div className="w-56 md:w-64">
        <p className="text-center text-base font-semibold tracking-tight text-[var(--color-text)]">
          Bank Leelathanapipat
        </p>
        <div className="mt-4 flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.24em] text-[var(--color-text-muted)]">
          <span>Loading</span>
          <span aria-hidden="true" className="tabular-nums text-[var(--color-accent)]">
            {pct}%
          </span>
        </div>
        <div aria-hidden="true" className="mt-2 h-px w-full overflow-hidden bg-[var(--color-border)]">
          <div
            className="h-full origin-left bg-[var(--color-accent)]"
            style={{ transform: `scaleX(${progress})` }}
          />
        </div>
      </div>
    </div>
  );
}
