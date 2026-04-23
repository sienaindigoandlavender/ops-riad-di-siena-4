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
        // Zara-minimal neutrals (pure white + near-black)
        sand: "#FFFFFF",
        cream: "#FFFFFF",
        parchment: "#FAFAFA",
        linen: "#F5F5F5",
        bone: "#F7F7F7",
        background: "#FFFFFF",
        foreground: "#000000",
        ink: {
          DEFAULT: "#1A1A1A",
          primary: "#000000",
          body: "#1A1A1A",
          secondary: "#666666",
          tertiary: "#999999",
          inverse: "#FFFFFF",
        },
        accent: {
          DEFAULT: "#000000",
          soft: "#F5F5F5",
          strong: "#000000",
        },
        // Pastel booking source colors — preserved
        sage: "#9DA88F",
        gold: "#C4A574",
        dusty: "#A8BDC8",
        rose: "#C9A5A0",
        forest: "#5C4220",
        brick: "#B07A6F",
        success: "#9DA88F",
        warning: "#C4A574",
        danger: "#B07A6F",
        info: "#A8BDC8",
        border: {
          subtle: "#EEEEEE",
          DEFAULT: "#D4D4D4",
          strong: "#999999",
        },
        muted: {
          DEFAULT: "#F5F5F5",
          foreground: "#666666",
        },
      },
      fontFamily: {
        // Serif aliased to sans — Zara minimalism has no serifs
        serif: ["Helvetica Neue", "Helvetica", "Arial", "sans-serif"],
        sans: ["Helvetica Neue", "Helvetica", "Arial", "sans-serif"],
      },
      fontSize: {
        base: ["0.875rem", { lineHeight: "1.5" }],
      },
      boxShadow: {
        // Minimal, subtle shadows only
        xs: "0 1px 2px rgba(0, 0, 0, 0.03)",
        sm: "0 1px 2px rgba(0, 0, 0, 0.04)",
        md: "0 2px 4px rgba(0, 0, 0, 0.04)",
        lg: "0 4px 12px rgba(0, 0, 0, 0.06)",
        xl: "0 8px 24px rgba(0, 0, 0, 0.08)",
      },
      borderRadius: {
        // Sharp corners — Zara aesthetic
        sm: "0",
        md: "0",
        lg: "0",
        xl: "0",
      },
      letterSpacing: {
        // Tight tracking for uppercase labels
        wider: "0.1em",
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
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        breathe: {
          "0%, 100%": { opacity: "0.6", transform: "scale(1)" },
          "50%": { opacity: "1", transform: "scale(1.04)" },
        },
      },
      animation: {
        "fade-rise": "fade-rise 300ms cubic-bezier(0.22, 1, 0.36, 1) both",
        breathe: "breathe 2s cubic-bezier(0.22, 1, 0.36, 1) infinite",
      },
    },
  },
  plugins: [],
};

export default config;
