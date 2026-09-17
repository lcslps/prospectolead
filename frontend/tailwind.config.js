/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        slate: { 50: '#fafafa', 100: '#f4f4f4', 200: '#e5e5e5', 300: '#d4d4d4', 400: '#a3a3a3', 500: '#737373', 600: '#525252', 700: '#404040', 800: '#292929', 900: '#202020', 950: '#161616' },
        brand: { 50: '#f1f7f3', 100: '#e0eee5', 200: '#c2ddcd', 300: '#9bc5ac', 400: '#75aa8d', 500: '#518568', 600: '#27664e', 700: '#24533f', 800: '#244434', 900: '#20392d', 950: '#14271e' },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
