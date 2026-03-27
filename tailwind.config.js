/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'SF Pro Display', 'Segoe UI', 'sans-serif'],
      },
      colors: {
        surface: {
          DEFAULT: '#1e293b',
          light: '#334155',
          lighter: '#475569',
        }
      }
    },
  },
  plugins: [],
}
