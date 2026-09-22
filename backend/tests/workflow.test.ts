import assert from 'node:assert/strict';
import { test } from 'node:test';
import { randomUUID } from 'node:crypto';
import { createApp } from '../src/app';
import { env } from '../src/config/env';
import { prisma } from '../src/lib/prisma';
import { googlePlacesService } from '../src/services/GooglePlacesService';
import { prospectService } from '../src/services/ProspectService';
import { storedSiteSchema } from '../src/services/siteArtefactSchema';

const SAMPLE_SITE = {
  seo: { title: 'Espetaria de teste', description: 'DescriÃƒÂ§ÃƒÂ£o de teste.', keywords: 'espetaria, teste' },
  imageIntents: [],
  files: {
    'index.html': '<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Espetaria de teste</title></head><body><header><nav aria-label="Principal"><a href="#hero">Inicio</a><a href="#sobre">Sobre</a><a href="#contato">Contato</a></nav></header><main><section id="hero" class="hero"><div><p class="eyebrow">Teste local</p><h1>Sabores preparados para bons encontros</h1><p>Uma experiencia acolhedora para conhecer em nossa cidade.</p><a class="button" href="#contato">Falar conosco</a></div><img src="https://images.example.test/hero.jpg" alt="Prato da espetaria" loading="lazy"></section><section id="sobre"><h2>Uma experiencia pensada nos detalhes</h2><p>Informacoes claras, atendimento direto e um convite para visitar.</p></section><section id="contato"><h2>Entre em contato</h2><p>Escolha o melhor canal para conversar.</p></section></main><footer><p>Espetaria de teste</p></footer><script src="script.js" defer></script></body></html>',
    'styles.css': ':root{--background:#fffaf5;--surface:#ffffff;--text:#172033;--muted:#536070;--primary:#9b3b24}*{box-sizing:border-box}body{margin:0;background:var(--background);color:var(--text);font-family:system-ui,sans-serif;line-height:1.6}a{color:inherit}.hero{display:grid;grid-template-columns:1.1fr .9fr;gap:clamp(2rem,6vw,6rem);align-items:center;max-width:72rem;margin:0 auto;padding:clamp(4rem,10vw,9rem) 1.5rem}section:not(.hero){max-width:72rem;margin:0 auto;padding:clamp(3rem,7vw,6rem) 1.5rem}.hero img{width:100%;aspect-ratio:4/5;object-fit:cover;border-radius:1rem}.eyebrow{text-transform:uppercase;letter-spacing:.12em;font-size:.75rem;color:var(--primary)}h1{font-size:clamp(2.5rem,6vw,5.5rem);line-height:1.02;margin:.5rem 0 1rem}h2{font-size:clamp(1.7rem,4vw,3rem);line-height:1.1}.button{display:inline-block;background:var(--primary);color:#fff;padding:.8rem 1.2rem;border-radius:.5rem;text-decoration:none}a:focus-visible{outline:3px solid #172033;outline-offset:3px}@media (max-width:700px){.hero{grid-template-columns:1fr;padding-block:3rem}nav{display:flex;gap:.75rem;flex-wrap:wrap}}@media (prefers-reduced-motion:reduce){*{scroll-behavior:auto;transition:none!important}}footer{padding:2rem 1.5rem;background:var(--text);color:#fff}',
    'script.js': 'console.log("ok");',
  },
};

test('ProspecÃƒÂ§ÃƒÂ£o Ã¢â€ â€™ CRM Ã¢â€ â€™ Gemini cria cÃƒÂ³digo do site Ã¢â€ â€™ ediÃƒÂ§ÃƒÂ£o, versÃƒÂµes, publicaÃƒÂ§ÃƒÂ£o', async t => {
  const marker = `workflow-test-${randomUUID()}`;
  const originalFetch = globalThis.fetch;
  const originalSearch = googlePlacesService.searchText;
  const originalNodeEnv = env.NODE_ENV;
  const originalKey = env.GEMINI_API_KEY, originalModel = env.GEMINI_MODEL, originalLevel = env.GEMINI_THINKING_LEVEL;
  const campaigns: string[] = [];
  const server = createApp().listen(0, '127.0.0.1');
  await new Promise<void>(resolve => server.once('listening', resolve));
  const port = (server.address() as { port: number }).port;
  const request = async (path: string, body?: unknown, method?: string) => {
    const init: RequestInit = { method: body === undefined && method === undefined ? 'GET' : method ?? 'POST' };
    if (body !== undefined) { init.headers = { 'Content-Type': 'application/json' }; init.body = JSON.stringify(body); }
    const response = await originalFetch(`http://127.0.0.1:${port}/api${path}`, init);
    return { status: response.status, body: await response.json() as any };
  };
  const waitForGeneration = async (siteId: string) => {
    for (let attempt = 0; attempt < 40; attempt += 1) {
      const current = await request(`/websites/${siteId}`);
      if (current.body.data.generationStatus === 'completed' || current.body.data.generationStatus === 'failed') return current.body.data;
      await new Promise(resolve => setTimeout(resolve, 25));
    }
    throw new Error('A geração assíncrona não foi concluída durante o teste.');
  };
  const baseline = (await request('/dashboard')).body.data;
  let crmIds: string[] = []; let site: any; let artefact1: string;
  try {
    env.NODE_ENV = 'test';
    await t.test('40 resultados nÃƒÂ£o alteram mÃƒÂ©tricas; 5 inclusÃƒÂµes entram em Novo', async () => {
      googlePlacesService.searchText = async ({ pageToken }) => {
        const offset = pageToken ? 20 : 0;
        return { places: Array.from({ length: 20 }, (_, i) => ({ id: `${marker}-${offset + i}`, displayName: { text: `Empresa de teste ${offset + i}` }, types: ['restaurant'], formattedAddress: 'EndereÃƒÂ§o de teste', rating: 4.6, userRatingCount: 23 })), nextPageToken: pageToken ? null : 'page2' };
      };
      const result = await prospectService.run({ nicho: marker, cidade: 'Teste', estado: 'MT', quantidade: 40 }); campaigns.push(result.campaignId);
      assert.equal(result.salvos, 40);
      const leads = await prisma.lead.findMany({ where: { googlePlaceId: { startsWith: marker } }, take: 5 });
      for (const lead of leads) {
        const added = await request('/crm/leads', { leadId: lead.id }); assert.equal(added.status, 201); crmIds.push(added.body.data.crmLead.id);
      }
      assert.equal((await request('/dashboard')).body.data.stats.totalLeads, baseline.stats.totalLeads + 5);
    });
    await t.test('Chave ausente retorna erro amigÃƒÂ¡vel sem criar site', async () => {
      env.GEMINI_API_KEY = ''; env.GEMINI_MODEL = '';
      const response = await request('/websites/generate', { crmLeadId: crmIds[0] });
      assert.equal(response.status, 400); assert.match(response.body.message, /GEMINI_API_KEY/);
      assert.equal((await request(`/websites/lead/${crmIds[0]}`)).body.data, null);
    });
    await t.test('Gemini cria cÃƒÂ³digo de site completo e move Novo Ã¢â€ â€™ Site gerado', async () => {
      env.GEMINI_API_KEY = 'test-only-never-transmitted'; env.GEMINI_MODEL = 'test-model'; env.GEMINI_THINKING_LEVEL = 'low';
      globalThis.fetch = async (input, init) => {
        if (String(input).startsWith('https://generativelanguage.googleapis.com/')) {
          assert.equal((init?.headers as Record<string, string>)['x-goog-api-key'], env.GEMINI_API_KEY);
          const payload = JSON.parse(String(init?.body)); assert.ok(payload.generationConfig.responseJsonSchema);
          assert.match(String(init?.body), /Do not invent/);
          return new Response(JSON.stringify({ candidates: [{ finishReason: 'STOP', content: { parts: [{ text: JSON.stringify(SAMPLE_SITE) }] } }] }), { status: 200 });
        }
        return originalFetch(input, init);
      };
      const result = await request('/websites/generate', { crmLeadId: crmIds[0] }); assert.equal(result.status, 200);
      site = await waitForGeneration(result.body.data.id); assert.equal(site.generationStatus, 'completed');
      assert.equal(site.currentDocument.schemaVersion, 2);
      assert.equal(site.legacy, undefined);
      const stored = storedSiteSchema.parse(site.currentDocument);
      assert.match(stored.artefact.files['index.html'], /<html lang="pt-BR"/);
      assert.match(stored.artefact.files['index.html'], /<title>Espetaria de teste<\/title>/);
      assert.match(stored.artefact.files['index.html'], /name="viewport"/);
      assert.equal(stored.artefact.seo.title, 'Espetaria de teste');
      artefact1 = stored.artefact.files['index.html'];
      assert.equal((await prisma.crmLead.findUniqueOrThrow({ where: { id: crmIds[0] } })).stage, 'SITE_GENERATED');
      assert.equal((await request('/websites/generate', { crmLeadId: crmIds[0] })).body.data.id, site.id);
      assert.equal((await request('/dashboard')).body.data.stats.sitesGerados, baseline.stats.sitesGerados + 1);
      assert.equal((await request(`/websites/public/${site.id}`)).status, 404);
    });
    await t.test('Pedir ÃƒÂ  IA altera apenas os arquivos retornados e cria nova versÃƒÂ£o', async () => {
      globalThis.fetch = async (input, init) => String(input).startsWith('https://generativelanguage.googleapis.com/')
        ? new Response(JSON.stringify({ candidates: [{ finishReason: 'STOP', content: { parts: [{ text: JSON.stringify({ files: { 'styles.css': ':root{--background:#fff;--text:#172033;--primary:#7c2d12}body{font-family:serif;background:var(--background);color:var(--text);min-height:100vh}main{max-width:72rem;margin:auto;padding:clamp(2rem,5vw,5rem)}.hero{display:grid;grid-template-columns:1fr 1fr;gap:2rem}.button{background:var(--primary);color:#fff;padding:.8rem 1rem;border-radius:.5rem}a:focus-visible{outline:3px solid var(--text)}@media (max-width:700px){.hero{grid-template-columns:1fr;padding:1.5rem}}@media (prefers-reduced-motion:reduce){*{transition:none!important;animation:none!important}}footer{padding:2rem;background:var(--text);color:#fff}' } }) }] } }] }), { status: 200 })
        : originalFetch(input, init);
      const result = await request(`/websites/${site.id}/rewrite`, { instruction: 'Deixe mais elegante' }); assert.equal(result.status, 200);
      site = result.body.data;
      const stored = storedSiteSchema.parse(site.currentDocument);
      assert.match(stored.artefact.files['styles.css'], /font-family:serif/);
      assert.match(stored.artefact.files['styles.css'], /@media/);
      assert.equal(stored.artefact.files['index.html'], artefact1);
      assert.equal(stored.meta.instruction, 'Deixe mais elegante');
      const versions = (await request(`/websites/${site.id}/versions`)).body.data;
      assert.equal(versions.length, 2);
      assert.equal(versions[0].isCurrent, true); assert.equal(versions[0].version, 2);
      assert.match(versions[0].source, /ai_edit/);
    });
    await t.test('VersÃƒÂµes: restaurar versÃƒÂ£o 1 volta o conteÃƒÂºdo original', async () => {
      const restored = await request(`/websites/${site.id}/restore`, { version: 1 }); assert.equal(restored.status, 200);
      const stored = storedSiteSchema.parse(restored.body.data.currentDocument);
      assert.equal(stored.artefact.files['index.html'], artefact1);
      assert.equal(stored.meta.source, 'restore');
      site = restored.body.data;
    });
    await t.test('PublicaÃƒÂ§ÃƒÂ£o vira snapshot pÃƒÂºblico; despublicar remove do ar', async () => {
      const published = await request(`/websites/${site.id}/publish`, undefined, 'POST'); assert.equal(published.status, 200);
      site = published.body.data; assert.equal(site.status, 'PUBLISHED'); assert.equal(site.publishedVersion, site.revision);
      const publicSite = (await request(`/websites/public/${site.id}`)).body.data;
      assert.equal(storedSiteSchema.parse(publicSite).artefact.files['index.html'], artefact1);
      await request(`/websites/${site.id}/rewrite`, { instruction: 'Mude o hero' });
      assert.equal(storedSiteSchema.parse((await request(`/websites/public/${site.id}`)).body.data).artefact.files['index.html'], artefact1);
      const unpublished = await request(`/websites/${site.id}/unpublish`, undefined, 'POST'); assert.equal(unpublished.status, 200);
      assert.equal(unpublished.body.data.status, 'DRAFT'); assert.equal((await request(`/websites/public/${site.id}`)).status, 404);
    });
    await t.test('Resposta incompleta marca falha sem publicar conteÃƒÂºdo', async () => {
      globalThis.fetch = async (input, init) => String(input).startsWith('https://generativelanguage.googleapis.com/') ? new Response(JSON.stringify({ candidates: [{ finishReason: 'MAX_TOKENS' }] })) : originalFetch(input, init);
      const queued = await request('/websites/generate', { crmLeadId: crmIds[1] }); assert.equal(queued.status, 200);
      const failed = await waitForGeneration(queued.body.data.id);
      assert.equal(failed.generationStatus, 'failed'); assert.equal((await request(`/websites/public/${failed.id}`)).status, 404);
    });
    await t.test('Alterar status nos detalhes mantÃƒÂ©m o CRM sincronizado', async () => {
      const crm = await prisma.crmLead.findUniqueOrThrow({ where: { id: crmIds[2] } });
      const changed = await request(`/leads/${crm.leadId}`, { status: 'RESPONDEU' }, 'PATCH');
      assert.equal(changed.status, 200);
      assert.equal((await prisma.crmLead.findUniqueOrThrow({ where: { id: crm.id } })).stage, 'REPLIED');
      assert.equal((await request('/dashboard')).body.data.stats.responderam, baseline.stats.responderam + 1);
    });
  } finally {
    globalThis.fetch = originalFetch; googlePlacesService.searchText = originalSearch; env.GEMINI_API_KEY = originalKey; env.GEMINI_MODEL = originalModel; env.GEMINI_THINKING_LEVEL = originalLevel; env.NODE_ENV = originalNodeEnv;
    await prisma.campaign.deleteMany({ where: { id: { in: campaigns } } });
    await prisma.lead.deleteMany({ where: { googlePlaceId: { startsWith: marker } } });
    await new Promise<void>(resolve => server.close(() => resolve())); await prisma.$disconnect();
  }
});
