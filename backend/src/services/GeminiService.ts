import { env } from '../config/env';
import { AppError } from '../utils/apiError';
import { REPAIR_SYSTEM_INSTRUCTION, SYSTEM_INSTRUCTION } from './SitePrompt';
import { geminiRequestScheduler } from './GeminiRequestScheduler';

export function requireGemini() {
  if (!env.GEMINI_API_KEY || !env.GEMINI_MODEL) throw new AppError(400, 'Configure GEMINI_API_KEY e GEMINI_MODEL no .env do backend para usar a integraÃ§Ã£o com Gemini.');
}
function geminiErrorMessage(status: number, detail: string) {
  if (status === 429) {
    const retry = detail.match(/retry in ([\d.]+)\s*s/i)?.[1];
    const limit = detail.match(/limit:\s*(\d+)/i)?.[1];
    const seconds = retry ? `${Math.ceil(Number(retry))}s` : 'cerca de 1 minuto';
    return `Limite de uso do Gemini atingido: cota gratuita${limit ? ` de ${limit} requisiÃ§Ãµes por minuto` : ''} no modelo ${env.GEMINI_MODEL}. Tente novamente em ${seconds}.`;
  }
  if (status === 503) return 'O Gemini estÃ¡ sobrecarregado no momento. Tente novamente em instantes.';
  if (status === 401 || status === 403) return 'A chave do Gemini foi recusada. Verifique GEMINI_API_KEY no backend.';
  if (status === 404) return 'O modelo do Gemini configurado nÃ£o foi encontrado. Verifique GEMINI_MODEL no backend.';
  if (status === 400) return 'O Gemini recusou a configuraÃ§Ã£o da solicitaÃ§Ã£o. Verifique GEMINI_MODEL e GEMINI_THINKING_LEVEL no backend.';
  return 'O Gemini nÃ£o conseguiu processar a solicitaÃ§Ã£o. Tente novamente.';
}
export interface GeminiVisionPart { mimeType: string; data: string }

export interface RetryEvent {
  attempt: number;
  status?: number;
  waitMs: number;
  reason: string;
}

export interface GenerateJsonOptions {
  model?: string;
  thinkingLevel?: 'low' | 'medium' | 'high';
  onRetry?: (event: RetryEvent) => void;
}

const RETRYABLE_STATUS = new Set([429, 500, 502, 503, 504]);

function backoffWait(attempt: number, retryAfterSeconds?: number): number {
  const base = Math.min(1500 * 2 ** (attempt - 1), 30000);
  const jitter = Math.floor(Math.random() * 500);
  if (retryAfterSeconds && retryAfterSeconds > 0) return Math.max(retryAfterSeconds * 1000, base);
  return base + jitter;
}

export async function generateJson(
  prompt: string,
  schema: object,
  systemInstruction = SYSTEM_INSTRUCTION,
  vision: GeminiVisionPart[] = [],
  options: GenerateJsonOptions = {},
): Promise<unknown> {
  requireGemini();
  const model = options.model || env.GEMINI_MODEL;
  const totalAttempts = Math.max(1, env.MAX_RETRIES + 1);
  const parts: Array<Record<string, unknown>> = [{ text: prompt }];
  for (const image of vision) {
    parts.push({ inlineData: { mimeType: image.mimeType, data: image.data } });
  }
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;
  let response: Response | undefined;
  for (let attempt = 1; attempt <= totalAttempts; attempt++) {
    const request = {
      method: 'POST',
      signal: AbortSignal.timeout(env.GEMINI_REQUEST_TIMEOUT_MS),
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': env.GEMINI_API_KEY },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemInstruction }] },
        contents: [{ role: 'user', parts }],
        generationConfig: { responseMimeType: 'application/json', responseJsonSchema: schema, thinkingConfig: { thinkingLevel: options.thinkingLevel ?? env.GEMINI_THINKING_LEVEL } },
      }),
    };
    try {
      response = await geminiRequestScheduler.run(() => fetch(url, request));
    } catch (error) {
      const reason = error instanceof Error ? `Falha de conexÃ£o ou timeout na API: ${error.message.slice(0, 180)}` : 'Falha de conexÃ£o ou timeout na API';
      if (attempt === totalAttempts) throw new AppError(502, 'NÃ£o foi possÃ­vel conectar ao Gemini. Tente novamente.');
      const waitMs = backoffWait(attempt);
      options.onRetry?.({ attempt, waitMs, reason });
      await sleep(waitMs);
      continue;
    }
    if (response.ok) break;
    const status = response.status;
    const detail = await response.text().catch(() => '');
    if (attempt === totalAttempts || !RETRYABLE_STATUS.has(status)) {
      const fallback = env.GEMINI_FALLBACK_MODEL.trim();
      if ((status === 429 || status === 503) && !options.model && fallback && fallback !== model) {
        console.warn('[Gemini] Modelo principal sobrecarregado; usando fallback configurado.', { model, fallback });
        return generateJson(prompt, schema, systemInstruction, vision, { ...options, model: fallback });
      }
      console.error('[Gemini]', status, detail.slice(0, 500));
      throw new AppError(502, geminiErrorMessage(status, detail));
    }
    const retryAfterSeconds = Number(response.headers.get('retry-after') ?? '') || undefined;
    const waitMs = backoffWait(attempt, retryAfterSeconds);
    if (status === 429 || status === 503) geminiRequestScheduler.cooldown(waitMs);
    options.onRetry?.({ attempt, status, waitMs, reason: `Resposta ${status} (${RETRY_LABELS[status] ?? 'erro temporÃ¡rio'})` });
    await sleep(waitMs);
  }
  if (!response) throw new AppError(502, 'NÃ£o foi possÃ­vel conectar ao Gemini. Tente novamente.');
  try {
    const data = await response.json() as { candidates?: { finishReason?: string; content?: { parts?: { text?: string }[] } }[] };
    const candidate = data.candidates?.[0];
    if (candidate?.finishReason !== 'STOP') throw new Error();
    return JSON.parse(candidate.content?.parts?.map(p => p.text ?? '').join('') ?? '');
  } catch { throw new AppError(502, 'O Gemini retornou conteÃºdo incompleto ou invÃ¡lido. Tente novamente.'); }
}

const RETRY_LABELS: Record<number, string> = {
  429: 'limite de requisiÃ§Ãµes', 500: 'erro interno', 502: 'erro temporÃ¡rio', 503: 'sobrecarregado', 504: 'timeout do gateway',
};

export async function generateAuxJson(
  prompt: string,
  schema: object,
  options: GenerateJsonOptions = {},
): Promise<unknown> {
  const model = (options.model || env.GEMINI_AUX_MODEL || env.GEMINI_MODEL).trim();
  return generateJson(prompt, schema, REPAIR_SYSTEM_INSTRUCTION, [], { ...options, model, thinkingLevel: options.thinkingLevel ?? 'low' });
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const str = { type: 'string' };
const seoProps = { title: str, description: str, keywords: str };

const designSystemProps = {
  palette: { type: 'object', properties: { primary: str, secondary: str, accent: str, background: str, surface: str, text: str, muted: str } },
  typography: { type: 'object', properties: { family: str, display: str, headings: str, body: str } },
  shape: { type: 'object', properties: { radius: str, shadow: str, border: str } },
  spacing: str,
  motion: { type: 'object', properties: { easing: str, duration: str, reveal: str } },
};

const designPlanProps = {
  businessInsight: str,
  targetAudience: str,
  creativeDirection: str,
  designSystem: { type: 'object', properties: designSystemProps },
  components: {
    type: 'array', maxItems: 24,
    items: { type: 'object', properties: { name: str, purpose: str, content: str, responsive: str } },
  },
  pageFlow: { type: 'array', maxItems: 30, items: str },
  primaryAction: str,
  whatsappStrategy: str,
  contentDecisions: str,
  variationNote: str,
};

const designPlanSchema = { type: 'object', properties: designPlanProps };

export const siteCreateGenerationSchema = {
  type: 'object',
  required: ['seo', 'files'],
  properties: {
    seo: { type: 'object', required: ['title', 'description', 'keywords'], properties: seoProps },
    designPlan: designPlanSchema,
    imageIntents: {
      type: 'array', maxItems: 12,
      items: { type: 'object', required: ['id', 'intent'], properties: { id: str, intent: str, usage: { type: 'string', enum: ['hero', 'about', 'gallery', 'decor', 'product'] } } },
    },
    files: {
      type: 'object',
      required: ['index.html', 'styles.css', 'script.js'],
      properties: { 'index.html': str, 'styles.css': str, 'script.js': str },
    },
  },
};

export const siteRepairGenerationSchema = {
  type: 'object',
  required: ['files'],
  properties: {
    files: {
      type: 'object',
      properties: { 'index.html': str, 'styles.css': str, 'script.js': str },
    },
  },
};

export const siteEditGenerationSchema = {
  type: 'object',
  required: ['files'],
  properties: {
    seo: { type: 'object', required: ['title', 'description', 'keywords'], properties: seoProps },
    files: {
      type: 'object',
      properties: { 'index.html': str, 'styles.css': str, 'script.js': str },
    },
  },
};
