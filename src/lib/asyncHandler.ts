import type { Request, Response, NextFunction, RequestHandler } from 'express';

type AsyncFn = (req: Request, res: Response, next: NextFunction) => Promise<unknown>;

// Express 4 does NOT forward async errors to the error middleware automatically.
// This wrapper catches any thrown error and passes it to next(), so controllers
// can throw freely without individual try/catch blocks.
export const asyncHandler = (fn: AsyncFn): RequestHandler =>
  (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
