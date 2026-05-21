export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        sonic: {
          green: "#00D16F",
          "green-light": "#E6FFF1",
          text: "#080808",
          bg: "#FFFFFF",
          border: "#E5E7EB",
        }
      },
      fontFamily: {
        sans: ['Outfit', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
  darkMode: 'class',
}
