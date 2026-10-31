/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        office: {
          dark: '#242a38',
          mid: '#3d485b',
          slate: '#697b8b',
          light: '#a7b7bb',
          cream: '#f4ead5',
          teal: '#355c5a',
        },
      },
    },
  },
  plugins: [],
};

