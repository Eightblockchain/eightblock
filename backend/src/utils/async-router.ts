import {
  Router,
  type NextFunction,
  type Request,
  type RequestHandler,
  type Response,
} from 'express';

// Express 4 ignores rejected promises from async handlers, leaving the request hanging.
// This forwards them to the error handler instead.
function forwardErrors(handler: unknown): unknown {
  if (typeof handler !== 'function' || handler.length >= 4) return handler;
  const fn = handler as RequestHandler;
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = fn(req, res, next) as unknown;
      if (result instanceof Promise) result.catch(next);
    } catch (error) {
      next(error);
    }
  };
}

const METHODS = ['use', 'all', 'get', 'post', 'put', 'patch', 'delete'] as const;

export function createRouter(options?: Parameters<typeof Router>[0]) {
  const router = Router(options);
  for (const method of METHODS) {
    const original = router[method].bind(router) as (...args: unknown[]) => unknown;
    (router as unknown as Record<string, unknown>)[method] = (...args: unknown[]) =>
      original(
        ...args.map((arg) => (Array.isArray(arg) ? arg.map(forwardErrors) : forwardErrors(arg)))
      );
  }
  return router;
}
