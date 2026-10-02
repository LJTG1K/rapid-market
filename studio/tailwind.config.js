/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./pages/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // RAPID accents, used only where they carry meaning (SPEC.md § Design):
        // stamp = Publish, accent = status & tags. Everything else is neutral zinc.
        stamp: { DEFAULT: '#BC3A1D', dark: '#9E2F16' },
        accent: { DEFAULT: '#155E58', soft: '#E3EFED' },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'Segoe UI', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
