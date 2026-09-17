import { test, expect } from '@playwright/test';

test('select and multiselect support filtering, keyboard, validation and form values', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto('/tests/fixtures/controls.html');
  await page.getByRole('button', { name: 'Salvar' }).click();
  await expect(page.locator('output')).toBeEmpty();
  await expect(page.getByRole('listbox')).toBeVisible();
  await page.getByRole('combobox', { name: 'Filtrar opções' }).fill('sao');
  await expect(page.getByRole('option')).toHaveCount(1);
  await page.keyboard.press('Enter');
  await expect(page.getByRole('combobox', { name: 'Estado', exact: true })).toHaveText('São Paulo');
  await expect(page.getByRole('combobox', { name: 'Estado', exact: true })).toBeFocused();
  await page.getByRole('combobox', { name: 'Estados', exact: true }).click();
  await page.getByRole('option', { name: 'São Paulo' }).click();
  await page.getByRole('option', { name: 'Mato Grosso' }).click();
  await expect(page.getByRole('option', { selected: true })).toHaveCount(2);
  await page.getByRole('option', { name: 'São Paulo' }).click();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('combobox', { name: 'Estados', exact: true })).toHaveText('Mato Grosso');
  await expect(page.getByRole('combobox', { name: 'Desativado' })).toBeDisabled();
  await page.getByRole('checkbox').focus();
  await page.keyboard.press('Space');
  await expect(page.getByRole('checkbox')).toBeChecked();
  await page.getByRole('button', { name: 'Salvar' }).click();
  await expect(page.locator('output')).toContainText('["state","SP"]');
  await expect(page.locator('output')).toContainText('["states","MT"]');
  expect(errors).toEqual([]);
});

test('region dropdown uses themed searchable menu on desktop and mobile', async ({ page }) => {
  await page.route('**/servicodados.ibge.gov.br/**', route => route.fulfill({ json: [{ sigla: 'MT', nome: 'Mato Grosso' }, { sigla: 'SP', nome: 'São Paulo' }] }));
  await page.goto('/prospeccao');
  const state = page.locator('#loc-estado');
  await expect(state).toBeEnabled();
  await state.click();
  await page.getByRole('combobox', { name: 'Filtrar opções' }).fill('zzzz');
  await expect(page.getByRole('status')).toHaveText('Nenhum resultado encontrado.');
  await page.getByRole('button', { name: 'Limpar busca' }).click();
  for (const dark of [false, true]) {
    await page.evaluate(dark => document.documentElement.classList.toggle('dark', dark), dark);
    await page.screenshot({ path: `test-results/select-${dark ? 'dark' : 'light'}.png` });
  }
  await page.setViewportSize({ width: 390, height: 844 });
  const box = await page.locator('.ui-select-popup').boundingBox();
  expect(box!.x).toBeGreaterThanOrEqual(0);
  expect(box!.x + box!.width).toBeLessThanOrEqual(390);
  await page.keyboard.press('Escape');
  await expect(state).toBeFocused();
  await expect(page.locator('.ui-select-popup')).toHaveCount(0);
});
