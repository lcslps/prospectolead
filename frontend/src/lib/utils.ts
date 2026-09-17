import type { CrmStage } from '../types';

export function phoneForWhatsApp(telefone?: string | null, telefoneInternacional?: string | null): string | null {
  const digits = (v: string) => v.replace(/\D/g, '');
  if (telefoneInternacional && digits(telefoneInternacional).length >= 12) {
    return digits(telefoneInternacional);
  }
  if (telefone) {
    const d = digits(telefone);
    if (d.length >= 10) {
      if (d.length === 10 || d.length === 11) return `55${d}`;
      return d;
    }
  }
  return null;
}

export function whatsAppLink(telefone?: string | null, telefoneInternacional?: string | null, message?: string): string | null {
  const number = phoneForWhatsApp(telefone, telefoneInternacional);
  if (!number) return null;
  const text = message ? `?text=${encodeURIComponent(message)}` : '';
  return `https://wa.me/${number}${text}`;
}

export function formatScore(score: number): { label: string; color: string; badgeClass: string } {
  if (score >= 85)
    return {
      label: 'Lead quente',
      color: 'text-amber-500',
      badgeClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    };
  if (score >= 70)
    return {
      label: 'Bom lead',
      color: 'text-emerald-500',
      badgeClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    };
  if (score >= 50)
    return {
      label: 'Lead médio',
      color: 'text-brand-500',
      badgeClass: 'bg-brand-500/10 text-brand-600 dark:text-brand-400',
    };
  return {
    label: 'Lead frio',
    color: 'text-slate-400',
    badgeClass: 'bg-slate-500/10 text-slate-500 dark:text-slate-400',
  };
}

export const STATUS_STYLES: Record<string, string> = {
  NOVO: 'bg-brand-500/10 text-brand-600 dark:text-brand-400 ring-brand-500/20',
  CONTATADO: 'bg-brand-500/10 text-brand-600 dark:text-brand-400 ring-brand-500/20',
  RESPONDEU: 'bg-brand-500/10 text-brand-600 dark:text-brand-400 ring-brand-500/20',
  INTERESSADO: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-emerald-500/20',
  NEGOCIACAO: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 ring-amber-500/20',
  CLIENTE: 'bg-green-600/10 text-green-700 dark:text-green-400 ring-green-600/20',
  IGNORADO: 'bg-slate-500/10 text-slate-500 dark:text-slate-400 ring-slate-500/20',
};

export const STATUS_LABELS: Record<string, string> = {
  NOVO: 'Novo',
  CONTATADO: 'Contatado',
  RESPONDEU: 'Respondeu',
  INTERESSADO: 'Interessado',
  NEGOCIACAO: 'Negociação',
  CLIENTE: 'Cliente',
  IGNORADO: 'Ignorado',
};

export const ESTADOS_BR = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
];

export function formatDate(iso?: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function formatRating(nota: number | null): string {
  if (nota === null || nota === undefined) return '—';
  return nota.toFixed(1).replace('.', ',');
}

export function previewTemplate(conteudo: string, servico?: string | null): string {
  return conteudo
    .replaceAll('{empresa}', 'Clínica Sorriso')
    .replaceAll('{cidade}', 'Sinop')
    .replaceAll('{estado}', 'MT')
    .replaceAll('{nicho}', 'dentistas')
    .replaceAll('{telefone}', '(66) 99999-9999')
    .replaceAll('{site}', 'www.exemplo.com')
    .replaceAll('{servico}', servico?.trim() || 'soluções para o seu segmento');
}

export const CRM_STAGE_ORDER: CrmStage[] = [
  'SCHEDULED',
  'FOLLOW_UP',
  'NEW',
  'SITE_GENERATED',
  'MESSAGE_SENT',
  'REPLIED',
  'INTERESTED',
  'NEGOTIATION',
  'CLIENT',
  'LOST',
];

export const CRM_STAGE_LABELS: Record<CrmStage, string> = {
  SCHEDULED: 'Agendado',
  FOLLOW_UP: 'Follow Up',
  SITE_GENERATED: 'Site gerado',
  NEW: 'Base',
  MESSAGE_SENT: 'Abordado',
  REPLIED: 'Respondeu',
  INTERESTED: 'Interessado',
  NEGOTIATION: 'Negociação',
  CLIENT: 'Convertido',
  LOST: 'Perdido',
};

export const CRM_STAGE_HEADERS: Record<CrmStage, string> = {
  SCHEDULED: 'Agendado',
  FOLLOW_UP: 'Follow Up',
  SITE_GENERATED: 'Site gerado',
  NEW: 'Base',
  MESSAGE_SENT: 'Abordado',
  REPLIED: 'RESPONDEU',
  INTERESTED: 'INTERESSADO',
  NEGOTIATION: 'NEGOCIAÇÃO',
  CLIENT: 'Convertido',
  LOST: 'Perdido',
};

export const CRM_STAGE_STYLES: Record<CrmStage, string> = {
  SCHEDULED: 'bg-brand-500/10 text-brand-600 dark:text-brand-300 ring-brand-500/20',
  FOLLOW_UP: 'bg-brand-500/10 text-brand-600 dark:text-brand-300 ring-brand-500/20',
  SITE_GENERATED: 'bg-brand-500/10 text-brand-600 dark:text-brand-300 ring-brand-500/20',
  NEW: 'bg-slate-500/10 text-slate-600 dark:text-slate-300 ring-slate-500/20',
  MESSAGE_SENT: 'bg-brand-500/10 text-brand-600 dark:text-brand-500 ring-brand-500/20',
  REPLIED: 'bg-brand-500/10 text-brand-600 dark:text-brand-400 ring-brand-500/20',
  INTERESTED: 'bg-brand-500/10 text-brand-600 dark:text-brand-300 ring-brand-500/20',
  NEGOTIATION: 'bg-brand-500/10 text-brand-600 dark:text-brand-300 ring-brand-500/20',
  CLIENT: 'bg-brand-500/10 text-brand-600 dark:text-brand-300 ring-brand-500/20',
  LOST: 'bg-red-500/10 text-red-600 dark:text-red-400 ring-red-500/20',
};

export const CRM_DOT_COLORS: Record<CrmStage, string> = {
  SCHEDULED: 'bg-brand-400',
  FOLLOW_UP: 'bg-brand-500',
  SITE_GENERATED: 'bg-brand-500',
  NEW: 'bg-slate-400',
  MESSAGE_SENT: 'bg-brand-500',
  REPLIED: 'bg-brand-500',
  INTERESTED: 'bg-brand-400',
  NEGOTIATION: 'bg-brand-500',
  CLIENT: 'bg-brand-600',
  LOST: 'bg-red-500',
};

export const CRM_PIPELINE_STAGES: CrmStage[] = ['NEW', 'MESSAGE_SENT', 'SCHEDULED', 'FOLLOW_UP', 'CLIENT', 'LOST'];
export function pipelineStage(stage: CrmStage): CrmStage {
  if (stage === 'SITE_GENERATED') return 'NEW';
  if (stage === 'REPLIED' || stage === 'INTERESTED') return 'MESSAGE_SENT';
  if (stage === 'NEGOTIATION') return 'FOLLOW_UP';
  return stage;
}

export function followUpStatus(nextFollowUpAt: string | null): { late: boolean; today: boolean } {
  if (!nextFollowUpAt) return { late: false, today: false };
  const date = new Date(nextFollowUpAt);
  const now = new Date();
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(todayStart);
  todayEnd.setDate(todayEnd.getDate() + 1);
  return {
    late: date.getTime() < now.getTime(),
    today: date.getTime() >= todayStart.getTime() && date.getTime() <= todayEnd.getTime(),
  };
}

export function formatCrmDate(iso?: string | null): string {
  if (!iso) return '—';
  const date = new Date(iso);
  const now = new Date();
  const sameDay = date.toDateString() === now.toDateString();
  if (sameDay) {
    return `Hoje, ${date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
  }
  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function toDatetimeLocalValue(iso?: string | null): string {
  if (!iso) return '';
  const date = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
