// src/config/domainRegistry.ts
import { DomainConfig } from "./wizard.types";
import { jeunesseConfig } from "./jeunesse.config";
import { affairesFemininesConfig } from "./affairesFeminines.config";
import { infrastructureConfig } from "./infrastructure.config";
import { protectionEnfanceConfig } from "./protectionEnfance.config";
import { crechesConfig } from "./creches.config";

// Ce dictionnaire associe le nom du domaine (sélectionné au début) à sa configuration
const registry: Record<string, DomainConfig> = {
  jeunesse: jeunesseConfig,
  femme: affairesFemininesConfig,
  infra: infrastructureConfig,
  pe: protectionEnfanceConfig,
  creches: crechesConfig,
};

export const getDomainConfig = (domainName: string): DomainConfig => {
  const key = domainName.toLowerCase();

  const config = registry[key];

  if (!config) {
    throw new Error(`Configuration introuvable pour le domaine : ${domainName}`);
  }

  return config;
};
