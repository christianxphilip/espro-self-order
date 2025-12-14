/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'espro-orange': '#FF6B35',
        'espro-dark': '#2C3E50',
        'espro-cream': '#F5F5DC',
      },
    },
  },
  plugins: [],
}
