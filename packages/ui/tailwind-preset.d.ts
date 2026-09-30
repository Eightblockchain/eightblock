import type { Config } from 'tailwindcss';

declare const preset: Partial<Config>;
/** Glob for the shared components, so apps generate their classes too. */
export const uiContent: string;
export default preset;
