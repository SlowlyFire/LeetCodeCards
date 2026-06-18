import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../lib/AppError.js';

// Central error middleware — Express identifies it by its 4-argument signature.
// Every error thrown in any route (via asyncHandler) lands here.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  // Zod validation failure → 400 with the first issue's message
  if (err instanceof ZodError) {
    const message = err.issues[0]?.message ?? 'Validation error';
    res.status(400).json({ error: message });
    return;
  }

  // Our own typed errors — status code is explicit
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ error: err.message });
    return;
  }

  // Mongoose CastError: invalid ObjectId in a route param (e.g. /api/patterns/not-an-id)
  if (err instanceof Error && err.name === 'CastError') {
    res.status(404).json({ error: 'Invalid ID format' });
    return;
  }

  // MongoDB duplicate key (unique index violation, e.g. duplicate pattern name)
  if (err instanceof Error && 'code' in err && (err as NodeJS.ErrnoException).code === '11000') {
    res.status(409).json({ error: 'A record with that value already exists' });
    return;
  }

  // Anything else — log it server-side and return a generic 500
  console.error('[Unhandled error]', err);
  res.status(500).json({ error: 'Internal server error' });
}
