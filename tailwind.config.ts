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
        accent: '#1D4E89',
        mint: '#D1FAE5',
        amber: '#FEF3C7',
        sky: '#E0F2FE',
        coral: '#FFEDD5',
        lavender: '#EDE9FE',
      },
      borderRadius: {
        xl: '20px',
        lg: '14px',
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
