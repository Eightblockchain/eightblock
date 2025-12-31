// utils/url.ts
export const getFullImageUrl = (relativePath: string): string => {
  if (!relativePath) return '';
  if (relativePath.startsWith('http')) return relativePath; // Already full URL

  const baseUrl = process.env.API_URL || 'https://api.eightblock.dev';
  return `${baseUrl}${relativePath.startsWith('/') ? '' : '/'}${relativePath}`;
};
