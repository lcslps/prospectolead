import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { BR_STATES, fetchCitiesByState } from './lib/geo.js';
import { NICHES, nicheByValue } from './lib/niches.js';
import { searchPlacesText, mapPlaceToLead, scoreLead } from './lib/places.js';
import {
  SITES_DIR,
  listLeads,
  listSites,
  getLead,
  upsertLeadsFromSearch,
  createManualLead,
  updateLead,
  deleteLead,
  deleteLeadSite,
  duplicateLeadSite,
  stageCounts,
  getUsage,
  incrementUsage,
} from './lib/store.js';

const app = express();
const PORT = Number(process.env.PORT || 3001);
const ACCOUNT_ID = (process.env.CLOUDFLARE_ACCOUNT_ID || '').trim();
const API_TOKEN = (process.env.CLOUDFLARE_API_TOKEN || '').trim();
const GEMINI_API_KEY = (process.env.GEMINI_API_KEY || '').trim();
const GOOGLE_MAPS_API_KEY = (process.env.GOOGLE_MAPS_API_KEY || '').trim();
const MONTHLY_LEAD_LIMIT = Number(process.env.MONTHLY_LEAD_LIMIT || 40);

const ALLOWED_MODELS = new Set([
  '@cf/black-forest-labs/flux-2-klein-4b',
  '@cf/black-forest-labs/flux-2-klein-9b',
  '@cf/black-forest-labs/flux-2-dev',
]);

const ALLOWED_TEXT_MODELS = new Set([
  'gemini-3.1-pro-preview',
  'gemini-3.8-flash',
  'gemini-3.5-flash-lite',
]);

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use('/sites', express.static(SITES_DIR));

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

const IMAGE_WITHOUT_TEXT_RULES =
  ' CRITICAL IMAGE RULE: create a photograph only, with absolutely no readable or decorative text anywhere in the pixels. ' +
  'Do not generate letters, words, numbers, logos, monograms, signatures, labels, signage, storefront signs, billboards, watermarks, UI, posters, typography, or brand marks. ' +
  'Keep walls, sky, windows, facades, screens, products, clothing and all background surfaces blank and free of writing. ' +
  'The website will render all copy and branding in HTML over the photograph.';

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
    geminiConfigured: Boolean(GEMINI_API_KEY),
    googleMapsConfigured: Boolean(GOOGLE_MAPS_API_KEY),
  });
});

/* ---------------------------------------------------------------------- */
/* Geo (país/estado/cidade) e catálogo de nichos                          */
/* ---------------------------------------------------------------------- */

app.get('/api/geo/countries', (_req, res) => {
  res.json({ ok: true, countries: [{ code: 'BR', name: 'Brasil' }] });
});

app.get('/api/geo/states', (_req, res) => {
  res.json({ ok: true, states: BR_STATES });
});

app.get('/api/geo/cities', async (req, res) => {
  try {
    const uf = String(req.query?.uf || '').trim();
    if (!uf) return res.status(400).json({ error: 'Informe o parâmetro uf.' });
    const cities = await fetchCitiesByState(uf);
    res.json({ ok: true, cities });
  } catch (error) {
    res.status(502).json({ error: error?.message || 'Falha ao buscar cidades.' });
  }
});

app.get('/api/niches', (_req, res) => {
  res.json({ ok: true, niches: NICHES });
});

app.get('/api/leads/usage', (_req, res) => {
  const usage = getUsage();
  res.json({ ok: true, used: usage.used, limit: MONTHLY_LEAD_LIMIT, month: usage.month });
});

/* ---------------------------------------------------------------------- */
/* Busca de leads (Google Places API - New)                               */
/* ---------------------------------------------------------------------- */

app.post('/api/leads/search', async (req, res) => {
  try {
    if (!GOOGLE_MAPS_API_KEY) {
      return res.status(500).json({
        error: 'Google Maps não configurado. Preencha GOOGLE_MAPS_API_KEY no .env do backend e reinicie.',
      });
    }

    const state = String(req.body?.state || '').trim();
    const city = String(req.body?.city || '').trim();
    const nicheValue = String(req.body?.niche || '').trim();
    const limit = Math.max(1, Math.min(60, Number(req.body?.limit) || 20));

    const niche = nicheByValue(nicheValue) ||
      // Nicho digitado fora do catálogo: usa o próprio texto como keyword/label.
      (nicheValue ? { value: nicheValue, label: nicheValue, keyword: nicheValue } : null);
    if (!niche) return res.status(400).json({ error: 'Nicho inválido.' });

    // Cidade e estado são opcionais: sem eles, a busca abrange o Brasil todo.
    const location = city && state ? `${city}, ${state}` : city || state || '';

    // LIMITE MENSAL DESATIVADO — para reativar, descomente o bloco abaixo.
    // const usage = getUsage();
    // if (usage.used >= MONTHLY_LEAD_LIMIT) {
    //   return res.status(429).json({ error: `Limite mensal de ${MONTHLY_LEAD_LIMIT} leads atingido.` });
    // }
    // const allowedThisSearch = Math.min(limit, MONTHLY_LEAD_LIMIT - usage.used);
    const allowedThisSearch = limit;

    const query = location ? `${niche.keyword} em ${location}, Brasil` : `${niche.keyword} no Brasil`;
    const places = await searchPlacesText({ apiKey: GOOGLE_MAPS_API_KEY, query, limit: allowedThisSearch });

    const results = places.map((p) => {
      const lead = mapPlaceToLead(p, { niche: niche.label, city, state });
      const { score, tier } = scoreLead(lead);
      return { ...lead, score, tier };
    });

    const updatedUsage = incrementUsage(results.length);

    res.json({
      ok: true,
      results,
      usage: { used: updatedUsage.used, limit: MONTHLY_LEAD_LIMIT, month: updatedUsage.month },
    });
  } catch (error) {
    res.status(502).json({ error: error?.message || 'Falha ao buscar leads.' });
  }
});

/* ---------------------------------------------------------------------- */
/* CRM                                                                    */
/* ---------------------------------------------------------------------- */

app.post('/api/crm/leads', (req, res) => {
  const body = req.body || {};
  if (Array.isArray(body.leads)) {
    const saved = upsertLeadsFromSearch(body.leads);
    return res.json({ ok: true, leads: saved });
  }
  // criação manual de um único lead ("+ Criar lead")
  const lead = createManualLead(body);
  res.json({ ok: true, lead });
});

app.get('/api/crm/leads', (req, res) => {
  const { q, stage, tier, hasSite, hasPhone, minScore } = req.query;
  const leads = listLeads({ q, stage, tier, hasSite, hasPhone, minScore });
  res.json({ ok: true, leads, counts: stageCounts() });
});

app.get('/api/crm/leads/:id', (req, res) => {
  const lead = getLead(req.params.id);
  if (!lead) return res.status(404).json({ error: 'Lead não encontrado.' });
  res.json({ ok: true, lead });
});

app.patch('/api/crm/leads/:id', (req, res) => {
  const allowed = ['stage', 'status', 'notes', 'name', 'niche', 'city', 'state', 'phone', 'email', 'address'];
  const patch = {};
  for (const key of allowed) {
    if (req.body?.[key] !== undefined) patch[key] = req.body[key];
  }
  const lead = updateLead(req.params.id, patch);
  if (!lead) return res.status(404).json({ error: 'Lead não encontrado.' });
  res.json({ ok: true, lead });
});

app.delete('/api/crm/leads/:id', (req, res) => {
  const removed = deleteLead(req.params.id);
  if (!removed) return res.status(404).json({ error: 'Lead não encontrado.' });
  res.json({ ok: true });
});

// Lista os sites já gerados (leads com siteUrl), ordenados do mais recente
app.get('/api/sites', (_req, res) => {
  const sites = listSites();
  res.json({ ok: true, sites, total: sites.length });
});

app.post('/api/crm/leads/:id/site', (req, res) => {
  const lead = getLead(req.params.id);
  if (!lead) return res.status(404).json({ error: 'Lead não encontrado.' });

  const html = String(req.body?.html || '');
  if (!html.trim()) return res.status(400).json({ error: 'HTML vazio.' });

  const filePath = path.join(SITES_DIR, `${lead.id}.html`);
  fs.writeFileSync(filePath, html, 'utf-8');

  const siteUrl = `/sites/${lead.id}.html`;
  const updated = updateLead(lead.id, { siteUrl, siteGeneratedAt: new Date().toISOString() });
  res.json({ ok: true, lead: updated, siteUrl });
});

// Remove apenas o site gerado, mantendo o lead no CRM
app.delete('/api/crm/leads/:id/site', (req, res) => {
  const lead = getLead(req.params.id);
  if (!lead) return res.status(404).json({ error: 'Lead não encontrado.' });
  const updated = deleteLeadSite(lead.id);
  res.json({ ok: true, lead: updated });
});

// Duplica o projeto: copia o lead + o HTML gerado para um novo id
app.post('/api/crm/leads/:id/duplicate', (req, res) => {
  const lead = getLead(req.params.id);
  if (!lead) return res.status(404).json({ error: 'Lead não encontrado.' });
  if (!lead.siteUrl) return res.status(400).json({ error: 'Este lead não tem site gerado.' });
  const copy = duplicateLeadSite(lead.id);
  res.json({ ok: true, lead: copy });
});

app.post('/api/generate-text', async (req, res) => {
  try {
    if (!GEMINI_API_KEY) {
      return res.status(500).json({
        error: 'Gemini não configurado. Preencha GEMINI_API_KEY no arquivo .env do backend e reinicie.',
      });
    }

    const model = String(req.body?.model || 'gemini-3.8-flash').trim();
    const systemInstruction = String(req.body?.systemInstruction || '').trim();
    const userPrompt = String(req.body?.userPrompt || '').trim();

    if (!ALLOWED_TEXT_MODELS.has(model)) {
      return res.status(400).json({ error: `Modelo de texto não permitido: ${model}` });
    }
    if (!userPrompt) return res.status(400).json({ error: 'Prompt do texto está vazio.' });

    const thinkingLevel = model.includes('flash-lite') ? 'minimal' : 'low';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { role: 'system', parts: [{ text: systemInstruction }] },
        contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
        generationConfig: { maxOutputTokens: 24576, thinkingConfig: { thinkingLevel } },
      }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      return res.status(response.status || 502).json({
        error: data?.error?.message || 'Falha ao chamar o modelo de texto',
        status: response.status,
      });
    }
    if (data?.candidates?.[0]?.finishReason === 'MAX_TOKENS') {
      return res.status(502).json({
        error: 'A resposta do modelo foi cortada antes de concluir o site. Gere novamente para receber o HTML completo.',
      });
    }
    const parts = data?.candidates?.[0]?.content?.parts || [];
    const text = parts.map((p) => p.text || '').join('');
    if (!text) {
      return res.status(502).json({ error: 'O modelo não retornou texto.' });
    }
    return res.json({ ok: true, model, text, finishReason: data?.candidates?.[0]?.finishReason, usageMetadata: data?.usageMetadata });
  } catch (error) {
    return res.status(500).json({ error: error?.message || String(error) });
  }
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
    // Centralized so every Cloudflare generation receives the rule, even when
    // a model-generated image brief accidentally asks for a branded scene.
    form.append('prompt', prompt + IMAGE_WITHOUT_TEXT_RULES);
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
  console.log(`Gemini configurado: ${Boolean(GEMINI_API_KEY) ? 'SIM' : 'NÃO'}`);
  console.log(`Google Maps configurado: ${Boolean(GOOGLE_MAPS_API_KEY) ? 'SIM' : 'NÃO'}`);
  console.log('Lembre-se de rodar o frontend React (npm run dev) em outra aba do terminal.');
  console.log('');
});
