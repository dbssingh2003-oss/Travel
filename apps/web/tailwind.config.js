/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
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
        success: "#10B981",
        warning: "#F59E0B",
        danger: "#EF4444",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
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
        card: "0 4px 24px rgba(0,0,0,0.4), 0 1px 4px rgba(0,0,0,0.3)",
        "card-hover": "0 8px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(99,102,241,0.3)",
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "float": "float 6s ease-in-out infinite",
        "shimmer": "shimmer 1.5s infinite",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
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
