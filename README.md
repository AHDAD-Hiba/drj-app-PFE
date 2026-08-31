# DRJ Casablanca-Settat — Application de Suivi des Performances

Application web de saisie, de gestion et de pilotage des rapports trimestriels et annuels de la Direction Régionale de la Jeunesse (DRJ) Casablanca-Settat et de ses directions provinciales.

## Stack technique

- **Frontend** : React 18 + TypeScript + Vite + React Router DOM
- **State & Data Fetching** : TanStack Query (React Query)
- **UI & Styles** : shadcn/ui + TailwindCSS + Lucide Icons
- **Backend / BDD** : Supabase (PostgreSQL + Auth + Storage + RLS + Edge Functions)
- **Internationalisation** : i18next (Français / Arabe RTL)
- **Génération de documents** : Docxtemplater + PizZip

---

## Installation

# 1. Installer les dépendances
npm install

# 2. Configurer les variables d'environnement
cp .env.example .env
# Remplir VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY

# 3. Lancer en développement
npm run dev
# → http://localhost:8080


## Variables d'environnement

| Variable | Description |
|----------|-------------|
| `VITE_SUPABASE_URL` | URL de votre projet Supabase |
| `VITE_SUPABASE_ANON_KEY` | Clé publique anon de Supabase |



## Pages & Navigation (Routes)

###  Routes Publiques

| Route | Composant | Description |
| --- | --- | --- |
| `/` | `Index` | Page d'accueil / Redirection |
| `/auth` | `Auth` | Page de connexion |
| `/forgot-password` | `ForgotPassword` | Demande de réinitialisation du mot de passe |
| `/reset-password` | `ResetPassword` | Définition du nouveau mot de passe |

---

### Routes Protégées (Selon les Rôles)

#### Espace Équipe Régionale (`equipe_regional`)

| Route | Composant | Description |
| --- | --- | --- |
| `/regional-dashboard` | `ProvincialReports` | Suivi et validation des rapports provinciaux |

#### Espace Directeur Régional (`directeur_regional`)

| Route | Composant | Description |
| --- | --- | --- |
| `/region-dashboard` | `RegDomainDashboard` | Tableau de bord décisionnel régional |
| `/directions` | `Directions` | Vue d'ensemble des directions provinciales |
| `/directions/:id` | `DirectionDetail` | Détail et suivi d'une direction spécifique |

#### Espace Saisie & Consultation (`directeur_prefectoral`, `equipe_regional`)

| Route | Composant | Description |
| --- | --- | --- |
| `/saisie` | `Saisie` | Initialisation et création d'un rapport |
| `/saisie/:rapportId` | `Saisie` | Formulaire dynamique de saisie par domaine |

#### Espaces Partagés (`directeur_prefectoral`, `directeur_regional`)

| Route | Composant | Description |
| --- | --- | --- |
| `/domain-dashboard` | `DomainDashboard` | Tableaux de bord thématiques par domaine |
| `/carte` | `RegionMapPage` | Carte interactive régionale |

#### Espace Administration (`admin`)

| Route | Composant | Description |
| --- | --- | --- |
| `/admin/users` | `UsersAdmin` | Gestion des comptes utilisateurs et rôles |
| `/admin/etablissements` | `EtablissementsAdmin` | Référentiel des établissements |
| `/admin/audit` | `AuditAdmin` | Journaux d'audit et de traçabilité système |



## Structure du projet

```
src/
├── assets/                  → Images, icônes et ressources statiques
├── components/              → Composants UI (shadcn/ui, wizard de saisie, cartes)
├── config/                  → Configurations globales de l'application
├── hooks/                   → Hooks React personnalisés organisés par domaine
│   ├── AffairesFeminines/   → Hooks spécifiques au domaine Affaires Féminines
│   ├── Creches/             → Hooks spécifiques au domaine Petite Enfance & Crèches
│   ├── Infrastructure/      → Hooks spécifiques au domaine Infrastructure
│   ├── Jeunesse/            → Hooks spécifiques au domaine Jeunesse
│   ├── ProtectionEnfance/   → Hooks spécifiques au domaine Protection de l'Enfance
│   └── common/              → Hooks partagés (useAuth, état réseau, etc.)
├── i18n/                    → Configuration de la traduction (i18next FR / AR)
├── integrations/            → Client Supabase & types générés
├── lib/                     → Fonctions utilitaires & helpers
├── pages/                   → Composants des vues principales / Routes React
├── services/                → Services métier d'agrégation de données
│   ├── regional/            → Services de calculs et traitements régionaux
│   ├── PrefDomainDashboardAffairesFemininesDataService.ts
│   ├── PrefDomainDashboardDataService.ts
│   ├── PrefDomainDashboardEnfanceCrechesDataService.ts
│   ├── PrefDomainDashboardInfrastructureDataService.ts
│   └── PrefDomainDashboardProtectionEnfanceDataService.ts

```


## PFE — Bajadda Hanane & Ahdad Hiba
Licence SITD — FST Settat — 2024-2025