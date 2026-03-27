import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        court: {
          empty: '#1e2a3a',
          active: '#0f2d1f',
          finished: '#1a1a2e',
        }
      }
    },
  },
  plugins: [],
}

export default config
