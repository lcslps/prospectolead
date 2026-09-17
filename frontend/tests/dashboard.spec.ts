import { test, expect } from '@playwright/test';

test('dashboard aggregates legacy stages, handles zero totals and both themes', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  let empty = false;
  await page.route('**/api/dashboard', route => route.fulfill({ json: { success: true, data: {
    stats: { totalLeads: empty ? 0 : 10, sitesGerados: 2, campanhas: 3 },
    crmStats: { porStage: empty ? {} : { NEW: 1, SITE_GENERATED: 1, MESSAGE_SENT: 1, REPLIED: 1, SCHEDULED: 2, NEGOTIATION: 1, FOLLOW_UP: 1, CLIENT: 1, LOST: 1 } },
    activity: { semSiteGerado: empty ? 0 : 8, followUpsAtrasados: 0, sitesPublicados: 1, empresasEncontradas: 20, mensagensEnviadas: 4 },
    ultimosLeads: [],
  } } }));
  await page.goto('/dashboard');
  await expect(page.getByRole('heading', { name: 'Funil de conversão' })).toBeVisible();
  await expect(page.getByRole('meter', { name: 'Base', exact: true })).toHaveAttribute('aria-valuenow', '2');
  await expect(page.getByRole('meter', { name: 'Abordado', exact: true })).toHaveAttribute('aria-valuenow', '2');
  await expect(page.getByRole('meter', { name: 'Follow Up', exact: true })).toHaveAttribute('aria-valuenow', '2');
  await expect(page.locator('.conversion-rates > div').first().locator('strong')).toHaveText('10%');
  await expect(page.locator('.conversion-rates > div').nth(1).locator('strong')).toHaveText('80%');
  await expect(page.locator('.conversion-rates > div').nth(2).locator('strong')).toHaveText('37,5%');
  for (const theme of ['light', 'dark']) {
    await page.evaluate(theme => document.documentElement.classList.toggle('dark', theme === 'dark'), theme);
    await page.screenshot({ path: `test-results/dashboard-${theme}.png`, fullPage: true });
  }
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: 'test-results/dashboard-mobile.png', fullPage: true });
  empty = true;
  await page.getByRole('button', { name: 'Atualizar' }).click();
  await expect(page.locator('.conversion-rates strong')).toHaveText(['0%', '0%', '0%', '0%', '0%']);
  expect(errors).toEqual([]);
});
