import { useState, useEffect, useRef } from "react";
import usePrefersReducedMotion from "../hooks/usePrefersReducedMotion";

// Scroll-reveal wrapper. Content starts hidden and eases into place when it
// first enters the viewport (one-shot). Respects reduced-motion preferences and
// degrades gracefully when IntersectionObserver is unavailable.
export default function Reveal({ children, className = "", delay = 0, as: Tag = "div" }) {
  const reduceMotion = usePrefersReducedMotion();
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // No motion requested: content is already rendered visible (see style below).
    if (reduceMotion) return;

    const node = ref.current;
    if (!node) return;

    // Graceful fallback: never leave content permanently hidden.
    if (typeof window === "undefined" || typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true);
            observer.disconnect(); // one-shot
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -10% 0px" }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [reduceMotion]);

  const style = reduceMotion
    ? undefined
    : {
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(16px)",
        transition: "opacity 600ms ease-out, transform 600ms ease-out",
        transitionDelay: `${delay}ms`,
      };

  return (
    <Tag ref={ref} className={className} style={style}>
      {children}
    </Tag>
  );
}
