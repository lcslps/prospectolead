import { prisma } from '../lib/prisma';

export class DashboardService {
  async getData() {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const [totalLeads, novos, contatados, responderam, interessados, negociacao, clientes, ignorado, campanhas, leadsHoje, porStatus, porCidade, topNichos, ultimosLeads, crmLeadsNoCrm, crmPorStage, crmMensagensEnviadas] =
      await Promise.all([
        prisma.crmLead.count(),
        prisma.crmLead.count({ where: { stage: 'NEW' } }),
        prisma.crmLead.count({ where: { stage: 'MESSAGE_SENT' } }),
        prisma.crmLead.count({ where: { stage: 'REPLIED' } }),
        prisma.crmLead.count({ where: { stage: 'INTERESTED' } }),
        prisma.crmLead.count({ where: { stage: 'NEGOTIATION' } }),
        prisma.crmLead.count({ where: { stage: 'CLIENT' } }),
        prisma.crmLead.count({ where: { stage: 'LOST' } }),
        prisma.campaign.count(),
        prisma.crmLead.count({ where: { createdAt: { gte: startOfDay } } }),
        prisma.lead.groupBy({
          by: ['status'],
          where: { crmLead: { isNot: null } },
          _count: { _all: true },
          orderBy: { _count: { status: 'desc' } },
        }),
        prisma.lead.groupBy({
          by: ['cidade'],
          _count: { _all: true },
          orderBy: { _count: { cidade: 'desc' } },
          where: { crmLead: { isNot: null }, cidade: { not: null } },
          take: 8,
        }),
        prisma.lead.groupBy({
          by: ['nicho'],
          _count: { _all: true },
          orderBy: { _count: { nicho: 'desc' } },
          where: { crmLead: { isNot: null }, nicho: { not: null } },
          take: 8,
        }),
        prisma.lead.findMany({
          where: { crmLead: { isNot: null } },
          orderBy: { createdAt: 'desc' },
          take: 6,
          select: {
            id: true,
            nome: true,
            cidade: true,
            estado: true,
            status: true,
            leadScore: true,
            nota: true,
            telefone: true,
            createdAt: true,
          },
        }),
        prisma.crmLead.count(),
        prisma.crmLead.groupBy({ by: ['stage'], _count: { _all: true } }),
        prisma.crmActivity.count({ where: { type: 'MESSAGE_SENT' } }),
      ]);

    const byCrmStage: Record<string, number> = {};
    for (const key of ['NEW', 'MESSAGE_SENT', 'REPLIED', 'INTERESTED', 'NEGOTIATION', 'CLIENT', 'LOST']) {
      byCrmStage[key] = 0;
    }
    for (const s of crmPorStage) byCrmStage[s.stage] = s._count._all;

    const crmMensagens =
      byCrmStage['MESSAGE_SENT'] +
      byCrmStage['REPLIED'] +
      byCrmStage['INTERESTED'] +
      byCrmStage['NEGOTIATION'] +
      byCrmStage['CLIENT'];

    return {
      stats: {
        totalLeads,
        novos,
        contatados,
        responderam,
        interessados,
        negociacao,
        clientes,
        ignorado,
        campanhas,
        leadsHoje,
        sitesGerados: await prisma.website.count({ where: { generationStatus: "completed" } }),
      },
      crmStats: {
        leadsNoCrm: crmLeadsNoCrm,
        novas: byCrmStage['NEW'],
        mensagensEnviadas: crmMensagens,
        responderam:
          byCrmStage['REPLIED'] +
          byCrmStage['INTERESTED'] +
          byCrmStage['NEGOTIATION'] +
          byCrmStage['CLIENT'],
        interessados: byCrmStage['INTERESTED'],
        clientes: byCrmStage['CLIENT'],
        atividadesMensagemEnviada: crmMensagensEnviadas,
        porStage: byCrmStage,
      },
      porStatus,
      porCidade: porCidade.filter((c) => c.cidade !== null),
      topNichos: topNichos.filter((n) => n.nicho !== null),
      ultimosLeads,
    };
  }
}

export const dashboardService = new DashboardService();