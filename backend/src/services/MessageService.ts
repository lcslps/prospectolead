import { prisma } from '../lib/prisma';
import { notFound } from '../utils/apiError';

const TOKEN_PATTERN = /\{(\w+)\}/g;

export interface MessageContext {
  empresa?: string | null;
  cidade?: string | null;
  estado?: string | null;
  nicho?: string | null;
  telefone?: string | null;
  site?: string | null;
  servico?: string | null;
}

export function renderMessage(conteudo: string, context: MessageContext): string {
  return conteudo.replace(TOKEN_PATTERN, (_match, token: string) => {
    const value = context[token as keyof MessageContext];
    if (value === undefined || value === null) return '';
    return String(value);
  });
}

export class MessageService {
  async generate(templateId: string, leadId: string): Promise<string> {
    const template = await prisma.messageTemplate.findUnique({ where: { id: templateId } });
    if (!template) throw notFound('Template não encontrado');

    const lead = await prisma.lead.findUnique({ where: { id: leadId } });
    if (!lead) throw notFound('Lead não encontrado');

    return renderMessage(template.conteudo, {
      empresa: lead.nome,
      cidade: lead.cidade,
      estado: lead.estado,
      nicho: lead.nicho,
      telefone: lead.telefone,
      site: lead.site,
      servico: template.servico,
    });
  }

  async generateFromTemplate(template: {
    conteudo: string;
    servico?: string | null;
  }, lead: {
    nome: string;
    cidade?: string | null;
    estado?: string | null;
    nicho?: string | null;
    telefone?: string | null;
    site?: string | null;
  }): Promise<string> {
    return renderMessage(template.conteudo, {
      empresa: lead.nome,
      cidade: lead.cidade,
      estado: lead.estado,
      nicho: lead.nicho,
      telefone: lead.telefone,
      site: lead.site,
      servico: template.servico,
    });
  }
}

export const messageService = new MessageService();