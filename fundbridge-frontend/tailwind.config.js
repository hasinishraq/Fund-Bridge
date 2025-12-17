/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'glow-indigo': '0 15px 60px rgba(99, 102, 241, 0.35)',
        'glow-cyan': '0 12px 40px rgba(34, 210, 245, 0.30)',
      },
      backgroundImage: {
        'glass-gradient':
          'radial-gradient(circle at 15% 20%, rgba(99,102,241,0.18), transparent 30%), radial-gradient(circle at 85% 0%, rgba(34,210,245,0.18), transparent 28%)',
      },
    },
  },
  plugins: [],
}
