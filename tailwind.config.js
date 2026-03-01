/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        primary: {
          DEFAULT: 'var(--primary)',
          foreground: 'var(--primary-foreground)',
        },
        border: 'var(--border)',
      },
      fontFamily: {
        mono: ['Geist Mono', 'monospace'],
        sentient: ['Sentient', 'sans-serif'],
      },
      boxShadow: {
        glow: 'var(--shadow-glow)',
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}
