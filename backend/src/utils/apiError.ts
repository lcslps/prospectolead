export class AppError extends Error {
  statusCode: number;
  details?: unknown;

  constructor(statusCode: number, message: string, details?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.name = 'AppError';
  }
}

export const badRequest = (message: string, details?: unknown) =>
  new AppError(400, message, details);

export const notFound = (message = 'Recurso não encontrado') =>
  new AppError(404, message);

export const conflict = (message: string) => new AppError(409, message);

export const serverError = (message = 'Erro interno do servidor') =>
  new AppError(500, message);