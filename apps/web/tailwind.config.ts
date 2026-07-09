import type { Config } from "tailwindcss";
import typography from "@tailwindcss/typography";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Dourado — destaques premium, links, estados ativos.
        gold: {
          50: "#fdfbf3",
          100: "#f5e7b2",
          200: "#eeda96",
          300: "#e2c775",
          400: "#d4b461",
          500: "#c8a951",
          600: "#b39240",
          700: "#8f7433",
          800: "#6b5827",
          900: "#4a3d1c",
        },
        // Preto/cinza — texto e botões primários.
        ink: {
          50: "#f7f7f8",
          100: "#eeeef0",
          200: "#dcdce0",
          300: "#b8b8c0",
          400: "#8e8e96",
          500: "#6b6b73",
          600: "#4b5563",
          700: "#3f3f46",
          800: "#27272a",
          900: "#18181b",
          950: "#111111",
        },
        surface: {
          DEFAULT: "#f8f9fa",
          raised: "#ffffff",
          border: "#e5e7eb",
        },
        // Mantido por compatibilidade com classes ja usadas no codigo;
        // aponta para a escala dourada (era a cor "brand" indigo antiga).
        brand: {
          50: "#fdfbf3",
          100: "#f5e7b2",
          200: "#eeda96",
          300: "#e2c775",
          400: "#d4b461",
          500: "#c8a951",
          600: "#b39240",
          700: "#8f7433",
          800: "#6b5827",
          900: "#4a3d1c",
          950: "#332810",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.5rem",
      },
      keyframes: {
        "toast-in": {
          "0%": { opacity: "0", transform: "translateY(-8px) scale(0.95)" },
          "100%": { opacity: "1", transform: "translateY(0) scale(1)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "scale-in": {
          "0%": { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
      },
      animation: {
        "toast-in": "toast-in 0.2s ease-out",
        "fade-in": "fade-in 0.15s ease-out",
        "scale-in": "scale-in 0.15s ease-out",
      },
    },
  },
  plugins: [typography],
};

export default config;
