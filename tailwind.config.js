/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        mono: ['"JetBrains Mono"', '"Fira Code"', 'monospace'],
      },
      colors: {
        tactical: {
          cyan: '#06b6d4',
          dark: '#0a0e17',
          panel: '#111827',
        },
      },
      animation: {
        'scan': 'scan 3s linear infinite',
        'slide-in': 'slideIn 0.3s ease-out',
        'glow-pulse': 'glowPulse 2s ease-in-out infinite',
      },
      keyframes: {
        scan: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
        },
        slideIn: {
          from: { opacity: '0', transform: 'translateY(-10px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 5px rgba(6, 182, 212, 0.3)' },
          '50%': { boxShadow: '0 0 20px rgba(6, 182, 212, 0.6)' },
        },
      },
    },
  },
  plugins: [],
}
