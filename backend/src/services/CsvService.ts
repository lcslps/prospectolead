import type { Lead } from '@prisma/client';

export function escapeCsv(value: unknown): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function leadsToCsv(leads: Array<Pick<Lead, 'nome' | 'telefone' | 'cidade' | 'estado' | 'site' | 'nota' | 'quantidadeAvaliacoes' | 'status' | 'leadScore'>>): string {
  const header = ['nome', 'telefone', 'cidade', 'estado', 'site', 'nota', 'avaliacoes', 'status', 'leadScore'];
  const rows = leads.map((lead) => {
    const nota = lead.nota === null || lead.nota === undefined ? '' : lead.nota.toFixed(1).replace('.', ',');
    return [
      lead.nome,
      lead.telefone ?? '',
      lead.cidade ?? '',
      lead.estado ?? '',
      lead.site ?? '',
      nota,
      lead.quantidadeAvaliacoes ?? '',
      lead.status,
      lead.leadScore ?? '',
    ];
  });

  return [header, ...rows].map((row) => row.map(escapeCsv).join(';')).join('\n');
}

export function toCsvFileName(prefix: string): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const stamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}-${pad(now.getMinutes())}`;
  return `${prefix}_${stamp}.csv`;
}