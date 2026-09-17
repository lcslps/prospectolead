import { test, expect } from '@playwright/test';
import { createRequire } from 'node:module';
import { randomUUID } from 'node:crypto';
const require = createRequire(import.meta.url);
require('../../backend/node_modules/dotenv').config({ path: '../backend/.env', quiet: true });
const { PrismaClient } = require('../../backend/node_modules/@prisma/client');
const { documentSchema } = require('../../backend/dist/services/websiteSchema');
const prisma = new PrismaClient();
let leadId: string; let siteId: string;
test.beforeAll(async () => {
  const lead = await prisma.lead.create({ data: { googlePlaceId: `studio-test-${randomUUID()}`, nome: 'Espetaria · teste do editor', categoria: 'Restaurante', cidade: 'Sinop', estado: 'MT', crmLead: { create: { stage: 'SITE_GENERATED' } } }, include: { crmLead: true } }); leadId = lead.id;
  const document = documentSchema.parse({ name: lead.nome, business: { name: lead.nome, category: 'Restaurante', city: 'Sinop / MT', rating: '4.6', reviewCount: '23' }, theme: { primary: '#164e63', accent: '#0891b2' }, sections: [
    { id: randomUUID(), type: 'header', content: { title: lead.nome }, settings: { padding: 24 } },
    { id: randomUUID(), type: 'hero', content: { title: 'Encontros à mesa, bons momentos', eyebrow: 'UM CONVITE EM SINOP', subtitle: 'Conheça nosso espaço e converse com a gente.', secondaryButton: { label: 'Conhecer', href: '#contato' } }, settings: { background: '#164e63', color: '#ffffff', padding: 100 } },
    { id: randomUUID(), type: 'about', content: { title: 'Sobre nosso espaço', text: 'Edite aqui a apresentação do estabelecimento.' }, settings: {} },
    { id: randomUUID(), type: 'contact', content: { title: 'Fale com a gente' }, settings: {} },
  ] });
  const site = await prisma.website.create({ data: { crmLeadId: lead.crmLead.id, name: document.name, business: document.business, theme: document.theme, generationStatus: 'completed', sections: { create: document.sections.map((s: any, order: number) => ({ ...s, order })) } } }); siteId = site.id;
});
test.afterAll(async () => { if (leadId) await prisma.lead.delete({ where: { id: leadId } }); await prisma.$disconnect(); });

test('Editor visual, autosave, histórico, responsividade e publicação real', async ({ page, request }) => {
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await page.goto('/dashboard');
  await page.getByRole('link', { name: 'Sites / Meus projetos', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Meus projetos', exact: true })).toBeVisible();
  await page.getByRole('textbox', { name: 'Buscar projetos' }).fill('Espetaria · teste do editor');
  await page.locator(`a[href="/studio/${siteId}"]`).click();
  const frame = page.frameLocator('iframe[title="Prévia do site"]');
  await expect(frame.getByRole('heading', { level: 1 })).toHaveText('Encontros à mesa, bons momentos');
  await frame.getByRole('heading', { level: 1 }).click();
  const title = page.locator('[data-editor-field="title"]');
  await expect(title).toBeFocused();
  await title.fill('Uma nova capa para a espetaria');
  await expect(frame.getByRole('heading', { level: 1 })).toHaveText('Uma nova capa para a espetaria');
  await expect(page.getByRole('status')).toHaveText('Salvo');
  await page.reload();
  await expect(frame.getByRole('heading', { level: 1 })).toHaveText('Uma nova capa para a espetaria');
  await page.getByRole('button', { name: 'Celular', exact: true }).click();
  await expect(page.locator('.studio-frame')).toHaveCSS('width', '390px');
  await page.getByRole('button', { name: 'Tablet', exact: true }).click();
  await expect(page.locator('.studio-frame')).toHaveCSS('width', '768px');
  await page.getByRole('button', { name: 'Desktop', exact: true }).click();
  await page.locator('.studio-catalog').getByRole('button', { name: 'Serviços', exact: true }).click();
  await expect(page.locator('.studio-section-row')).toHaveCount(5);
  await page.getByRole('button', { name: 'Adicionar item', exact: true }).click();
  await page.getByLabel('Título / nome / pergunta').fill('Item editável');
  await expect(frame.getByRole('heading', { name: 'Item editável' })).toBeVisible();
  await page.getByRole('button', { name: 'Duplicar', exact: true }).click();
  await expect(page.locator('.studio-section-row')).toHaveCount(6);
  await page.getByRole('button', { name: 'Ocultar', exact: true }).click();
  await expect(frame.getByRole('heading', { name: 'Item editável' })).toHaveCount(1);
  await page.getByRole('button', { name: 'Mover para cima', exact: true }).click();
  await page.getByRole('button', { name: 'Excluir seção', exact: true }).click();
  await expect(page.locator('.studio-section-row')).toHaveCount(5);
  await page.getByRole('button', { name: 'Desfazer', exact: true }).click();
  await expect(page.locator('.studio-section-row')).toHaveCount(6);
  await page.getByRole('button', { name: 'Refazer', exact: true }).click();
  await expect(page.locator('.studio-section-row')).toHaveCount(5);
  await page.getByRole('button', { name: 'Publicar', exact: true }).click();
  await expect(page.getByRole('link', { name: 'Abrir publicado ↗' })).toBeVisible();
  const publicResponse = await request.get(`http://localhost:3002/api/websites/public/${siteId}`);
  expect(publicResponse.status()).toBe(200);
  expect((await publicResponse.json()).data.sections.find((s: any) => s.type === 'hero').content.title).toBe('Uma nova capa para a espetaria');
  await page.locator('.studio-section-select').filter({ hasText: 'Capa (primeira dobra)' }).click();
  await page.locator('.studio-right input[type="file"]').first().setInputFiles({ name: 'imagem.png', mimeType: 'image/png', buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aWQAAAABJRU5ErkJggg==', 'base64') });
  await expect(page.locator('.studio-image-field img').first()).toBeVisible();
  await page.getByLabel('Texto do botão principal').fill('Fale conosco');
  await page.getByLabel('Link (https://, tel:, mailto: ou #seção)').first().fill('https://example.com/contato');
  await expect(frame.getByRole('link', { name: /Fale conosco/ })).toHaveAttribute('href', 'https://example.com/contato');
  await page.getByRole('button', { name: 'Pedir à IA' }).click();
  await page.route(`**/websites/${siteId}/rewrite`, route => route.fulfill({ json: { success: true, data: { patch: { title: 'Headline sugerida' } } } }));
  await page.getByRole('button', { name: 'Gerar sugestão', exact: true }).click();
  await expect(page.getByText('Headline sugerida', { exact: true })).toBeVisible();
  await expect(frame.getByRole('heading', { level: 1 })).toHaveText('Uma nova capa para a espetaria');
  await page.getByRole('button', { name: 'Aplicar sugestão', exact: true }).click();
  await expect(frame.getByRole('heading', { level: 1 })).toHaveText('Headline sugerida');
  await title.fill('Mudança somente no rascunho');
  await expect(page.getByRole('status')).toHaveText('Salvo');
  await page.screenshot({ path: 'test-results/editor-desktop.png', fullPage: true });
  await page.goto(`/s/${siteId}`);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Uma nova capa para a espetaria');
  expect(errors).toEqual([]);
});
