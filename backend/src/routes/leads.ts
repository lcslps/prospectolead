import { Router } from 'express';
import { Prisma, Status } from '@prisma/client';
import { asyncHandler } from '../utils/asyncHandler';
import { validate } from '../middleware/validate';
import {
  bulkDeleteSchema,
  bulkStatusSchema,
  enrichSchema,
  leadFiltersSchema,
  leadIdParamsSchema,
  leadPatchSchema,
} from '../schemas';
import {
  buildOrderBy,
  buildWhere,
  parseStatusList,
  type LeadListFilters,
} from '../services/leadQuery';
import { csvResponse, ok, okNoContent, validatedBody, validatedParams, validatedQuery } from '../utils/respond';
import { notFound, AppError } from '../utils/apiError';
import { prisma } from '../lib/prisma';
import { googlePlacesService } from '../services/GooglePlacesService';
import { mapPlaceToLeadData, type LeadDataInput } from '../services/placeMapper';
import { leadScoreService } from '../services/LeadScoreService';
import { leadsToCsv, toCsvFileName } from '../services/CsvService';
import { hasGoogleKey } from '../config/env';

export const leadsRouter = Router();

type LeadQuery = {
  search?: string;
  cidade?: string;
  estado?: string;
  status?: string;
  comTelefone?: boolean;
  semTelefone?: boolean;
  comSite?: boolean;
  semSite?: boolean;
  notaMinima?: number;
  orderBy?: string;
  order?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
  ids?: string;
  crm?: 'all' | 'none' | 'in';
};

function toFilters(q: LeadQuery): LeadListFilters {
  return {
    search: q.search,
    cidade: q.cidade,
    estado: q.estado,
    status: parseStatusList(q.status),
    comTelefone: q.comTelefone,
    semTelefone: q.semTelefone,
    comSite: q.comSite,
    semSite: q.semSite,
    notaMinima: q.notaMinima,
    orderBy: q.orderBy,
    order: q.order,
    page: q.page,
    pageSize: q.pageSize,
    crm: q.crm,
  };
}

leadsRouter.get(
  '/export/csv',
  validate(leadFiltersSchema),
  asyncHandler(async (req, res) => {
    const q = validatedQuery<LeadQuery>(req);
    const filters = toFilters(q);

    let ids: string[] | undefined;
    if (q.ids) {
      ids = String(q.ids).split(',').map((s) => s.trim()).filter(Boolean);
    }

    const where: Prisma.LeadWhereInput = ids && ids.length > 0 ? { id: { in: ids } } : buildWhere(filters);

    const leads = await prisma.lead.findMany({
      where,
      orderBy: buildOrderBy(filters.orderBy, filters.order),
      select: {
        nome: true,
        telefone: true,
        cidade: true,
        estado: true,
        site: true,
        nota: true,
        quantidadeAvaliacoes: true,
        status: true,
        leadScore: true,
      },
    });

    const csv = leadsToCsv(leads);
    csvResponse(res, toCsvFileName('leads'), csv);
  }),
);

leadsRouter.get(
  '/',
  validate(leadFiltersSchema),
  asyncHandler(async (req, res) => {
    const q = validatedQuery<LeadQuery>(req);
    const filters = toFilters(q);
    const page = Math.max(q.page ?? 1, 1);
    const pageSize = Math.min(Math.max(q.pageSize ?? 20, 1), 200);

    const where = buildWhere(filters);
    const orderBy = buildOrderBy(filters.orderBy, filters.order);

    const [total, leads] = await Promise.all([
      prisma.lead.count({ where }),
      prisma.lead.findMany({
        where,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          googlePlaceId: true,
          nome: true,
          categoria: true,
          nicho: true,
          endereco: true,
          cidade: true,
          estado: true,
          cep: true,
          latitude: true,
          longitude: true,
          telefone: true,
          telefoneInternacional: true,
          site: true,
          googleMapsUrl: true,
          nota: true,
          quantidadeAvaliacoes: true,
          status: true,
          observacoes: true,
          leadScore: true,
          createdAt: true,
          updatedAt: true,
          crmLead: { select: { id: true, stage: true } },
        },
      }),
    ]);

    ok(res, {
      items: leads.map((lead) => {
        const { crmLead, ...rest } = lead as typeof lead & { crmLead: { id: string; stage: string } | null };
        return { ...rest, crmStage: crmLead?.stage ?? null, crmLeadId: crmLead?.id ?? null };
      }),
      total,
      page,
      pageSize,
      totalPages: Math.max(Math.ceil(total / pageSize), 1),
    });
  }),
);

leadsRouter.get(
  '/:id',
  validate(leadIdParamsSchema),
  asyncHandler(async (req, res) => {
    const { id } = validatedParams<{ id: string }>(req);
    const lead = await prisma.lead.findUnique({
      where: { id },
      include: {
        campaigns: {
          include: {
            campaign: {
              select: {
                id: true,
                nome: true,
                nicho: true,
                cidade: true,
                estado: true,
                quantidadeSolicitada: true,
                quantidadeEncontrada: true,
                createdAt: true,
              },
            },
          },
        },
      },
    });

    if (!lead) throw notFound('Lead não encontrado');

    ok(res, lead);
  }),
);

leadsRouter.patch(
  '/:id',
  validate(leadPatchSchema),
  asyncHandler(async (req, res) => {
    const { id } = validatedParams<{ id: string }>(req);
    const body = validatedBody<{
      status?: Status;
      observacoes?: string | null;
      categoria?: string | null;
      nicho?: string | null;
    }>(req);

    const existing = await prisma.lead.findUnique({ where: { id } });
    if (!existing) throw notFound('Lead não encontrado');

    const lead = await prisma.lead.update({
      where: { id },
      data: {
        status: body.status ?? undefined,
        observacoes: body.observacoes !== undefined ? body.observacoes : undefined,
        categoria: body.categoria !== undefined ? body.categoria : undefined,
        nicho: body.nicho !== undefined ? body.nicho : undefined,
      },
    });

    ok(res, lead);
  }),
);

leadsRouter.delete(
  '/:id',
  validate(leadIdParamsSchema),
  asyncHandler(async (req, res) => {
    const { id } = validatedParams<{ id: string }>(req);
    const existing = await prisma.lead.findUnique({ where: { id } });
    if (!existing) throw notFound('Lead não encontrado');

    await prisma.lead.delete({ where: { id } });
    okNoContent(res);
  }),
);

function enrichMaskForLead(lead: {
  endereco: string | null;
  cidade: string | null;
  telefone: string | null;
  telefoneInternacional: string | null;
  site: string | null;
  googleMapsUrl: string | null;
  nota: number | null;
  quantidadeAvaliacoes: number | null;
  businessStatus: string | null;
}): string[] {
  const fields = ['id'];
  if (!lead.endereco || !lead.cidade) fields.push('formattedAddress', 'addressComponents');
  if (!lead.telefone || !lead.telefoneInternacional)
    fields.push('nationalPhoneNumber', 'internationalPhoneNumber');
  if (!lead.site) fields.push('websiteUri');
  if (!lead.googleMapsUrl) fields.push('googleMapsUri');
  if (lead.nota === null) fields.push('rating');
  if (lead.quantidadeAvaliacoes === null) fields.push('userRatingCount');
  if (!lead.businessStatus) fields.push('businessStatus');
  return fields;
}

function mergeEnriched(existing: { [k: string]: unknown }, fresh: LeadDataInput): Record<string, unknown> {
  const update: Record<string, unknown> = {};
  const fields: Array<keyof LeadDataInput> = [
    'nome',
    'categoria',
    'endereco',
    'cidade',
    'estado',
    'cep',
    'latitude',
    'longitude',
    'telefone',
    'telefoneInternacional',
    'site',
    'googleMapsUrl',
    'nota',
    'quantidadeAvaliacoes',
    'businessStatus',
  ];
  for (const key of fields) {
    const current = existing[key];
    const value = fresh[key];
    if ((current === null || current === undefined) && value !== null && value !== undefined && value !== '') {
      update[key] = value;
    }
  }
  return update;
}

async function enrichLeadById(id: string): Promise<{ ok: boolean; updatedFields: string[]; message?: string }> {
  const lead = await prisma.lead.findUnique({ where: { id } });
  if (!lead) throw notFound('Lead não encontrado');

  const fields = enrichMaskForLead(lead);
  if (fields.length <= 1) {
    return { ok: false, updatedFields: [], message: 'Lead já possui todos os dados disponíveis. Nenhuma consulta à API foi feita.' };
  }

  const place = await googlePlacesService.getPlaceDetails(lead.googlePlaceId, fields);
  const fresh = mapPlaceToLeadData(place, lead.nicho ?? '');
  const update = mergeEnriched(lead, fresh);
  const updatedFields = Object.keys(update);

  if (updatedFields.length === 0) {
    await prisma.lead.update({ where: { id }, data: { lastEnrichedAt: new Date() } });
    return { ok: false, updatedFields: [], message: 'Nenhum dado novo encontrado para preencher.' };
  }

  const score = await leadScoreService.score({
    site: update.site !== undefined ? String(update.site) : lead.site,
    telefone:
      update.telefone !== undefined ? String(update.telefone) : lead.telefone ?? lead.telefoneInternacional,
    quantidadeAvaliacoes:
      update.quantidadeAvaliacoes !== undefined
        ? Number(update.quantidadeAvaliacoes)
        : lead.quantidadeAvaliacoes,
    nota: update.nota !== undefined ? Number(update.nota) : lead.nota,
    endereco: update.endereco !== undefined ? String(update.endereco) : lead.endereco,
    cidade: update.cidade !== undefined ? String(update.cidade) : lead.cidade,
    cep: update.cep !== undefined ? String(update.cep) : lead.cep,
  });

  const finalData = update.leadScore !== undefined ? update : { ...update, leadScore: score };
  await prisma.lead.update({
    where: { id },
    data: { ...(finalData as object), lastEnrichedAt: new Date() },
  });

  return { ok: true, updatedFields };
}

leadsRouter.post(
  '/:id/enrich',
  validate(leadIdParamsSchema),
  asyncHandler(async (req, res) => {
    if (!hasGoogleKey) {
      throw new AppError(
        400,
        'Google Maps API Key não configurada. Adicione GOOGLE_MAPS_API_KEY no .env do backend.',
      );
    }
    const { id } = validatedParams<{ id: string }>(req);
    const result = await enrichLeadById(id);
    ok(res, result);
  }),
);

leadsRouter.post(
  '/enrich-selected',
  validate(enrichSchema),
  asyncHandler(async (req, res) => {
    if (!hasGoogleKey) {
      throw new AppError(
        400,
        'Google Maps API Key não configurada. Adicione GOOGLE_MAPS_API_KEY no .env do backend.',
      );
    }
    const { ids } = validatedBody<{ ids: string[] }>(req);

    const leads = await prisma.lead.findMany({
      where: { id: { in: ids } },
      select: { id: true },
    });
    const foundIds = leads.map((l) => l.id);

    const results = [];
    for (const id of foundIds) {
      const result = await enrichLeadById(id);
      results.push(result);
    }

    const updatedCount = results.filter((r) => r.ok).length;
    ok(res, {
      total: foundIds.length,
      updated: updatedCount,
      results,
      warning: 'Consultas adicionais foram feitas à Google Places API.',
    });
  }),
);

leadsRouter.post(
  '/bulk/status',
  validate(bulkStatusSchema),
  asyncHandler(async (req, res) => {
    const { ids, status } = validatedBody<{ ids: string[]; status: Status }>(req);
    const result = await prisma.lead.updateMany({
      where: { id: { in: ids } },
      data: { status },
    });
    ok(res, { updated: result.count });
  }),
);

leadsRouter.post(
  '/bulk/delete',
  validate(bulkDeleteSchema),
  asyncHandler(async (req, res) => {
    const { ids } = validatedBody<{ ids: string[] }>(req);
    const result = await prisma.lead.deleteMany({ where: { id: { in: ids } } });
    ok(res, { deleted: result.count });
  }),
);