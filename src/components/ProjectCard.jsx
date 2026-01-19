// src/components/ProjectCard.jsx
import React from 'react';
import { ExternalLink, Github } from 'lucide-react';

const ProjectCard = ({ title, description, tags, repo, link }) => {
  return (
    <div className="group relative bg-[#111] border border-white/10 p-8 rounded-3xl hover:border-blue-500/50 transition-all duration-500 shadow-2xl h-full flex flex-col">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl" />
      
      <div className="relative z-10 flex flex-col h-full">
        <div className="flex justify-between items-start mb-6">
          <h3 className="text-2xl font-bold text-white tracking-tight">{title}</h3>
          <div className="flex gap-3">
            <a href={repo} target="_blank" rel="noreferrer" className="text-gray-400 hover:text-white transition-colors">
              <Github size={20} />
            </a>
            <a href={link} target="_blank" rel="noreferrer" className="text-gray-400 hover:text-white transition-colors">
              <ExternalLink size={20} />
            </a>
          </div>
        </div>
        
        {/* REMOVED line-clamp-3 HERE */}
        <p className="text-gray-400 mb-8 leading-relaxed">
          {description}
        </p>
        
        <div className="flex flex-wrap gap-2 mt-auto">
          {tags.map((tag) => (
            <span key={tag} className="text-[10px] font-black uppercase tracking-widest text-blue-400 bg-blue-400/5 border border-blue-400/20 px-3 py-1 rounded-full">
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProjectCard;