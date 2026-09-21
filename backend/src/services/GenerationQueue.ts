import { prisma } from '../lib/prisma';
import { env } from '../config/env';

export type GenerationKind = 'generate' | 'regenerate';
export type QueueJobState = 'pending' | 'processing' | 'retrying' | 'completed' | 'failed';

export interface GenerationJob {
  siteId: string;
  crmLeadId: string;
  kind: GenerationKind;
  state: QueueJobState;
  attempts: number;
  queuedAt: number;
  startedAt?: number;
  finishedAt?: number;
  error?: string;
  run: () => Promise<void>;
  resolve: (value: void) => void;
  promise: Promise<void>;
}

const CONNECT_ERROR_MS = 150000;

export interface QueueSnapshot {
  maxConcurrent: number;
  active: number;
  queueLength: number;
  jobs: Array<{
    siteId: string;
    kind: GenerationKind;
    state: QueueJobState;
    attempts: number;
    queuedAt: number;
  }>;
}

class GenerationQueue {
  private waiting: GenerationJob[] = [];
  private running: GenerationJob[] = [];

  get maxConcurrent(): number {
    return env.MAX_CONCURRENT_GENERATIONS;
  }

  enqueue(job: GenerationJob): void {
    this.waiting.push(job);
    void this.pump();
  }

  snapshot(): QueueSnapshot {
    return {
      maxConcurrent: this.maxConcurrent,
      active: this.running.length,
      queueLength: this.waiting.length + this.running.length,
      jobs: [...this.waiting, ...this.running].map(job => ({
        siteId: job.siteId,
        kind: job.kind,
        state: job.state,
        attempts: job.attempts,
        queuedAt: job.queuedAt,
      })),
    };
  }

  private async pump(): Promise<void> {
    while (this.running.length < this.maxConcurrent && this.waiting.length) {
      const job = this.waiting.shift()!;
      this.running.push(job);
      job.state = 'processing';
      job.attempts = 0;
      job.startedAt = Date.now();
      void this.execute(job).finally(() => {
        this.running = this.running.filter(item => item !== job);
        void this.pump();
      });
    }
  }

  private async execute(job: GenerationJob): Promise<void> {
    try {
      await job.run();
      job.state = 'completed';
    } catch (error) {
      job.state = 'failed';
      job.error = error instanceof Error ? error.message : 'Erro desconhecido na geração.';
      console.error('[GenerationQueue]', { siteId: job.siteId, state: job.state, error: job.error });
    } finally {
      job.finishedAt = Date.now();
      job.resolve();
    }
  }

  setRetrying(job: GenerationJob): void {
    if (job.state === 'processing') job.state = 'retrying';
    job.attempts += 1;
  }

  /** Retoma no boot as gerações que ficaram pendentes/ativas em um processo anterior. */
  async resumePending(): Promise<void> {
    if (env.NODE_ENV === 'test') return;
    try {
      const stale = await prisma.website.findMany({
        where: {
          generationStatus: { in: ['pending', 'generating'] },
        },
        select: { id: true, crmLeadId: true, updatedAt: true, generationStatus: true, generationNextAttemptAt: true },
      });
      for (const site of stale) {
        if (!site.crmLeadId) continue;
        const isStuck = site.updatedAt.getTime() < Date.now() - CONNECT_ERROR_MS;
        if (site.generationStatus === 'generating' && !isStuck) continue;
        const { websiteService } = await import('./WebsiteService');
        await prisma.website.update({ where: { id: site.id }, data: { generationStatus: 'pending', generationError: null } });
        // Não espera a chamada terminar: uma API externa lenta não pode bloquear a retomada dos demais pendentes.
        const waitMs = Math.max(0, (site.generationNextAttemptAt?.getTime() ?? 0) - Date.now());
        setTimeout(() => {
          void websiteService.enqueueGenerate(site.crmLeadId!, { baseUrl: undefined, resume: true, wait: false });
        }, waitMs);
      }
    } catch (error) {
      console.error('[GenerationQueue] Falha ao retomar gerações pendentes:', error);
    }
  }
}

export const generationQueue = new GenerationQueue();
