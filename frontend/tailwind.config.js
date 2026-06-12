/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Dark analytics palette.
        ink: {
          950: "#070a12",
          900: "#0b0f1a",
          850: "#0f1422",
          800: "#141a2b",
          700: "#1c2438",
          600: "#283149",
        },
        oracle: {
          win: "#22d3a7", // teal/green
          draw: "#f5c451", // amber
          loss: "#fb6f7d", // red/pink
          accent: "#6c8cff", // electric indigo
          accent2: "#a07bff",
        },
      },
      fontFamily: {
        sans: [
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
      },
      boxShadow: {
        glass: "0 8px 32px rgba(0, 0, 0, 0.45)",
        glow: "0 0 40px -8px rgba(108, 140, 255, 0.55)",
      },
      backgroundImage: {
        "grid-faint":
          "linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.5s ease forwards",
      },
    },
  },
  plugins: [],
};
