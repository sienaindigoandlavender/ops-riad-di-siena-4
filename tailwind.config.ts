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
        // Premium neutrals
        sand: "#FAFAF8",
        cream: "#FFFFFF",
        parchment: "#FAFAF8",
        linen: "#F4F4F2",
        bone: "#F7F7F5",
        background: "#FFFFFF",
        foreground: "#111111",
        ink: {
          DEFAULT: "#2C2C2C",
          primary: "#111111",
          body: "#2C2C2C",
          secondary: "#555555",
          tertiary: "#808080",
          inverse: "#FFFFFF",
        },
        accent: {
          DEFAULT: "#111111",
          soft: "#F4F4F2",
          strong: "#000000",
        },
        // Premium muted booking source colors
        sage: "#8A9A80",
        gold: "#B5976A",
        dusty: "#8B9DAD",
        rose: "#B8918B",
        forest: "#4A5C3E",
        brick: "#A07060",
        success: "#8A9A80",
        warning: "#B5976A",
        danger: "#A07060",
        info: "#8B9DAD",
        border: {
          subtle: "#EAEAE8",
          DEFAULT: "#D5D5D3",
          strong: "#A0A09E",
        },
        muted: {
          DEFAULT: "#F4F4F2",
          foreground: "#717171",
        },
      },
      fontFamily: {
        serif: ["Inter", "system-ui", "sans-serif"],
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      fontSize: {
        base: ["0.8125rem", { lineHeight: "1.5" }],
      },
      boxShadow: {
        xs: "0 1px 2px rgba(0, 0, 0, 0.03)",
        sm: "0 1px 3px rgba(0, 0, 0, 0.04)",
        md: "0 2px 6px rgba(0, 0, 0, 0.05)",
        lg: "0 4px 12px rgba(0, 0, 0, 0.06)",
        xl: "0 8px 24px rgba(0, 0, 0, 0.08)",
      },
      borderRadius: {
        sm: "2px",
        md: "3px",
        lg: "4px",
        xl: "6px",
      },
      transitionTimingFunction: {
        gentle: "cubic-bezier(0.22, 1, 0.36, 1)",
        soft: "cubic-bezier(0.4, 0, 0.2, 1)",
      },
      transitionDuration: {
        "400": "400ms",
        "600": "600ms",
      },
      keyframes: {
        "fade-rise": {
          from: { opacity: "0", transform: "translateY(6px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        breathe: {
          "0%, 100%": { opacity: "0.4" },
          "50%": { opacity: "0.8" },
        },
      },
      animation: {
        "fade-rise": "fade-rise 250ms cubic-bezier(0.22, 1, 0.36, 1) both",
        breathe: "breathe 2s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
