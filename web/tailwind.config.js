/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'selector',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        satoshi: ['Satoshi', 'sans-serif'],
        inter: ['Inter', 'sans-serif'],
      },
      screens: {
        '2xl': '1536px',
        '3xl': '1920px',
      },
    },
    gridTemplateColumns: {
      '1': 'repeat(1, minmax(0, 1fr));',
      '2': 'repeat(2, minmax(0, 1fr));',
      '3': 'repeat(3, minmax(0, 1fr));',
      '4': 'repeat(4, minmax(0, 1fr));',
      '7': 'repeat(7, minmax(0, 1fr));',
      'auto-fill-140': 'repeat(auto-fill, minmax(140px, 1fr));',
      'auto-fill-240': 'repeat(auto-fill, minmax(240px, 1fr));',
      'auto-fill-320': 'repeat(auto-fill, minmax(320px, 1fr));',
    },
  },
  plugins: [
    require('@tailwindcss/container-queries'),
  ],
}

