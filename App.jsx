import React from 'react';
import ProjectCard from './components/ProjectCard';
import { Mail, Linkedin, Github, ArrowDown } from 'lucide-react';

function App() {
  const projects = [
    { title: "Neuro-Link UI", description: "A dark-themed interface for neural network visualization using Three.js and React.", tags: ["React", "Three.js", "Tailwind"], repo: "#", demo: "#" },
    { title: "Vault Keeper", description: "Encrypted password manager with biometric simulation and cloud sync.", tags: ["Node.js", "AES-256", "React"], repo: "#", demo: "#" },
    { title: "SkyCast AI", description: "Weather prediction app using machine learning to forecast localized micro-climates.", tags: ["Python", "React", "API"], repo: "#", demo: "#" },
  ];

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-blue-500/40">
      
      {/* Glassmorphism Nav */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-black/50 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <span className="text-xl font-black tracking-tighter">PORTFOLIO.</span>
          <div className="flex gap-8 text-sm font-medium text-gray-400">
            <a href="#work" className="hover:text-blue-400 transition-colors">Work</a>
            <a href="#contact" className="hover:text-blue-400 transition-colors">Contact</a>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="relative pt-40 pb-20 px-6 max-w-6xl mx-auto overflow-hidden">
        <div className="relative z-10">
          <p className="text-blue-500 font-mono mb-4 tracking-widest uppercase text-sm">Available for work 2026</p>
          <h1 className="text-7xl md:text-9xl font-black tracking-tighter mb-8 leading-[0.85]">
            BUILDING <br /> 
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-cyan-300 italic">THE FUTURE.</span>
          </h1>
          <p className="max-w-xl text-gray-400 text-lg md:text-xl mb-10 leading-relaxed">
            Specializing in high-end web applications and interactive 3D experiences. 
            Turning complex problems into elegant, code-driven solutions.
          </p>
          
          <div className="flex gap-4">
            <button className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-full font-bold transition-all transform hover:scale-105 active:scale-95">
              View Projects
            </button>
            <div className="flex items-center gap-4 px-6">
              <Github className="text-gray-500 hover:text-white cursor-pointer" />
              <Linkedin className="text-gray-500 hover:text-white cursor-pointer" />
            </div>
          </div>
        </div>
        
        {/* Background "blob" for texture */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/20 blur-[120px] rounded-full -z-10" />
      </header>

      {/* Project Section */}
      <section id="work" className="max-w-6xl mx-auto px-6 py-24">
        <div className="flex items-end justify-between mb-16">
          <div>
            <h2 className="text-4xl font-bold tracking-tight mb-2 text-white">Selected Works</h2>
            <div className="h-1 w-20 bg-blue-600" />
          </div>
          <ArrowDown className="text-gray-700 animate-bounce" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {projects.map((p, i) => (
            <ProjectCard key={i} {...p} />
          ))}
        </div>
      </section>

      {/* Contact Section */}
      <footer id="contact" className="max-w-6xl mx-auto px-6 py-32 border-t border-white/5">
        <div className="text-center">
          <h2 className="text-5xl font-bold mb-6">Let's create something.</h2>
          <a href="mailto:hello@yoursite.com" className="text-2xl text-blue-400 hover:underline decoration-2 underline-offset-8">
            hello@yoursite.com
          </a>
        </div>
      </footer>
    </div>
  );
}

export default App;