import assert from 'node:assert/strict';
import { test } from 'node:test';
import { randomUUID } from 'node:crypto';
import { createApp } from '../src/app';
import { env } from '../src/config/env';
import { prisma } from '../src/lib/prisma';
import { googlePlacesService } from '../src/services/GooglePlacesService';
import { prospectService } from '../src/services/ProspectService';

test('Prospecção → CRM → Gemini → editor → publicação', async t => {
  const marker = `workflow-test-${randomUUID()}`;
  const originalFetch = globalThis.fetch;
  const originalSearch = googlePlacesService.searchText;
  const originalKey = env.GEMINI_API_KEY, originalModel = env.GEMINI_MODEL, originalLevel = env.GEMINI_THINKING_LEVEL;
  const campaigns: string[] = [];
  const server = createApp().listen(0, '127.0.0.1');
  await new Promise<void>(resolve => server.once('listening', resolve));
  const port = (server.address() as { port: number }).port;
  const request = async (path: string, body?: unknown, method = 'POST') => {
    const response = await originalFetch(`http://127.0.0.1:${port}/api${path}`, body === undefined ? {} : { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    return { status: response.status, body: await response.json() as any };
  };
  const baseline = (await request('/dashboard')).body.data;
  let crmIds: string[] = []; let site: any; let document: any;
  try {
    await t.test('40 resultados não alteram métricas; 5 inclusões entram em Novo', async () => {
      googlePlacesService.searchText = async ({ pageToken }) => {
        const offset = pageToken ? 20 : 0;
        return { places: Array.from({ length: 20 }, (_, i) => ({ id: `${marker}-${offset + i}`, displayName: { text: `Empresa de teste ${offset + i}` }, types: ['restaurant'], formattedAddress: 'Endereço de teste', rating: 4.6, userRatingCount: 23 })), nextPageToken: pageToken ? null : 'page2' };
      };
      const result = await prospectService.run({ nicho: marker, cidade: 'Teste', estado: 'MT', quantidade: 40 }); campaigns.push(result.campaignId);
      assert.equal(result.salvos, 40);
      const filtered = await request(`/leads?campaignId=${result.campaignId}&pageSize=100`);
      assert.equal(filtered.body.data.total, 40);
      assert.equal((await request('/dashboard')).body.data.stats.totalLeads, baseline.stats.totalLeads);
      const leads = await prisma.lead.findMany({ where: { googlePlaceId: { startsWith: marker } }, take: 5 });
      for (const lead of leads) {
        const added = await request('/crm/leads', { leadId: lead.id }); assert.equal(added.status, 201); crmIds.push(added.body.data.crmLead.id);
        const again = await request('/crm/leads', { leadId: lead.id }); assert.equal(again.body.data.alreadyInCrm, true);
      }
      const after = (await request('/dashboard')).body.data;
      assert.equal(after.stats.totalLeads, baseline.stats.totalLeads + 5);
      assert.equal(after.stats.novos, baseline.stats.novos + 5);
      assert.equal(after.topNichos.find((n: any) => n.nicho === marker)?._count._all, 5);
      const repeat = await prospectService.run({ nicho: marker, cidade: 'Teste', estado: 'MT', quantidade: 40 }); campaigns.push(repeat.campaignId);
      assert.equal(repeat.novos, 0); assert.equal(repeat.salvos, 40);
    });
    await t.test('Chave ausente retorna erro amigável sem criar site', async () => {
      env.GEMINI_API_KEY = ''; env.GEMINI_MODEL = '';
      const response = await request('/websites/generate', { crmLeadId: crmIds[0] });
      assert.equal(response.status, 400); assert.match(response.body.message, /GEMINI_API_KEY/);
      assert.equal((await request(`/websites/lead/${crmIds[0]}`)).body.data, null);
    });
    await t.test('Gemini estruturado cria um único site e move Novo → Site gerado', async () => {
      env.GEMINI_API_KEY = 'test-only-never-transmitted'; env.GEMINI_MODEL = 'test-model'; env.GEMINI_THINKING_LEVEL = 'low';
      globalThis.fetch = async (input, init) => {
        if (String(input).startsWith('https://generativelanguage.googleapis.com/')) {
          assert.equal((init?.headers as Record<string, string>)['x-goog-api-key'], env.GEMINI_API_KEY);
          const payload = JSON.parse(String(init?.body)); assert.ok(payload.generationConfig.responseJsonSchema);
          return new Response(JSON.stringify({ candidates: [{ finishReason: 'STOP', content: { parts: [{ text: JSON.stringify({ theme: { primary: '#164e63', accent: '#06b6d4', background: '#ffffff', text: '#172033', font: 'sans', radius: 24 }, seo: { title: 'Espetaria de teste', description: 'Descrição de teste.', keywords: 'espetaria, teste' }, sections: ['header', 'hero', 'menu', 'contact', 'footer'].map(type => ({ type, title: type === 'hero' ? 'Um encontro à mesa' : type, subtitle: '', eyebrow: '', text: '', primaryLabel: '', secondaryLabel: '', items: [{ title: 'Preço inventado', text: '', price: 'R$ 99' }] })) }) }] } }] }), { status: 200 });
        }
        return originalFetch(input, init);
      };
      const result = await request('/websites/generate', { crmLeadId: crmIds[0] }); assert.equal(result.status, 200);
      site = result.body.data; assert.equal(site.generationStatus, 'completed'); assert.equal(site.business.rating, '4.6'); assert.equal(site.business.hours, ''); assert.equal(site.seo.title, 'Espetaria de teste'); assert.equal(site.theme.background, '#ffffff');
      assert.ok(site.sections.every((s: any) => s.content.items.length === 0));
      assert.equal((await prisma.crmLead.findUniqueOrThrow({ where: { id: crmIds[0] } })).stage, 'SITE_GENERATED');
      assert.equal((await request('/websites/generate', { crmLeadId: crmIds[0] })).body.data.id, site.id);
      assert.equal((await request('/dashboard')).body.data.stats.sitesGerados, baseline.stats.sitesGerados + 1);
      assert.equal((await request(`/websites/public/${site.id}`)).status, 404);
      document = { name: site.name, business: site.business, theme: site.theme, seo: site.seo, sections: site.sections };
    });
    await t.test('Salvar, reordenar, ocultar e reabrir; rejeitar sobrescrita concorrente', async () => {
      document.sections.reverse(); document.sections[0].visible = false; document.sections[1].content.title = 'Título editado';
      const staleRevision = site.revision;
      const result = await request(`/websites/${site.id}/save`, { revision: site.revision, document }); assert.equal(result.status, 200); site = result.body.data;
      const reload = (await request(`/websites/${site.id}`)).body.data;
      assert.equal(reload.sections[0].visible, false); assert.equal(reload.sections[1].content.title, 'Título editado');
      assert.equal((await request(`/websites/${site.id}/save`, { revision: staleRevision, document })).status, 409);
      const unsafe = structuredClone(document); unsafe.sections[0].content.primaryButton = { label: 'Ataque', href: 'javascript:alert(1)' };
      assert.equal((await request(`/websites/${site.id}/save`, { revision: site.revision, document: unsafe })).status, 400);
    });
    await t.test('Publicação é snapshot; edições no rascunho não vazam', async () => {
      const published = await request(`/websites/${site.id}/publish`, { revision: site.revision, document }); assert.equal(published.status, 200); site = published.body.data;
      document.sections[1].content.title = 'Rascunho ainda não publicado';
      const saved = await request(`/websites/${site.id}/save`, { revision: site.revision, document }); assert.equal(saved.status, 200); site = saved.body.data;
      assert.equal((await request(`/websites/public/${site.id}`)).body.data.sections[1].content.title, 'Título editado');
      const response = await request(`/websites/${site.id}/publish`, { revision: site.revision, document }); assert.equal(response.status, 200);
      assert.equal((await request(`/websites/public/${site.id}`)).body.data.sections[1].content.title, 'Rascunho ainda não publicado');
    });
    await t.test('Reescrita retorna somente sugestão e não muda o banco', async () => {
      globalThis.fetch = async (input, init) => String(input).startsWith('https://generativelanguage.googleapis.com/') ? new Response(JSON.stringify({ candidates: [{ finishReason: 'STOP', content: { parts: [{ text: JSON.stringify({ title: 'Uma nova headline' }) }] } }] })) : originalFetch(input, init);
      const before = (await request(`/websites/${site.id}`)).body.data;
      const result = await request(`/websites/${site.id}/rewrite`, { document, sectionId: document.sections[1].id, field: 'title' });
      assert.deepEqual(result.body.data.patch, { title: 'Uma nova headline' });
      assert.equal((await request(`/websites/${site.id}`)).body.data.revision, before.revision);
    });
    await t.test('Resposta incompleta marca falha sem publicar conteúdo', async () => {
      globalThis.fetch = async (input, init) => String(input).startsWith('https://generativelanguage.googleapis.com/') ? new Response(JSON.stringify({ candidates: [{ finishReason: 'MAX_TOKENS' }] })) : originalFetch(input, init);
      assert.equal((await request('/websites/generate', { crmLeadId: crmIds[1] })).status, 502);
      const failed = (await request(`/websites/lead/${crmIds[1]}`)).body.data;
      assert.equal(failed.generationStatus, 'failed'); assert.equal((await request(`/websites/public/${failed.id}`)).status, 404);
    });
    await t.test('Alterar status nos detalhes mantém o CRM sincronizado', async () => {
      const crm = await prisma.crmLead.findUniqueOrThrow({ where: { id: crmIds[2] } });
      const changed = await request(`/leads/${crm.leadId}`, { status: 'RESPONDEU' }, 'PATCH');
      assert.equal(changed.status, 200);
      assert.equal((await prisma.crmLead.findUniqueOrThrow({ where: { id: crm.id } })).stage, 'REPLIED');
      assert.equal((await request('/dashboard')).body.data.stats.responderam, baseline.stats.responderam + 1);
    });
    await t.test('As seis etapas do quadro persistem após recarregar', async () => {
      for (const stage of ['NEW', 'MESSAGE_SENT', 'SCHEDULED', 'FOLLOW_UP', 'CLIENT', 'LOST']) {
        const changed = await request(`/crm/leads/${crmIds[3]}/stage`, { stage, position: 20 }, 'PATCH');
        assert.equal(changed.status, 200);
        const detail = await request(`/crm/leads/${crmIds[3]}`);
        assert.equal(detail.body.data.stage, stage);
        assert.equal(detail.body.data.position, 20);
      }
    });
  } finally {
    globalThis.fetch = originalFetch; googlePlacesService.searchText = originalSearch; env.GEMINI_API_KEY = originalKey; env.GEMINI_MODEL = originalModel; env.GEMINI_THINKING_LEVEL = originalLevel;
    await prisma.campaign.deleteMany({ where: { id: { in: campaigns } } });
    await prisma.lead.deleteMany({ where: { googlePlaceId: { startsWith: marker } } });
    await new Promise<void>(resolve => server.close(() => resolve())); await prisma.$disconnect();
  }
});
