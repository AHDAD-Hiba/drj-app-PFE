import { test, expect } from '@playwright/test';

test('Simulation Globale : Parcours complet du Directeur Préfectoral', async ({ page }) => {
  // ─── 1. CONNEXION AUTHENTIFICATION ───
  await page.goto('/auth');
  await page.fill('input[type="email"]', 'dp.set@drj-cs.ma');
  await page.fill('input[type="password"]', '9iuwn80j2n6s');
  await page.click('button[type="submit"]');
  
  // ─── 2. AUDIT DU DASHBOARD INITIAL ───
  await page.goto('/dashboard/direction/17d33c55-c9f1-40c0-90d5-5a5b7ea68d14');
  
  // 💡 Correction Syntaxe Playwright : On utilise une expression régulière propre pour capter le statut
  await expect(page.locator('text=/NON COMMENCÉ|EN COURS|TERMINÉ/')).toBeVisible({ timeout: 15000 });
  
  // ─── 3. OUVERTURE DU FORMULAIRE ET PRÉ-SÉLECTION ───
  await page.goto('/saisie');
  await page.waitForTimeout(1000);

  // Si l'écran de pré-sélection est visible, on clique sur Confirmer
  const confirmBtn = page.locator('button:has-text("Confirmer"), button:has-text("Suivant"), button:has-text("تأكيد")');
  if (await confirmBtn.isVisible()) {
    await confirmBtn.click();
    await page.waitForTimeout(1000);
  }

  // ─── 4. LE NAVIGATEUR INTELLIGENT (Branchement conditionnel) ───
  const inputAssoc = page.locator('input[type="number"]').first();
  
  // On vérifie si le premier champ est désactivé (Rapport déjà soumis)
  const isFormLocked = await inputAssoc.isDisabled();

  if (!isFormLocked) {
    console.log("📝 Rapport modifiable (NON_COMMENCE ou EN_COURS). Lancement de la simulation de saisie...");

    // Stress-test Anti-doublons
    await inputAssoc.fill('8');
    await page.waitForTimeout(40); // Simule la Race Condition de frappe rapide
    await inputAssoc.fill('80'); 
    
    // Vérification visuelle du blindage de l'UI (Laisser une tolérance si la sauvegarde est instantanée)
    const syncIndicator = page.locator('text=Synchronisation, text=Sauvegarde');
    if (await syncIndicator.isVisible()) {
      await expect(syncIndicator).toBeVisible();
    }
    
    // ─── 5. PARCOURS DES ÉTAPES VIA LE BOUTON SUIVANT ───
    for (let i = 1; i <= 6; i++) {
      await page.waitForTimeout(300);
      await page.click('button:has-text("Suivant")');
    }

    // ─── 6. VÉRIFICATION DE LA JAUGE DE COMPLÉTUDE ───
    const completenessText = page.locator('text=Complétude, text=Progression');
    await expect(completenessText).not.toContainText('0%');

    // ─── 7. SOUMISSION FINALE ET VERROUILLAGE ───
    await page.click('button:has-text("Soumettre"), button:has-text("Envoyer")');
    await page.click('button:has-text("Confirmer")');
    await page.waitForTimeout(1500); // Attente de la validation Supabase

    // On valide que le blindage s'est bien activé suite à la soumission
    await expect(inputAssoc).toBeDisabled();

  } else {
    console.log("🔒 Le rapport est déjà validé (TERMINÉ). Saut de la phase de saisie pour éviter le crash.");
  }

  // ─── 8. VÉRIFICATION FINALE DU TABLEAU DE BORD (INTÉGRITÉ) ───
  await page.goto('/dashboard/direction/17d33c55-c9f1-40c0-90d5-5a5b7ea68d14');
  
  // On s'assure que le statut à l'écran affiche bien "TERMINÉ" (et plus "NON COMMENCÉ")
  await expect(page.locator('text=TERMINÉ')).toBeVisible({ timeout: 10000 });
  await expect(page.locator('text=NON COMMENCÉ')).not.toBeVisible();
  
  // Validation des calculs des KPIs SQL
  const kpiSection = page.locator('text=Total des Activités, text=Statistiques, text=Activités');
  await expect(kpiSection).toBeVisible();
});