import { Request, Response } from 'express';

export function ok<T>(res: Response, data: T): void {
  res.json({ success: true, data });
}

export function okCreated<T>(res: Response, data: T): void {
  res.status(201).json({ success: true, data });
}

export function okNoContent(res: Response): void {
  res.status(204).end();
}

export function csvResponse(res: Response, filename: string, content: string): void {
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(`\uFEFF${content}`);
}

export function validatedBody<T>(req: Request): T {
  const validated = (req as Request & { validated?: { body: unknown } }).validated;
  return (validated?.body ?? req.body) as T;
}

export function validatedQuery<T>(req: Request): T {
  const validated = (req as Request & { validated?: { query: unknown } }).validated;
  return (validated?.query ?? req.query) as T;
}

export function validatedParams<T>(req: Request): T {
  const validated = (req as Request & { validated?: { params: unknown } }).validated;
  return (validated?.params ?? req.params) as T;
}