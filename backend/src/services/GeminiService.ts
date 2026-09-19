import { env } from '../config/env';
import { AppError } from '../utils/apiError';
import { SYSTEM_INSTRUCTION } from './SitePrompt';

export function requireGemini() {
  if (!env.GEMINI_API_KEY || !env.GEMINI_MODEL) throw new AppError(400, 'Configure GEMINI_API_KEY e GEMINI_MODEL no .env do backend para usar a integração com Gemini.');
}
function geminiErrorMessage(status: number, detail: string) {
  if (status === 429) {
    const retry = detail.match(/retry in ([\d.]+)\s*s/i)?.[1];
    const limit = detail.match(/limit:\s*(\d+)/i)?.[1];
    const seconds = retry ? `${Math.ceil(Number(retry))}s` : 'cerca de 1 minuto';
    return `Limite de uso do Gemini atingido: cota gratuita${limit ? ` de ${limit} requisições por minuto` : ''} no modelo ${env.GEMINI_MODEL}. Tente novamente em ${seconds}.`;
  }
  if (status === 503) return 'O Gemini está sobrecarregado no momento. Tente novamente em instantes.';
  if (status === 401 || status === 403) return 'A chave do Gemini foi recusada. Verifique GEMINI_API_KEY no backend.';
  if (status === 404) return 'O modelo do Gemini configurado não foi encontrado. Verifique GEMINI_MODEL no backend.';
  if (status === 400) return 'O Gemini recusou a configuração da solicitação. Verifique GEMINI_MODEL e GEMINI_THINKING_LEVEL no backend.';
  return 'O Gemini não conseguiu processar a solicitação. Tente novamente.';
}
export async function generateJson(prompt: string, schema: object, systemInstruction = SYSTEM_INSTRUCTION): Promise<unknown> {
  requireGemini();
  const request = {
    method: 'POST', signal: AbortSignal.timeout(110000),
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': env.GEMINI_API_KEY },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemInstruction }] },
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: 'application/json', responseJsonSchema: schema, thinkingConfig: { thinkingLevel: env.GEMINI_THINKING_LEVEL } },
    }),
  };
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(env.GEMINI_MODEL)}:generateContent`;
  let response: Response | undefined;
  for (let attempt = 0; attempt < 3; attempt++) {
    if (attempt) await new Promise(resolve => setTimeout(resolve, attempt * 2000));
    try { response = await fetch(url, request); }
    catch { if (attempt === 2) throw new AppError(502, 'Não foi possível conectar ao Gemini. Tente novamente.'); continue; }
    if (response.status !== 503) break;
  }
  if (!response) throw new AppError(502, 'Não foi possível conectar ao Gemini. Tente novamente.');
  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    console.error('[Gemini]', response.status, detail.slice(0, 500));
    throw new AppError(502, geminiErrorMessage(response.status, detail));
  }
  try {
    const data = await response.json() as { candidates?: { finishReason?: string; content?: { parts?: { text?: string }[] } }[] };
    const candidate = data.candidates?.[0];
    if (candidate?.finishReason !== 'STOP') throw new Error();
    return JSON.parse(candidate.content?.parts?.map(p => p.text ?? '').join('') ?? '');
  } catch { throw new AppError(502, 'O Gemini retornou conteúdo incompleto ou inválido. Tente novamente.'); }
}

const str = { type: 'string' };
const seoProps = { title: str, description: str, keywords: str };

export const siteCreateGenerationSchema = {
  type: 'object',
  required: ['seo', 'files'],
  properties: {
    seo: { type: 'object', required: ['title', 'description', 'keywords'], properties: seoProps },
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