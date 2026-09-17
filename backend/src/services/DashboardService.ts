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
        prisma.crmLead.groupBy({
          by: ['stage'],
          _count: { _all: true },
          orderBy: { _count: { stage: 'desc' } },
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
          orderBy: { crmLead: { createdAt: 'desc' } },
          take: 6,
          select: {
            crmLead: { select: { stage: true, createdAt: true } },
            id: true,
            nome: true,
            categoria: true,
            nicho: true,
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
    for (const key of ['SCHEDULED', 'FOLLOW_UP', 'NEW', 'SITE_GENERATED', 'MESSAGE_SENT', 'REPLIED', 'INTERESTED', 'NEGOTIATION', 'CLIENT', 'LOST']) {
      byCrmStage[key] = 0;
    }
    for (const s of crmPorStage) byCrmStage[s.stage] = s._count._all;

    const crmMensagens =
      byCrmStage['MESSAGE_SENT'] +
      byCrmStage['REPLIED'] +
      byCrmStage['INTERESTED'] +
      byCrmStage['NEGOTIATION'] +
      byCrmStage['CLIENT'];

    const [semSiteGerado, followUpsAtrasados, sitesPublicados, empresasEncontradas] = await Promise.all([
      prisma.crmLead.count({ where: { OR: [{ website: null }, { website: { generationStatus: { not: 'completed' } } }] } }),
      prisma.crmLead.count({ where: { nextFollowUpAt: { lt: startOfDay }, stage: { notIn: ['CLIENT', 'LOST'] } } }),
      prisma.website.count({ where: { publishedAt: { not: null } } }),
      prisma.lead.count(),
    ]);

    return {
      activity: { semSiteGerado, followUpsAtrasados, sitesPublicados, empresasEncontradas, mensagensEnviadas: crmMensagensEnviadas },
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
      porStatus: porStatus.map(s => ({ status: stageStatus[s.stage], _count: s._count })),
      porCidade: porCidade.filter((c) => c.cidade !== null),
      topNichos: topNichos.filter((n) => n.nicho !== null),
      ultimosLeads: ultimosLeads.map(l => ({ ...l, status: stageStatus[l.crmLead!.stage], crmStage: l.crmLead!.stage, createdAt: l.crmLead!.createdAt })),
    };
  }
}

export const dashboardService = new DashboardService();
const stageStatus = { SCHEDULED: 'INTERESSADO', FOLLOW_UP: 'NEGOCIACAO', NEW: 'NOVO', SITE_GENERATED: 'NOVO', MESSAGE_SENT: 'CONTATADO', REPLIED: 'RESPONDEU', INTERESTED: 'INTERESSADO', NEGOTIATION: 'NEGOCIACAO', CLIENT: 'CLIENTE', LOST: 'IGNORADO' };
