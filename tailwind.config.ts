import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#FAF7F2',
        ink: '#1F2933',
        primary: '#0F766E',
        gold: '#C8A24A',
        alert: '#B4532A',
        card: '#FFFFFF',
      },
      borderRadius: {
        lg: '16px',
        md: '10px',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

export default config
