import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        turf: {
          950: "#0F241D",
          900: "#16332A",
          700: "#25523F",
          500: "#3F7D58",
          300: "#8FB99C",
        },
        parchment: {
          100: "#F2ECD9",
          200: "#E9E0C7",
        },
        flag: "#C1440E",
        ink: "#1B211D",
      },
      fontFamily: {
        display: ["var(--font-display)", "serif"],
        body: ["var(--font-body)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      borderRadius: {
        card: "6px",
      },
    },
  },
  plugins: [],
};
export default config;
