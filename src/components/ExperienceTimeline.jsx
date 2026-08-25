import { ArrowUpRight } from "lucide-react";
import Reveal from "./Reveal";

/**
 * Career timeline.
 *
 * The previous version put each role in a two-column row whose right column was
 * a full-height `border-l` rail holding one small date and several hundred
 * pixels of nothing. Three of those stacked read as one template stamped three
 * times, which is the actual reason it looked machine-made: the dead rail was
 * structure with no content in it.
 *
 * Here the date moves inline where it belongs and the leftover column becomes a
 * real spine: a chronological line with a via pad at each role, echoing the
 * routing pads in the hero. The line draws itself as you scroll (see
 * `.spine-draw` in index.css), so the one animated thing in this section is the
 * thing the section is actually about.
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
        className="absolute bottom-2 left-[4px] top-3 w-px bg-[var(--color-border)]"
      />
      <span
        aria-hidden="true"
        className="spine-draw absolute bottom-2 left-[4px] top-3 w-px origin-top bg-[var(--color-accent)]"
      />

      {items.map((job, i) => (
        <Reveal
          as="li"
          key={job.company}
          delay={i * 90}
          className="relative pb-14 pl-8 last:pb-0 md:pb-20 md:pl-12"
        >
          {/* Square pad, not a dot: the same shape the hero draws at every
              bend in a routed trace. */}
          <span
            aria-hidden="true"
            className="absolute left-0 top-[9px] h-[9px] w-[9px] bg-[var(--color-accent)]"
          />

          <p className="text-sm tabular-nums text-[var(--color-text-muted)]">{job.period}</p>

          <h3 className="font-display mt-2 text-[1.75rem] font-bold leading-tight tracking-tight text-[var(--color-text)] md:text-[2rem]">
            {job.company}
          </h3>

          <p className="mt-1 text-lg font-semibold text-[var(--color-text)] opacity-75">
            {job.role}
          </p>

          <p className="mt-5 max-w-[60ch] leading-relaxed text-[var(--color-text-muted)] md:text-lg">
            {job.description}
          </p>

          {/* Plain comma-separated tech rather than a row of bordered pills.
              Twelve identical pills down the section was most of the repetition,
              and the words are just as scannable without the chrome. */}
          <p className="mt-4 max-w-[60ch] text-sm text-[var(--color-text-muted)] opacity-80">
            {job.tags.join(", ")}
          </p>

          {job.link && (
            <a
              href={job.link}
              target="_blank"
              rel="noreferrer"
              className="group/link mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--color-text)] transition-colors hover:text-[var(--color-accent-text)]"
            >
              {job.linkLabel}
              <ArrowUpRight
                size={16}
                aria-hidden="true"
                className="transition-transform duration-300 group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5"
              />
            </a>
          )}
        </Reveal>
      ))}
    </ol>
  );
}
