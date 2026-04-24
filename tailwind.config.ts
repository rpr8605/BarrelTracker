import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#BA7517",
        "primary-light": "#FAC775",
        "primary-dark": "#854F0B",
        success: "#3B6D11",
        warning: "#854F0B",
        danger: "#A32D2D",
      },
    },
  },
  plugins: [],
};
export default config;
