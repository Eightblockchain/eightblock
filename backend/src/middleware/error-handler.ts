import type { NextFunction, Request, Response } from 'express';
import { logger } from '@/utils/logger';

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction) {
  logger.error(err.message);
  return res.status(500).json({ error: 'Internal server error' });
}
