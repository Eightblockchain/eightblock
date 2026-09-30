import type { Config } from 'tailwindcss';
import preset, { uiContent } from '@eightblock/ui/tailwind-preset';

const config: Config = {
  presets: [preset],
  content: ['./components/**/*.{ts,tsx}', './app/**/*.{ts,tsx}', uiContent],
};

export default config;
