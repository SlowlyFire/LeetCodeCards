import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

// Factory: returns an Express middleware that validates req.body against the given Zod schema.
// On success it replaces req.body with the parsed (and coerced) data.
// On failure it calls next(zodError), which the error handler turns into a 400.
export const validate = (schema: z.ZodTypeAny) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      next(result.error);
      return;
    }
    req.body = result.data;
    next();
  };
