/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)",
        ink: "var(--text)",
        muted: "var(--text-muted)",
        faint: "var(--text-faint)",
        rule: "var(--rule)",
        accent: "var(--accent)",
      },
      fontFamily: {
        sans: ['"Space Grotesk Variable"', "ui-sans-serif", "system-ui", "sans-serif"],
        serif: ['"Newsreader Variable"', '"Iowan Old Style"', "Georgia", "serif"],
      },
      maxWidth: { shell: "1180px" },
    },
  },
  plugins: [],
}
