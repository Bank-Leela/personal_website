import { useState } from "react";
import { Play } from "lucide-react";

const GENRES = [
  {
    genre: "Thai-pop",
    note: "Melodic hooks, and a mix of polished production with a more emotional feel.",
    embed: "track/34XtsYtOE2XUlgF8Iv2WUz",
  },
  {
    genre: "Japanese-pop",
    note: "The genre I come back to the most, especially songs tied to anime, films, and strong storytelling.",
    embed: "track/1FOhzA4qQiyVnzVYt1KcgN",
  },
  {
    genre: "City-pop",
    note: "What I reach for when I want something smoother and easy to have on in the background.",
    embed: "track/0JUWF44gfMszGNhjCF7Ufs",
  },
  {
    genre: "Hip-hop",
    note: "A different kind of energy and rhythm, for when I want something driving while working through ideas.",
    embed: "track/0y9uTzK9cNKSAEHnpeRG8C",
  },
];

/**
 * Four genre picks, each holding one Spotify embed behind a click.
 *
 * Loading all of them up front meant eight third-party documents on a page
 * nobody visits for the music. A facade button costs nothing until someone
 * actually wants to listen.
 *
 * The embed's chrome follows the live page theme rather than the theme at the
 * moment it was opened. Pinning it to the open-time theme would avoid
 * reloading an iframe out from under a playing track, but it also leaves a
 * black Spotify card sitting in the middle of the light palette the moment
 * anyone toggles, and the page holding one theme end to end matters more than
 * an interruption that only happens if you switch themes mid-song.
 */
export default function MusicShelf({ theme = "dark" }) {
  const [open, setOpen] = useState({});
  const spotifyTheme = theme === "light" ? "1" : "0";

  const play = (genre) => setOpen((current) => ({ ...current, [genre]: true }));

  return (
    <div className="grid grid-cols-1 gap-x-10 sm:grid-cols-2">
      {GENRES.map((item) => (
        <div
          key={item.genre}
          className="flex flex-col border-t border-[var(--color-border-soft)] py-7"
        >
          <h4 className="font-display text-xl font-bold text-[var(--color-text)] md:text-2xl">
            {item.genre}
          </h4>
          <p className="mt-2 max-w-[48ch] text-sm leading-relaxed text-[var(--color-text-muted)]">
            {item.note}
          </p>

          <div className="mt-5">
            {open[item.genre] ? (
              <iframe
                title={`${item.genre} preview on Spotify`}
                src={`https://open.spotify.com/embed/${item.embed}?utm_source=generator&theme=${spotifyTheme}`}
                width="100%"
                height="152"
                className="w-full rounded-[var(--radius-media)]"
                frameBorder="0"
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                loading="lazy"
              />
            ) : (
              <button
                type="button"
                onClick={() => play(item.genre)}
                className="inline-flex items-center gap-2.5 rounded-[var(--radius-pill)] border border-[var(--color-border)] bg-[var(--color-pill)] px-4 py-2.5 text-sm font-semibold text-[var(--color-text)] transition-all duration-300 hover:border-[var(--color-accent-border)] hover:bg-[var(--color-accent-soft)] hover:text-[var(--color-accent-text)] active:scale-[0.98]"
              >
                <Play size={14} aria-hidden="true" className="fill-current" />
                Play a {item.genre} pick
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
