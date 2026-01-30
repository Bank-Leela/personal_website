import React, { useState, useEffect, useRef } from "react";
import ProjectCard from "./components/ProjectCard";
import Globe from "react-globe.gl";
import {
  Mail,
  Linkedin,
  Github,
  MapPin,
  FileText,
  Globe as GlobeIcon,
} from "lucide-react";

function App() {
  // --- GLOBE FEATURE LOGIC START ---
  const globeRef = useRef();

  const markerData = [
    {
      lat: 43.4643,
      lng: -80.5204,
      label: "Waterloo, ON",
      timeZone: "America/Toronto",
      color: "#3b82f6",
    },
    {
      lat: 13.7563,
      lng: 100.5018,
      label: "Bangkok, TH",
      timeZone: "Asia/Bangkok",
      color: "#3b82f6",
    },
  ];

  const arcsData = [
    {
      startLat: 13.7563,
      startLng: 100.5018,
      endLat: 43.4643,
      endLng: -80.5204,
      color: ["#3b82f6", "#ffffff"],
    },
  ];

  const getFormattedTime = (tz) => {
    return new Intl.DateTimeFormat("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
      timeZone: tz,
    }).format(new Date());
  };

  const GlobeBox = () => {
    const [displayTime, setDisplayTime] = useState({
      label: "LOCAL TIME",
      time: getFormattedTime("America/Toronto"),
      location: "Waterloo, ON (GMT-4)",
    });

    useEffect(() => {
      if (globeRef.current) {
        const controls = globeRef.current.controls();
        controls.autoRotate = true;
        controls.autoRotateSpeed = 0.7;
        controls.enableZoom = false;
        globeRef.current.pointOfView({ lat: 20, lng: 10, altitude: 2.2 });
      }

      const timer = setInterval(() => {
        const tz = displayTime.location.includes("Bangkok")
          ? "Asia/Bangkok"
          : "America/Toronto";
        setDisplayTime((prev) => ({ ...prev, time: getFormattedTime(tz) }));
      }, 1000);

      return () => clearInterval(timer);
    }, [displayTime.location]);

    return (
      <div className="bg-[#0f0f0f] border border-white/5 rounded-[32px] p-8 h-[520px] flex flex-col justify-between relative overflow-hidden group shadow-2xl w-full">
        <div className="flex justify-between items-start z-10">
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">
            {displayTime.label}
          </span>
          <GlobeIcon
            size={20}
            className="text-white/20 group-hover:text-blue-500 transition-colors"
          />
        </div>

        <div className="absolute inset-0 flex items-center justify-center pointer-events-auto">
          <Globe
            ref={globeRef}
            width={480}
            height={480}
            backgroundColor="rgba(0,0,0,0)"
            globeImageUrl="//unpkg.com/three-globe/example/img/earth-dark.jpg"
            bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
            atmosphereColor="#3b82f6"
            atmosphereDaylightAlpha={0.1}
            pointsData={markerData}
            pointColor="color"
            pointRadius={0.7}
            onPointClick={(point) => {
              setDisplayTime({
                label: "SELECTED LOCATION",
                time: getFormattedTime(point.timeZone),
                location:
                  point.label === "Waterloo, ON"
                    ? "Waterloo, ON (GMT-4)"
                    : "Bangkok, TH (GMT+7)",
              });
            }}
            labelsData={markerData}
            labelText="label"
            labelSize={1.5}
            labelColor={() => "#ffffff"}
            labelDotRadius={0.4}
            labelAltitude={0.05}
            arcsData={arcsData}
            arcColor="color"
            arcDashLength={0.4}
            arcDashGap={4}
            arcDashAnimateTime={1500}
            arcStroke={0.5}
          />
        </div>

        <div className="z-10">
          <h2 className="text-7xl font-black text-white tracking-tighter mb-2 tabular-nums">
            {displayTime.time}
          </h2>
          <p className="text-sm font-bold text-white/40 uppercase tracking-wide">
            {displayTime.location}
          </p>
        </div>
      </div>
    );
  };
  // --- GLOBE FEATURE LOGIC END ---

  const SocialLinks = () => {
    return (
      <div className="flex items-center gap-3">
        {[
          { icon: Mail, href: "mailto:natdanai.leelathanapipat@gmail.com", label: "Gmail" },
          { icon: Github, href: "https://github.com/Bank-Leela", label: "Github" },
          { icon: Linkedin, href: "https://www.linkedin.com/in/bank-leelathanapipat", label: "LinkedIn" },
          { icon: FileText, href: "/Bank_Leela.pdf", label: "Resume" },
        ].map((social, i) => (
          <a
            key={i}
            href={social.href}
            target="_blank"
            rel="noreferrer"
            className="w-12 h-12 flex items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/60 hover:text-blue-500 hover:border-blue-500 hover:bg-blue-500/10 transition-all duration-300"
            title={social.label}
          >
            <social.icon size={20} />
          </a>
        ))}
      </div>
    );
  };

  const experience = [
    {
      company: "IEEE",
      role: "Research Assistant",
      period: "Jul 2024 — May 2025",
      description: "Engineered a low-budget IoT water level measurement system using ESP32 to facilitate flood mitigation. Results are officially published in the IEEE Xplore Digital Library.",
      tags: ["IoT", "ESP32", "System Design", "Research"],
    },
    {
      company: "ODDS-Thailand",
      role: "Software Engineering Intern",
      period: "Jul 2024 — Aug. 2024",
      description: "Developed responsive UI components for a $300M financial platform. Optimized database queries for a MongoDB cluster containing 20M+ entries.",
      tags: ["React", "Tailwind CSS", "MongoDB", "Optimization"],
    },
    {
      company: "NurseMetrics",
      role: "Lead Developer",
      period: "May 2023 — Aug. 2024",
      description: "Architected a KPI tracking web application using Google Apps Script (JavaScript) to automate data entry, reducing reporting time by 70%.",
      tags: ["JavaScript", "Automation", "Healthcare Tech"],
    },
  ];

  const projects = [
    {
      title: "Badminton Tracker",
      description: "A full-stack match analytics platform. Built with a React frontend and MongoDB backend to track real-time scores and historical match performance.",
      tags: ["MERN Stack", "API Development", "Tailwind CSS", "Data Analytics", "MongoDB"],
      repo: "https://github.com/Bank-Leela/badminton_tracker",
    },
    { title: "Upcoming Project", description: "...", tags: [] },
    { title: "Upcoming Project", description: "...", tags: [] },
  ];

  const hobbies = [
    {
      name: "Badminton",
      image: "kv.jpg",
      description: "Inspired by the technical precision and tactical brilliance of Kunlavut Vitidsarn, I enjoy studying the mechanics of the game and applying elite strategies to the court.",
    },
    {
      name: "Anime",
      image: "frieren.jpg",
      description: "In my free time, I watch anime and read some manga. Favorites include Your Name, Clannad, and Charlotte.",
    },
    {
      name: "Gaming",
      image: "minecraft.avif",
      description: "Strategy and teamwork focused. I enjoy Valorant, Minecraft, and co-op horror like Phasmophobia and Devour.",
    },
  ];

  return (
    <div className="relative selection:bg-blue-500/40">
      <div className="fixed inset-0 -z-10 h-screen w-full">
        <img src="/background2.gif" className="w-full h-full object-cover" alt="background" />
        <div className="absolute inset-0 bg-black/30"></div>
      </div>

      <div className="relative z-10">
        <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-black/50 backdrop-blur-md">
          <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
            <span className="text-xl font-black tracking-tighter text-white">Bank Leelathanapipat</span>
            <div className="flex gap-8 text-sm font-medium text-white/70">
              <a href="#experience" className="hover:text-white transition-colors">Experience</a>
              <a href="#work" className="hover:text-white transition-colors">Work</a>
              <a href="#hobbies" className="hover:text-white transition-colors">Hobbies</a>
              <a href="#contact" className="hover:text-white transition-colors">Contact</a>
            </div>
          </div>
        </nav>

        {/* ✅ HERO: Simplified (Globe removed from here) */}
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

            <p className="max-w-xl text-white/90 text-lg md:text-xl mb-10 leading-relaxed font-medium">
              Focused on mastering VLSI design and computer architecture to innovate the future of GPU development
            </p>

            <div className="flex flex-wrap items-center gap-6">
              <button
                onClick={() => document.getElementById("experience")?.scrollIntoView({ behavior: "smooth" })}
                className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-full font-bold transition-all transform hover:scale-105 active:scale-95 shadow-lg shadow-blue-600/20"
              >
                View Experience
              </button>
              <SocialLinks />
            </div>
          </div>
        </header>

        <div className="h-40 bg-gradient-to-b from-transparent to-[#050505]"></div>

        <main className="bg-[#050505]">
          {/* EXPERIENCE */}
          <section id="experience" className="max-w-6xl mx-auto px-6 py-24">
            <div className="mb-20 group">
              <h2 className="text-2xl uppercase tracking-[0.4em] text-white/40 mb-4 font-black">Professional Journey</h2>
              <div className="h-[1px] w-full bg-white/10 group-hover:bg-blue-500/50 transition-colors duration-300" />
            </div>
            <div className="space-y-24">
              {experience.map((job, i) => (
                <div key={i} className="group relative grid grid-cols-1 md:grid-cols-[1fr_auto] gap-x-12 gap-y-6">
                  <div className="space-y-6">
                    <div className="space-y-3">
                      <h3 className="text-4xl md:text-5xl font-black text-white group-hover:text-blue-500 transition-colors duration-500 tracking-tighter">{job.company}</h3>
                      <p className="text-xl text-white/80 font-bold tracking-tight">{job.role}</p>
                    </div>
                    <p className="max-w-3xl text-white/50 leading-relaxed text-lg">{job.description}</p>
                    <div className="flex flex-wrap gap-2">
                      {job.tags.map((tag) => (
                        <span key={tag} className="text-[10px] font-black uppercase tracking-widest px-3 py-1 border border-white/10 text-white/40 bg-white/5">{tag}</span>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-col items-end justify-between py-2 md:border-l border-white/10 md:pl-8 h-full">
                    <span className="text-sm font-bold text-white/30 uppercase tracking-tighter tabular-nums">{job.period}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* WORKS */}
          <section id="work" className="max-w-6xl mx-auto px-6 py-24 border-t border-white/5">
            <div className="mb-20 group">
              <h2 className="text-2xl uppercase tracking-[0.4em] text-white/40 mb-4 font-black">Selected Works</h2>
              <div className="h-[1px] w-full bg-white/10 group-hover:bg-blue-500/50 transition-colors duration-300" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {projects.map((p, i) => (<ProjectCard key={i} {...p} />))}
            </div>
          </section>

          {/* HOBBIES */}
          <section id="hobbies" className="max-w-6xl mx-auto px-6 py-24 border-t border-white/5">
            <div className="mb-20 group">
              <h2 className="text-2xl uppercase tracking-[0.4em] text-white/40 mb-4 font-black">Beyond the Code</h2>
              <div className="h-[1px] w-full bg-white/10 group-hover:bg-blue-500/50 transition-colors duration-300" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {hobbies.map((hobby, i) => (
                <div key={i} className="rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] transition-all group overflow-hidden">
                  <div className="aspect-video w-full overflow-hidden">
                    <img src={hobby.image} alt={hobby.name} className="w-full h-full object-cover grayscale group-hover:grayscale-0 group-hover:scale-105 transition-all duration-500" />
                  </div>
                  <div className="p-8">
                    <h3 className="text-xl font-bold text-white mb-2">{hobby.name}</h3>
                    <p className="text-white/50 text-sm">{hobby.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ✅ UPDATED CONTACT FOOTER: New Layout with Globe */}
          <footer id="contact" className="max-w-7xl mx-auto px-6 py-32 border-t border-white/5">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              {/* LEFT SIDE: Reference style text */}
              <div>
                <h2 className="text-6xl md:text-8xl font-black text-white tracking-tighter mb-4">
                  send me <br /> anything!
                </h2>
                <p className="text-xl text-white/50 mb-12 font-medium">chat? i love to meet new people.</p>

                <div className="space-y-2">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 italic">
                    QUESTIONS? HIT ME UP ↓
                  </p>
                  <a
                    href="mailto:nleelath@uwaterloo.ca"
                    className="text-2xl md:text-4xl font-black text-white hover:text-blue-500 transition-colors underline decoration-blue-500/30 underline-offset-8"
                  >
                    nleelath@uwaterloo.ca
                  </a>
                </div>
              </div>

              {/* RIGHT SIDE: Globe Moved Here */}
              <div className="flex justify-end ml-auto">
                <div className="w-full max-w-[560px]">
                  <GlobeBox />
                </div>
              </div>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}

export default App;