import { useEffect, useRef, useState } from "react";
import usePrefersReducedMotion from "../hooks/usePrefersReducedMotion";

// Each figure is traceable to a specific role below, and each label says whose
// number it is. "$300M" is the scale of the platform worked on, not a personal
// revenue claim, so the label names the platform rather than implying credit.
const STATS = [
  { value: 300, prefix: "$", suffix: "M", label: "Fintech platform worked on" },
  { value: 20, prefix: "", suffix: "M+", label: "Database entries optimized" },
  { value: 70, prefix: "", suffix: "%", label: "Faster KPI reporting" },
];

const DURATION = 1500;

// easeOutCubic: fast start, gentle settle.
const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

export default function StatsBand() {
  const reduceMotion = usePrefersReducedMotion();
  const containerRef = useRef(null);
  const rafRef = useRef(null);
  const settleRef = useRef(null);
  // The resting state is the REAL figures, not zero. The count-up is an
  // enhancement layered on top once the band is actually scrolled into view, so
  // every path where the animation does not run (no IntersectionObserver, a
  // background tab where rAF is suspended, reduced motion) still renders the
  // correct numbers rather than stranding "$0M" on a resume.
  const [values, setValues] = useState(() => STATS.map((s) => s.value));

  useEffect(() => {
    // Reduced motion: snap to final values, skip observer + animation entirely.
    if (reduceMotion) {
      setValues(STATS.map((s) => s.value));
      return;
    }

    const node = containerRef.current;
    if (!node || typeof window === "undefined" || !("IntersectionObserver" in window)) {
      // No observer available: show final values rather than a stuck 0.
      setValues(STATS.map((s) => s.value));
      return;
    }

    let started = false;

    const animate = () => {
      let start = null;
      setValues(STATS.map(() => 0)); // drop to zero only now that we can count up
      const step = (now) => {
        if (start === null) start = now;
        const elapsed = now - start;
        const t = Math.min(elapsed / DURATION, 1);
        const eased = easeOutCubic(t);
        setValues(STATS.map((s) => Math.round(s.value * eased)));
        if (t < 1) {
          rafRef.current = requestAnimationFrame(step);
        }
      };
      rafRef.current = requestAnimationFrame(step);

      // requestAnimationFrame is suspended in a background tab, which would
      // leave the count-up frozen part-way. These are figures off a resume, so
      // a stalled frame does not read as an unfinished animation, it reads as
      // "$9M" being the number. Snap to the real values if the animation has
      // not finished on time; setTimeout still fires while hidden.
      settleRef.current = window.setTimeout(() => {
        setValues(STATS.map((s) => s.value));
        if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      }, DURATION + 400);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !started) {
            started = true;
            observer.disconnect();
            animate();
          }
        });
      },
      { threshold: 0.4 }
    );

    observer.observe(node);

    return () => {
      observer.disconnect();
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      if (settleRef.current != null) window.clearTimeout(settleRef.current);
    };
  }, [reduceMotion]);

  return (
    // Three across while it spans the full width on small screens; stacked and
    // left-aligned once it moves into the narrow pinned column at `lg`.
    <dl
      ref={containerRef}
      className="m-0 grid grid-cols-3 gap-6 border-y border-[var(--color-border-soft)] py-8 sm:gap-8 lg:grid-cols-1 lg:gap-7 lg:border-y-0 lg:border-l lg:border-[var(--color-border)] lg:py-0 lg:pl-6"
    >
      {STATS.map((stat, i) => (
        <div key={stat.label} className="text-center lg:text-left">
          <dt className="sr-only">{stat.label}</dt>
          <dd className="m-0">
            <span
              aria-hidden="true"
              className="font-display block text-3xl font-black tabular-nums text-[var(--color-accent)] sm:text-4xl lg:text-[2.5rem] lg:leading-none"
            >
              {stat.prefix}
              {values[i]}
              {stat.suffix}
            </span>
            <span className="sr-only">
              {stat.prefix}
              {stat.value}
              {stat.suffix}
            </span>
            <span className="mt-2 block text-xs font-medium text-[var(--color-text-muted)] md:text-sm">
              {stat.label}
            </span>
          </dd>
        </div>
      ))}
    </dl>
  );
}
