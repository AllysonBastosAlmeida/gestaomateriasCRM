/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#16313f',
        mist: '#eef6f7',
        sand: '#f5efe6',
        teal: '#127475',
        coral: '#c96c4b',
        slate: '#5d6f77',
      },
      boxShadow: {
        panel: '0 12px 36px rgba(22, 49, 63, 0.10)',
      },
      fontFamily: {
        display: ['Manrope', 'sans-serif'],
        body: ['"DM Sans"', 'sans-serif'],
      },
      backgroundImage: {
        grid:
          'linear-gradient(rgba(18,116,117,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(18,116,117,0.06) 1px, transparent 1px)',
      },
      backgroundSize: {
        grid: '24px 24px',
      },
    },
  },
  plugins: [],
}
