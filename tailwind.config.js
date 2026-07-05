/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  blocklist: ['collapse'],
  theme: {
    extend: {
      colors: {
        base: '#FAF8F2',
        nav: '#EAE6DC',
        gold: '#D8A128',
        teal: '#0F6F64',
        deepGreen: '#073D35',
        btnBrown: '#C97D55',
        btnDark: '#2C3E50',
        productTitle: '#0F2A4A',
        starGold: '#F39C12',
        softBg: '#F4EFE6',
      },
      fontFamily: {
        sans: ['Manrope', 'sans-serif'],
        display: ['Cormorant Garamond', 'serif'],
      },
    },
  },
  plugins: [],
};
