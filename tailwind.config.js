/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // RAPID Marketplace design tokens — warm industrial / customs-manifest palette
        // "Dual Stamp" refresh: lighter/creamier ground, deeper ink, + a disciplined
        // second accent (customs-ink teal) for tags & links. Red stays reserved for CTAs.
        stone: '#E7E1D1',   // page background (lighter, creamier)
        paper: '#F3F0E8',   // card / surface background
        ink: '#1B1A14',     // primary text, display type (deeper)
        muted: '#69614F',   // secondary text
        line: '#C3BAA6',    // hairlines, rules, borders
        stamp: '#BC3A1D',   // primary accent — customs-stamp red (CTAs)
        accent: '#155E58',  // secondary accent — customs-ink teal (tags, links)
        dusk: '#14140E',    // dark section background (footer)
        // legacy aliases kept for any un-migrated components
        rapid: {
          black: '#1B1A14',
          white: '#F3F0E8',
        },
      },
      fontFamily: {
        display: ['"Bricolage Grotesque"', 'Arial Black', 'sans-serif'],
        body: ['"Inter Tight"', 'Inter', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },
      fontSize: {
        xs: ['12px', '18px'],
        sm: ['13px', '20px'],
        base: ['16px', '26px'],
        lg: ['19px', '29px'],
        xl: ['22px', '30px'],
        '2xl': ['28px', '34px'],
        '3xl': ['36px', '40px'],
        '4xl': ['48px', '50px'],
        '5xl': ['64px', '62px'],
        '6xl': ['84px', '80px'],
        '7xl': ['112px', '96px'],
        '8xl': ['148px', '128px'],
      },
      letterSpacing: {
        tightest: '-0.04em',
        tighter: '-0.02em',
        wide: '0.08em',
        widest: '0.18em',
      },
      boxShadow: {
        card: '0 1px 0 0 rgba(27,26,20,0.06)',
        stamp: '0 12px 30px -12px rgba(27,26,20,0.35)',
      },
      transitionTimingFunction: {
        stamp: 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
    },
  },
  plugins: [],
};
