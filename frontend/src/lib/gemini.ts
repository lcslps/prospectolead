export const TEXT_FALLBACKS = ['gemini-3.1-pro-preview', 'gemini-3.8-flash', 'gemini-3.5-flash-lite'];

export async function callGeminiText(
  apiKey: string,
  model: string,
  systemInstruction: string,
  userPrompt: string
): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const body = {
    systemInstruction: { role: 'system', parts: [{ text: systemInstruction }] },
    contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
    generationConfig: { maxOutputTokens: 8192 },
  };
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error?.message || 'Falha ao chamar o modelo de texto');
  }
  const parts = data?.candidates?.[0]?.content?.parts || [];
  const text = parts.map((p: { text?: string }) => p.text || '').join('');
  if (!text) {
    throw new Error('O modelo não retornou texto. Resposta: ' + JSON.stringify(data).slice(0, 300));
  }
  return text;
}

export async function callGeminiTextWithFallback(
  apiKey: string,
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
      const text = await callGeminiText(apiKey, model, systemInstruction, userPrompt);
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
