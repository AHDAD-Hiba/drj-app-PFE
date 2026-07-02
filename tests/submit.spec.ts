import { test, expect } from '@playwright/test';
import process from 'process';
import path from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

test.describe.serial('Tests de Soumission et Sécurisation (Submit & Readonly)', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/auth');
    await page.getByTestId('input-email').fill(process.env.TEST_EMAIL as string);
    await page.getByTestId('input-password').fill(process.env.TEST_PASSWORD as string);
    await page.getByTestId('btn-login').click();
    await expect(page).toHaveURL(/.*domain-dashboard/);
    
    await page.getByText('Saisie', { exact: true }).first().click();
    
    await page.getByRole('combobox').click();
    await page.getByRole('option', { name: 'T1' }).click();
    await page.getByRole('button', { name: /Suivant/i }).click();
    await page.getByRole('button', { name: /Jeunesse/i }).click();
    await page.getByRole('button', { name: /Accéder au formulaire/i }).click();
    
    await expect(page.getByRole('heading', { name: 'Activités permanentes' })).toBeVisible({ timeout: 10000 });
  });

  // دالة مساعدة للتنقل بين الـ Steps
  async function navigateToStep7(page) {
    for (let i = 1; i < 7; i++) {
      const btnNext = page.getByRole('button', { name: /Suivant|Next/i }).first();
      await btnNext.dispatchEvent('click');
      await page.waitForTimeout(800); 
    }
  }

  // ==========================================
  // Soumission -> TERMINE + Readonly
  // ==========================================
  test('Test : Soumission du rapport - Passage en TERMINE et Readonly', async ({ page }) => {
    // 1. نملأ الخانات لتفعيل الـ Autosave
    await page.locator('form#step1-form input').nth(0).fill('10');
    await page.locator('form#step1-form input').nth(1).fill('5');
    await page.waitForTimeout(3000); // تسنى الـ Autosave يكمل

    // 2. الانتقال إلى الخطوة الأخيرة (Step 7)
    await navigateToStep7(page);

    // 3. الضغط على زر الإرسال
    const btnSubmit = page.getByRole('button', { name: /Soumettre|Submit|Envoyer|Valider/i });
    await btnSubmit.dispatchEvent('click');

    // 4. تجاوز مودال التنبيه إذا ظهر (بسبب النسبة) للوصول للمودال النهائي
    const btnWarning = page.getByRole('button', { name: /Soumettre quand même|الإرسال رغم ذلك/i });
    if (await btnWarning.count() > 0) {
      await btnWarning.dispatchEvent('click');
    }

    // 5. تأكيد الإرسال النهائي
    await page.getByRole('button', { name: /Confirmer|تأكيد/i }).click();

    // 6. التحقق من ظهور رسالة النجاح (Toast)
    const successToast = page.getByText(/Rapport soumis|transmis/i).first();
    await expect(successToast).toBeVisible({ timeout: 5000 });

    // 7. الرجوع لـ Step 1 للتأكد من قفل الواجهة (Readonly)
    let btnPrev = page.getByRole('button', { name: /Précédent|Previous/i }).first();
    while (await btnPrev.isVisible() && await btnPrev.isEnabled()) {
      await btnPrev.click();
      await page.waitForTimeout(300);
    }

    // 8. الخانات يجب أن تصبح مقفولة تماماً وغير قابلة للتعديل
    await expect(page.locator('form#step1-form input').first()).toBeDisabled({ timeout: 5000 });
    
    // وزر "Enregistrer le brouillon" يجب أن يختفي
    await expect(page.getByRole('button', { name: /Enregistrer le brouillon|Save/i })).not.toBeVisible();
  });

});