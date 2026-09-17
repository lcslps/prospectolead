import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { googlePlacesService, type GooglePlace } from './GooglePlacesService';
import { mapPlaceToLeadData, type LeadDataInput } from './placeMapper';
import { leadScoreService, type ScoreInput } from './LeadScoreService';

export interface ProspectFilters {
  somenteComTelefone?: boolean;
  somenteComSite?: boolean;
  somenteSemSite?: boolean;
  notaMinima?: number;
  avaliacoesMinimas?: number;
  somenteAbertos?: boolean;
  evitarExistentes?: boolean;
}

export interface ProspectParams {
  nicho: string;
  cidade: string;
  estado: string;
  quantidade: number;
  filters?: ProspectFilters;
}

export interface ProspectResult {
  campaignId: string;
  encontrados: number;
  novos: number;
  existentes: number;
  filtrados: number;
  salvos: number;
  campaignName: string;
}

const PAGE_SIZE = 20;
const MAX_PAGES = 30;

type ExistingLead = {
  id: string;
  googlePlaceId: string;
  nome: string;
  categoria: string | null;
  nicho: string | null;
  endereco: string | null;
  cidade: string | null;
  estado: string | null;
  cep: string | null;
  latitude: number | null;
  longitude: number | null;
  telefone: string | null;
  telefoneInternacional: string | null;
  site: string | null;
  googleMapsUrl: string | null;
  nota: number | null;
  quantidadeAvaliacoes: number | null;
  businessStatus: string | null;
};

type MergeField =
  | 'nome'
  | 'categoria'
  | 'endereco'
  | 'cidade'
  | 'estado'
  | 'cep'
  | 'latitude'
  | 'longitude'
  | 'telefone'
  | 'telefoneInternacional'
  | 'site'
  | 'googleMapsUrl'
  | 'nota'
  | 'quantidadeAvaliacoes'
  | 'businessStatus';

export type { MergeField };

export class ProspectService {
  buildQuery(nicho: string, cidade: string, estado: string): string {
    return `${nicho.trim()} em ${cidade.trim()} ${estado.trim()}`.replace(/\s+/g, ' ').trim();
  }

  buildCampaignName(nicho: string, cidade: string, estado: string): string {
    const now = new Date();
    const stamp = now.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
    return `${nicho.trim()} - ${cidade.trim()} ${estado.trim()} (${stamp})`;
  }

  passesFilters(place: GooglePlace, filters: ProspectFilters): boolean {
    if (filters.somenteComTelefone && !place.nationalPhoneNumber && !place.internationalPhoneNumber) {
      return false;
    }
    if (filters.somenteComSite && !place.websiteUri) return false;
    if (filters.somenteSemSite && place.websiteUri) return false;
    if (filters.notaMinima && (place.rating ?? 0) < filters.notaMinima) return false;
    if (filters.avaliacoesMinimas && (place.userRatingCount ?? 0) < filters.avaliacoesMinimas)
      return false;
    if (filters.somenteAbertos && place.businessStatus && place.businessStatus !== 'OPERATIONAL') {
      return false;
    }
    return true;
  }

  private mergeMissing(
    existing: ExistingLead,
    data: LeadDataInput,
  ): Record<string, unknown> {
    const update: Record<string, unknown> = {};
    const fields: MergeField[] = [
      'nome',
      'categoria',
      'endereco',
      'cidade',
      'estado',
      'cep',
      'latitude',
      'longitude',
      'telefone',
      'telefoneInternacional',
      'site',
      'googleMapsUrl',
      'nota',
      'quantidadeAvaliacoes',
      'businessStatus',
    ];

    for (const key of fields) {
      const current = existing[key];
      const fresh = data[key];
      const isMissing = current === null || current === undefined;
      const isFilled = fresh !== null && fresh !== undefined && fresh !== '';
      if (isMissing && isFilled) {
        update[key] = fresh;
      }
    }

    if (!existing.nicho && data.nicho) update.nicho = data.nicho;

    return update;
  }

  async run(params: ProspectParams): Promise<ProspectResult> {
    const { nicho, cidade, estado, quantidade, filters = {} } = params;
    const safeQuantity = Math.min(Math.max(quantidade, 1), 1000);
    const limit = Math.min(safeQuantity, PAGE_SIZE * MAX_PAGES);

    const query = this.buildQuery(nicho, cidade, estado);
    const campaignName = this.buildCampaignName(nicho, cidade, estado);

    let pageToken: string | null = null;
    let encontrados = 0;
    let filtrados = 0;
    const collected: GooglePlace[] = [];

    let attempts = 0;
    while (collected.length < limit && attempts < MAX_PAGES) {
      attempts += 1;
      let response;
      try {
        const remaining = Math.max(limit - collected.length, 1);
        response = await googlePlacesService.searchText({
          query,
          pageSize: Math.min(PAGE_SIZE, remaining),
          pageToken: pageToken ?? undefined,
        });
      } catch (error) {
        if (collected.length === 0) throw error;
        break;
      }

      const places = (response.places ?? []).filter((p) => p && p.id);
      encontrados += places.length;

      for (const place of places) {
        if (collected.length >= limit) break;
        if (this.passesFilters(place, filters)) {
          collected.push(place);
        } else {
          filtrados += 1;
        }
      }

      pageToken = response.nextPageToken ?? null;
      if (!pageToken) break;
    }

    const scoredInputs: ScoreInput[] = collected.map((place) => ({
      site: place.websiteUri,
      telefone: place.nationalPhoneNumber || place.internationalPhoneNumber,
      quantidadeAvaliacoes: place.userRatingCount,
      nota: place.rating,
      endereco: place.formattedAddress,
      cidade: extractCidade(place),
      cep: extractCep(place),
    }));
    const scores = await leadScoreService.scoreMany(scoredInputs);

    const leadDatas: LeadDataInput[] = collected.map((place, index) => ({
      ...mapPlaceToLeadData(place, nicho),
      leadScore: scores[index],
    }));

    const upserts = await this.upsertLeads(leadDatas, filters.evitarExistentes ? 'skip' : 'merge');

    const campaign = await prisma.campaign.create({
      data: {
        nome: campaignName,
        nicho,
        cidade,
        estado,
        quantidadeSolicitada: safeQuantity,
        quantidadeEncontrada: encontrados,
      },
    });

    if (upserts.savedIds.length > 0) {
      await prisma.campaignLead.createMany({
        data: upserts.savedIds.map((leadId) => ({ leadId, campaignId: campaign.id })),
        skipDuplicates: true,
      });
    }

    return {
      campaignId: campaign.id,
      encontrados,
      novos: upserts.novos,
      existentes: upserts.existentes,
      filtrados,
      salvos: upserts.savedIds.length,
      campaignName,
    };
  }

  private async upsertLeads(datas: LeadDataInput[], mode: 'merge' | 'skip') {
    if (datas.length === 0) return { novos: 0, existentes: 0, savedIds: [] as string[] };

    const ids = datas.map((d) => d.googlePlaceId);
    const existingRecords = await prisma.lead.findMany({
      where: { googlePlaceId: { in: ids } },
      select: {
        id: true,
        googlePlaceId: true,
        nome: true,
        categoria: true,
        nicho: true,
        endereco: true,
        cidade: true,
        estado: true,
        cep: true,
        latitude: true,
        longitude: true,
        telefone: true,
        telefoneInternacional: true,
        site: true,
        googleMapsUrl: true,
        nota: true,
        quantidadeAvaliacoes: true,
        businessStatus: true,
      },
    });

    const existingById = new Map<string, ExistingLead>();
    for (const rec of existingRecords) {
      existingById.set(rec.googlePlaceId, rec);
    }

    const newIds: string[] = [];
    const existingIds: string[] = [];

    if (mode === 'merge') {
      const updates: Array<{ id: string; data: Record<string, unknown> }> = [];
      for (const data of datas) {
        const existing = existingById.get(data.googlePlaceId);
        if (!existing) {
          newIds.push(data.googlePlaceId);
        } else {
          existingIds.push(data.googlePlaceId);
          const merged = this.mergeMissing(existing, data);
          if (Object.keys(merged).length > 0) {
            updates.push({ id: existing.id, data: merged });
          }
        }
      }

      for (let i = 0; i < updates.length; i += 50) {
        const chunk = updates.slice(i, i + 50);
        await prisma.$transaction(
          chunk.map((u) =>
            prisma.lead.update({
              where: { id: u.id },
              data: u.data as Prisma.LeadUpdateInput,
            }),
          ),
        );
      }
    } else {
      for (const data of datas) {
        if (existingById.has(data.googlePlaceId)) {
          existingIds.push(data.googlePlaceId);
        } else {
          newIds.push(data.googlePlaceId);
        }
      }
    }

    let savedIds: string[] = [];
    if (newIds.length > 0) {
      const toCreate = datas
        .filter((d) => newIds.includes(d.googlePlaceId))
        .map((d) => ({ ...d, leadScore: d.leadScore ?? 0 }));
      await prisma.lead.createMany({ data: toCreate, skipDuplicates: true });

      const createdRows = await prisma.lead.findMany({
        where: { googlePlaceId: { in: newIds } },
        select: { id: true },
      });
      savedIds = createdRows.map((r) => r.id);
    }

    if (mode === 'merge') {
      savedIds.push(...existingIds.map(id => existingById.get(id)!.id));
    }
    return { novos: new Set(newIds).size, existentes: new Set(existingIds).size, savedIds: [...new Set(savedIds)] };
  }
}

function extractCidade(place: GooglePlace): string | null {
  const components = place.addressComponents ?? [];
  for (const c of components) {
    const types = c.types ?? [];
    if (types.includes('locality') || types.includes('sublocality_level_1')) return c.longText;
  }
  return null;
}

function extractCep(place: GooglePlace): string | null {
  const components = place.addressComponents ?? [];
  for (const c of components) {
    const types = c.types ?? [];
    if (types.includes('postal_code')) return c.longText;
  }
  return null;
}

export const prospectService = new ProspectService();
