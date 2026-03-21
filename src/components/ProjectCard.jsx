// src/components/ProjectCard.jsx
import React, { useState } from 'react';
import { ExternalLink, Github } from 'lucide-react';

const ProjectCard = ({
  title,
  description,
  tags,
  repo,
  link,
  image,
  imageAlt,
  placeholderLabel,
}) => {
  const [pointer, setPointer] = useState({ x: 50, y: 50, active: false });

  const handlePointerMove = (event) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - bounds.left) / bounds.width) * 100;
    const y = ((event.clientY - bounds.top) / bounds.height) * 100;
    setPointer({ x, y, active: true });
  };

  const handlePointerLeave = () => {
    setPointer({ x: 50, y: 50, active: false });
  };

  const rotateX = ((pointer.y - 50) / 50) * -5;
  const rotateY = ((pointer.x - 50) / 50) * 5;

  return (
    <div
      className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-8 shadow-2xl transition-all duration-500 hover:border-[var(--color-accent-border)]"
      onMouseMove={handlePointerMove}
      onMouseLeave={handlePointerLeave}
      style={{
        transform: pointer.active
          ? `perspective(1200px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-6px)`
          : "perspective(1200px) rotateX(0deg) rotateY(0deg) translateY(0px)",
      }}
    >
      <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-[var(--color-accent-soft)] via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
      <div
        className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{
          background: `radial-gradient(circle at ${pointer.x}% ${pointer.y}%, var(--color-accent-soft), transparent 34%)`,
        }}
      />

      <div className="relative z-10 flex flex-col h-full">
        {(image || placeholderLabel) && (
          <div className="mb-6 overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)]">
            {image ? (
              <img
                src={image}
                alt={imageAlt || title}
                className="h-48 w-full object-cover object-top transition-transform duration-700 group-hover:scale-[1.04]"
              />
            ) : (
              <div className="flex h-48 w-full items-center justify-center bg-gradient-to-br from-[var(--color-accent-soft)] via-[#201717] to-[var(--color-bg)] transition-transform duration-700 group-hover:scale-[1.03]">
                <span className="text-sm font-black uppercase tracking-[0.3em] text-[var(--color-text-muted)]">
                  {placeholderLabel}
                </span>
              </div>
            )}
          </div>
        )}

        <div className="flex justify-between items-start mb-6">
          <h3 className="text-2xl font-bold tracking-tight text-[var(--color-text)]">{title}</h3>
          <div className="flex gap-3 opacity-75 transition-all duration-300 group-hover:translate-x-0.5 group-hover:opacity-100">
            {repo && (
              <a href={repo} target="_blank" rel="noreferrer" className="text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text)]">
                <Github size={20} />
              </a>
            )}
            {link && (
              <a href={link} target="_blank" rel="noreferrer" className="text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text)]">
                <ExternalLink size={20} />
              </a>
            )}
          </div>
        </div>
        
        <p className="mb-8 leading-relaxed text-[var(--color-text-muted)]">
          {description}
        </p>
        
        <div className="mt-auto flex flex-wrap gap-2">
          {(tags || []).map((tag) => (
            <span key={tag} className="rounded-full border border-[var(--color-accent-border)] bg-[var(--color-accent-soft)] px-3 py-1 text-[10px] font-black uppercase tracking-widest text-[var(--color-tag-text)]">
              {tag}
            </span>
          ))}
        </div>

        {(repo || link) && (
          <div className="mt-8 flex items-center justify-between border-t border-[var(--color-border-soft)] pt-5 text-sm text-[var(--color-text-muted)]">
            <span className="translate-y-2 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
              hover to inspect
            </span>
            <div className="flex items-center gap-4">
              {repo && (
                <a
                  href={repo}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex translate-y-2 items-center gap-2 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 hover:text-[var(--color-text)]"
                >
                  <Github size={16} />
                  Source
                </a>
              )}
              {link && (
                <a
                  href={link}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex translate-y-2 items-center gap-2 opacity-0 transition-all duration-300 delay-75 group-hover:translate-y-0 group-hover:opacity-100 hover:text-[var(--color-text)]"
                >
                  <ExternalLink size={16} />
                  Live
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectCard;
