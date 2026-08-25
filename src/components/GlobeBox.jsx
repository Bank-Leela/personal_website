import { useCallback, useEffect, useRef, useState } from "react";
import Globe from "react-globe.gl";
import usePrefersReducedMotion from "../hooks/usePrefersReducedMotion";

const MARKERS = [
  {
    lat: 43.4643,
    lng: -80.5204,
    label: "Waterloo, ON",
    short: "Waterloo",
    blurb: "Where I study, and where I am for co-op terms.",
  },
  {
    lat: 13.7563,
    lng: 100.5018,
    label: "Bangkok, TH",
    short: "Bangkok",
    blurb: "Home, and where the IEEE flood-sensor work was deployed.",
  },
];

/**
 * The two places the work in this page came from, drawn on a globe.
 *
 * Previously this panel ran a 1 Hz clock interval for a live local-time
 * readout. That re-rendered the component every second for the lifetime of the
 * page and amounted to atmosphere rather than information, so the clock is
 * gone. The markers now do something useful instead: selecting one flies the
 * camera to that city and explains what connects it to the work.
 */
export default function GlobeBox({ theme }) {
  const globeRef = useRef();
  const boxRef = useRef(null);
  const reduceMotion = usePrefersReducedMotion();
  const [size, setSize] = useState(560);
  const [selected, setSelected] = useState(0);

  // Size the globe to its actual container column, not the viewport.
  useEffect(() => {
    const el = boxRef.current;
    if (!el) return undefined;
    const update = () => setSize(Math.min(el.clientWidth, 560));
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // One-time camera + controls setup.
  useEffect(() => {
    if (!globeRef.current) return;
    const controls = globeRef.current.controls();
    controls.autoRotate = !reduceMotion;
    controls.autoRotateSpeed = 0.6;
    controls.enableZoom = false;
    globeRef.current.pointOfView({ lat: 20, lng: 10, altitude: 2.4 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Stop spending GPU frames on a globe nobody is looking at.
  useEffect(() => {
    const el = boxRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return undefined;
    const io = new IntersectionObserver(
      (entries) => {
        const controls = globeRef.current?.controls?.();
        if (!controls) return;
        controls.autoRotate = !reduceMotion && entries.some((e) => e.isIntersecting);
      },
      { threshold: 0 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [reduceMotion]);

  const focus = useCallback(
    (index) => {
      setSelected(index);
      const marker = MARKERS[index];
      globeRef.current?.pointOfView(
        { lat: marker.lat, lng: marker.lng, altitude: 1.9 },
        reduceMotion ? 0 : 1100
      );
    },
    [reduceMotion]
  );

  const arcsData = [
    {
      startLat: MARKERS[1].lat,
      startLng: MARKERS[1].lng,
      endLat: MARKERS[0].lat,
      endLng: MARKERS[0].lng,
      color: theme === "light" ? ["#b83e36", "#171411"] : ["#e5484d", "#f3f3f3"],
    },
  ];

  const active = MARKERS[selected];

  return (
    <div
      ref={boxRef}
      className="relative flex h-[420px] w-full flex-col justify-end overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-border-soft)] bg-[var(--color-bg-elevated)] p-6 shadow-[var(--shadow-card)] md:h-[560px] md:p-8"
    >
      <div
        className="absolute inset-0 flex items-center justify-center"
        aria-hidden="true"
        style={
          theme === "light"
            ? {
                filter:
                  "sepia(0.58) saturate(0.42) hue-rotate(-12deg) brightness(1.08) contrast(0.9)",
              }
            : undefined
        }
      >
        <Globe
          ref={globeRef}
          width={size}
          height={size}
          backgroundColor="rgba(0,0,0,0)"
          globeImageUrl={
            theme === "dark" ? "/textures/earth-dark.jpg" : "/textures/earth-blue-marble.jpg"
          }
          bumpImageUrl="/textures/earth-topology.png"
          atmosphereColor={theme === "light" ? "#b83e36" : "#e5484d"}
          atmosphereDaylightAlpha={theme === "dark" ? 0.1 : 0.18}
          pointsData={MARKERS}
          pointColor={() => (theme === "light" ? "#b83e36" : "#e5484d")}
          pointRadius={0.7}
          onPointClick={(point) => focus(MARKERS.indexOf(point))}
          labelsData={MARKERS}
          labelText="label"
          labelSize={1.5}
          labelColor={() => (theme === "light" ? "#171411" : "#f3f3f3")}
          labelDotRadius={0.4}
          labelAltitude={0.05}
          arcsData={arcsData}
          arcColor="color"
          arcDashLength={0.4}
          arcDashGap={4}
          arcDashAnimateTime={reduceMotion ? 0 : 1500}
          arcStroke={0.5}
        />
      </div>

      {/* Scrim so the caption stays legible over whatever part of the globe
          happens to be rotating underneath it. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-[var(--color-bg-elevated)] via-[var(--color-bg-elevated)]/85 to-transparent"
      />

      <div className="relative z-10">
        <div className="flex flex-wrap gap-2">
          {MARKERS.map((marker, i) => (
            <button
              key={marker.label}
              type="button"
              onClick={() => focus(i)}
              aria-pressed={selected === i}
              className={`rounded-[var(--radius-pill)] border px-4 py-2 text-sm font-semibold transition-all duration-300 active:scale-[0.98] ${
                selected === i
                  ? "border-[var(--color-accent-border)] bg-[var(--color-accent-soft)] text-[var(--color-accent-text)]"
                  : "border-[var(--color-border)] bg-[var(--color-pill)] text-[var(--color-text-muted)] hover:border-[var(--color-accent-border)] hover:text-[var(--color-text)]"
              }`}
            >
              {marker.short}
            </button>
          ))}
        </div>
        <p
          aria-live="polite"
          className="mt-4 max-w-[42ch] text-sm leading-relaxed text-[var(--color-text-muted)] md:text-base"
        >
          <span className="font-semibold text-[var(--color-text)]">{active.label}.</span>{" "}
          {active.blurb}
        </p>
      </div>
    </div>
  );
}
