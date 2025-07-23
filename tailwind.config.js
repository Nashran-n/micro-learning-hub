/** @type {import('tailwindcss').Config} */
  export default {
    content: ["./index.html", "./src/**/*.{js,jsx}"],
    theme: {
      extend: {
        colors: {
          'custom-bg': '#f7f7f7',
          'custom-text': '#333333',
        },
      },
    },
    plugins: [],
  };