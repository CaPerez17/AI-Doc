/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html','./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary:  '#2563eb',   /* indigo-600 */
        primaryHover: '#1d4ed8',
        accent:   '#14b8a6',   /* teal-500 */
        accentHover:'#0d9488',
        bgLight:  '#f0f9ff',   /* sky-50 */
        textDark: '#0f172a',   /* slate-900 */
      },
    },
  },
  plugins: [],
} 