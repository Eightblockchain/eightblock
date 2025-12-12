import jwt from 'jsonwebtoken';

// Fail fast if JWT_SECRET is not set in ANY environment
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  throw new Error('CRITICAL: JWT_SECRET must be set and at least 32 characters long');
}

const JWT_SECRET = process.env.JWT_SECRET;
const EXPIRES_IN = '7d';

export interface TokenPayload {
  userId: string;
  role: string;
  walletAddress?: string;
  iat?: number; // JWT issued-at timestamp
  exp?: number; // JWT expiration timestamp
}

export function signToken(payload: TokenPayload) {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: EXPIRES_IN,
    issuer: 'eightblock',
    audience: 'eightblock-api',
  });
}

export function verifyToken(token: string) {
  return jwt.verify(token, JWT_SECRET, {
    issuer: 'eightblock',
    audience: 'eightblock-api',
  }) as TokenPayload;
}
