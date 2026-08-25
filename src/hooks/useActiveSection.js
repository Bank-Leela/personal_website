import { useEffect, useState } from "react";

/**
 * Scroll-spy without a scroll listener.
 *
 * The previous implementation compared `window.scrollY` against
 * `section.offsetTop`, which is measured from the nearest *positioned*
 * ancestor rather than the document. Because every section lives inside a
 * `position: relative` wrapper, every offset was shifted by that wrapper's
 * position and the nav highlighted the wrong section.
 *
 * Here a thin horizontal band sits just under the fixed nav, and the active
 * section is the last one (in document order) whose top edge has passed the
 * bottom of that band. Two adjacent sections always overlap the band at their
 * shared boundary, so "last one to have started" is the only rule that stays
 * deterministic there; asking which sections merely intersect the band would
 * make the answer depend on callback ordering.
 *
 * IntersectionObserver is used purely as the trigger to re-measure, which keeps
 * the work off the scroll path without ceding the decision to it.
 */
const NAV_OFFSET = 80; // top of the band, just below the nav
const BAND_HEIGHT = 80;
const BAND_BOTTOM = NAV_OFFSET + BAND_HEIGHT;

export default function useActiveSection(ids) {
  const [active, setActive] = useState(null);

  useEffect(() => {
    if (typeof window === "undefined" || typeof IntersectionObserver === "undefined") {
      return undefined;
    }

    let observer = null;

    const measure = () => {
      let current = null;
      for (const id of ids) {
        const el = document.getElementById(id);
        if (!el) continue;
        if (el.getBoundingClientRect().top < BAND_BOTTOM) current = id;
        else break; // sections are in document order; nothing later has started
      }
      setActive(current ?? ids[0] ?? null);
    };

    const connect = () => {
      if (observer) observer.disconnect();

      // The band is expressed as a shrunken observation root, so a callback
      // fires whenever any section boundary crosses it.
      const bottomInset = Math.max(0, window.innerHeight - BAND_BOTTOM);

      observer = new IntersectionObserver(measure, {
        rootMargin: `-${NAV_OFFSET}px 0px -${bottomInset}px 0px`,
        threshold: 0,
      });

      ids
        .map((id) => document.getElementById(id))
        .filter(Boolean)
        .forEach((el) => observer.observe(el));
    };

    measure();
    connect();

    // The band's bottom inset is derived from the viewport height, so it has to
    // be rebuilt when the viewport changes.
    let resizeTimer = null;
    const onResize = () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        connect();
        measure();
      }, 150);
    };
    window.addEventListener("resize", onResize);

    // A hash landing scrolls after mount, so re-measure once the browser has
    // settled on the target.
    const onHashChange = () => window.setTimeout(measure, 100);
    window.addEventListener("hashchange", onHashChange);
    const settleTimer = window.setTimeout(measure, 200);

    return () => {
      window.clearTimeout(resizeTimer);
      window.clearTimeout(settleTimer);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("hashchange", onHashChange);
      if (observer) observer.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ids.join(",")]);

  return active;
}
