import { test, expect } from '@playwright/test';
import process from 'process';
import path from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

test.describe.serial('Tests de Création de Rapport (Règles Métier)', () => {

  // هادشي كيدار قبل كل تست
  test.beforeEach(async ({ page }) => {
    // 1. الدخول للتطبيق
    await page.goto('/auth');
    await page.getByTestId('input-email').fill(process.env.TEST_EMAIL as string);
    await page.getByTestId('input-password').fill(process.env.TEST_PASSWORD as string);
    await page.getByTestId('btn-login').click();
    await expect(page).toHaveURL(/.*domain-dashboard/);
    
    // 2. كليك على Saisie في الـ Navbar
    await page.getByText('Saisie', { exact: true }).first().click();
    
    // 3. كنتسناو المكون ديال PreFormSelection يبان (الخطوة 1: Choisir le rapport)
    await expect(page.getByText('Choisir le rapport', { exact: true }).first()).toBeVisible();
  });

  // ==========================================
  // 1. CAS NORMAL : Créer T1
  // ==========================================
  test('Cas normal : Création d\'un nouveau rapport T1', async ({ page }) => {
    // STAGE 1
    await page.getByRole('combobox').click();
    await page.getByRole('option', { name: 'T1' }).click();
    await page.getByRole('button', { name: /Suivant/i }).click();

    // STAGE 2
    await page.getByRole('button', { name: /Jeunesse/i }).click();
    await page.getByRole('button', { name: /Accéder au formulaire/i }).click();

    // التأكد من أننا دزنا لصفحة الاستمارة (الزر ديال Accéder مابقاش كيبان)
    await expect(page.getByRole('button', { name: /Accéder au formulaire/i })).toBeHidden();
  });

  // ==========================================
  // 2. CAS BLOCAGE : Essayer T2 alors que T1 est EN_COURS
  // ==========================================
  test('Cas blocage : Impossible de créer T2 si T1 n\'est pas terminé', async ({ page }) => {
    // STAGE 1 : محاولة اختيار T2
    await page.getByRole('combobox').click();
    await page.getByRole('option', { name: 'T2' }).click();
    await page.getByRole('button', { name: /Suivant/i }).click();

    // STAGE 2
    await page.getByRole('button', { name: /Jeunesse/i }).click();
    await page.getByRole('button', { name: /Accéder au formulaire/i }).click();

    // التأكد من ظهور ميساج الخطأ ديال Règles Métier
    const errorMessage = page.locator('text=Tous les domaines du rapport précédent doivent être terminés').first();
    await expect(errorMessage).toBeVisible();
  });

  // ==========================================
  // 3. CAS EXISTANT : Créer T1 مرة أخرى
  // ==========================================
  test('Cas existant : Redirection vers le rapport T1 existant', async ({ page }) => {
    // STAGE 1 : اختيار T1 لي ديجا تكرِيَّا في التست الأول
    await page.getByRole('combobox').click();
    await page.getByRole('option', { name: 'T1' }).click();
    await page.getByRole('button', { name: /Suivant/i }).click();

    // STAGE 2
    await page.getByRole('button', { name: /Jeunesse/i }).click();
    await page.getByRole('button', { name: /Accéder au formulaire/i }).click();

    // خاصو يدوز للاستمارة عادي بلا ما يعطي خطأ وبلا ما يكريي واحد جديد
    await expect(page.getByRole('button', { name: /Accéder au formulaire/i })).toBeHidden();
  });

});