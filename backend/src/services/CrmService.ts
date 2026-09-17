import { Prisma, CrmActivityType, CrmStage } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { notFound } from '../utils/apiError';

const STAGE_ORDER: CrmStage[] = [
  'NEW',
  'SITE_GENERATED',
  'MESSAGE_SENT',
  'REPLIED',
  'INTERESTED',
  'NEGOTIATION',
  'CLIENT',
  'LOST',
];

const STAGE_LABELS: Record<CrmStage, string> = {
  NEW: 'NOVO',
  SITE_GENERATED: 'SITE GERADO',
  MESSAGE_SENT: 'MENSAGEM ENVIADA',
  REPLIED: 'RESPONDEU',
  INTERESTED: 'INTERESSADO',
  NEGOTIATION: 'NEGOCIAÇÃO',
  CLIENT: 'CLIENTE',
  LOST: 'PERDIDO',
};

export interface CrmFilters {
  search?: string;
  cidade?: string;
  nicho?: string;
  estado?: string;
  scoreMin?: number;
  comTelefone?: boolean;
  semTelefone?: boolean;
  comSite?: boolean;
  semSite?: boolean;
  followUpToday?: boolean;
  followUpLate?: boolean;
}

export class CrmService {
  private buildWhere(filters: CrmFilters): Prisma.CrmLeadWhereInput {
    const lead: Prisma.LeadWhereInput = {};

    if (filters.search) lead.nome = { contains: filters.search, mode: 'insensitive' };
    if (filters.cidade) lead.cidade = { contains: filters.cidade, mode: 'insensitive' };
    if (filters.nicho) lead.nicho = { contains: filters.nicho, mode: 'insensitive' };
    if (filters.estado) lead.estado = { equals: filters.estado };
    if (filters.scoreMin !== undefined) lead.leadScore = { gte: filters.scoreMin };

    if (filters.comTelefone && filters.semTelefone) {
      // both -> nothing (mutually exclusive, keep filter empty result? no: ignore)
    } else if (filters.semTelefone) {
      lead.telefone = null;
      lead.telefoneInternacional = null;
    } else if (filters.comTelefone) {
      lead.OR = [
        { telefone: { not: null } },
        { telefoneInternacional: { not: null } },
      ];
    }

    if (filters.comSite) lead.site = { not: null };
    if (filters.semSite) lead.site = null;

    const where: Prisma.CrmLeadWhereInput = {};
    if (Object.keys(lead).length > 0) where.lead = lead;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (filters.followUpToday) where.nextFollowUpAt = { gte: today, lt: tomorrow };
    if (filters.followUpLate) where.nextFollowUpAt = { lt: new Date() };

    return where;
  }

  private leadInclude = {
    website: { select: { id: true, status: true, generationStatus: true } },
    lead: {
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
          orderBy: { campaign: { createdAt: 'desc' } },
          take: 1,
        },
      },
    },
  } satisfies Prisma.CrmLeadInclude;

  async list(filters: CrmFilters) {
    return prisma.crmLead.findMany({
      where: this.buildWhere(filters),
      include: this.leadInclude,
      orderBy: [{ stage: 'asc' }, { position: 'asc' }, { createdAt: 'asc' }],
    });
  }

  async stats() {
    const [total, stages] = await Promise.all([
      prisma.crmLead.count(),
      prisma.crmLead.groupBy({ by: ['stage'], _count: { _all: true } }),
    ]);

    const byStage: Record<string, number> = {};
    for (const key of STAGE_ORDER) byStage[key] = 0;
    for (const s of stages) byStage[s.stage] = s._count._all;

    const novas = byStage['NEW'];
    const mensagensEnviadas =
      byStage['MESSAGE_SENT'] +
      byStage['REPLIED'] +
      byStage['INTERESTED'] +
      byStage['NEGOTIATION'] +
      byStage['CLIENT'];
    const responderam =
      byStage['REPLIED'] +
      byStage['INTERESTED'] +
      byStage['NEGOTIATION'] +
      byStage['CLIENT'];
    const clientes = byStage['CLIENT'];

    return {
      leadsNoCrm: total,
      novas,
      mensagensEnviadas,
      responderam,
      interessados: byStage['INTERESTED'],
      negociacao: byStage['NEGOTIATION'],
      clientes,
      perdidos: byStage['LOST'],
      taxaResposta: mensagensEnviadas > 0 ? Math.round((responderam / mensagensEnviadas) * 100) : 0,
      taxaConversao: total > 0 ? Math.round((clientes / total) * 100) : 0,
      porStage: byStage,
    };
  }

  async getById(id: string) {
    const crmLead = await prisma.crmLead.findUnique({
      where: { id },
      include: {
        ...this.leadInclude,
        activities: { orderBy: { createdAt: 'desc' } },
      },
    });
    if (!crmLead) throw notFound('Lead não encontrado no CRM');
    return crmLead;
  }

  async addToCrm(leadId: string) {
    const lead = await prisma.lead.findUnique({ where: { id: leadId } });
    if (!lead) throw notFound('Lead não encontrado');

    const existing = await prisma.crmLead.findUnique({ where: { leadId } });
    if (existing) {
      return { crmLead: existing, created: false, alreadyInCrm: true };
    }

    const crmLead = await prisma.$transaction(async (tx) => {
      const max = await tx.crmLead.aggregate({ _max: { position: true }, where: { stage: 'NEW' } });
      const created = await tx.crmLead.create({
        data: {
          leadId,
          stage: 'NEW',
          position: (max._max.position ?? 0) + 10,
        },
      });
      await tx.crmActivity.create({
        data: {
          crmLeadId: created.id,
          type: CrmActivityType.ADDED_TO_CRM,
          description: 'Lead adicionado ao CRM',
        },
      });
      return created;
    });

    return { crmLead, created: true, alreadyInCrm: false };
  }

  async addMany(ids: string[]) {
    const leads = await prisma.lead.findMany({ where: { id: { in: ids } }, select: { id: true } });
    const existing = await prisma.crmLead.findMany({
      where: { leadId: { in: leads.map((l) => l.id) } },
      select: { leadId: true },
    });
    const existingSet = new Set(existing.map((e) => e.leadId));

    const toCreate = leads.filter((l) => !existingSet.has(l.id));

    for (const lead of toCreate) {
      await this.addToCrm(lead.id);
    }

    return {
      total: leads.length,
      added: toCreate.length,
      skipped: leads.length - toCreate.length,
    };
  }

  async update(id: string, data: { notes?: string | null; lastContactAt?: string | null }) {
    const existing = await prisma.crmLead.findUnique({ where: { id } });
    if (!existing) throw notFound('Lead não encontrado no CRM');

    const parsed = {
      notes: data.notes !== undefined ? data.notes : undefined,
      lastContactAt:
        data.lastContactAt !== undefined ? (data.lastContactAt ? new Date(data.lastContactAt) : null) : undefined,
    };
    return prisma.crmLead.update({
      where: { id },
      data: {
        notes: parsed.notes,
        lastContactAt: parsed.lastContactAt,
      },
    });
  }

  async moveStage(id: string, stage: CrmStage, position?: number) {
    const existing = await prisma.crmLead.findUnique({ where: { id } });
    if (!existing) throw notFound('Lead não encontrado no CRM');

    const nextPosition = position ?? existing.position;

    return prisma.$transaction(async (tx) => {
      const moved = await tx.crmLead.update({
        where: { id },
        data: { stage, position: nextPosition },
      });

      if (stage !== existing.stage) {
        await tx.crmActivity.create({
          data: {
            crmLeadId: id,
            type: CrmActivityType.STAGE_CHANGED,
            description: `Lead movido de ${STAGE_LABELS[existing.stage]} para ${STAGE_LABELS[stage]}`,
          },
        });
        if (stage === 'CLIENT') {
          await tx.crmActivity.create({
            data: {
              crmLeadId: id,
              type: CrmActivityType.CLIENT_WON,
              description: 'Negócio fechado! Lead convertido em cliente',
            },
          });
        }
        if (stage === 'LOST') {
          await tx.crmActivity.create({
            data: {
              crmLeadId: id,
              type: CrmActivityType.LOST,
              description: 'Oportunidade perdida',
            },
          });
        }
      }

      return moved;
    });
  }

  async setFollowUp(id: string, nextFollowUpAt: string | null) {
    const existing = await prisma.crmLead.findUnique({ where: { id } });
    if (!existing) throw notFound('Lead não encontrado no CRM');

    return prisma.$transaction(async (tx) => {
      const updated = await tx.crmLead.update({
        where: { id },
        data: { nextFollowUpAt: nextFollowUpAt ? new Date(nextFollowUpAt) : null },
      });
      if (nextFollowUpAt) {
        const date = new Date(nextFollowUpAt);
        await tx.crmActivity.create({
          data: {
            crmLeadId: id,
            type: CrmActivityType.FOLLOW_UP_CREATED,
            description: `Próximo follow-up agendado para ${date.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`,
          },
        });
      }
      return updated;
    });
  }

  async addNote(id: string, description: string) {
    const existing = await prisma.crmLead.findUnique({ where: { id } });
    if (!existing) throw notFound('Lead não encontrado no CRM');

    return prisma.$transaction(async (tx) => {
      const updated = await tx.crmLead.update({
        where: { id },
        data: {
          notes: existing.notes ? `${existing.notes}\n${description}` : description,
        },
      });
      await tx.crmActivity.create({
        data: { crmLeadId: id, type: CrmActivityType.NOTE_ADDED, description },
      });
      return updated;
    });
  }

  async addActivity(id: string, type: CrmActivityType, description: string) {
    const existing = await prisma.crmLead.findUnique({ where: { id } });
    if (!existing) throw notFound('Lead não encontrado no CRM');
    return prisma.crmActivity.create({
      data: { crmLeadId: id, type, description },
    });
  }

  async activities(id: string) {
    const existing = await prisma.crmLead.findUnique({ where: { id } });
    if (!existing) throw notFound('Lead não encontrado no CRM');
    return prisma.crmActivity.findMany({
      where: { crmLeadId: id },
      orderBy: { createdAt: 'desc' },
    });
  }

  async remove(id: string) {
    const existing = await prisma.crmLead.findUnique({ where: { id } });
    if (!existing) throw notFound('Lead não encontrado no CRM');
    await prisma.crmLead.delete({ where: { id } });
  }
}

export const crmService = new CrmService();
export { STAGE_ORDER };