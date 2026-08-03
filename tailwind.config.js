/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: ['selector', '[data-admin-theme="dark"], .admin-dark'],
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
      keyframes: {
        sheetUp: {
          from: { opacity: '0', transform: 'translateY(28px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(18px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        floatY: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        softPulse: {
          '0%, 100%': { opacity: '0.45', transform: 'scale(1)' },
          '50%': { opacity: '0.75', transform: 'scale(1.06)' },
        },
        railIn: {
          from: { opacity: '0', transform: 'translateX(28px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        cardRise: {
          from: { opacity: '0', transform: 'translateY(24px) scale(0.98)' },
          to: { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        authAlertIn: {
          from: { opacity: '0', transform: 'translateY(-10px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        authAlertOut: {
          from: { opacity: '1', transform: 'translateY(0)' },
          to: { opacity: '0', transform: 'translateY(-8px)' },
        },
        fpStepIn: {
          from: { opacity: '0', transform: 'translateX(8px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        adminDropIn: {
          from: { opacity: '0', transform: 'translateY(-8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        navDropIn: {
          from: { opacity: '0', transform: 'translateY(-8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        productModalIn: {
          from: { opacity: '0', transform: 'translateY(20px) scale(0.98)' },
          to: { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        sidebarItemIn: {
          from: { opacity: '0', transform: 'translateX(-16px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        sidebarLogoIn: {
          from: { opacity: '0', transform: 'translateY(-8px) scale(0.96)' },
          to: { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        profileTabIn: {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        badgePulse: {
          '0%, 100%': { transform: 'scale(1)', opacity: '1' },
          '50%': { transform: 'scale(1.35)', opacity: '0.75' },
        },
        sidebarShimmer: {
          from: { transform: 'translateX(-120%)' },
          to: { transform: 'translateX(220%)' },
        },
      },
      animation: {
        sheetUp: 'sheetUp 0.38s cubic-bezier(0.16, 1, 0.3, 1) both',
        fadeUp: 'fadeUp 0.7s cubic-bezier(0.16, 1, 0.3, 1) both',
        fadeIn: 'fadeIn 0.6s ease both',
        floatY: 'floatY 5.5s ease-in-out infinite',
        softPulse: 'softPulse 4.5s ease-in-out infinite',
        railIn: 'railIn 0.65s cubic-bezier(0.16, 1, 0.3, 1) both',
        cardRise: 'cardRise 0.5s cubic-bezier(0.16, 1, 0.3, 1) both',
        authAlertIn: 'authAlertIn 0.38s cubic-bezier(0.16, 1, 0.3, 1) both',
        authAlertOut: 'authAlertOut 0.32s ease forwards',
        fpStepIn: 'fpStepIn 0.35s ease both',
        adminDropIn: 'adminDropIn 0.22s ease both',
        navDropIn: 'navDropIn 0.22s ease both',
        productModalIn: 'productModalIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) both',
        sidebarItemIn: 'sidebarItemIn 0.45s cubic-bezier(0.16, 1, 0.3, 1) both',
        sidebarLogoIn: 'sidebarLogoIn 0.55s cubic-bezier(0.16, 1, 0.3, 1) both',
        profileTabIn: 'profileTabIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) both',
        badgePulse: 'badgePulse 2s ease-in-out infinite',
        sidebarShimmer: 'sidebarShimmer 2.8s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
