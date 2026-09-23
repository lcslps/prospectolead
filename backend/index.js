import 'dotenv/config';
import express from 'express';
import cors from 'cors';

const app = express();
const PORT = Number(process.env.PORT || 3001);
const ACCOUNT_ID = (process.env.CLOUDFLARE_ACCOUNT_ID || '').trim();
const API_TOKEN = (process.env.CLOUDFLARE_API_TOKEN || '').trim();

const ALLOWED_MODELS = new Set([
  '@cf/black-forest-labs/flux-2-klein-4b',
  '@cf/black-forest-labs/flux-2-klein-9b',
  '@cf/black-forest-labs/flux-2-dev',
]);

app.use(cors());
app.use(express.json({ limit: '2mb' }));

function detectMime(base64) {
  try {
    const b = Buffer.from(base64.slice(0, 64), 'base64');
    if (b.length >= 8 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return 'image/png';
    if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'image/jpeg';
    if (b.length >= 12 && b.toString('ascii', 0, 4) === 'RIFF' && b.toString('ascii', 8, 12) === 'WEBP') return 'image/webp';
  } catch {
    // ignore, fall back to png below
  }
  return 'image/png';
}

function cleanSize(value, fallback) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(256, Math.min(1920, Math.round(n / 16) * 16));
}

function cloudflareError(data, status) {
  const errors = Array.isArray(data?.errors) ? data.errors : [];
  const messages = Array.isArray(data?.messages) ? data.messages : [];
  const detail = [
    ...errors.map((x) => x?.message || JSON.stringify(x)),
    ...messages.map((x) => x?.message || JSON.stringify(x)),
  ]
    .filter(Boolean)
    .join(' | ');
  return detail || data?.error || `Cloudflare Workers AI retornou HTTP ${status}`;
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'gemini-cloudflare-site-generator' });
});

app.get('/api/cloudflare/status', (_req, res) => {
  res.json({
    ok: true,
    configured: Boolean(ACCOUNT_ID && API_TOKEN),
    defaultModel: '@cf/black-forest-labs/flux-2-klein-4b',
  });
});

app.post('/api/image', async (req, res) => {
  try {
    if (!ACCOUNT_ID || !API_TOKEN) {
      return res.status(500).json({
        error: 'Cloudflare não configurado. Preencha CLOUDFLARE_ACCOUNT_ID e CLOUDFLARE_API_TOKEN no arquivo .env e reinicie o backend.',
      });
    }

    const prompt = String(req.body?.prompt || '').trim();
    const model = String(req.body?.model || '@cf/black-forest-labs/flux-2-klein-4b').trim();
    const width = cleanSize(req.body?.width, 1024);
    const height = cleanSize(req.body?.height, 1024);

    if (!prompt) return res.status(400).json({ error: 'Prompt da imagem está vazio.' });
    if (!ALLOWED_MODELS.has(model)) {
      return res.status(400).json({ error: `Modelo Cloudflare não permitido: ${model}` });
    }

    const form = new FormData();
    form.append('prompt', prompt);
    form.append('width', String(width));
    form.append('height', String(height));

    const url = `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/ai/run/${model}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${API_TOKEN}` },
      body: form,
    });

    const raw = await response.text();
    let data = {};
    try {
      data = JSON.parse(raw);
    } catch {
      // response wasn't JSON, handled by the check below
    }

    if (!response.ok || data?.success === false) {
      return res.status(response.status || 502).json({
        error: cloudflareError(data, response.status),
        status: response.status,
      });
    }

    const image = data?.result?.image || data?.image;
    if (!image || typeof image !== 'string') {
      return res.status(502).json({
        error: 'O Cloudflare respondeu sem o campo result.image.',
        preview: raw.slice(0, 500),
      });
    }

    const mime = detectMime(image);
    return res.json({
      ok: true,
      model,
      width,
      height,
      mime,
      dataUrl: `data:${mime};base64,${image}`,
    });
  } catch (error) {
    return res.status(500).json({ error: error?.message || String(error) });
  }
});

app.listen(PORT, () => {
  console.log('');
  console.log('Backend Gemini + Cloudflare iniciado.');
  console.log(`API disponível em: http://localhost:${PORT}`);
  console.log(`Cloudflare configurado: ${Boolean(ACCOUNT_ID && API_TOKEN) ? 'SIM' : 'NÃO'}`);
  console.log('Lembre-se de rodar o frontend React (npm run dev) em outra aba do terminal.');
  console.log('');
});
