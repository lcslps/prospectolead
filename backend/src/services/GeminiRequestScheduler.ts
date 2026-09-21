import { env } from '../config/env';

type Task<T> = { run: () => Promise<T>; resolve: (value: T) => void; reject: (reason: unknown) => void };

/** One gateway for every outbound Gemini request. It prevents unrelated features from bypassing quota control. */
class GeminiRequestScheduler {
  private waiting: Task<unknown>[] = [];
  private active = 0;
  private cooldownUntil = 0;

  async run<T>(task: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      this.waiting.push({ run: task, resolve: resolve as (value: unknown) => void, reject });
      void this.pump();
    });
  }

  cooldown(waitMs: number): void {
    this.cooldownUntil = Math.max(this.cooldownUntil, Date.now() + Math.max(0, waitMs));
  }

  private async pump(): Promise<void> {
    if (this.active >= env.MAX_CONCURRENT_GENERATIONS || !this.waiting.length) return;
    const delay = this.cooldownUntil - Date.now();
    if (delay > 0) { setTimeout(() => void this.pump(), delay); return; }
    const next = this.waiting.shift()!;
    this.active += 1;
    try { next.resolve(await next.run()); } catch (error) { next.reject(error); }
    finally { this.active -= 1; void this.pump(); }
  }
}

export const geminiRequestScheduler = new GeminiRequestScheduler();
