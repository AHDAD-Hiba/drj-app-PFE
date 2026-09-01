import type { RegionalDashboardService } from "./types";
import {
  loadJeunesseRegionalDashboard,
  type JeunesseRegionalDashboardData,
} from "./jeunesseRegionalService";
import {
  loadInfrastructureRegionalDashboard,
  type InfrastructureRegionalDashboardData,
} from "./infrastructureRegionalService";
import {
  loadFemmeRegionalDashboard,
  type FemmeRegionalDashboardData,
} from "./femmeRegionalService";
import { loadPeRegionalDashboard, type PeRegionalDashboardData } from "./peRegionalService";
import {
  loadCrechesRegionalDashboard,
  type CrechesRegionalDashboardData,
} from "./crechesRegionalService";

export const REGIONAL_DOMAIN_CODES = ["JEUNESSE", "INFRA", "FEMME", "PE", "CRECHES"] as const;
export type RegionalDomainCode = (typeof REGIONAL_DOMAIN_CODES)[number];

export type RegionalDashboardPayload =
  | JeunesseRegionalDashboardData
  | InfrastructureRegionalDashboardData
  | FemmeRegionalDashboardData
  | PeRegionalDashboardData
  | CrechesRegionalDashboardData;

/**
 * Registre typé des chargeurs régionaux. Chaque service renvoie
 * `RegionalDashboardData<...>` avec ses propres types métier ; l'union
 * `RegionalDashboardPayload` est le contrat consommé par la page.
 */
export const regionalDashboardServices = {
  JEUNESSE: loadJeunesseRegionalDashboard,
  INFRA: loadInfrastructureRegionalDashboard,
  FEMME: loadFemmeRegionalDashboard,
  PE: loadPeRegionalDashboard,
  CRECHES: loadCrechesRegionalDashboard,
} satisfies Record<RegionalDomainCode, RegionalDashboardService<RegionalDashboardPayload>>;

export function getRegionalDashboardService(
  domainCode: string,
): RegionalDashboardService<RegionalDashboardPayload> | null {
  const code = REGIONAL_DOMAIN_CODES.find((item) => item === domainCode);
  if (!code) return null;
  return regionalDashboardServices[code];
}

export interface RegionalMetricLabels {
  metricPrimaryLabel: string;
  metricSecondaryLabel: string;
  /** true si metric_primary est un pourcentage (actuellement uniquement INFRA) */
  isPrimaryPercent: boolean;
  /**
   * true lorsque le service renseigne comparison.score / comparison.directions[].rank
   * avec une formule existante (pas un placeholder).
   */
  hasRealRanking: boolean;
}

/**
 * Libellés des métriques primary/secondary, alignés sur comparison.* des services.
 */
export function getRegionalMetricLabels(
  domainCode: string,
  t: (key: string, fallback: string) => string,
): RegionalMetricLabels {
  switch (domainCode) {
    case "INFRA":
      return {
        metricPrimaryLabel: t(
          "regDomainDashboard.infra.metrics.budgetExecutionRate",
          "Taux d'exécution budgétaire",
        ),
        metricSecondaryLabel: t(
          "regDomainDashboard.infra.metrics.projectsCount",
          "Nombre de projets",
        ),
        isPrimaryPercent: true,
        hasRealRanking: true,
      };
    case "FEMME":
      return {
        metricPrimaryLabel: t(
          "regDomainDashboard.femme.kpis.inscriptionsFormation",
          "Inscriptions en formation",
        ),
        metricSecondaryLabel: t(
          "regDomainDashboard.femme.metrics.beneficiairesAccompagnes",
          "Bénéficiaires accompagnés",
        ),
        isPrimaryPercent: false,
        hasRealRanking: true,
      };
    case "PE":
      return {
        metricPrimaryLabel: t(
          "regDomainDashboard.pe.kpis.beneficiairesPriseEnCharge",
          "Bénéficiaires en prise en charge",
        ),
        metricSecondaryLabel: t(
          "regDomainDashboard.pe.kpis.integrationsLiberteSurveillee",
          "Intégrations en liberté surveillée",
        ),
        isPrimaryPercent: false,
        hasRealRanking: true,
      };
    case "CRECHES":
      return {
        metricPrimaryLabel: t(
          "regDomainDashboard.creches.kpis.enfantsPrisEnCharge",
          "Enfants pris en charge",
        ),
        metricSecondaryLabel: t(
          "regDomainDashboard.creches.kpis.demandesLicencesTraitees",
          "Demandes de licences traitées",
        ),
        isPrimaryPercent: false,
        hasRealRanking: true,
      };
    case "JEUNESSE":
    default:
      return {
        metricPrimaryLabel: t("RegDomainDashboard.section5.columns.metricPrimary", "Activités"),
        metricSecondaryLabel: t(
          "RegDomainDashboard.section5.columns.metricSecondary",
          "Bénéficiaires",
        ),
        isPrimaryPercent: false,
        hasRealRanking: true,
      };
  }
}
