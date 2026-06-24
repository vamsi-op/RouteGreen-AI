import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          green: "#16a34a",
          dark: "#064e3b",
          mid: "#10b981",
          slate: "#0f172a",
        },
      },
    },
  },
  plugins: [],
};

export default config;
