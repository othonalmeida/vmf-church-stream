/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Dourado — destaques premium, links, estados ativos. Mesma escala do apps/web.
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
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.5rem",
      },
    },
  },
  plugins: [],
};
