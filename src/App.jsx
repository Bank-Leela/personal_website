import React from "react";
import ProjectCard from "./components/ProjectCard";
import { Mail, Linkedin, Github, ArrowDown, MapPin } from "lucide-react";

function App() {
  const experience = [
    {
      company: "IEEE",
      role: "Research Assistant",
      period: "Jul 2024 — May 2025",
      description: "Engineered a low-budget IoT water level measurement system using ESP32 to facilitate flood mitigation. Results are officially published in the IEEE Xplore Digital Library.",
      tags: ["IoT", "ESP32", "System Design", "Research"],
      link: "#"
    },
    {
      company: "ODDS-Thailand",
      role: "Software Engineering Intern",
      period: "Jul 2024 — Aug. 2024",
      description: "Developed responsive UI components for a $300M financial platform. Optimized database queries for a MongoDB cluster containing 20M+ entries.",
      tags: ["React", "Tailwind CSS", "MongoDB", "Optimization"],
      link: "#"
    },
    {
      company: "NurseMetrics",
      role: "Lead Developer",
      period: "May 2023 — Aug. 2024",
      description: "Architected a KPI tracking web application using Google Apps Script (JavaScript) to automate data entry, reducing reporting time by 70%.",
      tags: ["JavaScript", "Automation", "Healthcare Tech"],
      link: "#"
    }
  ];

  const projects = [
    {
      title: "Badminton Tracker",
      description:
        "A full-stack match analytics platform. Built with a React frontend and MongoDB backend to track real-time scores and historical match performance.",
      tags: ["MERN Stack", "API Development", "Tailwind CSS", "Data Analytics", "MongoDB"],
      repo: "https://github.com/Bank-Leela/badminton_tracker",
      link: "#",
    },
    {
      title: "Upcoming Project",
      description: "...",
      tags: [],
      repo: "#",
      link: "#",
    },
    {
      title: "Upcoming Project",
      description:
        "...",
      tags: [],
      repo: "#",
      link: "#",
    },
  ];

  const hobbies = [
    {
      name: "Badminton",
      image: "kv.jpg",
      description:
        "Inspired by the technical precision and tactical brilliance of Kunlavut Vitidsarn, I enjoy studying the mechanics of the game and applying elite strategies to the court.",
    },
    {
      name: "Anime",
      image: "frieren.jpg",
      description:
        "In my free time, I watch anime and read some manga. Some favorite anime I watch so far are: Gotoubun no Hanayome, Your Name, Clannad, Charlotte, Reborn, and Love, Chunibyo & Other Delusions!",
    },
    {
      name: "Gaming",
      image: "minecraft.avif",
      description:
        "Strategy and teamwork focused. I enjoy the tactical depth of Valorant, the sandbox creativity of Minecraft, and the high-pressure coordination required in co-op horror like Phasmophobia and Devour.",
    },
  ];

  const scrollToExperience = () => {
    document.getElementById("experience")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="relative selection:bg-blue-500/40">
      <div className="fixed inset-0 -z-10 h-screen w-full">
        <img
          src="/background2.gif"
          className="w-full h-full object-cover"
          alt="background"
        />
        <div className="absolute inset-0 bg-black/30"></div>
      </div>

      <div className="relative z-10">
        <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-black/50 backdrop-blur-md">
          <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
            <span className="text-xl font-black tracking-tighter text-white">
              Natdanai (Bank) Leelathanapipat
            </span>
            <div className="flex gap-8 text-sm font-medium text-white/70">
              <a href="#experience" className="hover:text-white transition-colors">
                Experience
              </a>
              <a href="#work" className="hover:text-white transition-colors">
                Work
              </a>
              <a href="#hobbies" className="hover:text-white transition-colors">
                Hobbies
              </a>
              <a href="#contact" className="hover:text-white transition-colors">
                Contact
              </a>
            </div>
          </div>
        </nav>

        <header className="relative h-screen flex items-center px-6 max-w-6xl mx-auto">
          <div className="relative z-10">
            <div className="flex flex-wrap items-center gap-3 mb-8">
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm">
                <MapPin size={14} className="text-blue-500" />
                <span className="text-white text-xs font-medium tracking-wide">
                  Waterloo/Toronto, ON | Bangkok, TH
                </span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 backdrop-blur-sm">
                <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                <span className="text-white text-xs font-medium tracking-wide uppercase">
                  Available for work 2026
                </span>
              </div>
            </div>

            <h1 className="text-6xl md:text-8xl font-black text-white tracking-tighter mb-8 leading-[0.85]">
              Bank Leelathanapipat
            </h1>
            <p className="text-xl md:text-2xl font-bold text-white mb-8 tracking-tight opacity-90">
              Comp Eng '30 | UWaterloo
            </p>

            <p className="max-w-xl text-white/90 text-lg md:text-xl mb-10 leading-relaxed">
              Focused on mastering VLSI design and computer architecture to
              innovate the future of GPU development
            </p>

            <div className="flex gap-4">
              <button
                onClick={scrollToExperience}
                className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-full font-bold transition-all transform hover:scale-105 active:scale-95"
              >
                View Experience
              </button>
              <div className="flex items-center gap-6 px-4">
                <a
                  href="https://github.com/Bank-Leela"
                  target="_blank"
                  rel="noreferrer"
                >
                  <Github
                    className="text-white/60 hover:text-white cursor-pointer transition-colors"
                    size={28}
                  />
                </a>
                <a
                  href="https://www.linkedin.com/in/bank-leelathanapipat"
                  target="_blank"
                  rel="noreferrer"
                >
                  <Linkedin
                    className="text-white/60 hover:text-white cursor-pointer transition-colors"
                    size={28}
                  />
                </a>
              </div>
            </div>
          </div>
        </header>

        <div className="h-40 bg-gradient-to-b from-transparent to-[#050505]"></div>

        <main className="bg-[#050505]">
          {/* Professional Journey Section */}
          <section id="experience" className="max-w-6xl mx-auto px-6 py-24">
            <div className="mb-20">
              <h2 className="text-sm uppercase tracking-[0.3em] text-white/40 mb-4 font-black">
                Professional Journey
              </h2>
              <div className="h-[1px] w-full bg-white/10" />
            </div>

            <div className="space-y-24">
              {experience.map((job, i) => (
                <div key={i} className="group relative grid grid-cols-1 md:grid-cols-[1fr_auto] gap-x-12 gap-y-6">
                  <div className="space-y-6">
                    <div className="space-y-3">
                      <h3 className="text-4xl md:text-5xl font-black text-white group-hover:text-blue-500 transition-colors duration-500 tracking-tighter">
                        {job.company}
                      </h3>
                      <p className="text-xl text-white/80 font-bold tracking-tight">
                        {job.role}
                      </p>
                    </div>
                    
                    <p className="max-w-3xl text-white/50 leading-relaxed text-lg">
                      {job.description}
                    </p>

                    <div className="flex flex-wrap gap-2">
                      {job.tags.map((tag) => (
                        <span key={tag} className="text-[10px] font-black uppercase tracking-widest px-3 py-1 border border-white/10 text-white/40 bg-white/5">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col items-end justify-between py-2 md:border-l border-white/10 md:pl-8 h-full">
                    <span className="text-sm font-bold text-white/30 uppercase tracking-tighter">
                      {job.period}
                    </span>
                    {job.link !== "#" && (
                      <a href={job.link} target="_blank" rel="noreferrer" className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-500 hover:text-white transition-colors mt-auto">
                        VISIT SITE →
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Selected Works Section */}
          <section id="work" className="max-w-6xl mx-auto px-6 py-24 border-t border-white/5">
            <div className="flex items-end justify-between mb-16">
              <div>
                <h2 className="text-4xl font-bold tracking-tight mb-2 text-white">
                  Selected Works
                </h2>
                <div className="h-1 w-20 bg-blue-600" />
              </div>
              <ArrowDown className="text-white/30 animate-bounce" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {projects.map((p, i) => (
                <ProjectCard key={i} {...p} />
              ))}
            </div>
          </section>

          {/* Hobby Section */}
          <section
            id="hobbies"
            className="max-w-6xl mx-auto px-6 py-24 border-t border-white/5"
          >
            <div className="mb-16">
              <h2 className="text-4xl font-bold tracking-tight mb-2 text-white">
                Beyond the Code
              </h2>
              <div className="h-1 w-20 bg-blue-600" />
              <p className="mt-6 text-white/60 max-w-xl">
                When I'm not in the lab or debugging React, you can find me
                exploring these interests.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {hobbies.map((hobby, i) => (
                <div
                  key={i}
                  className="rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] transition-all group overflow-hidden"
                >
                  <div className="aspect-video w-full overflow-hidden">
                    <img
                      src={hobby.image}
                      alt={hobby.name}
                      className="w-full h-full object-cover grayscale group-hover:grayscale-0 group-hover:scale-105 transition-all duration-500"
                    />
                  </div>

                  <div className="p-8">
                    <h3 className="text-xl font-bold text-white mb-2">
                      {hobby.name}
                    </h3>
                    <p className="text-white/50">{hobby.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <footer
            id="contact"
            className="max-w-6xl mx-auto px-6 py-32 border-t border-white/5"
          >
            <div className="text-center">
              <h2 className="text-5xl font-bold mb-6 text-white">
                Let's create something.
              </h2>
              <a
                href="mailto:nleelath@uwaterloo.ca"
                className="text-2xl text-white hover:text-blue-400 hover:underline decoration-2 underline-offset-8 transition-all"
              >
                nleelath@uwaterloo.ca
              </a>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}

export default App;