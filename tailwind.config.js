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
        stone: '#DAD5C8',   // page background
        paper: '#F3F0E8',   // card / surface background
        ink: '#201E19',     // primary text, display type
        muted: '#69614F',   // secondary text
        line: '#C3BAA6',    // hairlines, rules, borders
        stamp: '#BC3A1D',   // single accent — customs-stamp red
        dusk: '#17160F',    // dark section background (footer)
        // legacy aliases kept for any un-migrated components
        rapid: {
          black: '#201E19',
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
        card: '0 1px 0 0 rgba(32,30,25,0.06)',
        stamp: '0 12px 30px -12px rgba(32,30,25,0.35)',
      },
      transitionTimingFunction: {
        stamp: 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
    },
  },
  plugins: [],
};
