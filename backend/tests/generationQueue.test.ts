import assert from 'node:assert/strict';
import { test } from 'node:test';
import { AppError } from '../src/utils/apiError';
import { env } from '../src/config/env';
import { generationQueue, type GenerationJob } from '../src/services/GenerationQueue';
import { generateJson, generateAuxJson } from '../src/services/GeminiService';

function sleep(ms: number): Promise<void> { return new Promise(resolve => setTimeout(resolve, ms)); }

function makeJob(siteId: string, run: () => Promise<void>): GenerationJob {
  let resolveJob: (value: void) => void = () => {};
  const promise = new Promise<void>(resolve => { resolveJob = resolve; });
  return { siteId, crmLeadId: `lead-${siteId}`, kind: 'generate', state: 'pending', attempts: 0, queuedAt: Date.now(), run, resolve: resolveJob, promise };
}

test('fila limita a concorrência e agenda esperas em FIFO', async () => {
  env.MAX_CONCURRENT_GENERATIONS = 1;
  let active = 0;
  let maxActive = 0;
  const order: number[] = [];
  let resolveRelease: () => void = () => {};
  const release = new Promise<void>(resolve => { resolveRelease = resolve; });

  const jobs: GenerationJob[] = [];
  for (let i = 0; i < 4; i++) {
    const job = makeJob(`site-${i}`, async () => {
      active += 1;
      maxActive = Math.max(maxActive, active);
      order.push(i);
      if (i === 0) await release;
      else await sleep(10);
      active -= 1;
    });
    generationQueue.enqueue(job);
    jobs.push(job);
  }

  await sleep(30);
  assert.equal(active, 1, 'segura o 2º job atrás do 1º quando a concorrência é 1');
  assert.equal(generationQueue.snapshot().jobs.length, 4);
  assert.equal(generationQueue.snapshot().jobs.find(job => job.state === 'processing')?.siteId, 'site-0', 'o primeiro job entra em processamento');
  resolveRelease();
  await Promise.all(jobs.map(job => job.promise));
  assert.equal(maxActive, 1, 'nunca excede a concorrência máxima');
  assert.deepEqual(order, [0, 1, 2, 3], 'executa em ordem FIFO');
  assert.equal(generationQueue.snapshot().jobs.length, 0);
  env.MAX_CONCURRENT_GENERATIONS = 2;
});

test('generateJson tenta de novo em 503 e repassa o evento de retry', async () => {
  env.GEMINI_API_KEY = 'test-only-never-transmitted';
  env.GEMINI_MODEL = 'test-model';
  env.MAX_RETRIES = 2;
  env.GEMINI_THINKING_LEVEL = 'low';
  let calls = 0;
  const retries: string[] = [];
  globalThis.fetch = async () => {
    calls += 1;
    if (calls === 1) return new Response('overloaded', { status: 503 });
    return new Response(JSON.stringify({ candidates: [{ finishReason: 'STOP', content: { parts: [{ text: JSON.stringify({ ok: true }) }] } }] }), { status: 200 });
  };
  const result = await generateJson('teste', {}, 'instrução', [], {
    onRetry: (event) => retries.push(`${event.status}:${event.reason}`),
  });
  assert.deepEqual(result, { ok: true });
  assert.equal(calls, 2, 'tentou novamente após 503');
  assert.equal(retries.length, 1);
  assert.match(retries[0], /^503:/);
});

test('generateJson não tenta de novo em erro não temporário', async () => {
  env.GEMINI_API_KEY = 'test-only-never-transmitted';
  env.MAX_RETRIES = 3;
  let calls = 0;
  globalThis.fetch = async () => {
    calls += 1;
    return new Response('requisição inválida', { status: 400 });
  };
  await assert.rejects(generateJson('teste', {}), (error: unknown) => error instanceof AppError && error.statusCode === 502);
  assert.equal(calls, 1, 'não retenta em 400');
});

test('generateAuxJson usa o modelo auxiliar com raciocínio baixo', async () => {
  env.GEMINI_API_KEY = 'test-only-never-transmitted';
  env.GEMINI_AUX_MODEL = 'test-aux-model';
  env.MAX_RETRIES = 0;
  let url = '';
  globalThis.fetch = async (input) => {
    url = String(input);
    return new Response(JSON.stringify({ candidates: [{ finishReason: 'STOP', content: { parts: [{ text: JSON.stringify({ repaired: true }) }] } }] }), { status: 200 });
  };
  const result = await generateAuxJson('teste', {});
  assert.deepEqual(result, { repaired: true });
  assert.match(url, /models\/test-aux-model:generateContent/);
});