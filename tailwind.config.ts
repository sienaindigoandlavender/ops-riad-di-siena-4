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
        // Slow-dreamy warm neutrals
        sand: "#FBF9F4",
        cream: "#FBF9F4",
        parchment: "#F7F2EA",
        linen: "#EEE8DB",
        bone: "#FAF7F0",
        background: "#FBF9F4",
        foreground: "#2B2623",
        // Warm ink system
        ink: {
          DEFAULT: "#3E3630",
          primary: "#2B2623",
          body: "#3E3630",
          secondary: "#6B5F55",
          tertiary: "#9C8E82",
          inverse: "#EDE5D8",
        },
        // Muted accent palette
        accent: {
          DEFAULT: "#A8826F",
          soft: "#E8DDD4",
          strong: "#6B4E3D",
        },
        sage: "#8B9D7F",
        gold: "#C4A574",
        dusty: "#7B8A99",
        rose: "#B08A8A",
        forest: "#6B7B6E",
        brick: "#B07A6F",
        // Semantic
        success: "#8B9D7F",
        warning: "#C4A574",
        danger: "#B07A6F",
        info: "#7B8A99",
        // Borders
        border: {
          subtle: "#E5DCCF",
          DEFAULT: "#D4C8B8",
          strong: "#B8A997",
        },
        muted: {
          DEFAULT: "#EEE8DB",
          foreground: "#6B5F55",
        },
      },
      fontFamily: {
        serif: ["Fraunces", "Playfair Display", "Georgia", "serif"],
        sans: ["General Sans", "Space Grotesk", "system-ui", "sans-serif"],
      },
      fontSize: {
        base: ["1.0625rem", { lineHeight: "1.6" }],
      },
      boxShadow: {
        xs: "0 1px 2px rgba(75, 58, 47, 0.04)",
        sm: "0 2px 8px rgba(75, 58, 47, 0.04), 0 1px 3px rgba(75, 58, 47, 0.06)",
        md: "0 2px 8px rgba(75, 58, 47, 0.04), 0 8px 24px rgba(75, 58, 47, 0.06)",
        lg: "0 4px 12px rgba(75, 58, 47, 0.06), 0 16px 40px rgba(75, 58, 47, 0.08)",
        xl: "0 8px 24px rgba(75, 58, 47, 0.08), 0 32px 64px rgba(75, 58, 47, 0.10)",
      },
      borderRadius: {
        sm: "6px",
        md: "10px",
        lg: "16px",
        xl: "24px",
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
          from: { opacity: "0", transform: "translateY(12px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        breathe: {
          "0%, 100%": { opacity: "0.6", transform: "scale(1)" },
          "50%": { opacity: "1", transform: "scale(1.04)" },
        },
      },
      animation: {
        "fade-rise": "fade-rise 500ms cubic-bezier(0.16, 1, 0.3, 1) both",
        breathe: "breathe 2s cubic-bezier(0.22, 1, 0.36, 1) infinite",
      },
    },
  },
  plugins: [],
};

export default config;
