import type { Config } from "tailwindcss";
import typography from "@tailwindcss/typography";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f2f5ff",
          100: "#e0e7ff",
          200: "#c2cffe",
          300: "#9bacfb",
          400: "#7686f6",
          500: "#5561ee",
          600: "#4142d8",
          700: "#3733ae",
          800: "#302e8a",
          900: "#2b2b6e",
          950: "#151434",
        },
        surface: {
          DEFAULT: "#0b0c14",
          raised: "#14151f",
          border: "#232433",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.5rem",
      },
    },
  },
  plugins: [typography],
};

export default config;
