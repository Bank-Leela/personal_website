// src/components/ProjectCard.jsx
import React from 'react';
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
  return (
    <div className="group relative flex h-full flex-col rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-8 shadow-2xl transition-all duration-500 hover:border-[var(--color-accent-border)]">
      <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-[var(--color-accent-soft)] via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
      
      <div className="relative z-10 flex flex-col h-full">
        {(image || placeholderLabel) && (
          <div className="mb-6 overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)]">
            {image ? (
              <img
                src={image}
                alt={imageAlt || title}
                className="h-48 w-full object-cover object-top"
              />
            ) : (
              <div className="flex h-48 w-full items-center justify-center bg-gradient-to-br from-[var(--color-accent-soft)] via-[#201717] to-[var(--color-bg)]">
                <span className="text-sm font-black uppercase tracking-[0.3em] text-[var(--color-text-muted)]">
                  {placeholderLabel}
                </span>
              </div>
            )}
          </div>
        )}

        <div className="flex justify-between items-start mb-6">
          <h3 className="text-2xl font-bold tracking-tight text-[var(--color-text)]">{title}</h3>
          <div className="flex gap-3">
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
        
        <div className="flex flex-wrap gap-2 mt-auto">
          {(tags || []).map((tag) => (
            <span key={tag} className="rounded-full border border-[var(--color-accent-border)] bg-[var(--color-accent-soft)] px-3 py-1 text-[10px] font-black uppercase tracking-widest text-[var(--color-tag-text)]">
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProjectCard;
