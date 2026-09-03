import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        shadowfax: {
          green: "#1F6F5C",
          "green-dark": "#155245",
          "green-light": "#E8F3F0",
          yellow: "#D8DA3A",
        },
        surface: {
          bg: "#F7F8FA",
          card: "#FFFFFF",
          border: "#E7E9EC",
        },
      },
      boxShadow: {
        card: "0 1px 2px rgba(16, 24, 40, 0.04), 0 1px 3px rgba(16, 24, 40, 0.06)",
        elevated: "0 4px 12px rgba(16, 24, 40, 0.08)",
      },
      borderRadius: {
        xl: "0.875rem",
        "2xl": "1.25rem",
      },
    },
  },
  plugins: [],
};

export default config;
