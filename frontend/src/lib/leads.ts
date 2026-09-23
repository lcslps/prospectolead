import type { Lead, LeadSearchResult, LeadStage } from '../types';

function base(backendUrl: string): string {
  const b = backendUrl.trim().replace(/\/$/, '');
  if (!b) throw new Error('Backend não configurado.');
  return b;
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || `Falha na requisição (${res.status})`);
  return data as T;
}

export interface SearchLeadsParams {
  state: string;
  city: string;
  niche: string;
  limit: number;
}

export interface SearchLeadsResult {
  results: LeadSearchResult[];
  usage: { used: number; limit: number; month: string };
}

export async function searchLeads(backendUrl: string, params: SearchLeadsParams): Promise<SearchLeadsResult> {
  return request(base(backendUrl) + '/api/leads/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
}

export async function sendLeadsToCrm(backendUrl: string, leads: LeadSearchResult[]): Promise<Lead[]> {
  const data = await request<{ leads: Lead[] }>(base(backendUrl) + '/api/crm/leads', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ leads }),
  });
  return data.leads;
}

export interface CrmFilters {
  q?: string;
  stage?: LeadStage;
  tier?: string;
  hasSite?: 'true' | 'false';
  hasPhone?: 'true';
  minScore?: number;
}

export async function listCrmLeads(
  backendUrl: string,
  filters: CrmFilters = {}
): Promise<{ leads: Lead[]; counts: Record<string, number> }> {
  const qs = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => {
    if (v !== undefined && v !== '') qs.set(k, String(v));
  });
  const suffix = qs.toString() ? `?${qs.toString()}` : '';
  return request(base(backendUrl) + '/api/crm/leads' + suffix);
}

export async function getCrmLead(backendUrl: string, id: string): Promise<Lead> {
  const data = await request<{ lead: Lead }>(base(backendUrl) + `/api/crm/leads/${id}`);
  return data.lead;
}

export async function updateCrmLead(backendUrl: string, id: string, patch: Partial<Lead>): Promise<Lead> {
  const data = await request<{ lead: Lead }>(base(backendUrl) + `/api/crm/leads/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch),
  });
  return data.lead;
}

export async function deleteCrmLead(backendUrl: string, id: string): Promise<void> {
  await request(base(backendUrl) + `/api/crm/leads/${id}`, { method: 'DELETE' });
}

export async function createManualLead(backendUrl: string, data: Partial<Lead>): Promise<Lead> {
  const res = await request<{ lead: Lead }>(base(backendUrl) + '/api/crm/leads', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.lead;
}

export async function saveLeadSite(backendUrl: string, id: string, html: string): Promise<string> {
  const data = await request<{ siteUrl: string }>(base(backendUrl) + `/api/crm/leads/${id}/site`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ html }),
  });
  return data.siteUrl;
}
