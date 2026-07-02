# DRJ Casablanca-Settat — Application de Suivi des Performances

Application web de saisie et de pilotage des rapports annuels des 13 directions provinciales.

## Stack technique
- **Frontend** : React 18 + TypeScript + Vite
- **UI** : shadcn/ui + TailwindCSS
- **Backend / BDD** : Supabase (PostgreSQL + Auth + RLS)
- **Déploiement** : Vercel

## Installation

```bash
# 1. Installer les dépendances
npm install

# 2. Configurer les variables d'environnement
cp .env.example .env.local
# Remplir VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY

# 3. Lancer en développement
npm run dev
# → http://localhost:8080
```

## Variables d'environnement

| Variable | Description |
|----------|-------------|
| `VITE_SUPABASE_URL` | URL de votre projet Supabase |
| `VITE_SUPABASE_ANON_KEY` | Clé publique anon de Supabase |

⚠️ Ne jamais committer le fichier `.env` sur GitHub.

## Pages disponibles

| Route | Description | Accès |
|-------|-------------|-------|
| `/auth` | Connexion | Public |
| `/forgot-password` | Mot de passe oublié | Public |
| `/reset-password` | Nouveau mot de passe (lien email) | Public |
| `/dashboard` | Tableau de bord régional | Protégé |
| `/directions` | Liste des 13 directions | Protégé |
| `/saisie` | Formulaire de saisie | Protégé |
| `/import` | Import Excel | Protégé |
| `/admin/provision` | Création des comptes (admin) | Admin |

## Structure du projet

```
src/
├── components/       → Composants réutilisables
│   ├── ui/           → Composants shadcn/ui
│   └── wizard/       → Étapes du formulaire de saisie
├── hooks/            → Hooks React (useAuth, etc.)
├── integrations/     → Client Supabase
├── lib/              → Utilitaires
├── pages/            → Pages de l'application
└── i18n/             → Traductions FR / AR
```

## PFE — Bajadda Hanane & Ahdad Hiba
Licence SITD — FST Settat — 2024-2025
Encadrante : Mme Meryem Agadi — DRJ Casablanca-Settat
