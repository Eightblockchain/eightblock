import type { NextFunction, Request, Response } from 'express';
import type { ZodSchema } from 'zod';

export function validateBody<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const issue = result.error.issues[0];
      const field = issue?.path.join('.');
      return res.status(400).json({
        // Clients show `error` directly, so it must be a readable sentence.
        error: field ? `${field}: ${issue.message}` : (issue?.message ?? 'Invalid request'),
        details: result.error.flatten(),
      });
    }
    req.body = result.data;
    return next();
  };
}
