import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { validate } from '../middleware/validate';
import { leadIdParamsSchema } from '../schemas';
import { prisma } from '../lib/prisma';
import { notFound } from '../utils/apiError';
import { ok, okNoContent, validatedParams } from '../utils/respond';
import { z } from 'zod';

export const campaignsRouter = Router();

campaignsRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    const campaigns = await prisma.campaign.findMany({
      orderBy: { createdAt: 'desc' },
      take: 200,
      include: {
        _count: { select: { leads: true } },
      },
    });
    ok(res, campaigns);
  }),
);

campaignsRouter.get(
  '/:id',
  validate(leadIdParamsSchema),
  asyncHandler(async (req, res) => {
    const { id } = validatedParams<{ id: string }>(req);
    const campaign = await prisma.campaign.findUnique({
      where: { id },
      include: {
        leads: {
          include: {
            lead: {
              select: {
                id: true,
                googlePlaceId: true,
                nome: true,
                categoria: true,
                cidade: true,
                estado: true,
                telefone: true,
                telefoneInternacional: true,
                site: true,
                nota: true,
                quantidadeAvaliacoes: true,
                status: true,
                leadScore: true,
                createdAt: true,
                crmLead: { select: { id: true, stage: true } },
              },
            },
          },
          orderBy: { lead: { createdAt: 'desc' } },
        },
      },
    });

    if (!campaign) throw notFound('Campanha não encontrada');

    ok(res, {
      ...campaign,
      leads: campaign.leads.map(({ lead }) => {
        const { crmLead, ...rest } = lead as typeof lead & { crmLead: { id: string; stage: string } | null };
        return { lead: { ...rest, crmStage: crmLead?.stage ?? null, crmLeadId: crmLead?.id ?? null } };
      }),
    });
  }),
);

const deleteParamsSchema = z.object({
  params: z.object({ id: z.string().min(1).max(64) }),
});

campaignsRouter.delete(
  '/:id',
  validate(deleteParamsSchema),
  asyncHandler(async (req, res) => {
    const { id } = validatedParams<{ id: string }>(req);
    const existing = await prisma.campaign.findUnique({ where: { id } });
    if (!existing) throw notFound('Campanha não encontrada');

    await prisma.campaign.delete({ where: { id } });
    okNoContent(res);
  }),
);