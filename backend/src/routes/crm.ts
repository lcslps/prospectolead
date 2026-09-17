import { Router } from 'express';
import { CrmActivityType, CrmStage } from '@prisma/client';
import { asyncHandler } from '../utils/asyncHandler';
import { validate } from '../middleware/validate';
import {
  crmFiltersQuerySchema,
  crmAddSchema,
  crmBulkAddSchema,
  crmLeadParamsSchema,
  crmPatchSchema,
  crmStagePatchSchema,
  crmFollowUpSchema,
  crmNoteSchema,
  crmActivitySchema,
} from '../schemas';
import { ok, okCreated, okNoContent, validatedBody, validatedParams, validatedQuery } from '../utils/respond';
import { crmService, type CrmFilters } from '../services/CrmService';

export const crmRouter = Router();

function toFilters(q: Record<string, unknown>): CrmFilters {
  return {
    search: typeof q.search === 'string' ? q.search : undefined,
    cidade: typeof q.cidade === 'string' ? q.cidade : undefined,
    nicho: typeof q.nicho === 'string' ? q.nicho : undefined,
    estado: typeof q.estado === 'string' ? q.estado : undefined,
    scoreMin: typeof q.scoreMin === 'number' ? q.scoreMin : undefined,
    comTelefone: q.comTelefone === true ? true : undefined,
    semTelefone: q.semTelefone === true ? true : undefined,
    comSite: q.comSite === true ? true : undefined,
    semSite: q.semSite === true ? true : undefined,
    followUpToday: q.followUpToday === true ? true : undefined,
    followUpLate: q.followUpLate === true ? true : undefined,
  };
}

crmRouter.get(
  '/',
  validate(crmFiltersQuerySchema),
  asyncHandler(async (req, res) => {
    const q = validatedQuery<Record<string, unknown>>(req);
    const [leads, stats] = await Promise.all([
      crmService.list(toFilters(q)),
      crmService.stats(),
    ]);
    ok(res, { leads, stats });
  }),
);

crmRouter.get(
  '/stats',
  asyncHandler(async (_req, res) => {
    const stats = await crmService.stats();
    ok(res, stats);
  }),
);

crmRouter.get(
  '/leads',
  validate(crmFiltersQuerySchema),
  asyncHandler(async (req, res) => {
    const q = validatedQuery<Record<string, unknown>>(req);
    const leads = await crmService.list(toFilters(q));
    ok(res, leads);
  }),
);

crmRouter.post(
  '/leads',
  validate(crmAddSchema),
  asyncHandler(async (req, res) => {
    const { leadId } = validatedBody<{ leadId: string }>(req);
    const result = await crmService.addToCrm(leadId);
    if (result.created) {
      okCreated(res, result);
    } else {
      ok(res, result);
    }
  }),
);

crmRouter.post(
  '/leads/bulk',
  validate(crmBulkAddSchema),
  asyncHandler(async (req, res) => {
    const { ids } = validatedBody<{ ids: string[] }>(req);
    const result = await crmService.addMany(ids);
    ok(res, result);
  }),
);

crmRouter.get(
  '/leads/:id',
  validate(crmLeadParamsSchema),
  asyncHandler(async (req, res) => {
    const { id } = validatedParams<{ id: string }>(req);
    const crmLead = await crmService.getById(id);
    ok(res, crmLead);
  }),
);

crmRouter.patch(
  '/leads/:id',
  validate(crmPatchSchema),
  asyncHandler(async (req, res) => {
    const { id } = validatedParams<{ id: string }>(req);
    const body = validatedBody<{ notes?: string | null; lastContactAt?: string | null }>(req);
    const crmLead = await crmService.update(id, body);
    ok(res, crmLead);
  }),
);

crmRouter.patch(
  '/leads/:id/stage',
  validate(crmStagePatchSchema),
  asyncHandler(async (req, res) => {
    const { id } = validatedParams<{ id: string }>(req);
    const body = validatedBody<{ stage: CrmStage; position?: number }>(req);
    const crmLead = await crmService.moveStage(id, body.stage, body.position);
    ok(res, crmLead);
  }),
);

crmRouter.patch(
  '/leads/:id/follow-up',
  validate(crmFollowUpSchema),
  asyncHandler(async (req, res) => {
    const { id } = validatedParams<{ id: string }>(req);
    const body = validatedBody<{ nextFollowUpAt: string | null }>(req);
    const crmLead = await crmService.setFollowUp(id, body.nextFollowUpAt);
    ok(res, crmLead);
  }),
);

crmRouter.delete(
  '/leads/:id',
  validate(crmLeadParamsSchema),
  asyncHandler(async (req, res) => {
    const { id } = validatedParams<{ id: string }>(req);
    await crmService.remove(id);
    okNoContent(res);
  }),
);

crmRouter.get(
  '/leads/:id/activities',
  validate(crmLeadParamsSchema),
  asyncHandler(async (req, res) => {
    const { id } = validatedParams<{ id: string }>(req);
    const activities = await crmService.activities(id);
    ok(res, activities);
  }),
);

crmRouter.post(
  '/leads/:id/activities',
  validate(crmActivitySchema),
  asyncHandler(async (req, res) => {
    const { id } = validatedParams<{ id: string }>(req);
    const body = validatedBody<{ type: CrmActivityType; description: string }>(req);
    const activity = await crmService.addActivity(id, body.type, body.description);
    okCreated(res, activity);
  }),
);

crmRouter.post(
  '/leads/:id/notes',
  validate(crmNoteSchema),
  asyncHandler(async (req, res) => {
    const { id } = validatedParams<{ id: string }>(req);
    const body = validatedBody<{ description: string }>(req);
    const crmLead = await crmService.addNote(id, body.description);
    ok(res, crmLead);
  }),
);