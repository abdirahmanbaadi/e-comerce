/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx,html}',
    './public/js/**/*.js',
  ],
  theme: {
    container: {
      center: true,
      padding: '0.75rem',
      screens: {
        sm: '540px',
        md: '720px',
        lg: '960px',
        xl: '1140px',
        '2xl': '1320px',
      },
    },
    extend: {
      colors: {
        'bs-muted': '#6c757d',
        'bs-success': '#198754',
        'bs-dark': '#212529',
        'bs-secondary': '#6c757d',
        'bs-danger': '#dc3545',
        'bs-danger-text': '#dc3545',
      },
      borderRadius: {
        bs: '0.375rem',
        'bs-3': '0.5rem',
      },
      maxWidth: {
        'modal-sm': '300px',
        'modal-md': '500px',
        'modal-lg': '800px',
      },
    },
  },
  plugins: [],
};
