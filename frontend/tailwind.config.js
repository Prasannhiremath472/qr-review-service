// Build-time Tailwind config (replaces the runtime cdn.tailwindcss.com script
// that used to be loaded from index.html). The semantic colour tokens below are
// used by the customer review page; their values come from the CSS variables
// defined on .rv-theme in src/index.css.
const rv = (name) => `rgb(var(--rv-${name}) / <alpha-value>)`;

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "sans-serif"],
        display: ["Outfit", "Roboto", "Noto Sans Devanagari", "sans-serif"],
        review: ["Roboto", "Noto Sans Devanagari", "system-ui", "sans-serif"],
      },
      colors: {
        background: rv("background"),
        foreground: rv("foreground"),
        card: rv("card"),
        primary: rv("primary"),
        "primary-foreground": rv("primary-foreground"),
        muted: rv("muted"),
        "muted-foreground": rv("muted-foreground"),
        star: rv("star"),
        "star-soft": rv("star-soft"),
        lavender: rv("lavender"),
        destructive: rv("destructive"),
        border: rv("border"),
      },
      boxShadow: {
        card: "0 12px 40px -12px rgba(30, 41, 59, 0.25)",
        float: "0 6px 18px -4px rgba(30, 41, 59, 0.35)",
      },
    },
  },
  plugins: [],
};
