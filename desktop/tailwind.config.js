/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        vault: {
          dark: '#0b0f19',
          card: 'rgba(17, 24, 39, 0.75)',
          accent: '#6366f1',
          emerald: '#10b981',
          amber: '#f59e0b',
        }
      },
      backdropBlur: {
        xs: '2px',
      }
    },
  },
  plugins: [],
}
