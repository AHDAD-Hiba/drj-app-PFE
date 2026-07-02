import { test, expect } from '@playwright/test';
import process from 'process';
import path from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });
// قبل كل تست، كنمشيو لصفحة الدخول لي عندك سميتها /auth
test.beforeEach(async ({ page }) => {
  await page.goto('/auth');
});

test.describe('Tests d\'Authentification et de Routage PFE', () => {

  // ==========================================
  // 1. LOGIN VALIDE & REDIRECTION
  // ==========================================
  
  test('Login valide et redirection automatique vers domain-dashboard', async ({ page }) => {
    await page.getByTestId('input-email').fill(process.env.TEST_EMAIL as string);
    await page.getByTestId('input-password').fill(process.env.TEST_PASSWORD as string);
    await page.getByTestId('btn-login').click();

    // هنا تذكير: /dashboard كيدير Navigate لـ /domain-dashboard تلقائياً
    await expect(page).toHaveURL(/.*domain-dashboard/);
  });

  // ==========================================
  // 2. LOGIN INVALIDE
  // ==========================================

  test('Login invalide - Reste sur la page /auth', async ({ page }) => {
    await page.getByTestId('input-email').fill(process.env.TEST_EMAIL as string);
    await page.getByTestId('input-password').fill('MotDePasseFaux123!'); 
    await page.getByTestId('btn-login').click();

    // التأكد من بقائه في صفحة /auth وظهور الخطأ
    await expect(page.locator('text=Invalid login credentials').first()).toBeVisible();
    await expect(page).toHaveURL(/.*auth/);
  });

  // ==========================================
  // 3. SESSION & REFRESH
  // ==========================================

  test('Persistance de la session sur /domain-dashboard après refresh', async ({ page }) => {
    await page.getByTestId('input-email').fill(process.env.TEST_EMAIL as string);
    await page.getByTestId('input-password').fill(process.env.TEST_PASSWORD as string);
    await page.getByTestId('btn-login').click();
    await expect(page).toHaveURL(/.*domain-dashboard/);

    // تحديث الصفحة
    await page.reload();

    // خاصو يبقى في نفس الصفحة وميرجعش للـ /auth
    await expect(page).toHaveURL(/.*domain-dashboard/);
  });

  // ==========================================
  // 4. VERIFICATION DES PROTECTED ROUTES
  // ==========================================

  test('ProtectedRoute - Redirige un utilisateur anonyme vers /auth', async ({ page }) => {
    // محاولة الدخول مباشرة لصفحة محمية (مثلا صفحة إدخال البيانات /saisie) بلا login
    await page.goto('/saisie');

    // الـ ProtectedRoute خاصها تمنعو وترجعو لـ /auth فورا حيت ماعندوش session
    await expect(page).toHaveURL(/.*auth/);
  });

});