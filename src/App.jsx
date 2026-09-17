import { useCallback, useEffect, useLayoutEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import Court from "./components/Court";
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
    company: "Digital Health Center, Chulalongkorn University",
    role: "Software Developer",
    period: "2026",
    description:
      "A constraint-solver dispatch platform running the Faculty of Medicine's six-driver fleet in daily production. Also a camera-based CPR coach on pose estimation, 98.7% agreement across 82 trainees.",
  },
  {
    // KMITL was the employer. IEEE published the paper, so the citation is a
    // link inside the description rather than a link on the organisation.
    company: "King Mongkut's Institute of Technology Ladkrabang",
    role: "Research Assistant",
    period: "2024 to 2025",
    description: (
      <>
        A reservoir flood-monitoring system streaming water level and flow velocity from dam
        substations over 433 MHz Yagi-Uda telemetry.{" "}
        <Ext href="https://ieeexplore.ieee.org/abstract/document/10811073">
          Published in IEEE Xplore
        </Ext>
        .
      </>
    ),
  },
  {
    company: "ODDS-Thailand",
    role: "Software Engineering Intern",
    period: "2024",
    description:
      "Responsive UI for a $300M financial platform, and query optimisation on a 20M-entry MongoDB cluster.",
    link: "https://odds.team/",
  },
  {
    company: "NurseMetrics",
    role: "Lead Developer",
    period: "2023 to 2024",
    description:
      "A KPI tracking app on Google Apps Script that automated data entry and cut reporting time by 70%.",
  },
];

const BUILDS = [
  {
    title: "Sentinel",
    description:
      "Scores transactions as they arrive and shows the reasoning behind each alert. Graph analysis pulls in the surrounding account activity, so an analyst sees the network a flagged transaction sits in rather than a number on its own. Takes CSV batches for retrospective review too. Built at GenAI Genesis.",
    tech: "Python, FastAPI, Next.js, graph analysis",
    links: [
      { label: "Source", href: "https://github.com/SarveshwarSenthilKumar/Sentinel" },
      { label: "Devpost", href: "https://devpost.com/software/sentinel-128ad4" },
    ],
  },
  {
    // The Source link is deliberately absent: the only public badminton repo is
    // the computer-vision one below, which is a different project.
    title: "Badminton Tracker",
    description:
      "Match analytics for competitive players. Casual apps stop at the running score; this keeps full match history at rally level, so performance trends across a season are reviewable instead of remembered.",
    tech: "MERN, TypeScript, Tailwind CSS, MongoDB",
    links: [],
  },
  {
    title: "Shuttle Vision",
    description:
      "Tracks the shuttlecock through broadcast match footage with a TrackNetV3 fork, then segments the video into rallies, caching each match and rendering overlays to check the tracking by eye. Groundwork for scoring individual shots.",
    tech: "Python, PyTorch, OpenCV, TrackNetV3",
    links: [{ label: "Source", href: "https://github.com/Bank-Leela/badminton_tracker" }],
  },
];

const ABOUT = [
  {
    label: "Now",
    value: "Back from a co-op at the Digital Health Center, Chulalongkorn University, where the dispatch platform I built is still running the Faculty of Medicine's fleet.",
  },
  {
    label: "Studying",
    value: "Algorithms and data structures in C++, computer architecture down to assembly and memory systems, digital circuits in Verilog.",
  },
  {
    label: "Reaching for",
    value: "Python, TypeScript, React and Next.js, FastAPI, Postgres and Prisma, PyTorch.",
  },
  {
    label: "Away from the keyboard",
    value: "Badminton, most days. Anime, and co-op horror games with friends.",
  },
  { label: "Based", value: "Waterloo and Bangkok." },
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
        Watching is half the interest: where a shot was played from, what it forced, and why a
        rally was often decided three shots before the point ended. I play regularly with the
        Waterloo Badminton Club, and I keep track of my own patterns closely enough that it
        eventually turned into a project.
      </>
    ),
  },
  {
    title: "Gaming",
    body: (
      <>
        Strategy and teamwork first: Valorant, Minecraft, and co-op horror like Phasmophobia and
        Devour. What holds my attention is coordination under pressure, reading what the other
        side is set up to do and committing before you are certain. Minecraft is the opposite
        pole, building with no clock running. Co-op horror is mostly an excuse to be on a call
        with friends while everything goes wrong.
      </>
    ),
  },
  {
    title: "Anime and manga",
    body: (
      <>
        Favourites include Your Name, Clannad, and Charlotte. Two of those are Jun Maeda&rsquo;s,
        which is not an accident. I am drawn to ordinary life sharpened by a single impossible
        premise, and to stories that earn their ending slowly rather than surprising you into it.
        Your Name is the outlier, there for Shinkai&rsquo;s craft as much as the story.
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
        . Thai-pop is home and gets the most play. City-pop is what goes on for long stretches of
        work, since it sits in the background without asking for anything. Hip-hop is for the days
        that need momentum instead of calm.
      </>
    ),
  },
];

function Ext({ href, children }) {
  return (
    <a href={href} target="_blank" rel="noreferrer" className="link">
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
  <div className="grid items-center gap-x-14 gap-y-10 md:grid-cols-2">
    <div className="mx-auto max-w-[46ch] text-center">
      <motion.p
        variants={ITEM}
        className="knock readable text-[clamp(2.1rem,4.4vw,3.4rem)] font-medium leading-[1.06] tracking-[-0.03em]"
      >
        I build software that holds up.
      </motion.p>
      <motion.p variants={ITEM} className="knock readable prose mt-7">
        Computer Engineering at the <Ext href="https://uwaterloo.ca/">University of Waterloo</Ext>,
        class of 2030. Research published in{" "}
        <Ext href="https://ieeexplore.ieee.org/abstract/document/10811073">IEEE Xplore</Ext>, then
        match analytics and fraud detection.
      </motion.p>
      <motion.p variants={ITEM} className="knock readable mt-8 flex flex-wrap justify-center gap-x-7 gap-y-2 text-[15px]">
        <a href={RESUME} className="link">
          Read the resume
        </a>
        <a href={`mailto:${EMAIL}`} className="link">
          {EMAIL}
        </a>
      </motion.p>
    </div>

    {/* The far side of the net was empty, so it carries the detail the
        headline has no room for. */}
    <dl className="m-0 mx-auto max-w-[42ch] self-center text-center">
      {ABOUT.map((fact) => (
        <motion.div key={fact.label} variants={ITEM} className="knock mt-5 first:mt-0">
          <dt className="readable meta">{fact.label}</dt>
          <dd className="readable prose m-0 mt-1 text-[16px]">{fact.value}</dd>
        </motion.div>
      ))}
    </dl>
  </div>
);

const Record = () => (
  <div className="grid gap-x-14 gap-y-8 md:grid-cols-2">
    {RECORD.map((job) => (
      <motion.article key={job.company} variants={ITEM} className="knock max-w-[46ch]">
        <p className="readable meta">{job.period}</p>
        <h2 className="readable mt-1 text-[20px] font-medium tracking-[-0.02em]">
          {job.link ? <Ext href={job.link}>{job.company}</Ext> : job.company}
          <span className="text-body">, {job.role}</span>
        </h2>
        <p className="readable prose mt-2 text-[16px]">{job.description}</p>
      </motion.article>
    ))}
  </div>
);

const Builds = () => (
  <div className="grid gap-x-14 gap-y-8 md:grid-cols-2">
    {BUILDS.map((project) => (
      <motion.article key={project.title} variants={ITEM} className="knock max-w-[46ch]">
        <h2 className="readable text-[22px] font-medium tracking-[-0.02em]">{project.title}</h2>
        <p className="readable prose mt-2 text-[16px]">{project.description}</p>
        <p className="readable meta mt-3">
          {project.tech}
          {project.links.map((l) => (
            <span key={l.label}>
              <span aria-hidden="true"> &middot; </span>
              <Ext href={l.href}>{l.label}</Ext>
            </span>
          ))}
        </p>
      </motion.article>
    ))}
  </div>
);

const OffCourt = () => (
  <div className="grid gap-x-14 gap-y-8 md:grid-cols-2">
    {OFF_COURT.map((item) => (
      <motion.article key={item.title} variants={ITEM} className="knock max-w-[46ch]">
        <h2 className="readable text-[19px] font-medium tracking-[-0.02em]">{item.title}</h2>
        <p className="readable prose mt-1.5 text-[16px]">{item.body}</p>
      </motion.article>
    ))}
  </div>
);

const CONTENT = { serve: Serve, record: Record, builds: Builds, "off-court": OffCourt };

function readPane() {
  const hash = window.location.hash.replace("#", "");
  // Own-property guards: without them `#constructor` and `#__proto__` resolve
  // to prototype members and React throws on the resulting element type.
  if (Object.prototype.hasOwnProperty.call(CONTENT, hash)) return hash;
  if (Object.prototype.hasOwnProperty.call(LEGACY_ANCHORS, hash)) return LEGACY_ANCHORS[hash];
  return "serve";
}

export default function App() {
  const reduce = useReducedMotion();
  const [theme, setTheme] = useState(
    () => document.documentElement.dataset.theme || "light",
  );
  const [pane, setPane] = useState(readPane);
  const [smashToken, setSmashToken] = useState(0);

  // A layout effect, so the attribute lands before any child's passive effect
  // runs. React fires children's effects first, and the shuttle reads its
  // colours from the stylesheet when the theme changes; with a plain effect it
  // read the outgoing palette every time and painted itself into the paper.
  useLayoutEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem("theme", theme);
    } catch (e) {
      /* storage unavailable; the theme still applies for this page view */
    }
    document
      .querySelector('meta[name="theme-color"]')
      // Keep these two hexes in sync with the boot script in index.html.
      ?.setAttribute("content", theme === "dark" ? "#121212" : "#f4f4f2");
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
      {/*
        Four corners hold the furniture and the middle row holds the reading
        matter, so nothing is stacked into a rail. The open centre is also the
        shuttle's court.
      */}
      <Court />

      <div className="relative z-10 grid h-[100dvh] grid-cols-2 grid-rows-[auto_minmax(0,1fr)_auto] gap-x-6 gap-y-5 overflow-hidden px-6 py-6 md:px-10 md:py-8">
        <a href="#serve" className="readable-soft self-start text-[21px] font-semibold tracking-[-0.035em]">
          Bank Leelathanapipat
        </a>

        <nav aria-label="Panes" className="readable-soft justify-self-end self-start text-right">
          <ul className="m-0 flex list-none flex-col items-end gap-1 p-0 text-[15px]">
            {PANES.map((p) => (
              <li key={p.id}>
                <a
                  href={`#${p.id}`}
                  onClick={pick(p.id)}
                  aria-current={pane === p.id ? "page" : undefined}
                  className={pane === p.id ? "underline underline-offset-4" : "text-body hover:text-ink"}
                >
                  {p.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <main className="col-span-2 flex min-h-0 items-center overflow-y-auto overflow-x-hidden py-2">
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

        <ul className="readable-soft m-0 flex list-none flex-wrap items-end gap-x-5 gap-y-1 self-end p-0">
          {LINKS.map((l) => (
            <li key={l.label}>
              <a
                href={l.href}
                target={l.href.startsWith("http") ? "_blank" : undefined}
                rel={l.href.startsWith("http") ? "noreferrer" : undefined}
                className="meta hover:text-ink"
              >
                {l.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="readable-soft flex flex-col items-end gap-1 justify-self-end self-end">
          <button type="button" onClick={toggleTheme} className="meta hover:text-ink">
            {theme === "dark" ? "Light" : "Dark"}
          </button>
          <button type="button" onClick={smash} className="meta hover:text-ink">
            Smash
          </button>
        </div>
      </div>

      <Shuttle smashToken={smashToken} theme={theme} />
    </>
  );
}
