/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Valentino Chocolate Color Scheme (Inspired by logo)
        primary: {
          DEFAULT: '#1A4D4D',  // Dark teal/green from logo
          container: '#2A6666',
          on: '#F4E4C1',  // Gold/cream
          'on-container': '#FFFFFF',
        },
        secondary: {
          DEFAULT: '#D4AF37',  // Rich gold
          container: '#F4E4C1',  // Light gold/cream
          on: '#1A4D4D',
          'on-container': '#0F2929',
        },
        tertiary: {
          DEFAULT: '#8B7355',  // Brown chocolate
          container: '#A0826D',
          on: '#FFFFFF',
          'on-container': '#3E2723',
        },
        surface: {
          DEFAULT: '#FFF8F5',
          variant: '#F5EBE7',
          dim: '#E8DDD9',
          bright: '#FFFFFF',
        },
        background: '#FFF8F5',
        error: {
          DEFAULT: '#BA1A1A',
          container: '#FFDAD6',
          on: '#FFFFFF',
          'on-container': '#410002',
        },
        outline: '#857370',
        'outline-variant': '#D7C2BC',
      },
      fontFamily: {
        sans: ['Cairo', 'Tajawal', 'sans-serif'],
        script: ['Dancing Script', 'cursive'],  // For Valentino logo
      },
      borderRadius: {
        'm3': '18px',
        'm3-sm': '12px',
        'm3-lg': '28px',
      },
      boxShadow: {
        'm3-1': '0 1px 2px 0 rgba(0, 0, 0, 0.3), 0 1px 3px 1px rgba(0, 0, 0, 0.15)',
        'm3-2': '0 1px 2px 0 rgba(0, 0, 0, 0.3), 0 2px 6px 2px rgba(0, 0, 0, 0.15)',
        'm3-3': '0 4px 8px 3px rgba(0, 0, 0, 0.15), 0 1px 3px 0 rgba(0, 0, 0, 0.3)',
        'm3-4': '0 6px 10px 4px rgba(0, 0, 0, 0.15), 0 2px 3px 0 rgba(0, 0, 0, 0.3)',
        'm3-5': '0 8px 12px 6px rgba(0, 0, 0, 0.15), 0 4px 4px 0 rgba(0, 0, 0, 0.3)',
      },
    },
  },
  plugins: [],
}

