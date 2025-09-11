import type { Config } from 'tailwindcss';
export default {
  content: ['./src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      borderRadius: { sm:'6px', md:'10px', lg:'14px' },
      boxShadow: { card:'0 1px 2px 0 rgb(0 0 0 / 0.06), 0 1px 3px 0 rgb(0 0 0 / 0.10)' },
      colors: {
        brand: { 50:'#f3f7ff', 600:'#3b82f6', 700:'#2563eb' },
        neon: {
          blue: '#00e5ff',
          pink: '#ff4dff',
          purple: '#9b5cff',
          green: '#00ff99',
          amber: '#ffd24d'
        }
      },
    },
  },
  plugins: [],
} satisfies Config;
