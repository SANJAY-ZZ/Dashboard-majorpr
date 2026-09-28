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
        charcoal: {
          bg: '#0B0D0F',
          surface: '#14171A',
          elevated: '#181B1F',
          hover: '#1E2227',
          border: '#23272B',
          'border-subtle': '#1D2024',
          muted: '#7E8691',
        },
        ivory: {
          DEFAULT: '#E8DFD8',
          hover: '#DED4CB',
          light: '#F5EFEB',
          dark: '#161310',
          muted: '#A89F95',
        },
        status: {
          'green-bg': '#142E23',
          'green-text': '#4ADE80',
          'green-border': '#1B4332',
          'blue-bg': '#16273B',
          'blue-text': '#38BDF8',
          'blue-border': '#1E3A5F',
          'amber-bg': '#332514',
          'amber-text': '#FBBF24',
          'amber-border': '#4D361B',
          'red-bg': '#3C191E',
          'red-text': '#F87171',
          'red-border': '#5C242B',
        },
      },
      fontFamily: {
        sans: ['Inter', 'Plus Jakarta Sans', 'system-ui', 'sans-serif'],
        serif: ['Playfair Display', 'Georgia', 'Cambria', 'serif'],
      },
    },
  },
  plugins: [],
}
