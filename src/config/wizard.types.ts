import { ComponentType } from 'react';

// 1. Le contrat pour les props de tes composants d'étapes (Step1, Step2, etc.)
// C'est exactement ce que ton Saisie.tsx actuel passera aux enfants.
export interface StepComponentProps {
  rapportId: string | null;
  disabled: boolean;
  onActivity: () => Promise<void>;
}

// 2. Le contrat pour définir une étape dans la barre de progression (Stepper)
export interface DomainStep {
  id: number;
  labelFr: string;
  labelAr: string;
  // Le composant React qui sera affiché pour cette étape
  component: ComponentType<StepComponentProps>;
}

// 3. Le contrat global pour un Domaine (Jeunesse ou Affaires Féminines)
export interface DomainConfig {
  id: string; // L'ID du domaine dans la base de données
  name: string; // ex: 'jeunesse' ou 'femme'
  steps: DomainStep[]; // La liste des étapes de ce domaine
  // La fonction pour calculer la complétude spécifique à ce domaine
  useCompleteness: (rapportId: string | null, refreshTrigger?: number) => number; 
}