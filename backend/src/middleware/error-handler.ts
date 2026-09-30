import type { NextFunction, Request, Response } from 'express';
import multer from 'multer';
import { logger } from '../utils/logger.js';

export function errorHandler(err: Error, _req: Request, res: Response, next: NextFunction) {
  if (res.headersSent) {
    return next(err);
  }
  if (err instanceof multer.MulterError) {
    const message = err.code === 'LIMIT_FILE_SIZE' ? 'File is too large' : err.message;
    return res.status(400).json({ error: message });
  }
  if (err.message?.startsWith('Invalid file type')) {
    return res.status(400).json({ error: err.message });
  }
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({ error: 'Origin not allowed' });
  }
  if ((err as { type?: string }).type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Invalid JSON body' });
  }
  if ((err as { type?: string }).type === 'entity.too.large') {
    return res.status(413).json({ error: 'Request body is too large' });
  }

  logger.error(err.stack || err.message);
  return res.status(500).json({ error: 'Internal server error' });
}
