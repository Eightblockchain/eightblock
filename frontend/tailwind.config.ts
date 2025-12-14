import type { Config } from 'tailwindcss';
import { fontFamily } from 'tailwindcss/defaultTheme';
import tailwindcssAnimate from 'tailwindcss-animate';
import typography from '@tailwindcss/typography';

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './content/**/*.{md,mdx}',
    './contentlayer/generated/**/*.ts',
  ],
  theme: {
    extend: {
      screens: {
        xs: '475px',
      },
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: '#009FE3',
          foreground: '#ffffff',
          50: '#E5F7FE',
          100: '#CCF0FD',
          200: '#99E0FB',
          300: '#66D1F9',
          400: '#33C1F7',
          500: '#009FE3',
          600: '#007FB6',
          700: '#005F88',
          800: '#00405B',
          900: '#00202D',
        },
        secondary: {
          DEFAULT: '#FFBE0D',
          foreground: '#000000',
          50: '#FFF9E6',
          100: '#FFF3CC',
          200: '#FFE799',
          300: '#FFDB66',
          400: '#FFCF33',
          500: '#FFBE0D',
          600: '#CC980A',
          700: '#997208',
          800: '#664C05',
          900: '#332603',
        },
        accent: {
          DEFAULT: '#009FE3',
          foreground: '#ffffff',
        },
        muted: {
          DEFAULT: '#f8f9fa',
          foreground: '#6c757d',
        },
      },
      fontFamily: {
        sans: ['var(--font-lato)', ...fontFamily.sans],
      },
      borderRadius: {
        lg: '2px',
        md: '2px',
        sm: '2px',
        DEFAULT: '2px',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [tailwindcssAnimate, typography],
};

export default config;
