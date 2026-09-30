import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { fontFamily } from 'tailwindcss/defaultTheme.js';
import tailwindcssAnimate from 'tailwindcss-animate';
import typography from '@tailwindcss/typography';

/** Apps add this to `content` so classes used inside the shared components are generated. */
export const uiContent = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  'src/**/*.{ts,tsx}'
);

/** @type {import('tailwindcss').Config} */
const preset = {
  darkMode: ['class'],
  content: [],
  theme: {
    extend: {
      screens: { xs: '475px' },
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#ffbe0d',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        link: 'hsl(var(--link))',
        brand: {
          blue: 'hsl(var(--brand-blue))',
          gold: 'hsl(var(--brand-gold))',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', ...fontFamily.sans],
        display: ['var(--font-display)', 'var(--font-inter)', ...fontFamily.sans],
        mono: ['var(--font-mono)', ...fontFamily.mono],
      },
      maxWidth: {
        read: '44rem',
        page: '76rem',
      },
      borderRadius: {
        lg: 'calc(var(--radius) + 2px)',
        md: 'var(--radius)',
        sm: 'calc(var(--radius) - 2px)',
        DEFAULT: 'var(--radius)',
        xl: 'calc(var(--radius) + 6px)',
        '2xl': 'calc(var(--radius) + 10px)',
        '3xl': 'calc(var(--radius) + 16px)',
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
        'toast-progress': {
          from: { transform: 'scaleX(1)' },
          to: { transform: 'scaleX(0)' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'toast-progress': 'toast-progress linear forwards',
      },
    },
  },
  plugins: [tailwindcssAnimate, typography],
};

export default preset;
