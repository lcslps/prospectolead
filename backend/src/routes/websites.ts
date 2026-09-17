import { Router } from 'express';
import { z } from 'zod';
import rateLimit from 'express-rate-limit';
import { asyncHandler } from '../utils/asyncHandler';
import { ok } from '../utils/respond';
import { websiteService } from '../services/WebsiteService';
import { documentSchema } from '../services/websiteSchema';

export const websitesRouter = Router();
const aiLimit = rateLimit({ windowMs: 60000, max: 10, message: { success: false, message: 'Aguarde um minuto antes de solicitar mais gerações.' } });
const saveSchema = z.object({ revision: z.number().int().nonnegative(), document: documentSchema });
websitesRouter.get('/public/:id', asyncHandler(async (req, res) => { ok(res, await websiteService.publicSite(String(req.params.id))); }));
websitesRouter.get('/lead/:id', asyncHandler(async (req, res) => { ok(res, await websiteService.byLead(String(req.params.id))); }));
websitesRouter.post('/generate', aiLimit, asyncHandler(async (req, res) => {
  const { crmLeadId } = z.object({ crmLeadId: z.string().min(1).max(100) }).parse(req.body);
  ok(res, await websiteService.generate(crmLeadId));
}));
websitesRouter.get('/:id', asyncHandler(async (req, res) => { ok(res, await websiteService.get(String(req.params.id))); }));
for (const action of ['save', 'publish']) websitesRouter.post(`/:id/${action}`, asyncHandler(async (req, res) => {
  const { revision, document } = saveSchema.parse(req.body);
  ok(res, await websiteService.save(String(req.params.id), revision, document, action === 'publish'));
}));
websitesRouter.post('/:id/rewrite', aiLimit, asyncHandler(async (req, res) => {
  const input = z.object({ document: documentSchema, sectionId: z.string().optional(), field: z.enum(['title', 'subtitle', 'text', 'eyebrow', 'section', 'structure']), instruction: z.string().max(2000).default('Melhore o texto mantendo os fatos.') }).parse(req.body);
  ok(res, await websiteService.rewrite(String(req.params.id), input.document, input.sectionId, input.field, input.instruction));
}));
