import type { GeoState, NicheOption } from '../types';

function base(backendUrl: string): string {
  const b = backendUrl.trim().replace(/\/$/, '');
  if (!b) throw new Error('Backend não configurado.');
  return b;
}

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || `Falha na requisição (${res.status})`);
  return data as T;
}

export async function fetchStates(backendUrl: string): Promise<GeoState[]> {
  const data = await getJson<{ states: GeoState[] }>(base(backendUrl) + '/api/geo/states');
  return data.states;
}

export async function fetchCities(backendUrl: string, uf: string): Promise<string[]> {
  if (!uf) return [];
  const data = await getJson<{ cities: string[] }>(base(backendUrl) + `/api/geo/cities?uf=${encodeURIComponent(uf)}`);
  return data.cities;
}

export async function fetchNiches(backendUrl: string): Promise<NicheOption[]> {
  const data = await getJson<{ niches: NicheOption[] }>(base(backendUrl) + '/api/niches');
  return data.niches;
}

export async function fetchLeadUsage(backendUrl: string): Promise<{ used: number; limit: number }> {
  const data = await getJson<{ used: number; limit: number }>(base(backendUrl) + '/api/leads/usage');
  return data;
}
