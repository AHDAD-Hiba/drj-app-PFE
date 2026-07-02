import { test, expect } from '@playwright/test';
import process from 'process';
import path from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

test.describe.serial('Tests d\'Autosave et Résilience (Step 1)', () => {

  test.beforeEach(async ({ page }) => {
    // 1. نمشيو نيشان للداشبورد حيت ديجا تسجلنا الدخول بفضل auth.setup.ts
    await page.goto('/domain-dashboard'); 
    
    // 2. نكملو الكليكان باش نوصلو للاستمارة 
    await page.getByText('Saisie', { exact: true }).first().click();
    
    await page.getByRole('combobox').click();
    await page.getByRole('option', { name: 'T1' }).click();
    await page.getByRole('button', { name: /Suivant/i }).click();
    await page.getByRole('button', { name: /Jeunesse/i }).click();
    await page.getByRole('button', { name: /Accéder au formulaire/i }).click();
    
    await expect(page.getByText('Activités permanentes', { exact: false }).first()).toBeVisible();
  });

  // ==========================================
  // Test 1: DB updated (Cas Normal)
  // ==========================================
  test('Test 1 : Enregistrement réussi après délai (Autosave)', async ({ page }) => {
    // كنتسناو العنوان يبان كأول خطوة (باش نضمنوا حنا في الصفحة الصحيحة)
    await expect(page.getByRole('heading', { name: 'Activités permanentes' })).toBeVisible({ timeout: 10000 });

    const requestPromise = page.waitForRequest(request => 
      request.url().includes('/rest/v1/') && 
      (request.method() === 'PATCH' || request.method() === 'POST')
    );

    const inputAssoc = page.locator('form#step1-form input').nth(0);
    await inputAssoc.fill('100');
    await inputAssoc.blur(); 

    const request = await requestPromise;
    expect(request).toBeTruthy();
  });

  // ==========================================
  // Test 2: Rapid Typing (Debounce)
  // ==========================================
  test('Test 2 : Frappe rapide (Debounce) - 1 seul save', async ({ page }) => {
    let saveRequestsCount = 0;
    
    page.on('request', request => {
      if (request.url().includes('/rest/v1/') && (request.method() === 'PATCH' || request.method() === 'POST')) {
        saveRequestsCount++;
      }
    });

    // الخانة الثانية (nombre_clubs)
    const inputClubs = page.locator('form#step1-form input').nth(1);
    
    await inputClubs.fill('1');
    await page.waitForTimeout(100);
    await inputClubs.fill('12');
    await page.waitForTimeout(100);
    await inputClubs.fill('123');
    await page.waitForTimeout(100);
    await inputClubs.fill('1234');
    
    await inputClubs.blur();
    await page.waitForTimeout(2000); // كنتسناو شوية باش نشوفو شحال من طلب مشا

    // خاص يكون مشا غير طلب واحد
    expect(saveRequestsCount).toBe(1);
  });

/// ==========================================
  // Test 3: Refresh immédiat
  // ==========================================
  test('Test 3 : Données conservées après un rafraîchissement', async ({ page }) => {
    const inputConventions = page.locator('form#step1-form input').nth(2);

    await inputConventions.fill('999');
    await inputConventions.blur();
    
    // 🔴 السر هنا: خاصنا نتسناو الـ Debounce يسالي (3 ثواني) باش التسجيل يمشي لـ Supabase
    // حيت يلا درنا Refresh بالزربة، كيتلغى التسجيل
    await page.waitForTimeout(3000); 

    // دابا نقدرو نديرو Refresh وحنا متأكدين بلي 999 تسجلات
    await page.reload();
    
    // نرجعو ندخلو للاستمارة
    await page.getByRole('combobox').click();
    await page.getByRole('option', { name: 'T1' }).click();
    await page.getByRole('button', { name: /Suivant/i }).click();
    await page.getByRole('button', { name: /Jeunesse/i }).click();
    await page.getByRole('button', { name: /Accéder au formulaire/i }).click();

    // كنتسناو الفورمولير يبان ونتأكدو من القيمة واش بقات محفوظة
    await expect(page.locator('form#step1-form input').nth(2)).toBeVisible();
    await expect(page.locator('form#step1-form input').nth(2)).toHaveValue('999');
  });

// ==========================================
  // Test 4: Offline (Coupure Internet)
  // ==========================================
  test('Test 4 : Gestion d\'erreur si coupure Internet', async ({ page, context }) => {
    const inputEducatives = page.locator('form#step1-form input').nth(3);
    
    // 1. نقطعو الأنترنيت
    await context.setOffline(true);

    // 2. نكتبو القيمة باش نفعلو الـ Autosave
    await inputEducatives.fill('50');
    await inputEducatives.blur();

    // 3. 🔴 التعديل هنا: غنستعملو Regex باش نقلبو على الكلمة بسهولة
    // /i كتعني أنه ماغاديش يتسوق واش الحروف ماجيسكول ولا مينيسكول
    const toastMessage = page.getByText("Échec de l'enregistrement").first();
    
    // كنتسناو الميساج يبان (عطيناه 5 ثواني حيت كاين الـ Debounce ديال 3 ثواني لي درنا الفوق)
    await expect(toastMessage).toBeVisible({ timeout: 5000 });

    // 4. نرجعو الأنترنيت باش ما يتبلوكاش لينا المتصفح
    await context.setOffline(false);
  });

});