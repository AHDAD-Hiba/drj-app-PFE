import { test, expect } from '@playwright/test';

test('directeur prefectoral can login', async ({ page }) => {
  await page.goto('/auth');

  await page.fill('#email', 'dp.set@drj-cs.ma');
  await page.fill('#password', '9iuwn80j2n6s');

  await page.getByRole('button', { name: /sign in|connexion|se connecter/i }).click();

  await page.waitForURL('**/dashboard');

  expect(page.url()).toContain('/dashboard');
});