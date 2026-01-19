import React from "react";
import ProjectCard from "./components/ProjectCard";
import { Mail, Linkedin, Github, ArrowDown, MapPin } from "lucide-react";

function App() {
  const projects = [
    {
      title: "Badminton Tracker",
      description:
        "A full-stack match analytics platform. Built with a React frontend and MongoDB backend to track real-time scores and historical match performance.",
      tags: ["MERN Stack", "Tailwind CSS", "Data Analytics"],
      repo: "https://github.com/nleelath/badminton_tracker",
      link: "#",
    },
    {
      title: "Upcoming Project",
      description:
        "Hardware-focused development exploring GPU microarchitectures and parallel processing optimization.",
      tags: ["Hardware", "VLSI", "Architecture"],
      repo: "#",
      link: "#",
    },
    {
      title: "Upcoming Project",
      description:
        "Low-level systems project focused on high-performance computing and memory management.",
      tags: ["C++", "Systems", "Optimization"],
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

  const scrollToWork = () => {
    document.getElementById("work")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="relative selection:bg-blue-500/40">
      {/* 1. FIXED BACKGROUND */}
      <div className="fixed inset-0 -z-10 h-screen w-full">
        {/* Path updated to match your pushed file name exactly */}
        <img
          src="/background2.gif"
          className="w-full h-full object-cover"
          alt="background"
        />
        {/* Subtle overlay to help white text pop */}
        <div className="absolute inset-0 bg-black/30"></div>
      </div>

      {/* 2. CONTENT LAYER */}
      <div className="relative z-10">
        {/* Glassmorphism Nav */}
        <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-black/50 backdrop-blur-md">
          <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
            <span className="text-xl font-black tracking-tighter text-white">
              PORTFOLIO.
            </span>
            <div className="flex gap-8 text-sm font-medium text-white/70">
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

        {/* Hero Section */}
        <header className="relative h-screen flex items-center px-6 max-w-6xl mx-auto">
          <div className="relative z-10">
            {/* Changed to white */}
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

            {/* Changed description to white/90 */}
            <p className="max-w-xl text-white/90 text-lg md:text-xl mb-10 leading-relaxed">
              Focused on mastering VLSI design and computer architecture to
              innovate the future of GPU development
            </p>

            <div className="flex gap-4">
              <button
                onClick={scrollToWork}
                className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-full font-bold transition-all transform hover:scale-105 active:scale-95"
              >
                View Projects
              </button>
              <div className="flex items-center gap-6 px-4">
                {/* Updated with your specific links */}
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

        {/* 3. THE TRANSITION: Fades GIF out into solid black */}
        <div className="h-40 bg-gradient-to-b from-transparent to-[#050505]"></div>

        {/* 4. SOLID BLACK SECTION */}
        <main className="bg-[#050505]">
          <section id="work" className="max-w-6xl mx-auto px-6 py-24">
            <div className="flex items-end justify-between mb-16">
              <div>
                <h2 className="text-4xl font-bold tracking-tight mb-2 text-white">
                  Selected Works
                </h2>
                <div className="h-1 w-20 bg-blue-600" />
              </div>
              <ArrowDown className="text-white/30 animate-bounce" />
            </div>

            {/* Standard 3-column grid layout */}
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
                  {/* Hobby Image */}
                  <div className="aspect-video w-full overflow-hidden">
                    <img
                      src={hobby.image}
                      alt={hobby.name}
                      className="w-full h-full object-cover grayscale group-hover:grayscale-0 group-hover:scale-105 transition-all duration-500"
                    />
                  </div>

                  {/* Text Content */}
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

          {/* Contact Section */}
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
