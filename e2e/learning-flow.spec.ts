import { expect, test } from '@playwright/test';

test('learner opens a lesson, answers it, and sees progress', async ({ page }) => {
  await page.goto('');
  await expect(page.getByRole('heading', { name: 'Învață ceva mic.' })).toBeVisible();
  await page.getByRole('button', { name: 'Structura ideii' }).click();
  await expect(page.getByRole('heading', { name: 'Structura ideii' })).toBeVisible();
  for (const [index, option] of ['Aleg un verb precis', 'Arată ideea în context', 'Îl citești cu voce tare', 'Repetițiile fără rol', 'O direcție clară'].entries()) {
    await page.getByRole('button', { name: option }).click();
    await expect(page.getByRole('status').filter({ hasText: 'Exact.' })).toBeVisible();
    await page.getByRole('button', { name: index === 4 ? /Vezi rezultatul/ : /Următoarea întrebare/ }).click();
  }
  await expect(page.getByRole('heading', { name: 'unei idei noi.' })).toBeVisible();
  await expect(page.getByText('1/6')).toBeVisible();
});
