import { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../utils/apiError';
import { isProduction } from '../config/env';

export function notFoundHandler(_req: Request, res: Response): void {
  res.status(404).json({ success: false, message: 'Rota não encontrada' });
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      ...(err.details !== undefined ? { details: err.details } : {}),
    });
    return;
  }

  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      message: 'Dados inválidos',
      details: err.issues.map((e) => ({ path: e.path.join('.'), message: e.message })),
    });
    return;
  }

  if (err instanceof Error && 'statusCode' in err && (err as { statusCode: number }).statusCode) {
    const statusCode = (err as { statusCode: number }).statusCode;
    const message = err.message || 'Requisição inválida';
    res.status(statusCode).json({
      success: false,
      message,
      ...('details' in err && (err as { details?: unknown }).details !== undefined
        ? { details: (err as { details: unknown }).details }
        : {}),
    });
    return;
  }

  console.error('[ErrorHandler]', err);

  const message =
    err && typeof err === 'object' && 'message' in err
      ? String((err as { message: unknown }).message)
      : 'Erro interno do servidor';

  res.status(500).json({
    success: false,
    message: isProduction ? 'Erro interno do servidor' : message,
  });
}