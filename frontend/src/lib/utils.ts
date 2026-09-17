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
      color: 'text-blue-500',
      badgeClass: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    };
  return {
    label: 'Lead frio',
    color: 'text-slate-400',
    badgeClass: 'bg-slate-500/10 text-slate-500 dark:text-slate-400',
  };
}

export const STATUS_STYLES: Record<string, string> = {
  NOVO: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 ring-sky-500/20',
  CONTATADO: 'bg-violet-500/10 text-violet-600 dark:text-violet-400 ring-violet-500/20',
  RESPONDEU: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 ring-indigo-500/20',
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
  SITE_GENERATED: 'Site gerado',
  NEW: 'Novo',
  MESSAGE_SENT: 'Mensagem enviada',
  REPLIED: 'Respondeu',
  INTERESTED: 'Interessado',
  NEGOTIATION: 'Negociação',
  CLIENT: 'Cliente',
  LOST: 'Perdido',
};

export const CRM_STAGE_HEADERS: Record<CrmStage, string> = {
  SITE_GENERATED: 'Site gerado',
  NEW: 'NOVO',
  MESSAGE_SENT: 'MENSAGEM ENVIADA',
  REPLIED: 'RESPONDEU',
  INTERESTED: 'INTERESSADO',
  NEGOTIATION: 'NEGOCIAÇÃO',
  CLIENT: 'CLIENTE',
  LOST: 'PERDIDO',
};

export const CRM_STAGE_STYLES: Record<CrmStage, string> = {
  SITE_GENERATED: 'bg-cyan-500/10 text-cyan-600 ring-cyan-500/20',
  NEW: 'bg-slate-500/10 text-slate-600 dark:text-slate-300 ring-slate-500/20',
  MESSAGE_SENT: 'bg-sky-500/10 text-sky-600 dark:text-sky-500 ring-sky-500/20',
  REPLIED: 'bg-violet-500/10 text-violet-600 dark:text-violet-400 ring-violet-500/20',
  INTERESTED: 'bg-amber-500/10 text-amber-600 dark:text-amber-500 ring-amber-500/20',
  NEGOTIATION: 'bg-orange-500/10 text-orange-600 dark:text-orange-500 ring-orange-500/20',
  CLIENT: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-emerald-500/20',
  LOST: 'bg-red-500/10 text-red-600 dark:text-red-400 ring-red-500/20',
};

export const CRM_DOT_COLORS: Record<CrmStage, string> = {
  SITE_GENERATED: 'Site gerado',
  NEW: 'bg-slate-400',
  MESSAGE_SENT: 'bg-sky-500',
  REPLIED: 'bg-violet-500',
  INTERESTED: 'bg-amber-500',
  NEGOTIATION: 'bg-orange-500',
  CLIENT: 'bg-emerald-500',
  LOST: 'bg-red-500',
};

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