export const TEXT_FALLBACKS = ['gemini-3.1-pro-preview', 'gemini-3.8-flash', 'gemini-3.5-flash-lite'];

function baseUrl(backendUrl: string): string {
  const base = backendUrl.trim().replace(/\/$/, '');
  if (!base) throw new Error('Backend não configurado. Informe a URL do backend.');
  return base;
}

export async function callGeminiText(
  backendUrl: string,
  model: string,
  systemInstruction: string,
  userPrompt: string
): Promise<string> {
  const res = await fetch(baseUrl(backendUrl) + '/api/generate-text', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, systemInstruction, userPrompt }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.error || 'Falha ao chamar o modelo de texto');
  }
  if (!data?.text) {
    throw new Error('O modelo não retornou texto.');
  }
  return data.text as string;
}

export async function callGeminiTextWithFallback(
  backendUrl: string,
  preferredModel: string,
  systemInstruction: string,
  userPrompt: string,
  onLog?: (msg: string, kind: 'ok' | 'go' | 'err' | 'muted') => void
): Promise<{ text: string; model: string }> {
  const models = [preferredModel, ...TEXT_FALLBACKS.filter((m) => m !== preferredModel)];
  let lastError: unknown;
  for (const model of models) {
    try {
      onLog?.(`▸ Tentando modelo de texto: ${model}...`, 'muted');
      const text = await callGeminiText(backendUrl, model, systemInstruction, userPrompt);
      if (model !== preferredModel) onLog?.(`✔ Fallback ativado: usando ${model}.`, 'ok');
      return { text, model };
    } catch (e) {
      lastError = e;
      const msg = String((e as Error)?.message || e);
      const retryable = /429|quota|rate|503|overload|unavailable|not available|404|not found|new users/i.test(msg);
      onLog?.(`✘ ${model} falhou: ${msg}`, 'err');
      if (!retryable) throw e;
    }
  }
  throw lastError instanceof Error ? lastError : new Error('Nenhum modelo de texto disponível.');
}
