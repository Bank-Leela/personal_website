import React, { useCallback, useEffect, useRef, useState } from "react";
import ProjectCard from "./components/ProjectCard";
import ScrollProgress from "./components/ScrollProgress";
import Reveal from "./components/Reveal";
import StatsBand from "./components/StatsBand";
import ExperienceTimeline from "./components/ExperienceTimeline";
import MusicShelf from "./components/MusicShelf";
import EasterEgg from "./components/EasterEgg";
import Loader, { introAlreadySeen } from "./components/Loader";
import useActiveSection from "./hooks/useActiveSection";
import SmoothScroll from "./lib/SmoothScroll";
import usePrefersReducedMotion from "./hooks/usePrefersReducedMotion";
import { Mail, Linkedin, Github, FileText, Moon, Sun, Check, Copy } from "lucide-react";

// react-globe.gl pulls in three.js (~600KB+); lazy-load it so it stays out of
// the initial bundle and only downloads when the contact footer is reached.
const GlobeBox = React.lazy(() => import("./components/GlobeBox"));

const CONTACT_EMAIL = "nleelath@uwaterloo.ca";

const SOCIALS = [
  { icon: Mail, href: `mailto:${CONTACT_EMAIL}`, label: "Email" },
  { icon: Github, href: "https://github.com/Bank-Leela", label: "GitHub" },
  {
    icon: Linkedin,
    href: "https://www.linkedin.com/in/bank-leelathanapipat",
    label: "LinkedIn",
  },
  {
    mask: "/devpost.svg",
    href: "https://devpost.com/natdanai-leelathanapipat?ref_content=user-portfolio&ref_feature=portfolio&ref_medium=global-nav",
    label: "Devpost",
  },
  { icon: FileText, href: "/Bank_Leela.pdf", label: "Resume" },
];

const SocialLinks = () => (
  <ul className="flex list-none items-center gap-2.5 p-0">
    {SOCIALS.map((social) => (
      <li key={social.label}>
        <a
          href={social.href}
          target="_blank"
          rel="noreferrer"
          aria-label={social.label}
          title={social.label}
          className="flex h-11 w-11 items-center justify-center rounded-[var(--radius-pill)] border border-[var(--color-border)] bg-[var(--color-pill)] text-[var(--color-text-muted)] transition-all duration-300 hover:border-[var(--color-accent-border)] hover:bg-[var(--color-accent-soft)] hover:text-[var(--color-accent-text)] active:scale-95"
        >
          {social.icon ? (
            <social.icon size={18} aria-hidden="true" />
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
      </li>
    ))}
  </ul>
);

// Plain section headline plus a rule. No small-caps label above it: the
// section's position on the page already says what it is.
const SectionHeading = ({ children }) => (
  <Reveal className="group mb-12 md:mb-16">
    <h2 className="font-display mb-5 text-3xl font-black tracking-tight text-[var(--color-text)] md:text-4xl">
      {children}
    </h2>
    <div className="h-px w-full bg-[var(--color-border)] transition-colors duration-500 group-hover:bg-[var(--color-accent-border)]" />
  </Reveal>
);

// `link` is shown as its own labelled line rather than wired to the company
// name. The IEEE URL points at the published paper, not at IEEE, so making the
// employer name the anchor was quietly mislabelling where the link goes.
const EXPERIENCE = [
  {
    company: "IEEE",
    role: "Research Assistant",
    period: "Jul 2024 - May 2025",
    description:
      "Engineered a low-budget IoT water level measurement system using ESP32 to facilitate flood mitigation. Results are officially published in the IEEE Xplore Digital Library.",
    tags: ["IoT", "ESP32", "System Design", "Research"],
    link: "https://ieeexplore.ieee.org/abstract/document/10811073",
    linkLabel: "Read the paper on IEEE Xplore",
  },
  {
    company: "ODDS-Thailand",
    role: "Software Engineering Intern",
    period: "Jul 2024 - Aug 2024",
    description:
      "Developed responsive UI components for a $300M financial platform. Optimized database queries for a MongoDB cluster containing 20M+ entries.",
    tags: ["React", "Tailwind CSS", "MongoDB", "Optimization"],
    link: "https://odds.team/",
    linkLabel: "odds.team",
  },
  {
    company: "NurseMetrics",
    role: "Lead Developer",
    period: "May 2023 - Aug 2024",
    description:
      "Architected a KPI tracking web application using Google Apps Script (JavaScript) to automate data entry, reducing reporting time by 70%.",
    tags: ["JavaScript", "Automation", "Healthcare Tech"],
  },
];

const PROJECTS = [
  {
    title: "Badminton Tracker",
    description:
      "A full-stack match analytics platform for competitive players who want more than a running score.",
    problem:
      "Most casual score trackers stop at points. I wanted a tool that could also capture match history and make performance trends easier to analyze over time.",
    built:
      "I built the frontend and backend flow for real-time scorekeeping, match history storage, and an interface that makes past performance easy to review.",
    highlight:
      "Designed the stack around live updates plus persistent analytics, balancing responsive match-day interactions with longer-term data tracking.",
    tags: ["MERN Stack", "TypeScript", "API Development", "Tailwind CSS", "MongoDB"],
    repo: "https://github.com/Bank-Leela/badminton_tracker",
    repoLabel: "Source",
    placeholderLabel: "Screenshots coming soon",
  },
  {
    title: "Sentinel",
    description:
      "A hackathon-built fraud detection platform designed to help analysts investigate suspicious behavior beyond isolated transactions.",
    problem:
      "Fraud tools often surface alerts without enough context. We wanted a system that could help analysts understand connected activity, not just single anomalous events.",
    built:
      "I contributed to a workflow that combines anomaly scoring, rules, graph-based investigation, and a UI for triage so teams can move from alert to explanation faster.",
    highlight:
      "The hard part was folding several detection strategies into one analyst-friendly view without losing clarity inside a short hackathon build window.",
    tags: ["Python", "FastAPI", "Next.js", "Machine Learning", "Graph Analysis"],
    repo: "https://github.com/SarveshwarSenthilKumar/Sentinel",
    repoLabel: "Source",
    link: "https://devpost.com/software/sentinel-128ad4",
    linkLabel: "Case study",
    image: "/sentinel.jpg",
    imageAlt: "Sentinel fraud detection dashboard showing a transaction graph",
  },
];

const HOBBIES = [
  {
    name: "Badminton",
    image: "/kv.jpg",
    alt: "Badminton player mid-smash on court",
    description:
      "Inspired by the technical precision and tactical brilliance of Kunlavut Vitidsarn, I enjoy studying the mechanics of the game and applying elite strategies to the court.",
    feature: true,
  },
  {
    name: "Anime",
    image: "/frieren.jpg",
    alt: "Still frame from the anime Frieren",
    description:
      "In my free time I watch anime and read manga. Favorites include Your Name, Clannad, and Charlotte.",
  },
  {
    name: "Gaming",
    image: "/minecraft.avif",
    alt: "Minecraft landscape at sunset",
    description:
      "Strategy and teamwork focused: Valorant, Minecraft, and co-op horror like Phasmophobia and Devour.",
  },
];

const NAV_ITEMS = [
  { id: "experience", label: "Experience" },
  { id: "work", label: "Work" },
  { id: "hobbies", label: "Hobbies" },
  { id: "contact", label: "Contact" },
];

// "top" is observed alongside the real sections so that scrolling back into the
// hero clears the nav underline instead of stranding it on the first section.
const SPY_IDS = ["top", ...NAV_ITEMS.map((item) => item.id)];

function App() {
  const heroRef = useRef(null);
  const reduceMotion = usePrefersReducedMotion();
  const activeSection = useActiveSection(SPY_IDS);

  // `introMounted` keeps the overlay in the tree long enough to fade; `introDone`
  // drives the fade itself. Collapsing these into one flag would unmount the
  // node on the same tick the class changes, so the transition would never run.
  const [introMounted, setIntroMounted] = useState(() => !introAlreadySeen());
  const [introDone, setIntroDone] = useState(false);
  const [copied, setCopied] = useState(false);
  const [theme, setTheme] = useState(() => {
    if (typeof window === "undefined") return "dark";
    // index.html already resolved this before first paint (stored choice, then
    // OS preference); read it back rather than guessing a second time.
    return document.documentElement.dataset.theme || "dark";
  });

  // Defer the heavy three.js globe until the contact footer is nearly in view,
  // so visitors who never scroll there never download or execute it.
  const globeSlotRef = useRef(null);
  const [showGlobe, setShowGlobe] = useState(false);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem("theme", theme);
    } catch (e) {
      /* storage unavailable; the theme still applies for this page view */
    }
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute("content", theme === "light" ? "#eae3d8" : "#100d0c");
  }, [theme]);

  // Safety net: if `transitionend` never arrives (reduced motion, a
  // background tab, a browser that skips the transition), unmount anyway.
  useEffect(() => {
    if (!introDone) return undefined;
    const timer = window.setTimeout(() => setIntroMounted(false), 600);
    return () => window.clearTimeout(timer);
  }, [introDone]);

  useEffect(() => {
    const el = globeSlotRef.current;
    if (!el) return undefined;
    if (typeof IntersectionObserver === "undefined") {
      setShowGlobe(true);
      return undefined;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setShowGlobe(true);
          observer.disconnect();
        }
      },
      { rootMargin: "300px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const handleCopyEmail = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(CONTACT_EMAIL);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      // Clipboard blocked (insecure context, denied permission). Fall back to
      // the mail client so the action still does something useful.
      window.location.href = `mailto:${CONTACT_EMAIL}`;
    }
  }, []);

  // Hero glow follows the cursor through CSS custom properties written on the
  // node itself. Routing this through React state would re-render the entire
  // hero subtree on every pointer event.
  const handleHeroPointerMove = (event) => {
    const node = heroRef.current;
    if (!node || reduceMotion) return;
    const bounds = node.getBoundingClientRect();
    node.style.setProperty("--px", `${((event.clientX - bounds.left) / bounds.width) * 100}%`);
    node.style.setProperty("--py", `${((event.clientY - bounds.top) / bounds.height) * 100}%`);
    node.dataset.glow = "on";
  };

  const handleHeroPointerLeave = () => {
    if (heroRef.current) heroRef.current.dataset.glow = "off";
  };

  return (
    <div className="relative">
      <SmoothScroll />
      <ScrollProgress />
      <EasterEgg />

      <a
        href="#experience"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[110] focus:rounded-[var(--radius-pill)] focus:bg-[var(--color-accent-solid)] focus:px-5 focus:py-2.5 focus:text-sm focus:font-semibold focus:text-white"
      >
        Skip to content
      </a>

      {/* The page below is fully rendered and painted while this overlay is up,
          so it is a brand moment rather than a gate. It runs once per session. */}
      {introMounted && (
        <div
          role="status"
          aria-live="polite"
          className={`pointer-events-none fixed inset-0 z-[100] flex items-center justify-center bg-[var(--color-bg)] transition-opacity duration-300 ${
            introDone ? "opacity-0" : "opacity-100"
          }`}
          onTransitionEnd={() => introDone && setIntroMounted(false)}
        >
          <Loader onComplete={() => setIntroDone(true)} />
        </div>
      )}

      <div className="fixed inset-0 -z-10 bg-[var(--color-bg)]" />

      <div className="relative z-10">
        <nav className="fixed top-0 z-50 w-full border-b border-[var(--color-border-soft)] bg-[var(--color-nav)] backdrop-blur-md">
          <div className="mx-auto flex h-16 max-w-[1520px] items-center justify-between gap-4 px-4 md:h-[72px] md:px-6">
            <a
              href="#top"
              className="font-display shrink-0 text-base font-black tracking-tight text-[var(--color-text)] md:text-lg"
            >
              <span className="sm:hidden">Bank L.</span>
              <span className="hidden sm:inline">Bank Leelathanapipat</span>
            </a>

            <div className="flex items-center gap-1 text-sm font-medium text-[var(--color-text-muted)] sm:gap-2 md:gap-6">
              {NAV_ITEMS.map((item) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  aria-current={activeSection === item.id ? "true" : undefined}
                  className={`relative inline-flex h-11 items-center whitespace-nowrap px-1.5 text-[13px] transition-colors after:absolute after:bottom-2 after:left-1.5 after:right-1.5 after:h-[2px] after:origin-left after:rounded-[var(--radius-pill)] after:bg-[var(--color-accent)] after:transition-transform after:duration-300 md:px-1 md:text-sm ${
                    activeSection === item.id
                      ? "text-[var(--color-text)] after:scale-x-100"
                      : "after:scale-x-0 hover:text-[var(--color-text)] hover:after:scale-x-100"
                  }`}
                >
                  {item.label}
                </a>
              ))}
              <button
                type="button"
                onClick={() => setTheme((current) => (current === "dark" ? "light" : "dark"))}
                className="ml-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-pill)] border border-[var(--color-border)] bg-[var(--color-pill)] text-[var(--color-text-muted)] transition-all hover:border-[var(--color-accent-border)] hover:text-[var(--color-accent-text)] active:scale-95"
                aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
                title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              >
                {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
              </button>
            </div>
          </div>
        </nav>

        {/* ---------------------------------------------------------------
            HERO. Asymmetric split: the value proposition on the left, a
            generative die plot holding the right. Four text elements total.
        --------------------------------------------------------------- */}
        <header
          id="top"
          ref={heroRef}
          data-glow="off"
          onPointerMove={handleHeroPointerMove}
          onPointerLeave={handleHeroPointerLeave}
          className="hero-view-source group/hero relative flex min-h-[100dvh] w-full items-center overflow-hidden pb-12 pt-20 md:pb-16 md:pt-24"
        >
          <div
            aria-hidden="true"
            className="pointer-glow pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-data-[glow=on]/hero:opacity-100"
          />

          <div className="hero-recede relative z-10 mx-auto w-full max-w-[1520px] px-4 md:px-6">
            <div>
              <div className="mb-6 flex flex-wrap items-center gap-x-4 gap-y-3 md:mb-8">
                <span className="text-sm font-semibold tracking-tight text-[var(--color-text-muted)]">
                  Bank Leelathanapipat
                </span>
                <span className="inline-flex items-center gap-2 rounded-[var(--radius-pill)] border border-[var(--color-accent-border)] bg-[var(--color-accent-soft)] px-3.5 py-1.5">
                  {/* Real availability state, not decoration. */}
                  <span className="h-1.5 w-1.5 animate-pulse rounded-[var(--radius-pill)] bg-[var(--color-accent)]" />
                  <span className="text-xs font-semibold text-[var(--color-text)]">
                    Available for co-op 2026
                  </span>
                </span>
              </div>

              {/* Fluid down to narrow phones. The 16ch measure only applies
                  from `sm` up: on a 360px screen it would squeeze the headline
                  into a column narrower than the viewport and add a fourth
                  line, which is a font-scale error rather than a copy problem. */}
              <h1 className="font-display mb-5 text-balance text-[clamp(1.9rem,8vw,2.6rem)] font-black leading-[1.02] tracking-tight text-[var(--color-text)] sm:max-w-[15ch] sm:text-7xl md:mb-7 lg:text-[5.4rem]">
                Full-stack software, published research.
              </h1>

              <p className="mb-8 max-w-[54ch] text-lg leading-relaxed md:mb-10 text-[var(--color-text-muted)] md:text-[1.35rem]">
                Computer Engineering &rsquo;30 at Waterloo. Software engineering{" "}
                <span className="whitespace-nowrap">co-op</span>, IEEE-published IoT work, and
                projects from match analytics to fraud detection.
              </p>

              <div className="flex flex-wrap items-center gap-4 md:gap-6">
                <a
                  href="#experience"
                  className="inline-flex h-12 items-center whitespace-nowrap rounded-[var(--radius-pill)] bg-[var(--color-accent-solid)] px-7 text-base font-bold text-white shadow-lg shadow-[var(--color-shadow)] transition-all hover:brightness-110 active:scale-[0.98]"
                >
                  View experience
                </a>
                <SocialLinks />
              </div>
            </div>
          </div>
        </header>

        <div className="h-24 bg-gradient-to-b from-transparent to-[var(--color-surface)]" />

        <main className="bg-[var(--color-surface)]">
          {/* -------------------------------------------------------------
              EXPERIENCE. A pinned context column beside a scrolling timeline.

              The heading and the numbers stay put while the roles move past
              them, which is what the old full-height date rail was gesturing at
              without ever holding any content. It also gives this section a
              layout family nothing else on the page uses.
          ------------------------------------------------------------- */}
          <section id="experience" className="mx-auto max-w-[1520px] px-4 py-16 md:px-6 md:py-24">
            <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
              <div className="lg:col-span-4">
                <div className="lg:sticky lg:top-28">
                  <Reveal className="group">
                    <h2 className="font-display mb-5 text-3xl font-black tracking-tight text-[var(--color-text)] md:text-4xl">
                      Where I have worked
                    </h2>
                    <div className="h-px w-full bg-[var(--color-border)] transition-colors duration-500 group-hover:bg-[var(--color-accent-border)] lg:w-16" />
                  </Reveal>
                  <Reveal delay={80} className="mt-8 lg:mt-10">
                    <StatsBand />
                  </Reveal>
                </div>
              </div>

              <div className="lg:col-span-8">
                <ExperienceTimeline items={EXPERIENCE} />
              </div>
            </div>
          </section>

          {/* -------------------------------------------------------------
              WORK. Two projects, two cells. No phantom third column.
          ------------------------------------------------------------- */}
          <section
            id="work"
            className="mx-auto max-w-[1520px] border-t border-[var(--color-border-soft)] px-4 py-16 md:px-6 md:py-24"
          >
            <SectionHeading>Things I have built</SectionHeading>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-8">
              {PROJECTS.map((project, i) => (
                <Reveal key={project.title} delay={i * 80} className="h-full">
                  <ProjectCard {...project} />
                </Reveal>
              ))}
            </div>
          </section>

          {/* -------------------------------------------------------------
              HOBBIES. Asymmetric bento: one feature cell plus two supporting
              cells. Three interests, three cells, no blank tiles.
          ------------------------------------------------------------- */}
          <section
            id="hobbies"
            className="mx-auto max-w-[1520px] border-t border-[var(--color-border-soft)] px-4 py-16 md:px-6 md:py-24"
          >
            <SectionHeading>Outside the lab</SectionHeading>

            <div className="grid gap-5 md:gap-6 lg:grid-cols-3 lg:grid-rows-[minmax(0,1fr)_minmax(0,1fr)]">
              {HOBBIES.map((hobby, i) => (
                <Reveal
                  key={hobby.name}
                  delay={i * 80}
                  className={`card-view-source group flex flex-col overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-border-soft)] bg-[var(--color-bg-elevated)] transition-colors duration-500 hover:border-[var(--color-accent-border)] ${
                    hobby.feature ? "lg:col-span-2 lg:row-span-2" : ""
                  }`}
                >
                  <div
                    className={`w-full shrink-0 overflow-hidden ${
                      hobby.feature ? "h-56 lg:h-auto lg:flex-1" : "h-44"
                    }`}
                  >
                    <img
                      src={hobby.image}
                      alt={hobby.alt}
                      loading="lazy"
                      decoding="async"
                      width="800"
                      height="450"
                      className={`h-full w-full object-cover saturate-[0.35] transition-all duration-700 group-hover:saturate-100 ${
                        hobby.feature ? "zoom-settle" : "group-hover:scale-[1.03]"
                      }`}
                    />
                  </div>
                  <div className={hobby.feature ? "p-6 md:p-8" : "p-5 md:p-6"}>
                    <h3
                      className={`font-display font-bold text-[var(--color-text)] ${
                        hobby.feature ? "text-2xl md:text-3xl" : "text-lg"
                      }`}
                    >
                      {hobby.name}
                    </h3>
                    <p
                      className={`mt-2 leading-relaxed text-[var(--color-text-muted)] ${
                        hobby.feature ? "max-w-[62ch] text-base md:text-lg" : "text-sm"
                      }`}
                    >
                      {hobby.description}
                    </p>
                  </div>
                </Reveal>
              ))}
            </div>

            {/* Music: a different layout family again, and every embed stays
                behind a click so the section costs nothing to scroll past. */}
            <Reveal className="mt-14 md:mt-20">
              <h3 className="font-display text-2xl font-bold text-[var(--color-text)] md:text-3xl">
                Music
              </h3>
              <p className="mt-4 max-w-[68ch] leading-relaxed text-[var(--color-text-muted)] md:text-lg">
                Music is a big part of how I focus, reset, and unwind outside of code. My taste moves
                across a few genres depending on whether I am studying, building, or slowing down
                after a long day.
              </p>
              <div className="mt-10">
                <MusicShelf theme={theme} />
              </div>
            </Reveal>
          </section>

          {/* -------------------------------------------------------------
              CONTACT.
          ------------------------------------------------------------- */}
          <footer
            id="contact"
            className="mx-auto max-w-[1520px] overflow-hidden border-t border-[var(--color-border-soft)] px-4 py-20 md:px-6 md:py-28"
          >
            <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16">
              <Reveal>
                <h2 className="font-display mb-6 text-5xl font-black tracking-tight text-[var(--color-text)] md:text-7xl">
                  send me
                  <br />
                  anything!
                </h2>
                <p className="mb-10 max-w-[46ch] text-lg leading-relaxed text-[var(--color-text-muted)]">
                  A research opportunity, a project idea, or just a conversation about hardware and
                  systems. I would love to hear from you.
                </p>

                <button
                  type="button"
                  onClick={handleCopyEmail}
                  className="group/copy inline-flex max-w-full items-center gap-3 rounded-[var(--radius-pill)] border border-[var(--color-accent-border)] bg-[var(--color-accent-soft)] px-5 py-3.5 text-left transition-all duration-300 hover:brightness-110 active:scale-[0.98]"
                >
                  {copied ? (
                    <Check size={18} aria-hidden="true" className="shrink-0 text-[var(--color-accent-text)]" />
                  ) : (
                    <Copy size={18} aria-hidden="true" className="shrink-0 text-[var(--color-accent-text)]" />
                  )}
                  <span className="truncate text-base font-bold text-[var(--color-text)] md:text-xl">
                    {CONTACT_EMAIL}
                  </span>
                  <span className="shrink-0 text-sm font-semibold text-[var(--color-text-muted)]">
                    {copied ? "Copied" : "Copy"}
                  </span>
                </button>
                <span className="sr-only" role="status" aria-live="polite">
                  {copied ? "Email address copied to clipboard" : ""}
                </span>

                <div className="mt-10">
                  <SocialLinks />
                </div>

                <p className="mt-10 text-sm text-[var(--color-text-muted)]">
                  Waterloo, ON and Bangkok, TH
                </p>
              </Reveal>

              <div ref={globeSlotRef} className="w-full">
                {showGlobe ? (
                  <React.Suspense
                    fallback={
                      <div className="h-[420px] w-full rounded-[var(--radius-card)] border border-[var(--color-border-soft)] bg-[var(--color-bg-elevated)] md:h-[560px]" />
                    }
                  >
                    <GlobeBox theme={theme} />
                  </React.Suspense>
                ) : (
                  <div className="h-[420px] w-full rounded-[var(--radius-card)] border border-[var(--color-border-soft)] bg-[var(--color-bg-elevated)] md:h-[560px]" />
                )}
              </div>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}

export default App;
