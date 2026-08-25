import { useEffect, useMemo, useRef, useState } from "react";
import usePrefersReducedMotion from "../hooks/usePrefersReducedMotion";

const KONAMI = [
  "ArrowUp",
  "ArrowUp",
  "ArrowDown",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "ArrowLeft",
  "ArrowRight",
  "b",
  "a",
];

const SHUTTLE_COUNT = 24;
const ACTIVE_MS = 4500;

// Compare a single keydown key against an expected Konami key.
// Arrow keys match exactly; letter keys (b/a) match case-insensitively.
function keyMatches(actual, expected) {
  if (!actual) return false;
  if (expected === "b" || expected === "a") {
    return actual.toLowerCase() === expected;
  }
  return actual === expected;
}

export default function EasterEgg() {
  const reduceMotion = usePrefersReducedMotion();
  const [active, setActive] = useState(false);
  const progressRef = useRef(0);
  const timeoutRef = useRef(null);

  // One-time tasteful console hint.
  useEffect(() => {
    console.log(
      "%cCurious dev? Try the Konami code ↑↑↓↓←→←→ B A 🏸",
      "color:#e5484d;font-weight:bold;font-size:13px;"
    );
  }, []);

  // Konami keydown listener (inline, no separate hook).
  useEffect(() => {
    if (typeof window === "undefined") return;

    const onKeyDown = (e) => {
      const expected = KONAMI[progressRef.current];
      if (keyMatches(e.key, expected)) {
        progressRef.current += 1;
        if (progressRef.current === KONAMI.length) {
          progressRef.current = 0;
          setActive(true);
        }
      } else {
        // Allow the mismatched key to (re)start the sequence.
        progressRef.current = keyMatches(e.key, KONAMI[0]) ? 1 : 0;
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // Auto-clear the egg after a short while once active.
  useEffect(() => {
    if (!active) return;
    timeoutRef.current = window.setTimeout(() => {
      setActive(false);
    }, ACTIVE_MS);
    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [active]);

  // Generate the shuttlecock rain values once per activation.
  const shuttles = useMemo(() => {
    if (!active) return [];
    return Array.from({ length: SHUTTLE_COUNT }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      duration: 3 + Math.random() * 3, // ~3-6s
      delay: Math.random() * 1.2, // ~0-1.2s
      size: 1.1 + Math.random() * 0.9, // rem
    }));
  }, [active]);

  if (!active) return null;

  return (
    <>
      {!reduceMotion && (
        <div className="fixed inset-0 pointer-events-none z-[90]" aria-hidden="true">
          {shuttles.map((s) => (
            <span
              key={s.id}
              className="absolute top-0 select-none"
              style={{
                left: `${s.left}%`,
                fontSize: `${s.size}rem`,
                animation: `shuttle-fall ${s.duration}s linear ${s.delay}s forwards`,
              }}
            >
              {"🏸"}
            </span>
          ))}
        </div>
      )}

      <div
        role="status"
        aria-live="polite"
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[95] flex items-center gap-3 rounded-[var(--radius-pill)] bg-[var(--color-bg-elevated)] border border-[var(--color-accent-border)] text-[var(--color-text)] px-5 py-2.5 shadow-lg"
      >
        <span className="text-sm font-medium">
          {"🏸"} You found the secret! Nice.
        </span>
        <button
          type="button"
          aria-label="Dismiss"
          onClick={() => setActive(false)}
          className="grid h-6 w-6 place-items-center rounded-[var(--radius-pill)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-pill)] transition-colors"
        >
          <span aria-hidden="true" className="text-base leading-none">
            &times;
          </span>
        </button>
      </div>
    </>
  );
}
