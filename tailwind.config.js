/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      keyframes: {
        'fade-in-scale': {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'fade-out': {
          '0%': { opacity: '1' },
          '100%': { opacity: '0' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'background-pan': {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        },
        'pulse-glow': {
            '0%, 100%': { boxShadow: '0 0 10px 0px rgba(99, 102, 241, 0.5)', opacity: '1' },
            '50%': { boxShadow: '0 0 25px 10px rgba(99, 102, 241, 0.2)', opacity: '0.7' },
        },
        'signal': {
          '0%': { transform: 'scale(0)', opacity: '0' },
          '50%': { opacity: '1' },
          '100%': { transform: 'scale(1)', opacity: '0' },
        },
        'draw-line': {
          'from': { 'stroke-dashoffset': '1000' },
          'to': { 'stroke-dashoffset': '0' },
        },
        'line-pulse': {
            '0%, 100%': { stroke: 'rgba(79, 70, 229, 0.7)' },
            '50%': { stroke: 'rgba(56, 189, 248, 1)' },
        }
      },
      animation: {
        'fade-in-scale': 'fade-in-scale 0.3s ease-out forwards',
        'fade-in': 'fade-in 0.3s ease-out forwards',
        'fade-out': 'fade-out 0.3s ease-out forwards',
        'float': 'float 4s ease-in-out infinite',
        'background-pan': 'background-pan 15s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 3s ease-in-out infinite',
        'signal': 'signal 2s ease-out infinite',
        'draw-line': 'draw-line 2s ease-in-out forwards',
        'line-pulse': 'line-pulse 4s ease-in-out infinite',
      }
    },
  },
  plugins: [],
}