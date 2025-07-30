/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#4F46E5',
          light: '#818CF8',
          dark: '#3730A3'
        },
        secondary: {
          DEFAULT: '#10B981',
          light: '#34D399',
          dark: '#059669'
        },
        background: {
          light: '#F9FAFB',
          dark: '#111827'
        },
        card: {
          light: '#FFFFFF',
          dark: '#1F2937'
        },
        text: {
          light: '#111827',
          dark: '#F9FAFB'
        }
      }
    },
  },
  plugins: [],
}
