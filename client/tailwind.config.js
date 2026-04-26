/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // Enable class-based dark mode
  theme: {
    extend: {
      colors: {
        ferrari: {
          red: '#DA291C',
          darkRed: '#B01E0A',
          black: '#000000',
          nearBlack: '#181818',
          surface: '#303030',
          darkGray: '#666666',
          midGray: '#8F8F8F',
          silver: '#969696',
          teal: '#1EAEDB',
        },
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#DA291C', // Replaced primary 500 with Ferrari Red as a fallback
          600: '#B01E0A',
          700: '#9D2211',
          800: '#075985',
          900: '#0c4a6e',
          950: '#082f49',
        },
      },
      fontFamily: {
        sans: ['FerrariSans', 'Arial', 'Helvetica', 'sans-serif'],
        ferrari: ['FerrariSans', 'Arial', 'Helvetica', 'sans-serif'],
        body: ['Body-Font', 'Arial', 'sans-serif'],
      },
      borderRadius: {
        'none': '0',
        'sm': '1px',
        DEFAULT: '2px',
        'md': '2px',
        'lg': '2px',
        'xl': '2px',
        '2xl': '2px',
        '3xl': '2px',
        'full': '9999px',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'marquee-l': 'marquee-l 35s linear infinite',
        'marquee-r': 'marquee-r 35s linear infinite',
      },
      keyframes: {
        'marquee-l': {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        'marquee-r': {
          '0%': { transform: 'translateX(-50%)' },
          '100%': { transform: 'translateX(0)' },
        }
      },
      backdropBlur: {
        xs: '2px',
      }
    },
  },
  plugins: [],
}
