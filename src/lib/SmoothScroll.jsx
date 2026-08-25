import { useEffect, useRef } from "react";
import usePrefersReducedMotion from "../hooks/usePrefersReducedMotion";
import Lenis from "lenis";

/**
 * Inertial scrolling for the whole document.
 *
 * Lenis intercepts wheel and touch input and eases the real scroll position
 * toward the target, which is what gives the page weight instead of a 1:1 jump
 * per wheel notch. Because it moves the actual scroll position rather than
 * transforming a container, everything already built on top of scrolling keeps
 * working untouched: the CSS scroll-timelines that drive the progress bar and
 * the section choreography, the IntersectionObservers behind the reveals and
 * the nav scroll-spy, and native anchor targets.
 *
 * Side-effect only; renders nothing. Under prefers-reduced-motion it never
 * boots, leaving the browser's own instant scrolling in place.
 */
export default function SmoothScroll() {
  const reduceMotion = usePrefersReducedMotion();
  const lenisRef = useRef(null);

  useEffect(() => {
    if (reduceMotion || typeof window === "undefined") return undefined;

    const lenis = new Lenis({
      autoRaf: true,
      // Low lerp reads as glide; high reads as lag. 0.1 lands on "weighted"
      // without the page feeling like it is fighting the wheel.
      lerp: 0.1,
      wheelMultiplier: 0.9,
      // Nav items and deep links stay plain #hash anchors. Lenis animates them
      // and the offset clears the fixed nav, which is what scroll-padding-top
      // did for the native path.
      anchors: { offset: -96, duration: 1.1 },
    });

    lenisRef.current = lenis;

    // Tab moves focus, the browser scrolls that element into view, and Lenis
    // restores its own scroll target on the next frame, which puts the focused
    // element back off screen. Measured: 3 of 26 tab stops landed below the
    // fold with Lenis running, 0 without it. Handing out-of-view focus targets
    // back to Lenis keeps keyboard users able to see where they are.
    const NAV_CLEARANCE = 112;

    const handleFocusIn = (event) => {
      const target = event.target;
      if (!target || typeof target.getBoundingClientRect !== "function") return;

      const rect = target.getBoundingClientRect();
      if (rect.top >= NAV_CLEARANCE && rect.bottom <= window.innerHeight) return;

      // Short: someone tabbing quickly should not watch the page chase them.
      lenis.scrollTo(target, { offset: -NAV_CLEARANCE - 16, duration: 0.35 });
    };

    document.addEventListener("focusin", handleFocusIn);

    return () => {
      document.removeEventListener("focusin", handleFocusIn);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, [reduceMotion]);

  return null;
}
