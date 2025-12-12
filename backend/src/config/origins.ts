const DEFAULT_ORIGINS = ['http://localhost:3000'];

const parsedOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const allowedOrigins = parsedOrigins.length > 0 ? parsedOrigins : DEFAULT_ORIGINS;

export function getAllowedOrigins(): string[] {
  return allowedOrigins;
}
