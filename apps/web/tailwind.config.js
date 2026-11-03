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
        // Crema cálido editorial: neutrales tintados hacia terracota
        // Ningún blanco puro (#fff) ni gris frío. Cada tono lleva
        // un matiz sutil de la paleta terracota (chroma 0.005–0.01).
        stone: {
          50:  '#FAF8F5',   // crema base — reemplaza el antiguo #FBFBFC
          100: '#F4F1EC',   // crema medio
          200: '#E8E4DE',   // arena suave
          300: '#D4CFC7',   // piedra clara
          400: '#9C9589',   // piedra media
          500: '#6E675D',   // piedra oscura
          600: '#4D4840',   // carbón cálido
          700: '#3A352F',   // marrón profundo
          800: '#252220',   // tinta cálida
          900: '#1A1816',   // casi negro cálido
          950: '#0F0E0D',   // negro tintado
        },
        // Terracota puro equilibrado
        terracotta: {
          50:  '#FDF6F3',
          100: '#FEE4DB',
          200: '#FDC4B3',
          300: '#F5A890',
          400: '#E28867',
          500: '#D97856',
          600: '#C85A32',
          700: '#B24B25',
          800: '#8C381A',
          900: '#6B2A13',
        },
        // Superficies Dark Mode (Grafito cálido, no neutro frío)
        surface: {
          50:  '#141312',   // base oscura — tinte cálido sutil
          100: '#1B1918',   // tarjeta oscura
          200: '#252321',   // muted oscuro
          300: '#2C2A27',   // bordes oscuros
          400: '#3F3C38',   // bordes hover
          500: '#555048',   // texto deshabilitado oscuro
        },
        // Crema explícito para fondos light mode
        cream: {
          50:  '#FEFCF9',   // papel — el más claro
          100: '#FBF8F3',   // fondo principal light
          200: '#F6F2EB',   // fondo muted / sidebar
          300: '#EDE8DF',   // hover sutil
          400: '#E2DACE',   // bordes suaves
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
