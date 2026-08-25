import { useState, useEffect } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

// Live-updating boolean: true when the user has requested reduced motion.
// Re-renders consumers if the OS setting is toggled without a reload.
export default function usePrefersReducedMotion() {
  const [reduce, setReduce] = useState(() =>
    typeof window !== "undefined" && window.matchMedia
      ? window.matchMedia(QUERY).matches
      : false
  );

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia(QUERY);
    const onChange = () => setReduce(mq.matches);
    mq.addEventListener("change", onChange);
    setReduce(mq.matches);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return reduce;
}
