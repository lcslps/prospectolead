import { NextFunction, Request, RequestHandler, Response } from 'express';
import { ZodTypeAny } from 'zod';

export function validate(schema: ZodTypeAny): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse({
      body: req.body,
      query: req.query,
      params: req.params,
    });

    if (!result.success) {
      let message = 'Dados inválidos';
      const issues = result.error.issues ?? [];
      if (issues.length > 0) {
        const first = issues[0];
        const label = first.path.length > 0 ? first.path.join('.') : 'payload';
        message = `${label}: ${first.message}`;
      }
      const error = new Error(message) as Error & { statusCode: number; details: unknown };
      error.statusCode = 400;
      error.name = 'ValidationError';
      error.details = result.error.issues.map((e) => ({
        path: e.path.join('.'),
        message: e.message,
      }));
      return next(error);
    }

    (req as Request & { validated?: unknown }).validated = result.data;
    return next();
  };
}