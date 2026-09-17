import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { validate } from '../middleware/validate';
import { templatePatchSchema, templateSchema } from '../schemas';
import { z } from 'zod';
import { notFound } from '../utils/apiError';
import { prisma } from '../lib/prisma';
import { ok, okCreated, okNoContent, validatedBody, validatedParams } from '../utils/respond';

export const templatesRouter = Router();

const idParamsSchema = z.object({
  params: z.object({ id: z.string().min(1).max(64) }),
});

templatesRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    const templates = await prisma.messageTemplate.findMany({
      orderBy: { createdAt: 'desc' },
    });
    ok(res, templates);
  }),
);

templatesRouter.post(
  '/',
  validate(templateSchema),
  asyncHandler(async (req, res) => {
    const body = validatedBody<{ nome: string; conteudo: string; servico?: string | null }>(req);
    const template = await prisma.messageTemplate.create({
      data: {
        nome: body.nome,
        conteudo: body.conteudo,
        servico: body.servico ?? null,
      },
    });
    okCreated(res, template);
  }),
);

templatesRouter.patch(
  '/:id',
  validate(templatePatchSchema),
  asyncHandler(async (req, res) => {
    const { id } = validatedParams<{ id: string }>(req);
    const body = validatedBody<{ nome?: string; conteudo?: string; servico?: string | null }>(req);

    const existing = await prisma.messageTemplate.findUnique({ where: { id } });
    if (!existing) throw notFound('Template não encontrado');

    const template = await prisma.messageTemplate.update({
      where: { id },
      data: {
        nome: body.nome ?? undefined,
        conteudo: body.conteudo ?? undefined,
        servico: body.servico !== undefined ? body.servico : undefined,
      },
    });
    ok(res, template);
  }),
);

templatesRouter.delete(
  '/:id',
  validate(idParamsSchema),
  asyncHandler(async (req, res) => {
    const { id } = validatedParams<{ id: string }>(req);
    const existing = await prisma.messageTemplate.findUnique({ where: { id } });
    if (!existing) throw notFound('Template não encontrado');

    await prisma.messageTemplate.delete({ where: { id } });
    okNoContent(res);
  }),
);