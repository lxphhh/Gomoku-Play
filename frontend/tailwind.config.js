/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        board: {
          light: '#F5D6A8',
          dark: '#D4A373',
          grid: '#8B5E3C',
        },
        stone: {
          black: '#1a1a1a',
          white: '#f5f5f5',
          shadow: 'rgba(0, 0, 0, 0.3)',
        },
      },
      animation: {
        'piece-place': 'piece-place 0.2s ease-out',
      },
      keyframes: {
        'piece-place': {
          '0%': { transform: 'scale(0.5)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
