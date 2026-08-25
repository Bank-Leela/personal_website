import { useRef } from "react";
import { ExternalLink, Github, Cpu } from "lucide-react";
import usePrefersReducedMotion from "../hooks/usePrefersReducedMotion";

const PARALLAX = 7; // px the artwork drifts against the cursor

/**
 * A single project. The cursor drives a spotlight, a lift, and a small
 * counter-drift of the artwork inside its frame, all written as CSS custom
 * properties straight onto the node through a ref, so tracking costs one style
 * mutation per pointer event instead of re-rendering the card (and every
 * sibling in the grid) on every frame.
 *
 * Deliberately no 3D tilt: rotating a card this size shears its type, softens
 * a screenshot that is already small, and breaks the alignment it shares with
 * the card beside it. Depth here comes from the artwork moving against a fixed
 * frame, which reads as parallax rather than as a rotating slab.
 */
const ProjectCard = ({
  title,
  description,
  problem,
  built,
  highlight,
  tags,
  repo,
  repoLabel,
  link,
  linkLabel,
  image,
  imageAlt,
  placeholderLabel,
}) => {
  const cardRef = useRef(null);
  const reduceMotion = usePrefersReducedMotion();

  const handlePointerMove = (event) => {
    const node = cardRef.current;
    if (!node || reduceMotion) return;
    const bounds = node.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width;
    const y = (event.clientY - bounds.top) / bounds.height;
    node.dataset.tracking = "true";
    node.style.setProperty("--px", `${x * 100}%`);
    node.style.setProperty("--py", `${y * 100}%`);
    // Signed -0.5..0.5 so the artwork drifts away from the cursor.
    node.style.setProperty("--mx", `${x - 0.5}`);
    node.style.setProperty("--my", `${y - 0.5}`);
    node.style.setProperty("--lift", "-5px");
  };

  const handlePointerLeave = () => {
    const node = cardRef.current;
    if (!node) return;
    node.dataset.tracking = "false";
    node.style.setProperty("--mx", "0");
    node.style.setProperty("--my", "0");
    node.style.setProperty("--lift", "0px");
  };

  return (
    <article
      ref={cardRef}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      className="pointer-surface group relative flex h-full flex-col overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-6 shadow-[var(--shadow-card)] hover:border-[var(--color-accent-border)] hover:shadow-[var(--shadow-card-hover)] md:p-8"
    >
      <div
        aria-hidden="true"
        className="pointer-glow absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
      />

      <div className="relative z-10 flex h-full flex-col">
        {(image || placeholderLabel) && (
          // 16:9 frame, matching the screenshots themselves. The old fixed
          // height cropped a quarter off the bottom of a 16:9 shot, which cut
          // the product's own headline in half.
          <div className="mb-6 aspect-video w-full overflow-hidden rounded-[var(--radius-media)] border border-[var(--color-border)] bg-[var(--color-surface)]">
            {image ? (
              // Screenshots arrive in whatever palette their own product used.
              // Holding them at reduced saturation at rest keeps the page on a
              // single accent, and restoring full colour on hover rewards the
              // person who is actually looking at the project.
              <img
                src={image}
                alt={imageAlt || title}
                loading="lazy"
                decoding="async"
                width="1000"
                height="563"
                className="pointer-media h-full w-full object-cover object-center saturate-[0.35] group-hover:saturate-100"
                style={reduceMotion ? undefined : { "--parallax": `${PARALLAX}px` }}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[var(--color-accent-soft)] via-[var(--color-surface)] to-[var(--color-bg)]">
                <span className="rounded-[var(--radius-pill)] border border-[var(--color-border)] px-4 py-1.5 text-xs font-semibold text-[var(--color-text-muted)]">
                  {placeholderLabel}
                </span>
              </div>
            )}
          </div>
        )}

        <div className="mb-5 flex items-start justify-between gap-4">
          <h3 className="font-display text-2xl font-bold tracking-tight text-[var(--color-text)] md:text-3xl">
            {title}
          </h3>
          <div className="flex shrink-0 gap-3 pt-1">
            {repo && (
              <a
                href={repo}
                target="_blank"
                rel="noreferrer"
                aria-label={`${title} ${repoLabel || "source code"}`}
                className="text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-accent-text)]"
              >
                <Github size={20} aria-hidden="true" />
              </a>
            )}
            {link && (
              <a
                href={link}
                target="_blank"
                rel="noreferrer"
                aria-label={`${title} ${linkLabel || "case study"}`}
                className="text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-accent-text)]"
              >
                <ExternalLink size={20} aria-hidden="true" />
              </a>
            )}
          </div>
        </div>

        <div className="mb-8 space-y-4">
          <p className="leading-relaxed text-[var(--color-text)] opacity-90">{description}</p>
          {problem && (
            <p className="text-sm leading-relaxed text-[var(--color-text-muted)] md:text-base">
              {problem}
            </p>
          )}
          {built && (
            <p className="text-sm leading-relaxed text-[var(--color-text-muted)] md:text-base">
              {built}
            </p>
          )}

          {highlight && (
            <div className="flex gap-3 rounded-[var(--radius-media)] border border-[var(--color-accent-border)] bg-[var(--color-accent-soft)] px-4 py-3">
              <Cpu
                size={18}
                aria-hidden="true"
                className="mt-0.5 shrink-0 text-[var(--color-accent)]"
              />
              <p className="text-sm leading-relaxed text-[var(--color-text)]">{highlight}</p>
            </div>
          )}
        </div>

        <div className="mt-auto flex flex-wrap gap-2">
          {(tags || []).map((tag) => (
            <span
              key={tag}
              className="rounded-[var(--radius-pill)] border border-[var(--color-border)] bg-[var(--color-pill)] px-3 py-1 text-xs font-medium text-[var(--color-text-muted)]"
            >
              {tag}
            </span>
          ))}
        </div>

        {(repo || link) && (
          <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-[var(--color-border-soft)] pt-5 text-sm font-semibold">
            {repo && (
              <a
                href={repo}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-accent-text)]"
              >
                <Github size={16} aria-hidden="true" />
                {repoLabel || "Source"}
              </a>
            )}
            {link && (
              <a
                href={link}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-accent-text)]"
              >
                <ExternalLink size={16} aria-hidden="true" />
                {linkLabel || "Case study"}
              </a>
            )}
          </div>
        )}
      </div>
    </article>
  );
};

export default ProjectCard;
