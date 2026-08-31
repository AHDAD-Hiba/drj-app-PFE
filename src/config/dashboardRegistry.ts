import type { DashboardConfig } from "./dashboard.types";
import { jeunesseDashboardConfig } from "./jeunesse.dashboard.config";

const dashboardRegistry: Record<string, DashboardConfig> = {
  [jeunesseDashboardConfig.domain]: jeunesseDashboardConfig,
};

export const getDashboardConfig = (domain: string): DashboardConfig => {
  const config = dashboardRegistry[domain];

  if (!config) {
    throw new Error(`Configuration de dashboard introuvable pour le domaine : ${domain}`);
  }

  return config;
};
