/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#FF6B35',
          light: '#FF8A5C',
          dark: '#E55520',
        },
        secondary: {
          DEFAULT: '#004E89',
          light: '#1E88E5',
        },
        background: {
          light: '#FFFFFF',
          dark: '#1A1A1A',
        },
        surface: {
          light: '#F7F7F7',
          dark: '#2A2A2A',
        },
        text: {
          light: '#1A1A1A',
          dark: '#FFFFFF',
          secondary: {
            light: '#666666',
            dark: '#B3B3B3',
          },
        },
        border: {
          light: '#E0E0E0',
          dark: '#3A3A3A',
        },
        success: {
          light: '#4CAF50',
          dark: '#66BB6A',
        },
        error: {
          light: '#F44336',
          dark: '#EF5350',
        },
        warning: {
          light: '#FF9800',
          dark: '#FFA726',
        },
      },
    },
  },
  plugins: [],
}

