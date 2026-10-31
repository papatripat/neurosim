/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        sand: '#e6dfce',
        cream: '#f4ead5',
        parchment: '#fdf8ef',
        soft: '#fff9eb',
        ink: {
          DEFAULT: '#242a38',
          light: '#3d485b',
          muted: '#4a5659',
        },
        wood: {
          light: '#ba8a5c',
          DEFAULT: '#856044',
          dark: '#533e3b',
        },
        teal: {
          light: '#658979',
          DEFAULT: '#355c5a',
          dark: '#2c4d4b',
        },
        sage: '#2b6e4f',
        ochre: '#b87a28',
        brass: '#e0b65d',
        brick: '#94463d',
        terracotta: '#cb7367',
      },
      fontFamily: {
        sans: ['system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
    },
  },
  plugins: [],
};
