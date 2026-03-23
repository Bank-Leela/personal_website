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
  Moon,
  Sun,
} from "lucide-react";

function App() {
  const headerRef = useRef(null);
  const [heroGlow, setHeroGlow] = useState({ x: 50, y: 50, active: false });
  const [activeSection, setActiveSection] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [theme, setTheme] = useState(() => {
    if (typeof window === "undefined") {
      return "dark";
    }

    return localStorage.getItem("theme") || "dark";
  });

  // --- COPY EMAIL LOGIC ---
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    const minimumLoad = window.setTimeout(() => {
      setIsLoading(false);
    }, 1400);

    return () => window.clearTimeout(minimumLoad);
  }, []);

  useEffect(() => {
    document.body.style.overflow = isLoading ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [isLoading]);

  useEffect(() => {
    const sectionIds = ["experience", "work", "hobbies", "contact"];

    const updateActiveSection = () => {
      const navOffset = 120;
      const scrollPosition = window.scrollY + navOffset;
      const sections = sectionIds
        .map((id) => document.getElementById(id))
        .filter(Boolean);

      if (sections.length === 0) {
        return;
      }

      const firstSectionTop = sections[0].offsetTop;

      if (scrollPosition < firstSectionTop) {
        setActiveSection(null);
        return;
      }

      let currentSection = sections[0].id;

      sections.forEach((section) => {
        if (scrollPosition >= section.offsetTop) {
          currentSection = section.id;
        }
      });

      setActiveSection(currentSection);
    };

    updateActiveSection();
    window.addEventListener("scroll", updateActiveSection, { passive: true });
    window.addEventListener("resize", updateActiveSection);

    return () => {
      window.removeEventListener("scroll", updateActiveSection);
      window.removeEventListener("resize", updateActiveSection);
    };
  }, []);

  useEffect(() => {
    const syncHashSection = () => {
      const hash = window.location.hash.replace("#", "");
      if (hash) {
        setActiveSection(hash);
      }
    };

    syncHashSection();
    window.addEventListener("hashchange", syncHashSection);

    return () => window.removeEventListener("hashchange", syncHashSection);
  }, []);

  const handleCopyEmail = (e) => {
    e.preventDefault();
    navigator.clipboard.writeText("nleelath@uwaterloo.ca");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // --- RESPONSIVE GLOBE DIMENSIONS LOGIC ---
  const [globeSize, setGlobeSize] = useState({ width: 600, height: 600 });

  useEffect(() => {
    const handleResize = () => {
      // Calculate width based on screen size: full width on mobile (-padding), fixed 600 on desktop
      const sidePadding = window.innerWidth < 768 ? 64 : 80;
      const size = Math.min(window.innerWidth - sidePadding, 600);
      setGlobeSize({ width: size, height: size });
    };

    window.addEventListener("resize", handleResize);
    handleResize(); // Initialize
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // --- GLOBE FEATURE LOGIC START ---
  const globeRef = useRef();

  const markerData = [
    {
      lat: 43.4643,
      lng: -80.5204,
      label: "Waterloo, ON",
      timeZone: "America/Toronto",
      color: "#e5484d",
    },
    {
      lat: 13.7563,
      lng: 100.5018,
      label: "Bangkok, TH",
      timeZone: "Asia/Bangkok",
      color: "#e5484d",
    },
  ];

  const arcsData = [
    {
      startLat: 13.7563,
      startLng: 100.5018,
      endLat: 43.4643,
      endLng: -80.5204,
      color: ["#e5484d", "#f3f3f3"],
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
        // Adjust altitude slightly for mobile to keep markers visible
        const altitude = window.innerWidth < 768 ? 2.5 : 2.2;
        globeRef.current.pointOfView({ lat: 20, lng: 10, altitude: altitude });
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
      // ✅ RESPONSIVE HEIGHT: h-[400px] on mobile, h-[640px] on desktop
      <div className="group relative flex h-[400px] w-full flex-col justify-between overflow-hidden rounded-[32px] border border-[var(--color-border-soft)] bg-[var(--color-bg-elevated)] p-6 shadow-2xl md:h-[640px] md:p-8">
        <div className="flex justify-between items-start z-10">
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--color-text-muted)]">
            {displayTime.label}
          </span>
          <GlobeIcon
            size={20}
            className="text-[var(--color-text-muted)] transition-colors group-hover:text-[var(--color-accent)]"
          />
        </div>

        <div
          className="absolute inset-0 flex items-center justify-center pointer-events-auto"
          style={
            theme === "light"
              ? {
                  filter:
                    "sepia(0.58) saturate(0.42) hue-rotate(-12deg) brightness(1.08) contrast(0.9)",
                }
              : undefined
          }
        >
          <Globe
            ref={globeRef}
            width={globeSize.width}
            height={globeSize.height}
            backgroundColor="rgba(0,0,0,0)"
            globeImageUrl={
              theme === "dark"
                ? "//unpkg.com/three-globe/example/img/earth-dark.jpg"
                : "//unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
            }
            bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
            atmosphereColor="#e5484d"
            atmosphereDaylightAlpha={theme === "dark" ? 0.1 : 0.18}
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
            labelColor={() => "#f3f3f3"}
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
          <h2 className="mb-2 text-4xl font-black tracking-tighter text-[var(--color-text)] tabular-nums md:text-7xl">
            {displayTime.time}
          </h2>
          <p className="text-[10px] font-bold uppercase tracking-wide text-[var(--color-text-muted)] md:text-sm">
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
          { mask: "/devpost.svg", href: "https://devpost.com/natdanai-leelathanapipat?ref_content=user-portfolio&ref_feature=portfolio&ref_medium=global-nav", label: "Devpost" },
          { icon: FileText, href: "/Bank_Leela.pdf", label: "Resume" },
        ].map((social, i) => (
          <a
            key={i}
            href={social.href}
            target="_blank"
            rel="noreferrer"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-pill)] text-[var(--color-text-muted)] transition-all duration-300 hover:border-[var(--color-accent-border)] hover:bg-[var(--color-accent-soft)] hover:text-[var(--color-accent)] md:h-12 md:w-12"
            title={social.label}
          >
            {social.icon ? (
              <social.icon size={18} />
            ) : (
              <span
                className="h-[18px] w-[18px] bg-current"
                style={{
                  WebkitMaskImage: `url(${social.mask})`,
                  maskImage: `url(${social.mask})`,
                  WebkitMaskRepeat: "no-repeat",
                  maskRepeat: "no-repeat",
                  WebkitMaskPosition: "center",
                  maskPosition: "center",
                  WebkitMaskSize: "contain",
                  maskSize: "contain",
                }}
                aria-hidden="true"
              />
            )}
          </a>
        ))}
      </div>
    );
  };

  const experience = [
    { company: "IEEE", companyUrl: "https://ieeexplore.ieee.org/abstract/document/10811073", role: "Research Assistant", period: "Jul 2024 — May 2025", description: "Engineered a low-budget IoT water level measurement system using ESP32 to facilitate flood mitigation. Results are officially published in the IEEE Xplore Digital Library.", tags: ["IoT", "ESP32", "System Design", "Research"] },
    { company: "ODDS-Thailand", companyUrl: "https://odds.team/", role: "Software Engineering Intern", period: "Jul 2024 — Aug. 2024", description: "Developed responsive UI components for a $300M financial platform. Optimized database queries for a MongoDB cluster containing 20M+ entries.", tags: ["React", "Tailwind CSS", "MongoDB", "Optimization"] },
    { company: "NurseMetrics", role: "Lead Developer", period: "May 2023 — Aug. 2024", description: "Architected a KPI tracking web application using Google Apps Script (JavaScript) to automate data entry, reducing reporting time by 70%.", tags: ["JavaScript", "Automation", "Healthcare Tech"] },
  ];

  const projects = [
    {
      title: "Badminton Tracker",
      description: "A full-stack match analytics platform for competitive players who want more than a running score.",
      problem: "Most casual score trackers stop at points. I wanted a tool that could also capture match history and make performance trends easier to analyze over time.",
      built: "I built the frontend and backend flow for real-time scorekeeping, match history storage, and an interface that makes past performance easy to review.",
      highlight: "Designed the stack around live updates plus persistent analytics, balancing responsive match-day interactions with longer-term data tracking.",
      tags: ["MERN Stack", "TypeScript", "API Development", "Tailwind CSS", "Data Analytics", "MongoDB"],
      repo: "https://github.com/Bank-Leela/badminton_tracker",
      repoLabel: "Source",
      placeholderLabel: "Coming Soon",
    },
    {
      title: "Sentinel",
      description: "A hackathon-built fraud detection platform designed to help analysts investigate suspicious behavior beyond isolated transactions.",
      problem: "Fraud tools often surface alerts without enough context. We wanted a system that could help analysts understand connected activity, not just single anomalous events.",
      built: "I contributed to a workflow that combines anomaly scoring, rules, graph-based investigation, and a UI for triage so teams can move from alert to explanation faster.",
      highlight: "The main challenge was combining multiple detection strategies into one analyst-friendly experience without losing clarity during a short hackathon build window.",
      tags: ["Python", "FastAPI", "Next.js", "Machine Learning", "Isolation Forest", "Graph Analysis"],
      repo: "https://github.com/SarveshwarSenthilKumar/Sentinel",
      repoLabel: "Source",
      link: "https://devpost.com/software/sentinel-128ad4",
      linkLabel: "Case Study",
      image: "/sentinel.png",
      imageAlt: "Sentinel fraud detection dashboard",
    },
    {
      title: "Upcoming Project",
      description: "Coming soon...",
      tags: [],
    },
  ];

  const hobbies = [
    { name: "Badminton", image: "kv.jpg", description: "Inspired by the technical precision and tactical brilliance of Kunlavut Vitidsarn, I enjoy studying the mechanics of the game and applying elite strategies to the court." },
    { name: "Anime", image: "frieren.jpg", description: "In my free time, I watch anime and read some manga. Favorites include Your Name, Clannad, and Charlotte." },
    { name: "Gaming", image: "minecraft.avif", description: "Strategy and teamwork focused. I enjoy Valorant, Minecraft, and co-op horror like Phasmophobia and Devour." },
  ];

  const navItems = [
    { id: "experience", label: "Experiences" },
    { id: "work", label: "Work" },
    { id: "hobbies", label: "Hobbies" },
    { id: "contact", label: "Contact" },
  ];

  const handleHeroMouseMove = (event) => {
    if (!headerRef.current) {
      return;
    }

    const bounds = headerRef.current.getBoundingClientRect();
    const x = ((event.clientX - bounds.left) / bounds.width) * 100;
    const y = ((event.clientY - bounds.top) / bounds.height) * 100;
    setHeroGlow({ x, y, active: true });
  };

  const handleHeroMouseLeave = () => {
    setHeroGlow((current) => ({ ...current, active: false }));
  };

  return (
    <div className="relative selection:bg-[var(--color-accent-soft)]">
      <div
        className={`pointer-events-none fixed inset-0 z-[100] flex items-center justify-center bg-[var(--color-bg)] transition-opacity duration-700 ${
          isLoading ? "opacity-100" : "opacity-0"
        }`}
      >
        <div className="flex flex-col items-center gap-6">
          <div className="relative flex h-20 w-20 items-center justify-center">
            <div className="absolute inset-0 rounded-full border border-[var(--color-accent-border)]" />
            <div className="absolute inset-2 rounded-full border-2 border-transparent border-t-[var(--color-accent)] border-r-[var(--color-accent)] animate-spin" />
            <div className="absolute inset-[18px] rounded-full bg-[var(--color-accent-soft)] blur-md" />
            <span className="font-display relative text-2xl font-black tracking-tight text-[var(--color-text)]">
              B
            </span>
          </div>
          <div className="text-center">
            <p className="text-xs font-black uppercase tracking-[0.45em] text-[var(--color-text-muted)]">
              Loading Portfolio
            </p>
            <p className="mt-3 text-lg font-semibold tracking-tight text-[var(--color-text)]">
              Bank Leelathanapipat
            </p>
          </div>
        </div>
      </div>

      <div className="fixed inset-0 -z-10 h-screen w-full bg-[var(--color-bg)]"></div>

      <div className="relative z-10">
        <nav className="fixed top-0 z-50 w-full border-b border-[var(--color-border-soft)] bg-[var(--color-nav)] backdrop-blur-md">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-3 py-4 md:px-4">
            {/* ✅ RESPONSIVE NAV: Smaller text/hidden full name on very small screens */}
            <span className="font-display text-sm font-black tracking-tighter text-[var(--color-text)] md:text-xl">
              <span className="md:hidden">Bank Leela</span>
              <span className="hidden md:inline">Bank Leelathanapipat</span>
            </span>
            <div className="flex items-center gap-4 text-[10px] font-medium text-[var(--color-text-muted)] md:gap-8 md:text-sm">
              {navItems.map((item) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  onClick={() => setActiveSection(item.id)}
                  className={`relative pb-2 transition-colors after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-full after:origin-left after:rounded-full after:bg-[var(--color-accent)] after:transition-transform after:duration-300 ${
                    activeSection === item.id
                      ? "text-[var(--color-text)] after:scale-x-100"
                      : "hover:text-[var(--color-text)] after:scale-x-0 hover:after:scale-x-100"
                  }`}
                >
                  {item.label}
                </a>
              ))}
              <button
                type="button"
                onClick={() => setTheme((currentTheme) => (currentTheme === "dark" ? "light" : "dark"))}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-pill)] text-[var(--color-text-muted)] transition-colors hover:border-[var(--color-accent-border)] hover:text-[var(--color-accent)]"
                aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
                title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              >
                {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
              </button>
            </div>
          </div>
        </nav>

        <header
          ref={headerRef}
          className="relative flex min-h-screen w-full items-center overflow-hidden pt-20"
          onMouseMove={handleHeroMouseMove}
          onMouseLeave={handleHeroMouseLeave}
        >
          <div
            className={`pointer-events-none absolute inset-0 transition-opacity duration-300 ${
              heroGlow.active ? "opacity-100" : "opacity-0"
            }`}
            style={{
              background: `radial-gradient(circle at ${heroGlow.x}% ${heroGlow.y}%, var(--color-accent-soft), transparent 20%)`,
            }}
          />
          <div className="pointer-events-none absolute -left-24 top-28 h-72 w-72 rounded-full bg-[var(--color-accent-soft)] blur-3xl opacity-40" />
          <div className="pointer-events-none absolute right-0 top-16 h-64 w-64 rounded-full bg-[var(--color-accent-soft)] blur-3xl opacity-15" />

          <div className="relative z-10 mx-auto w-full max-w-7xl px-3 md:px-4">
            <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-8">
              <div className="flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-pill)] px-3 py-2 backdrop-blur-sm md:px-4">
                <MapPin size={12} className="text-[var(--color-accent)]" />
                <span className="text-[10px] font-medium tracking-wide text-[var(--color-text)] md:text-xs">
                  Waterloo, ON | Bangkok, TH
                </span>
              </div>
              <div className="flex items-center gap-2 rounded-full border border-[var(--color-accent-border)] bg-[var(--color-accent-soft)] px-3 py-2 backdrop-blur-sm md:px-4">
                <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--color-accent)]"></div>
                <span className="text-[10px] font-medium uppercase tracking-wide text-[var(--color-text)] md:text-xs">
                  Available for work 2026
                </span>
              </div>
            </div>

            <h1 className="font-display mb-8 text-5xl font-black leading-[0.9] tracking-tighter text-[var(--color-text)] transition-transform duration-200 md:text-8xl md:leading-[0.85]">
              Bank Leelathanapipat
            </h1>
            <p className="mb-8 text-lg font-bold tracking-tight text-[var(--color-text)] opacity-90 md:text-2xl">
              Comp Eng '30 | UWaterloo
            </p>

            <p className="mb-10 max-w-xl text-base font-medium leading-relaxed text-[var(--color-text)] opacity-90 md:text-xl">
              Focused on mastering VLSI design and computer architecture to innovate the future of GPU development
            </p>

            <div className="flex flex-wrap items-center gap-4 md:gap-6">
              <button
                onClick={() => document.getElementById("experience")?.scrollIntoView({ behavior: "smooth" })}
                className="transform rounded-full bg-[var(--color-accent)] px-6 py-3 text-sm font-bold text-white shadow-lg shadow-[var(--color-shadow)] transition-all hover:scale-105 hover:brightness-110 active:scale-95 md:px-8 md:py-4 md:text-base"
              >
                View Experience
              </button>
              <SocialLinks />
            </div>
          </div>
        </header>

        <div className="h-40 bg-gradient-to-b from-transparent to-[var(--color-surface)]"></div>

        <main className="bg-[var(--color-surface)]">
          {/* PROFESSIONAL JOURNEY */}
          <section id="experience" className="mx-auto max-w-7xl px-3 py-12 md:px-4 md:py-24">
            <div className="mb-12 md:mb-20 group">
              <h2 className="font-display mb-4 text-xl font-black uppercase tracking-[0.4em] text-[var(--color-text-muted)] transition-colors duration-300 group-hover:text-[var(--color-accent)] md:text-2xl">Professional Journey</h2>
              <div className="h-[1px] w-full bg-[var(--color-border)] transition-colors duration-300 group-hover:bg-[var(--color-accent-border)]" />
            </div>
            <div className="space-y-16 md:y-24">
              {experience.map((job, i) => (
                <div key={i} className="group relative grid grid-cols-1 md:grid-cols-[1fr_auto] gap-x-12 gap-y-4 md:gap-y-6">
                  <div className="space-y-4 md:space-y-6">
                    <div className="space-y-2 md:space-y-3">
                      {job.companyUrl ? (
                        <a
                          href={job.companyUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="font-display text-3xl font-black tracking-tighter text-[var(--color-text)] transition-colors duration-500 group-hover:text-[var(--color-accent)] hover:text-[var(--color-accent)] md:text-5xl"
                        >
                          {job.company}
                        </a>
                      ) : (
                        <h3 className="font-display text-3xl font-black tracking-tighter text-[var(--color-text)] transition-colors duration-500 group-hover:text-[var(--color-accent)] md:text-5xl">
                          {job.company}
                        </h3>
                      )}
                      <p className="text-lg font-bold tracking-tight text-[var(--color-text)] opacity-80 md:text-xl">{job.role}</p>
                    </div>
                    <p className="max-w-3xl text-base leading-relaxed text-[var(--color-text-muted)] md:text-lg">{job.description}</p>
                    <div className="flex flex-wrap gap-2">
                      {job.tags.map((tag) => (
                        <span key={tag} className="border border-[var(--color-border)] bg-[var(--color-pill)] px-2 py-1 text-[9px] font-black uppercase tracking-widest text-[var(--color-text-muted)] md:px-3 md:text-[10px]">{tag}</span>
                      ))}
                    </div>
                  </div>
                  <div className="flex h-full flex-col items-start justify-between py-2 md:items-end md:border-l md:border-[var(--color-border)] md:pl-8">
                    <span className="text-xs font-bold uppercase tracking-tighter text-[var(--color-text-muted)] opacity-80 tabular-nums md:text-sm">{job.period}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* SELECTED WORKS */}
          <section id="work" className="mx-auto max-w-7xl border-t border-[var(--color-border-soft)] px-3 py-12 md:px-4 md:py-24">
            <div className="mb-12 md:mb-20 group">
              <h2 className="font-display mb-4 text-xl font-black uppercase tracking-[0.4em] text-[var(--color-text-muted)] transition-colors duration-300 group-hover:text-[var(--color-accent)] md:text-2xl">Selected Works</h2>
              <div className="h-[1px] w-full bg-[var(--color-border)] transition-colors duration-300 group-hover:bg-[var(--color-accent-border)]" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {projects.map((p, i) => (<ProjectCard key={i} {...p} />))}
            </div>
          </section>

          {/* BEYOND THE CODE */}
          <section id="hobbies" className="mx-auto max-w-7xl border-t border-[var(--color-border-soft)] px-3 py-12 md:px-4 md:py-24">
            <div className="mb-12 md:mb-20 group">
              <h2 className="font-display mb-4 text-xl font-black uppercase tracking-[0.4em] text-[var(--color-text-muted)] transition-colors duration-300 group-hover:text-[var(--color-accent)] md:text-2xl">Beyond the Code</h2>
              <div className="h-[1px] w-full bg-[var(--color-border)] transition-colors duration-300 group-hover:bg-[var(--color-accent-border)]" />
            </div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-8 lg:grid-cols-3">
              {hobbies.map((hobby, i) => (
                <div key={i} className="group overflow-hidden rounded-2xl border border-[var(--color-border-soft)] bg-[var(--color-pill)] transition-all hover:border-[var(--color-accent-border)] hover:bg-[var(--color-pill-strong)]">
                  <div className="aspect-video w-full overflow-hidden">
                    <img src={hobby.image} alt={hobby.name} className="w-full h-full object-cover grayscale group-hover:grayscale-0 group-hover:scale-105 transition-all duration-500" />
                  </div>
                  <div className="p-6 md:p-8">
                    <h3 className="font-display mb-2 text-lg font-bold text-[var(--color-text)] md:text-xl">{hobby.name}</h3>
                    <p className="text-sm text-[var(--color-text-muted)]">{hobby.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-10 rounded-2xl border border-[var(--color-border-soft)] bg-[var(--color-pill)] p-6 md:p-8">
              <p className="text-[10px] font-black uppercase tracking-[0.35em] text-[var(--color-text-muted)]">
                On Repeat
              </p>
              <h3 className="font-display mt-4 text-2xl font-bold text-[var(--color-text)] md:text-3xl">
                Music
              </h3>
              <p className="mt-4 text-sm leading-8 text-[var(--color-text-muted)] md:text-base">
                Music is a big part of how I focus, reset, and unwind outside of code. My taste moves across a few different genres, especially <span className="text-[var(--color-text)]">Thai-pop</span>, <span className="text-[var(--color-text)]">Japanese-pop</span>, <span className="text-[var(--color-text)]">city-pop</span>, and <span className="text-[var(--color-text)]">hip-hop</span>. Depending on the mood, I like having different sounds on while studying, building projects, or just slowing down after a long day.
              </p>

              <div className="mt-8 space-y-4">
                {[
                  {
                    genre: "Thai-pop",
                    note: "I like Thai-pop for its melodic hooks and the mix of polished production with a more emotional feel.",
                    embeds: [
                      {
                        title: "Thai-pop track preview",
                        src: "https://open.spotify.com/embed/track/34XtsYtOE2XUlgF8Iv2WUz?utm_source=generator&theme=0",
                      },
                      {
                        title: "Thai-pop artist preview",
                        src: "https://open.spotify.com/embed/artist/5pxvW2nJ0a77b9oX24Unwi?utm_source=generator&theme=0",
                      },
                    ],
                  },
                  {
                    genre: "Japanese-pop",
                    note: "Japanese-pop is one of the genres I come back to the most, especially songs tied to anime, films, and strong storytelling.",
                    embeds: [
                      {
                        title: "Japanese-pop track preview",
                        src: "https://open.spotify.com/embed/track/1FOhzA4qQiyVnzVYt1KcgN?utm_source=generator&theme=0",
                      },
                      {
                        title: "Japanese-pop artist preview",
                        src: "https://open.spotify.com/embed/artist/1EowJ1WwkMzkCkRomFhui7?utm_source=generator&theme=0",
                      },
                    ],
                  },
                  {
                    genre: "City-pop",
                    note: "City-pop is what I usually reach for when I want something smoother, more laid-back, and easy to have on in the background.",
                    embeds: [
                      {
                        title: "City-pop track preview",
                        src: "https://open.spotify.com/embed/track/0JUWF44gfMszGNhjCF7Ufs?utm_source=generator&theme=0",
                      },
                      {
                        title: "City-pop artist preview",
                        src: "https://open.spotify.com/embed/artist/0xGtOrmB2hnrNRLG3vhpSo?utm_source=generator&theme=0",
                      },
                    ],
                  },
                  {
                    genre: "Hip-hop",
                    note: "Hip-hop gives me a different kind of energy and rhythm, especially when I want something more driving while working through ideas.",
                    embeds: [
                      {
                        title: "Hip-hop track preview",
                        src: "https://open.spotify.com/embed/track/0y9uTzK9cNKSAEHnpeRG8C?utm_source=generator&theme=0",
                      },
                      {
                        title: "Hip-hop artist preview",
                        src: "https://open.spotify.com/embed/artist/2YZyLoL8N0Wb9xBt1NhZWg?utm_source=generator&theme=0",
                      },
                    ],
                  },
                ].map((item) => (
                  <div
                    key={item.genre}
                    className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-5 transition-colors duration-300 hover:border-[var(--color-accent-border)] md:px-6 md:py-6"
                  >
                    <p className="font-display text-lg font-bold text-[var(--color-text)] md:text-xl">
                      {item.genre}
                    </p>
                    <div className="mt-3">
                      <p className="text-sm leading-7 text-[var(--color-text-muted)] md:text-base">
                        {item.note}
                      </p>
                      {item.embeds && (
                        <div className="mt-5 grid grid-cols-1 items-start gap-4 lg:grid-cols-2">
                          {item.embeds.map((embed) => (
                            <iframe
                              key={embed.src}
                              title={embed.title}
                              src={embed.src}
                              width="100%"
                              height="152"
                              className="w-full rounded-xl"
                              frameBorder="0"
                              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                              loading="lazy"
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* CONTACT FOOTER */}
          <footer id="contact" className="mx-auto max-w-7xl overflow-hidden border-t border-[var(--color-border-soft)] px-4 py-20 md:px-6 md:py-32">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div> 
                <h2 className="font-display mb-4 text-5xl font-black tracking-tighter text-[var(--color-text)] md:text-8xl">
                  send me <br className="hidden md:block" /> anything!
                </h2>
                <p className="mb-8 max-w-2xl text-base font-medium leading-relaxed text-[var(--color-text-muted)] md:mb-12 md:text-xl">
                  Whether it&apos;s a research opportunity, a project idea, or just a conversation about hardware and systems, I&apos;d love to hear from you.
                </p>

                <div className="mb-8 flex flex-wrap gap-3 md:mb-10">
                  <a
                    href="/Bank_Leela.pdf"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center rounded-full border border-[var(--color-border)] bg-[var(--color-pill)] px-5 py-2.5 text-sm font-semibold text-[var(--color-text)] transition-all duration-300 hover:border-[var(--color-accent-border)] hover:bg-[var(--color-accent-soft)] hover:text-[var(--color-accent)]"
                  >
                    View Resume
                  </a>
                  <a
                    href="https://www.linkedin.com/in/bank-leelathanapipat"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center rounded-full border border-[var(--color-border)] bg-[var(--color-pill)] px-5 py-2.5 text-sm font-semibold text-[var(--color-text)] transition-all duration-300 hover:border-[var(--color-accent-border)] hover:bg-[var(--color-accent-soft)] hover:text-[var(--color-accent)]"
                  >
                    LinkedIn
                  </a>
                </div>

                <div className="space-y-2 relative group/copy">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--color-text-muted)] italic">
                    QUESTIONS? HIT ME UP ↓
                  </p>
                  <button
                    onClick={handleCopyEmail}
                    className="relative text-left text-xl font-black text-[var(--color-text)] underline underline-offset-8 decoration-[var(--color-accent-border)] transition-colors hover:text-[var(--color-accent)] md:text-4xl"
                  >
                    nleelath@uwaterloo.ca
                    <span className={`absolute -top-10 left-0 rounded bg-[var(--color-accent)] px-3 py-1 text-[10px] font-black text-white transition-opacity duration-300 ${copied ? 'opacity-100' : 'pointer-events-none opacity-0'}`}>
                      COPIED!
                    </span>
                  </button>
                </div>
              </div>

              {/* ✅ RESPONSIVE GLOBE POSITION: Standard padding on mobile, right-aligned on desktop */}
              <div className="flex justify-center md:justify-end mt-8 lg:mt-0">
                <div className="w-full max-w-[700px]">
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
