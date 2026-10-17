/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/modules/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Moderno Suizo: Piedra neutra y superficies limpias
        stone: {
          50: '#FBFBFC',
          100: '#F3F4F6',
          200: '#E5E7EB',
          300: '#D1D5DB',
          400: '#9CA3AF',
          500: '#6B7280',
          600: '#4B5563',
          700: '#374151',
          800: '#1F2937',
          900: '#111827',
          950: '#0B0F17',
        },
        // Terracota puro equilibrado
        terracotta: {
          50: '#FDF6F3',
          100: '#FEE4DB',
          200: '#FDC4B3',
          400: '#E28867',
          500: '#D97856',
          600: '#C85A32',
          700: '#B24B25',
          800: '#8C381A',
        },
        // Superficies Dark Mode (Gris Grafito Neutro #121214)
        surface: {
          50: '#121214',
          100: '#18181B',
          200: '#232328',
          300: '#27272A',
          400: '#3F3F46',
          500: '#52525B',
        },
      },
      fontFamily: {
        serif: ['Newsreader', 'Georgia', 'serif'],
        sans: ['Plus Jakarta Sans', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      boxShadow: {
        subtle: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        card: '0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 1px 2px -1px rgba(0, 0, 0, 0.04)',
        'card-hover': '0 10px 25px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -2px rgba(0, 0, 0, 0.04)',
        'dark-card': '0 1px 3px 0 rgba(0, 0, 0, 0.4)',
        'dark-card-hover': '0 10px 25px -3px rgba(0, 0, 0, 0.6)',
      },
    },
  },
  plugins: [],
};
