import { prisma } from '../lib/prisma';

export interface ScoreWeights {
  semSite: number;
  temTelefone: number;
  avaliacoesMais20: number;
  notaQuatroCinco: number;
  avaliacoesMais50: number;
  enderecoCompleto: number;
  max: number;
}

export const DEFAULT_WEIGHTS: ScoreWeights = {
  semSite: 30,
  temTelefone: 20,
  avaliacoesMais20: 15,
  notaQuatroCinco: 15,
  avaliacoesMais50: 10,
  enderecoCompleto: 10,
  max: 100,
};

const CACHE_TTL_MS = 60_000;

interface CacheEntry {
  weights: ScoreWeights;
  fetchedAt: number;
}

export interface ScoreInput {
  site?: string | null;
  telefone?: string | null;
  quantidadeAvaliacoes?: number | null;
  nota?: number | null;
  endereco?: string | null;
  cidade?: string | null;
  cep?: string | null;
}

let cache: CacheEntry | null = null;

export class LeadScoreService {
  async getWeights(): Promise<ScoreWeights> {
    if (cache && Date.now() - cache.fetchedAt < CACHE_TTL_MS) {
      return cache.weights;
    }

    const stored = await prisma.setting.findUnique({ where: { key: 'leadScore' } });
    if (!stored) {
      cache = { weights: DEFAULT_WEIGHTS, fetchedAt: Date.now() };
      return DEFAULT_WEIGHTS;
    }

    const value = stored.value as Partial<ScoreWeights>;
    const weights: ScoreWeights = {
      semSite: value.semSite ?? DEFAULT_WEIGHTS.semSite,
      temTelefone: value.temTelefone ?? DEFAULT_WEIGHTS.temTelefone,
      avaliacoesMais20: value.avaliacoesMais20 ?? DEFAULT_WEIGHTS.avaliacoesMais20,
      notaQuatroCinco: value.notaQuatroCinco ?? DEFAULT_WEIGHTS.notaQuatroCinco,
      avaliacoesMais50: value.avaliacoesMais50 ?? DEFAULT_WEIGHTS.avaliacoesMais50,
      enderecoCompleto: value.enderecoCompleto ?? DEFAULT_WEIGHTS.enderecoCompleto,
      max: value.max ?? DEFAULT_WEIGHTS.max,
    };
    cache = { weights, fetchedAt: Date.now() };
    return weights;
  }

  async setWeights(weights: ScoreWeights): Promise<ScoreWeights> {
    const merged: ScoreWeights = { ...DEFAULT_WEIGHTS, ...weights };
    await prisma.setting.upsert({
      where: { key: 'leadScore' },
      create: { key: 'leadScore', value: merged as unknown as object },
      update: { value: merged as unknown as object },
    });
    cache = null;
    return merged;
  }

  private async compute(input: ScoreInput, weights: ScoreWeights): Promise<number> {
    let score = 0;

    if (!input.site) score += weights.semSite;
    if (input.telefone) score += weights.temTelefone;
    if ((input.quantidadeAvaliacoes ?? 0) > 20) score += weights.avaliacoesMais20;
    if ((input.nota ?? 0) >= 4.5) score += weights.notaQuatroCinco;
    if ((input.quantidadeAvaliacoes ?? 0) > 50) score += weights.avaliacoesMais50;
    if (input.endereco && input.cidade && input.cep) score += weights.enderecoCompleto;

    return Math.min(Math.max(score, 0), weights.max);
  }

  async score(input: ScoreInput): Promise<number> {
    const weights = await this.getWeights();
    return this.compute(input, weights);
  }

  private async computeAll(inputs: ScoreInput[], weights: ScoreWeights): Promise<number[]> {
    return Promise.all(inputs.map((input) => this.compute(input, weights)));
  }

  async scoreMany(inputs: ScoreInput[]): Promise<number[]> {
    const weights = await this.getWeights();
    return this.computeAll(inputs, weights);
  }
}

export function scoreLabel(score: number): string {
  if (score >= 85) return 'Lead quente';
  if (score >= 70) return 'Bom lead';
  if (score >= 50) return 'Lead médio';
  return 'Lead frio';
}

export function scoreColor(score: number): string {
  if (score >= 85) return 'text-amber-500';
  if (score >= 70) return 'text-emerald-500';
  if (score >= 50) return 'text-blue-500';
  return 'text-slate-400';
}

export const leadScoreService = new LeadScoreService();