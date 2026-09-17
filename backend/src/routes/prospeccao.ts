import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { validate } from '../middleware/validate';
import { prospeccaoSchema } from '../schemas';
import { prospectService } from '../services/ProspectService';
import { hasGoogleKey } from '../config/env';
import { badRequest } from '../utils/apiError';
import { ok, validatedBody } from '../utils/respond';

export const prospeccaoRouter = Router();

type ProspectBody = {
  nicho: string;
  cidade: string;
  estado: string;
  quantidade: number;
  filters?: {
    somenteComTelefone?: boolean;
    somenteComSite?: boolean;
    somenteSemSite?: boolean;
    notaMinima?: number;
    avaliacoesMinimas?: number;
    somenteAbertos?: boolean;
    evitarExistentes?: boolean;
  };
};

prospeccaoRouter.post(
  '/',
  validate(prospeccaoSchema),
  asyncHandler(async (req, res) => {
    if (!hasGoogleKey) {
      throw badRequest(
        'Google Maps API Key não configurada. Adicione GOOGLE_MAPS_API_KEY no .env do backend.',
      );
    }

    const body = validatedBody<ProspectBody>(req);
    const result = await prospectService.run(body);
    ok(res, result);
  }),
);