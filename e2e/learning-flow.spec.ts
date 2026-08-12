import { expect, test } from '@playwright/test';

test('traseul complet și persistența locală', async ({ page }) => {
  await page.goto('');
  await page.getByRole('button', { name: /Începe demo-ul/ }).click();
  await page.getByRole('button', { name: /Școală/ }).click();
  await page.getByRole('button', { name: /Matematică/ }).click();
  await page.getByRole('button', { name: /Clasa a VIII-a/ }).click();
  await page.getByRole('button', { name: /Continuă/ }).click();
  await page.getByRole('button', { name: /Verifică ce ai înțeles/ }).click();
  await page.getByRole('button', { name: /Scad 5/ }).click();
  await page.getByRole('button', { name: /Următorul exercițiu/ }).click();
  await page.getByLabel('Răspunsul tău').fill('5');
  await page.getByRole('button', { name: /Verifică/ }).click();
  await page.getByRole('button', { name: /Următorul exercițiu/ }).click();
  for (const name of ['Adun 4 la ambele părți', 'Obțin 2x = 14', 'Împart la 2 și obțin x = 7']) await page.getByRole('button', { name: new RegExp(name) }).click();
  await page.getByRole('button', { name: /Verifică ordinea/ }).click();
  await page.getByRole('button', { name: /Finalizează lecția/ }).click();
  await expect(page.getByRole('heading', { name: /care rămâne/ })).toBeVisible();
  await expect(page.getByRole('main').getByText('+30 XP', { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByText('⚡ 30 XP')).toBeVisible();
});
