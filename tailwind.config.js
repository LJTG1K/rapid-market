/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './contexts/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // RAPID "Verified" identity (Direction A, Nov 2026): white ground, neutral
        // photo tiles, near-black ink. Accents each have ONE job:
        //   stamp (red)  - buying only (Buy / Continue to Sugargoo)
        //   qc (green)   - only inside the Verified-seller seal
        //   pen (blue)   - only Gilly's handwritten notes (Gilly picks, never homepage)
        //   hi (yellow)  - highlighter, at most once per page, on a headline
        stone: '#FFFFFF',   // page background
        paper: '#F4F4F2',   // photo tile / quiet surface
        ink: '#0E0E10',     // primary text
        muted: '#6B6B70',   // secondary text
        line: '#E3E3DF',    // hairlines, borders
        stamp: '#C8361B',   // buy red
        accent: '#0E0E10',  // tags + link hovers now use ink (teal retired)
        qc: '#1F7A4D',
        pen: '#1D3FD6',
        hi: '#FFE680',
        dusk: '#0E0E10',    // footer
        // legacy aliases kept for any un-migrated components
        rapid: {
          black: '#0E0E10',
          white: '#FFFFFF',
        },
      },
      fontFamily: {
        // Archivo Expanded: big headlines only. Instrument Sans: everything else.
        // Bricolage stays solely for the RAPID. wordmark (font-mark).
        display: ['Archivo', 'Arial', 'sans-serif'],
        body: ['"Instrument Sans"', 'Arial', 'sans-serif'],
        mono: ['"Geist Mono"', 'ui-monospace', 'monospace'],
        mark: ['"Bricolage Grotesque"', 'Arial Black', 'sans-serif'],
        pen: ['"Nanum Pen Script"', 'cursive'],
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
