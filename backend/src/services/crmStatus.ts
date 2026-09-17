import type { CrmStage, Status } from '@prisma/client';
export const stageToStatus: Record<CrmStage, Status> = { NEW: 'NOVO', SITE_GENERATED: 'NOVO', MESSAGE_SENT: 'CONTATADO', REPLIED: 'RESPONDEU', INTERESTED: 'INTERESSADO', NEGOTIATION: 'NEGOCIACAO', CLIENT: 'CLIENTE', LOST: 'IGNORADO' };
export const statusToStage: Record<Status, CrmStage> = { NOVO: 'NEW', CONTATADO: 'MESSAGE_SENT', RESPONDEU: 'REPLIED', INTERESSADO: 'INTERESTED', NEGOCIACAO: 'NEGOTIATION', CLIENTE: 'CLIENT', IGNORADO: 'LOST' };
