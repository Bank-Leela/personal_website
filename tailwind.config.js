/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        floor: "var(--floor)",
        mat: "var(--mat)",
        ink: "var(--ink)",
        body: "var(--body)",
        meta: "var(--meta)",
        rule: "var(--rule)",
      },
      fontFamily: {
        sans: ['"Space Grotesk Variable"', "ui-sans-serif", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
}
