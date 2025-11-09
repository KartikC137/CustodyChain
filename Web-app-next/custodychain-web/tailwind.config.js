/** @type {import('tailwindcss').Config} */
/** @plugin 'tailwind-scrollbar'; */

module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],

  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-monsteratt)"],
      },
    },
  },

  plugins: [require("tailwind-scrollbar")],
};
