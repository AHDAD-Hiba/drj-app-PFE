import { test as setup, expect } from '@playwright/test';
import process from 'process';
import path from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const authFile = 'playwright/.auth/user.json';

setup('authenticate', async ({ page }) => {
  await page.goto('/auth'); 


  await page.getByTestId('input-email').fill(process.env.TEST_EMAIL as string);
  await page.getByTestId('input-password').fill(process.env.TEST_PASSWORD as string);
  
  // 3. كليك على زر الدخول
  await page.getByTestId('btn-login').click(); 

  // 4. كنتسناو الداشبورد يتبان 
  await expect(page).toHaveURL(/.*domain-dashboard/); 

  // 5. حفظ الجلسة
  await page.context().storageState({ path: authFile });
});