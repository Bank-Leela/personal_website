import { ArrowUpRight } from "lucide-react";

/**
 * Career timeline, as cards on a spine.
 *
 * The roles sit in cards so each one is a bounded object you can scan and stop
 * at, instead of three runs of loose text separated only by whitespace. The
 * spine survives the change because it is the part carrying meaning: a
 * chronological line with a via pad at each role, echoing the routing pads in
 * the hero, drawing itself as you scroll (see `.spine-draw` in index.css).
 *
 * These are deliberately not built like the project cards below. Those are a
 * two-column grid with artwork, a cursor spotlight and a lift. These are one
 * full-width column, no media, and the only hover response is the border and
 * the pad on the rail. Same radius, different object, so the two sections do
 * not read as the same layout stamped twice.
 *
 * Company sits at 30px rather than 48px. At the old scale the employer name
 * shouted over the work done under it, and the work is the part being assessed.
 */
export default function ExperienceTimeline({ items }) {
  return (
    <ol className="relative m-0 list-none p-0">
      {/* Spine track, then the accent line that draws over it. */}
      <span
        aria-hidden="true"
        className="absolute bottom-6 left-[4px] top-8 w-px bg-[var(--color-border)] md:top-10"
      />
      <span
        aria-hidden="true"
        className="spine-draw absolute bottom-6 left-[4px] top-8 w-px origin-top bg-[var(--color-accent)] md:top-10"
      />

      {items.map((job) => (
        <li
          key={job.company}
          className="group relative pb-6 pl-8 last:pb-0 md:pb-8 md:pl-12"
        >
          {/* Square pad, not a dot: the same shape the hero draws at every
              bend in a routed trace. It marks where this card joins the
              chronology, so it answers the hover rather than the card lifting. */}
          <span
            aria-hidden="true"
            className="absolute left-0 top-8 h-[9px] w-[9px] bg-[var(--color-accent)] transition-transform duration-300 group-hover:scale-[1.6] md:top-10"
          />

          {/* Short tie from the pad to the card edge, so the card reads as
              hanging off the chronology rather than floating beside it. */}
          <span
            aria-hidden="true"
            className="absolute left-[9px] top-[36px] h-px w-[23px] bg-[var(--color-border)] [transition:background-color_400ms_ease] group-hover:bg-[var(--color-accent-border)] md:top-[44px] md:w-[39px]"
          />

          <article className="card-scrub rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-6 shadow-[var(--shadow-card)] [transition:border-color_400ms_ease] group-hover:border-[var(--color-accent-border)] md:p-8">
            {/* Company and period share a line: the date belongs beside the
                employer, not stranded in a column of its own. */}
            <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
              <h3 className="font-display text-[1.6rem] font-bold leading-tight tracking-tight text-[var(--color-text)] md:text-[1.9rem]">
                {job.company}
              </h3>
              <p className="shrink-0 text-sm tabular-nums text-[var(--color-text-muted)]">
                {job.period}
              </p>
            </div>

            <p className="mt-1.5 text-lg font-semibold text-[var(--color-text)] opacity-75">
              {job.role}
            </p>

            <div
              aria-hidden="true"
              className="mt-5 h-px w-full bg-[var(--color-border-soft)]"
            />

            <p className="mt-5 max-w-[60ch] leading-relaxed text-[var(--color-text-muted)] md:text-lg">
              {job.description}
            </p>

            {/* Plain comma-separated tech rather than a row of bordered pills.
                Twelve identical pills down the section was most of the
                repetition, and the words are just as scannable without the
                chrome. It also keeps these distinct from the project cards,
                which do use pills. */}
            <p className="mt-4 max-w-[60ch] text-sm text-[var(--color-text-muted)] opacity-80">
              {job.tags.join(", ")}
            </p>

            {job.link && (
              <a
                href={job.link}
                target="_blank"
                rel="noreferrer"
                className="group/link mt-6 inline-flex touch-manipulation items-center gap-1.5 text-sm font-semibold text-[var(--color-text)] transition-colors hover:text-[var(--color-accent-text)]"
              >
                {job.linkLabel}
                <ArrowUpRight
                  size={16}
                  aria-hidden="true"
                  className="transition-transform duration-300 group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5"
                />
              </a>
            )}
          </article>
        </li>
      ))}
    </ol>
  );
}
