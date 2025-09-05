module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: '#121212',
        card: '#1e1e1e',
        accent: '#e63946',
        secondary: '#457b9d',
        text: '#f1faee'
      }
    }
  },
  plugins: []
};
