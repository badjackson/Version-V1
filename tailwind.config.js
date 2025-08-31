/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        ocean: {
          50: '#f0fdff',
          100: '#ccf7fe',
          200: '#99eefd',
          300: '#60defa',
          400: '#21c5f0',
          500: '#06a9d6',
          600: '#0887b4',
          700: '#0e6d92',
          800: '#155a78',
          900: '#164c65',
          950: '#083145',
        },
        sand: {
          50: '#fdfcf1',
          100: '#f9f6d9',
          200: '#f3ecb4',
          300: '#ebdd84',
          400: '#e1ca5c',
          500: '#d6b43f',
          600: '#bc9434',
          700: '#99732e',
          800: '#7f5e2b',
          900: '#6d4e28',
          950: '#3f2a14',
        },
        coral: {
          50: '#fef7f0',
          100: '#feeddb',
          200: '#fcd9b7',
          300: '#f9be88',
          400: '#f59857',
          500: '#f17b32',
          600: '#e25f1d',
          700: '#bb4918',
          800: '#953b1a',
          900: '#783318',
          950: '#40170a',
        },
        sectors: {
          A: '#3b82f6', // Blue
          B: '#10b981', // Emerald
          C: '#f59e0b', // Amber
          D: '#ef4444', // Red
          E: '#8b5cf6', // Purple
          F: '#06b6d4', // Cyan
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Poppins', 'Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-in': 'slideIn 0.3s ease-out',
        'bounce-gentle': 'bounceGentle 2s infinite',
        'wave': 'wave 3s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideIn: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        bounceGentle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
        wave: {
          '0%, 100%': { transform: 'rotate(0deg)' },
          '50%': { transform: 'rotate(3deg)' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
};