import { Prisma, Status } from '@prisma/client';

export interface LeadListFilters {
  campaignId?: string;
  search?: string;
  cidade?: string;
  estado?: string;
  status?: Status[];
  comTelefone?: boolean;
  semTelefone?: boolean;
  comSite?: boolean;
  semSite?: boolean;
  notaMinima?: number;
  orderBy?: string;
  order?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
  crm?: 'all' | 'none' | 'in';
}

export function buildWhere(filters: LeadListFilters): Prisma.LeadWhereInput {
  const and: Prisma.LeadWhereInput[] = [];
  if (filters.campaignId) and.push({ campaigns: { some: { campaignId: filters.campaignId } } });

  if (filters.search) {
    and.push({
      OR: [
        { nome: { contains: filters.search, mode: 'insensitive' } },
        { categoria: { contains: filters.search, mode: 'insensitive' } },
        { endereco: { contains: filters.search, mode: 'insensitive' } },
      ],
    });
  }
  if (filters.cidade) {
    and.push({ cidade: { contains: filters.cidade, mode: 'insensitive' } });
  }
  if (filters.estado) {
    and.push({ estado: { equals: filters.estado, mode: 'insensitive' } });
  }
  if (filters.status && filters.status.length > 0) {
    and.push({ status: { in: filters.status } });
  }
  if (filters.comTelefone) and.push({ NOT: { telefone: null } });
  if (filters.semTelefone) and.push({ telefone: null });
  if (filters.comSite) and.push({ NOT: { site: null } });
  if (filters.semSite) and.push({ site: null });
  if (filters.notaMinima !== undefined && filters.notaMinima > 0) {
    and.push({ nota: { gte: filters.notaMinima } });
  }
  if (filters.crm === 'none') and.push({ crmLead: null });
  if (filters.crm === 'in') and.push({ crmLead: { isNot: null } });

  return and.length === 1 ? and[0] : and.length > 1 ? { AND: and } : {};
}

export function buildOrderBy(
  orderBy?: string,
  order?: 'asc' | 'desc',
): Prisma.LeadOrderByWithRelationInput[] {
  const dir = order === 'asc' ? 'asc' : 'desc';
  const defaultOrder: Prisma.LeadOrderByWithRelationInput = { createdAt: 'desc' };

  switch (orderBy) {
    case 'nome':
      return [{ nome: dir }, defaultOrder];
    case 'nota':
      return [{ nota: dir }, defaultOrder];
    case 'avaliacoes':
      return [{ quantidadeAvaliacoes: dir }, defaultOrder];
    case 'score':
      return [{ leadScore: dir }, defaultOrder];
    case 'cidade':
      return [{ cidade: dir }, defaultOrder];
    case 'estado':
      return [{ estado: dir }, defaultOrder];
    default:
      return [defaultOrder];
  }
}

export function parseStatusList(value: unknown): Status[] {
  if (!value) return [];
  const parts = Array.isArray(value) ? value : String(value).split(',');
  const parsed: Status[] = [];
  for (const part of parts) {
    const trimmed = String(part).trim() as Status;
    if (Object.values(Status).includes(trimmed)) parsed.push(trimmed);
  }
  return parsed;
}

export const STATUSES = Object.values(Status);
