/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./src/**/*.{astro,html,js,jsx,ts,tsx}'],
  safelist: [
    // Accent color classes for grade card badges (dynamically set from JSON)
    'text-sky-300', 'bg-sky-500/10', 'border-sky-500/20',
    'text-amber-300', 'bg-amber-500/10', 'border-amber-500/20',
    'text-teal-300', 'bg-teal-500/10', 'border-teal-500/20',
    'text-pink-300', 'bg-pink-500/10', 'border-pink-500/20',
    'text-orange-300', 'bg-orange-500/10', 'border-orange-500/20',
    'text-indigo-300', 'bg-indigo-500/10', 'border-indigo-500/20',
    'text-cyan-300', 'bg-cyan-500/10', 'border-cyan-500/20',
    'text-blue-300', 'bg-blue-500/10', 'border-blue-500/20',
    'text-emerald-300', 'bg-emerald-500/10', 'border-emerald-500/20',
    'text-violet-300', 'bg-violet-500/10', 'border-violet-500/20',
    'text-fuchsia-300', 'bg-fuchsia-500/10', 'border-fuchsia-500/20',
    // Cover gradient fragments
    'from-emerald-600/40', 'via-emerald-800/30', 'to-slate-900',
    'from-blue-600/40', 'via-blue-800/30',
    'from-cyan-600/40', 'via-cyan-800/30',
    'from-purple-600/40', 'via-purple-800/30',
    'from-amber-600/40', 'via-amber-800/30',
  ],
  theme: {
    extend: {
      screens: {
        xs: '420px',
      },
      fontFamily: {
        sans: ['"Cairo"', '"Segoe UI"', 'system-ui', 'sans-serif'],
      },
      animation: {
        'slide-up': 'slide-up 0.5s ease-out forwards',
      },
      keyframes: {
        'slide-up': {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};
