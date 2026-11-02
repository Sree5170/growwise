/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        paper: '#fbfaf6', ink: { DEFAULT: '#1f2d2b', soft: '#4a5b58', faint: '#556562' },
        mint: { 50: '#effaf5', 100: '#d6f3e6', 200: '#aee6cf', 300: '#7dd3b0', 400: '#4cbd91', 500: '#2aa376', 600: '#1f8461', 700: '#1a6a4f', 800: '#175440', 900: '#134335' },
        coral: { 50: '#fff3f0', 100: '#ffe1db', 200: '#ffc4b8', 300: '#ff9d8a', 400: '#ff7a63', 500: '#f25a42', 600: '#d9442d', 700: '#b33523' },
        sun: { 50: '#fffbe8', 100: '#fff4c7', 200: '#ffe88f', 300: '#ffd94d', 400: '#f9c623', 500: '#e0ac0c', 700: '#8a6a00' },
        sky: { 50: '#eff8ff', 100: '#dbeefd', 200: '#b9defb', 300: '#86c6f6', 400: '#4fa8ec', 500: '#2b8bd9', 600: '#1f6fb6', 700: '#1b5a93' },
      },
      fontFamily: { display: ['"Bricolage Grotesque"', 'ui-rounded', 'system-ui', 'sans-serif'], sans: ['Figtree', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'] },
      borderRadius: { xl2: '1.25rem' },
      boxShadow: { card: '0 1px 2px rgba(31,45,43,.06), 0 4px 14px rgba(31,45,43,.05)', lift: '0 6px 24px rgba(31,45,43,.10)' },
      keyframes: {
        pop: { '0%': { transform: 'scale(.6)', opacity: 0 }, '70%': { transform: 'scale(1.1)', opacity: 1 }, '100%': { transform: 'scale(1)' } },
        shimmer: { '100%': { transform: 'translateX(100%)' } },
      },
      animation: { pop: 'pop .45s ease-out both', shimmer: 'shimmer 1.4s infinite' },
    },
  },
  plugins: [],
};
