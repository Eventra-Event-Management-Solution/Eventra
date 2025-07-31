/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'SF Pro Display', 'system-ui', 'sans-serif'],
      },
      colors: {
        primary: '#6366F1', // indigo
        secondary: '#10B981', // emerald
        accent: '#F59E0B', // amber
        background: '#F9FAFB', // light grey
        text: '#111827', // dark grey
        success: '#059669', // green
        error: '#DC2626', // red
      },
    },
  },
  plugins: [],
}