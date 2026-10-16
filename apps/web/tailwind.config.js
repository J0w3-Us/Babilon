/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        parchment: {
          50: '#FDFBF7',
          100: '#F9F6EE',
          200: '#F2ECE1',
          300: '#E7DEC9',
          400: '#D5C4A1',
          500: '#BDA579',
          800: '#4A3B2C',
          900: '#2A1F17',
        },
        terracotta: {
          50: '#FDF6F3',
          100: '#FBEEE8',
          200: '#F7D9CC',
          400: '#D97856',
          500: '#C85A32',
          600: '#B24B25',
          700: '#943B1A',
        },
        ink: {
          50: '#F8F9FA',
          100: '#E9ECEF',
          400: '#94A3B8',
          500: '#64748B',
          600: '#475569',
          700: '#334155',
          800: '#1E293B',
          900: '#0F172A',
          950: '#070D18',
        },
        academic: {
          gold: '#C59B27',
          forest: '#1E392A',
          slate: '#3C4048',
        },
        // Dark mode surface colors
        surface: {
          50: '#0A0C10',
          100: '#12151E',
          200: '#1A1E2A',
          300: '#222736',
          400: '#2E3446',
          500: '#3A4256',
        },
      },
      fontFamily: {
        serif: ['Newsreader', 'Georgia', 'serif'],
        sans: ['Plus Jakarta Sans', 'Inter', 'sans-serif'],
        display: ['Cinzel', 'serif'],
      },
      boxShadow: {
        subtle: '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.05)',
        card: '0 4px 20px -2px rgba(42, 31, 23, 0.06), 0 2px 6px -1px rgba(42, 31, 23, 0.03)',
        'card-hover': '0 12px 32px -4px rgba(42, 31, 23, 0.12), 0 4px 12px -2px rgba(42, 31, 23, 0.06)',
        'dark-card': '0 4px 20px -2px rgba(0, 0, 0, 0.3), 0 2px 6px -1px rgba(0, 0, 0, 0.2)',
        'dark-card-hover': '0 12px 32px -4px rgba(0, 0, 0, 0.5), 0 4px 12px -2px rgba(0, 0, 0, 0.3)',
        'gold-glow': '0 8px 32px -4px rgba(229, 179, 103, 0.15)',
      },
    },
  },
  plugins: [],
};
