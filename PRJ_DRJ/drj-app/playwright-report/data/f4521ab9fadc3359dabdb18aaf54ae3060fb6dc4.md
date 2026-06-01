# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: workflow-prefectoral.spec.ts >> Simulation Globale : Parcours complet du Directeur Préfectoral
- Location: tests\workflow-prefectoral.spec.ts:3:1

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('text=/NON COMMENCÉ|EN COURS|TERMINÉ/')
Expected: visible
Timeout: 15000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 15000ms
  - waiting for locator('text=/NON COMMENCÉ|EN COURS|TERMINÉ/')

```

```yaml
- region "Notifications (F8)":
  - list
- region "Notifications alt+T"
- banner:
  - img "MJCC"
  - text: DRJ Casablanca-Settat
  - button "العربية":
    - img
    - text: العربية
- main:
  - heading "Direction Régionale de la Jeunesse Casablanca-Settat" [level=1]
  - paragraph: Accédez à votre espace de pilotage régional
  - heading "Connexion" [level=2]
  - paragraph: Accédez à votre espace de pilotage régional
  - text: Adresse e-mail
  - textbox "Adresse e-mail":
    - /placeholder: votre@email.ma
  - text: Mot de passe
  - link "Mot de passe oublié ?":
    - /url: /forgot-password
  - textbox "Mot de passe"
  - button "Afficher":
    - img
  - button "Se connecter"
```