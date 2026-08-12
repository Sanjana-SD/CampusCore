/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        brand: {
          50: '#f5f7fa',
          100: '#e4ebf4',
          500: '#1e3a8a',
          600: '#1d4ed8',
          700: '#1e40af',
          900: '#0f172a',
        },
        campus: {
          bg: '#0a0a0f',
          panel: '#11111a',
          line: 'rgba(255,255,255,0.1)',
          accent: '#60a5fa',
          accent2: '#a855f7',
          accent3: '#ec4899',
        },
      },
    },
  },
  plugins: [],
}
