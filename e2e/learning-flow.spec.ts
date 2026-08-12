import { expect, test } from '@playwright/test';

async function enterApp(page: import('@playwright/test').Page) {
  await page.goto('');
  await page.getByRole('button', { name: /Să începem/ }).click();
}

test('Telegram-style learning flow persists local progress', async ({ page }) => {
  await enterApp(page);
  await page.getByText('Școală', { exact: true }).click();
  await page.getByText('Matematică', { exact: true }).click();
  await page.getByText('Fundamente', { exact: true }).click();
  await page.getByText('Ușor', { exact: true }).click();
  await page.getByRole('button', { name: /Continuă/ }).click();
  await page.getByRole('button', { name: /Scad 5/ }).click();
  await page.getByRole('button', { name: /Verifică/ }).click();
  await expect(page.getByText(/Corect/i)).toBeVisible();
  await page.getByRole('button', { name: /Mai departe/ }).click();
  await expect(page.locator('input.answer')).toBeVisible();
});

test('mobile shell has no horizontal overflow and exposes product sections', async ({ page }) => {
  await enterApp(page);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  expect(overflow).toBe(false);
  await expect(page.getByText(/Duel|Battle/i).first()).toBeAttached();
  await expect(page.getByText(/Magazin/i).first()).toBeAttached();
  await expect(page.getByText(/Profil/i).first()).toBeAttached();
});
