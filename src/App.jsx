import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import Shuttle from "./components/Shuttle";

const EMAIL = "nleelath@uwaterloo.ca";
const RESUME = "/Bank_Leela.pdf";

const PANES = [
  { id: "serve", label: "Serve" },
  { id: "record", label: "Record" },
  { id: "builds", label: "Builds" },
  { id: "off-court", label: "Off court" },
];

/* The old site's anchors, kept working so existing links and the sitemap do not
   break now that the panes have been renamed. */
const LEGACY_ANCHORS = {
  about: "serve",
  experience: "record",
  projects: "builds",
  hobbies: "off-court",
};

const LINKS = [
  { label: "LinkedIn", href: "https://www.linkedin.com/in/bank-leelathanapipat" },
  { label: "GitHub", href: "https://github.com/Bank-Leela" },
  { label: "Devpost", href: "https://devpost.com/natdanai-leelathanapipat" },
  { label: "Email", href: `mailto:${EMAIL}` },
  { label: "Resume", href: RESUME },
];

const RECORD = [
  {
    company: "IEEE",
    role: "Research Assistant",
    period: "2024 to 2025",
    description:
      "A low-budget IoT water level measurement system on ESP32 for flood mitigation, published in the IEEE Xplore Digital Library.",
    link: "https://ieeexplore.ieee.org/abstract/document/10811073",
  },
  {
    company: "ODDS-Thailand",
    role: "Software Engineering Intern",
    period: "2024",
    description:
      "Responsive UI for a $300M financial platform, and query optimisation against a MongoDB cluster holding over 20M entries.",
    link: "https://odds.team/",
  },
  {
    company: "NurseMetrics",
    role: "Lead Developer",
    period: "2023 to 2024",
    description:
      "A KPI tracking application on Google Apps Script that automated data entry and cut reporting time by 70%.",
  },
];

const BUILDS = [
  {
    title: "Sentinel",
    description:
      "Fraud detection that connects the activity around an alert, so an analyst gets from alert to explanation instead of triaging transactions one at a time.",
    tech: "Python, FastAPI, Next.js, graph analysis",
    links: [
      { label: "Source", href: "https://github.com/SarveshwarSenthilKumar/Sentinel" },
      { label: "Devpost", href: "https://devpost.com/software/sentinel-128ad4" },
    ],
  },
  {
    title: "Badminton Tracker",
    description:
      "Match analytics for competitive players. Casual apps stop at the running score; this one keeps match history and makes performance trends reviewable across a season.",
    tech: "MERN, TypeScript, Tailwind CSS, MongoDB",
    links: [{ label: "Source", href: "https://github.com/Bank-Leela/badminton_tracker" }],
  },
];

const MUSIC = [
  { genre: "Thai-pop", href: "https://open.spotify.com/track/34XtsYtOE2XUlgF8Iv2WUz" },
  { genre: "Japanese-pop", href: "https://open.spotify.com/track/1FOhzA4qQiyVnzVYt1KcgN" },
  { genre: "City-pop", href: "https://open.spotify.com/track/0JUWF44gfMszGNhjCF7Ufs" },
  { genre: "Hip-hop", href: "https://open.spotify.com/track/0y9uTzK9cNKSAEHnpeRG8C" },
];

const OFF_COURT = [
  {
    title: "Badminton",
    body: (
      <>
        I study the mechanics of the game and try to bring elite strategy to the court, mostly
        chasing the precision of{" "}
        <Ext href="https://en.wikipedia.org/wiki/Kunlavut_Vitidsarn">Kunlavut Vitidsarn</Ext>.
      </>
    ),
  },
  { title: "Anime and manga", body: <>Favourites include Your Name, Clannad, and Charlotte.</> },
  {
    title: "Gaming",
    body: (
      <>
        Strategy and teamwork first: Valorant, Minecraft, and co-op horror like Phasmophobia and
        Devour.
      </>
    ),
  },
  {
    title: "Music",
    body: (
      <>
        How I focus and reset. Depending on the day it is{" "}
        {MUSIC.map((m, i) => (
          <span key={m.genre}>
            {i > 0 && (i === MUSIC.length - 1 ? " or " : ", ")}
            <Ext href={m.href}>{m.genre}</Ext>
          </span>
        ))}
        .
      </>
    ),
  },
];

function Ext({ href, className, children }) {
  return (
    <a href={href} target="_blank" rel="noreferrer" className={className}>
      {children}
    </a>
  );
}

/* Children resolve one after another so a pane assembles rather than appearing
   as a single block. */
const GROUP = {
  hidden: {},
  shown: { transition: { staggerChildren: 0.07, delayChildren: 0.04 } },
};

const ITEM = {
  hidden: { opacity: 0, y: 14 },
  shown: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] } },
};

const Serve = () => (
  <>
    <motion.p
      variants={ITEM}
      className="serif mx-auto max-w-[16ch] text-[clamp(2.1rem,5.2vw,3.9rem)] font-medium leading-[1.06]"
    >
      I build software that holds up.
    </motion.p>
    <motion.p variants={ITEM} className="prose mx-auto mt-7 max-w-[48ch] text-muted">
      Computer Engineering at the <Ext href="https://uwaterloo.ca/">University of Waterloo</Ext>,
      class of 2030. Research published in{" "}
      <Ext href="https://ieeexplore.ieee.org/abstract/document/10811073">IEEE Xplore</Ext>, then
      match analytics and fraud detection. Waterloo and Bangkok.
    </motion.p>
    <motion.p variants={ITEM} className="mt-8 flex flex-wrap justify-center gap-x-7 gap-y-2 text-[15px]">
      <a href={RESUME} className="text-accent hover:underline">
        Read the resume
      </a>
      <a href={`mailto:${EMAIL}`} className="text-muted transition-colors hover:text-ink">
        {EMAIL}
      </a>
    </motion.p>
  </>
);

const Record = () => (
  <div className="mx-auto max-w-[52ch] space-y-8">
    {RECORD.map((job) => (
      <motion.article key={job.company} variants={ITEM}>
        <p className="meta">{job.period}</p>
        <h2 className="serif mt-1 text-[22px] font-semibold">
          {job.link ? (
            <Ext href={job.link} className="transition-colors hover:text-accent">
              {job.company}
            </Ext>
          ) : (
            job.company
          )}
          <span className="text-muted">, {job.role}</span>
        </h2>
        <p className="prose mt-2 text-[17px] text-muted">{job.description}</p>
      </motion.article>
    ))}
  </div>
);

const Builds = () => (
  <div className="mx-auto max-w-[52ch] space-y-9">
    {BUILDS.map((project) => (
      <motion.article key={project.title} variants={ITEM}>
        <h2 className="serif text-[26px] font-semibold">{project.title}</h2>
        <p className="prose mt-2 text-[17px] text-muted">{project.description}</p>
        <p className="meta mt-3">{project.tech}</p>
        <p className="mt-2 flex justify-center gap-6 text-[14px]">
          {project.links.map((l) => (
            <Ext key={l.label} href={l.href} className="text-accent hover:underline">
              {l.label}
            </Ext>
          ))}
        </p>
      </motion.article>
    ))}
  </div>
);

const OffCourt = () => (
  <div className="mx-auto max-w-[52ch] space-y-7">
    {OFF_COURT.map((item) => (
      <motion.article key={item.title} variants={ITEM}>
        <h2 className="serif text-[21px] font-semibold">{item.title}</h2>
        <p className="prose mt-1.5 text-[17px] text-muted">{item.body}</p>
      </motion.article>
    ))}
  </div>
);

const CONTENT = { serve: Serve, record: Record, builds: Builds, "off-court": OffCourt };

function readPane() {
  const hash = window.location.hash.replace("#", "");
  if (CONTENT[hash]) return hash;
  return LEGACY_ANCHORS[hash] || "serve";
}

/**
 * Identity rail. Zain's sits centre-left with the reading matter to its right;
 * this one is pinned to the right edge and right-aligned, with the reading
 * matter centred in the space it leaves.
 */
function Rail({ pane, onPick, theme, onToggleTheme, onSmash }) {
  return (
    <aside className="flex shrink-0 flex-col gap-5 md:h-full md:justify-center md:text-right">
      <p className="serif text-[19px] font-semibold leading-tight">Bank Leelathanapipat</p>

      <nav aria-label="Panes">
        <ul className="m-0 flex list-none flex-wrap gap-x-5 gap-y-1 p-0 text-[15px] md:flex-col md:items-end md:gap-1.5">
          {PANES.map((p) => (
            <li key={p.id}>
              <a
                href={`#${p.id}`}
                onClick={onPick(p.id)}
                aria-current={pane === p.id ? "page" : undefined}
                className={
                  pane === p.id ? "text-accent" : "text-ink transition-colors hover:text-accent"
                }
              >
                {p.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <ul className="m-0 flex list-none flex-wrap gap-x-5 gap-y-1 p-0 md:flex-col md:items-end md:gap-1">
        {LINKS.map((l) => (
          <li key={l.label}>
            <a
              href={l.href}
              target={l.href.startsWith("http") ? "_blank" : undefined}
              rel={l.href.startsWith("http") ? "noreferrer" : undefined}
              className="meta transition-colors hover:text-ink"
            >
              {l.label}
            </a>
          </li>
        ))}
        <li>
          <button
            type="button"
            onClick={onToggleTheme}
            className="meta transition-colors hover:text-ink"
          >
            {theme === "dark" ? "Light" : "Dark"}
          </button>
        </li>
        <li>
          <button
            type="button"
            onClick={onSmash}
            className="meta transition-colors hover:text-accent"
          >
            Smash
          </button>
        </li>
      </ul>
    </aside>
  );
}

export default function App() {
  const reduce = useReducedMotion();
  const [theme, setTheme] = useState(
    () => document.documentElement.dataset.theme || "light",
  );
  const [pane, setPane] = useState(readPane);
  const [smashToken, setSmashToken] = useState(0);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem("theme", theme);
    } catch (e) {
      /* storage unavailable; the theme still applies for this page view */
    }
    document
      .querySelector('meta[name="theme-color"]')
      // Keep these two hexes in sync with the boot script in index.html.
      ?.setAttribute("content", theme === "dark" ? "#12100c" : "#f9f6ef");
  }, [theme]);

  useEffect(() => {
    const onHash = () => setPane(readPane());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const pick = useCallback(
    (id) => (event) => {
      event.preventDefault();
      history.replaceState(null, "", id === "serve" ? " " : `#${id}`);
      setPane(id);
      // The shuttle carries the change: one smash across the incoming pane.
      setSmashToken((n) => n + 1);
    },
    [],
  );

  const smash = useCallback(() => setSmashToken((n) => n + 1), []);
  const toggleTheme = useCallback(
    () => setTheme((t) => (t === "dark" ? "light" : "dark")),
    [],
  );

  const Pane = CONTENT[pane];

  return (
    <>
      <div className="grid h-[100dvh] grid-rows-[minmax(0,1fr)_auto] gap-8 overflow-hidden px-6 py-8 md:grid-cols-[minmax(0,1fr)_13rem] md:grid-rows-1 md:gap-14 md:px-12 md:py-0">
        <main className="flex min-h-0 items-center justify-center overflow-y-auto py-2 text-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={pane}
              variants={GROUP}
              initial={reduce ? false : "hidden"}
              animate="shown"
              exit={reduce ? undefined : { opacity: 0, y: -10, transition: { duration: 0.2 } }}
              className="w-full"
            >
              <Pane />
            </motion.div>
          </AnimatePresence>
        </main>

        <Rail
          pane={pane}
          onPick={pick}
          theme={theme}
          onToggleTheme={toggleTheme}
          onSmash={smash}
        />
      </div>

      <Shuttle smashToken={smashToken} theme={theme} />
    </>
  );
}
