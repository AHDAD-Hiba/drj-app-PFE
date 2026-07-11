// src/config/domainRegistry.ts
import { DomainConfig } from './wizard.types';
import { jeunesseConfig } from './jeunesse.config';

// Ce dictionnaire associe le nom du domaine (sélectionné au début) à sa configuration
const registry: Record<string, DomainConfig> = {
  'jeunesse': jeunesseConfig,
  // C'est ICI que l'on ajoutera 'femme': afConfig très bientôt !
  'test_domaine': {
    id: 'un-id-fictif-de-bdd',
    name: 'test_domaine',
    useCompleteness: () => 50, // Il affichera directement 50% pour le test
    steps: [
      { id: 1, labelFr: 'Étape Test', labelAr: 'خطوة تجريبية', component: jeunesseConfig.steps[0].component }
    ]
  }
};

export const getDomainConfig = (domainName: string): DomainConfig => {
  const config = registry[domainName];
  if (!config) {
    throw new Error(`Configuration introuvable pour le domaine : ${domainName}`);
  }
  return config;
};