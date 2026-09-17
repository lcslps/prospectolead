import { z } from 'zod';

declare global {
  namespace Express {
    interface Request {
      validated?: z.ZodTypeAny;
    }
  }
}

export {};