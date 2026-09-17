import { test, expect } from '@playwright/test';
import { createRequire } from 'node:module';
import { randomUUID } from 'node:crypto';
const require = createRequire(import.meta.url);
require('../../backend/node_modules/dotenv').config({ path: '../backend/.env', quiet: true });
const { PrismaClient } = require('../../backend/node_modules/@prisma/client');
const prisma = new PrismaClient();
const marker = `crm-board-test-${randomUUID()}`;
let moving: string; let legacy: string;
test.beforeAll(async () => {
  for (const [suffix, stage] of [['moving', 'NEW'], ['legacy', 'SITE_GENERATED']]) {
    const lead = await prisma.lead.create({ data: { googlePlaceId: `${marker}-${suffix}`, nome: `${marker}-${suffix}`, crmLead: { create: { stage } } }, include: { crmLead: true } });
    if (suffix === 'moving') moving = lead.crmLead.id; else legacy = lead.crmLead.id;
  }
});
test.afterAll(async () => { await prisma.lead.deleteMany({ where: { googlePlaceId: { startsWith: marker } } }); await prisma.$disconnect(); });
test('Seis colunas e movimentação persistida sem alterar etapas antigas', async ({ page }) => {
  await page.goto('/crm');
  await expect(page.locator('[data-crm-stage]')).toHaveCount(6);
  const base = page.locator('[data-crm-stage="NEW"]');
  const scheduled = page.locator('[data-crm-stage="SCHEDULED"]');
  await expect(base.getByText(`${marker}-legacy`, { exact: true })).toBeVisible();
  const card = base.getByText(`${marker}-moving`, { exact: true });
  const from = await card.boundingBox(); const to = await scheduled.boundingBox();
  if (!from || !to) throw new Error('Card ou coluna indisponível');
  await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
  await page.mouse.down(); await page.mouse.move(from.x + 10, from.y + 15, { steps: 3 });
  await page.mouse.move(to.x + to.width / 2, to.y + 100, { steps: 12 }); await page.mouse.up();
  await expect.poll(async () => (await prisma.crmLead.findUniqueOrThrow({ where: { id: moving } })).stage).toBe('SCHEDULED');
  await page.reload();
  await expect(scheduled.getByText(`${marker}-moving`, { exact: true })).toBeVisible();
  expect((await prisma.crmLead.findUniqueOrThrow({ where: { id: legacy } })).stage).toBe('SITE_GENERATED');
});
