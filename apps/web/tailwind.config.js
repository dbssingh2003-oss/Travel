/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: "#080C14",
        surface: "#0F1623",
        "surface-2": "#161F30",
        border: "#1E2A40",
        primary: "#6366F1",
        "primary-hover": "#4F46E5",
        "primary-glow": "rgba(99,102,241,0.25)",
        accent: "#22D3EE",
        "accent-glow": "rgba(34,211,238,0.2)",
        muted: "#94A3B8",
        "muted-fg": "#64748B",
        brand: {
          50: "#f0f7ff",
          100: "#e0effe",
          200: "#bae0fd",
          300: "#7cc5fb",
          400: "#38a5f8",
          500: "#2563eb", // primary action
          600: "#1d4ed8",
          700: "#1d40b0",
          800: "#1e3a8a",
          900: "#1e3a5f",
          glow: "rgba(37,99,235,0.25)",
        },
        success: {
          DEFAULT: "#10B981",
          50: "#f0fdf4",
          500: "#16a34a",
          600: "#15803d",
          glow: "rgba(22,163,74,0.2)",
        },
        warning: {
          DEFAULT: "#F59E0B",
          50: "#fffbeb",
          500: "#d97706", // for WAITLISTED/RAC badges
          600: "#b45309",
          glow: "rgba(217,119,6,0.2)",
        },
        danger: {
          DEFAULT: "#EF4444",
          50: "#fef2f2",
          500: "#dc2626",
          600: "#b91c1c",
          glow: "rgba(220,38,38,0.2)",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        display: ["Cal Sans", "Inter", "sans-serif"],
      },
      borderRadius: {
        card: "1rem",
        pill: "9999px",
      },
      backgroundImage: {
        "hero-gradient": "linear-gradient(135deg, #080C14 0%, #0D1526 40%, #111B34 100%)",
        "card-gradient": "linear-gradient(145deg, rgba(15,22,35,0.8) 0%, rgba(22,31,48,0.9) 100%)",
        "primary-gradient": "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)",
        "accent-gradient": "linear-gradient(135deg, #22D3EE 0%, #06B6D4 100%)",
        "glow-radial": "radial-gradient(ellipse at center, rgba(99,102,241,0.15) 0%, transparent 70%)",
      },
      boxShadow: {
        "glow-primary": "0 0 30px rgba(99,102,241,0.3), 0 0 60px rgba(99,102,241,0.1)",
        "glow-accent": "0 0 30px rgba(34,211,238,0.3)",
        card: "0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)",
        elevated: "0 10px 25px rgba(0,0,0,0.10)",
        "card-hover": "0 8px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(99,102,241,0.3)",
        "glow-brand": "0 0 30px rgba(37,99,235,0.3)",
      },
      animation: {
        "fade-in": "fadeIn 200ms ease-out",
        "slide-up": "slideUp 250ms cubic-bezier(0.16, 1, 0.3, 1)",
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        float: "float 6s ease-in-out infinite",
        shimmer: "shimmer 1.5s infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-8px)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
    },
  },
  plugins: [],
};
