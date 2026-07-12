// src/config/domainRegistry.ts
import { DomainConfig } from './wizard.types';
import { jeunesseConfig } from './jeunesse.config';
import { affairesFemininesConfig } from './affairesFeminines.config';

// Ce dictionnaire associe le nom du domaine (sélectionné au début) à sa configuration
const registry: Record<string, DomainConfig> = {
  'jeunesse': jeunesseConfig,
  // C'est ICI que l'on ajoutera 'femme': afConfig très bientôt !
  'femme': affairesFemininesConfig,
};

export const getDomainConfig = (domainName: string): DomainConfig => {
  const config = registry[domainName];
  if (!config) {
    throw new Error(`Configuration introuvable pour le domaine : ${domainName}`);
  }
  return config;
};