export async function checkCloudflareStatus(
  backendUrl: string
): Promise<{ configured: boolean; defaultModel?: string }> {
  const base = backendUrl.trim().replace(/\/$/, '');
  if (!base) throw new Error('Informe a URL do backend Cloudflare.');
  const res = await fetch(base + '/api/cloudflare/status');
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || 'Backend indisponível.');
  if (!data.configured) {
    throw new Error(
      'Backend está rodando, mas CLOUDFLARE_ACCOUNT_ID ou CLOUDFLARE_API_TOKEN não foi configurado no .env.'
    );
  }
  return data;
}

export async function callCloudflareImage(
  backendUrl: string,
  model: string,
  prompt: string,
  width = 1024,
  height = 1024
): Promise<string> {
  const base = backendUrl.trim().replace(/\/$/, '');
  if (!base) throw new Error('Backend Cloudflare não configurado.');
  const res = await fetch(base + '/api/image', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, prompt, width, height }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.error || `Falha ao gerar imagem no Cloudflare (${res.status})`);
  }
  if (!data?.dataUrl) throw new Error('Cloudflare respondeu sem imagem.');
  return data.dataUrl as string;
}
