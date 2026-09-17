import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { validate } from '../middleware/validate';
import { settingsSchema } from '../schemas';
import { leadScoreService } from '../services/LeadScoreService';
import { ok, validatedBody } from '../utils/respond';

export const settingsRouter = Router();

settingsRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    const weights = await leadScoreService.getWeights();
    ok(res, { leadScore: weights });
  }),
);

settingsRouter.put(
  '/',
  validate(settingsSchema),
  asyncHandler(async (req, res) => {
    const body = validatedBody<Record<string, number | undefined>>(req);
    const current = await leadScoreService.getWeights();
    const merged = { ...current, ...body };
    const saved = await leadScoreService.setWeights(merged);
    ok(res, { leadScore: saved });
  }),
);