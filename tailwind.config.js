/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        parchment: {
          50: '#fdfbf7',
          100: '#f8f4eb',
          200: '#eee5d3',
          300: '#e1d2b5',
          400: '#cfb78f',
        },
        primary: {
          50: '#fbf7ee',
          100: '#f5ebd2',
          200: '#ebd4a4',
          500: '#b46e1c',
          600: '#9b5614',
          700: '#7e3e13',
          800: '#683315',
          900: '#572b15',
        },
        forest: {
          50: '#f2f9f5',
          100: '#e0f1e7',
          600: '#1d7348',
          700: '#195c3b',
          800: '#164a31',
          900: '#133d2a',
        }
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'Georgia', 'Cambria', 'serif'],
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
