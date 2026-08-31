import type { TFunction } from "i18next";
import { AlertTriangle, GraduationCap, Globe2, ShieldCheck, TrendingUp, Users } from "lucide-react";
import type { KpiItem } from "./types";
import type { ProtectionEnfanceKpisRaw } from "@/services/PrefDomainDashboardProtectionEnfanceDataService";

/**
 * Construit les 6 KPIs du domaine Protection de l'Enfance pour Section2.
 * Les icônes et couleurs sont propres à ce domaine — Section2 ne décide
 * jamais quelle icône utiliser.
 */
export const buildProtectionEnfanceKpiItems = (
  kpis: ProtectionEnfanceKpisRaw,
  t: TFunction,
): KpiItem[] => [
  // 1. Bénéficiaires en prise en charge (Σ garçons + filles)
  {
    id: "totalBeneficiairesPriseEnCharge",
    icon: <Users className="h-5 w-5" />,
    value: kpis.totalBeneficiairesPriseEnCharge,
    format: "number",
    label: t(
      "prefDomainDashboard.protectionEnfance.kpis.priseEnCharge",
      "Bénéficiaires en prise en charge",
    ),
    color: {
      accentBarClassName: "bg-[hsl(var(--kpi-1))]",
      iconWrapperClassName: "bg-[hsl(var(--kpi-1-soft))] text-[hsl(var(--kpi-1))]",
    },
  },
  // 2. Taux de préparation à l'intégration (moyenne des lignes renseignées)
  {
    id: "tauxPreparationIntegrationMoyen",
    icon: <TrendingUp className="h-5 w-5" />,
    value: `${kpis.tauxPreparationIntegrationMoyen.toFixed(1)}%`,
    format: "text",
    label: t(
      "prefDomainDashboard.protectionEnfance.kpis.tauxPreparationIntegration",
      "Taux de préparation à l'intégration",
    ),
    color: {
      accentBarClassName: "bg-[hsl(var(--kpi-6))]",
      iconWrapperClassName: "bg-[hsl(var(--kpi-6-soft))] text-[hsl(var(--kpi-6))]",
    },
  },
  // 3. Bénéficiaires Éducation & Formation (formel + non-formel + soutien)
  {
    id: "totalBeneficiairesEducationFormation",
    icon: <GraduationCap className="h-5 w-5" />,
    value: kpis.totalBeneficiairesEducationFormation,
    format: "number",
    label: t(
      "prefDomainDashboard.protectionEnfance.kpis.educationFormation",
      "Bénéficiaires Éducation & Formation",
    ),
    color: {
      accentBarClassName: "bg-[hsl(var(--kpi-4))]",
      iconWrapperClassName: "bg-[hsl(var(--kpi-4-soft))] text-[hsl(var(--kpi-4))]",
    },
  },
  // 4. Intégrations en Liberté Surveillée (scolaire + formation pro + stage + associations)
  {
    id: "totalIntegrationsLiberteSurveillee",
    icon: <ShieldCheck className="h-5 w-5" />,
    value: kpis.totalIntegrationsLiberteSurveillee,
    format: "number",
    label: t(
      "prefDomainDashboard.protectionEnfance.kpis.integrationsLiberteSurveillee",
      "Intégrations en Liberté Surveillée",
    ),
    color: {
      accentBarClassName: "bg-[hsl(var(--kpi-2))]",
      iconWrapperClassName: "bg-[hsl(var(--kpi-2-soft))] text-[hsl(var(--kpi-2))]",
    },
  },
  // 5. Incidents exceptionnels signalés (Σ nombre_cas)
  {
    id: "totalIncidentsSignales",
    icon: <AlertTriangle className="h-5 w-5" />,
    value: kpis.totalIncidentsSignales,
    format: "number",
    label: t(
      "prefDomainDashboard.protectionEnfance.kpis.incidentsSignales",
      "Incidents exceptionnels signalés",
    ),
    color: {
      accentBarClassName: "bg-[hsl(var(--kpi-3))]",
      iconWrapperClassName: "bg-[hsl(var(--kpi-3-soft))] text-[hsl(var(--kpi-3))]",
    },
  },
  // 6. Mineurs migrants non accompagnés (Σ migrants_non_accompagnes)
  {
    id: "totalMigrantsNonAccompagnes",
    icon: <Globe2 className="h-5 w-5" />,
    value: kpis.totalMigrantsNonAccompagnes,
    format: "number",
    label: t(
      "prefDomainDashboard.protectionEnfance.kpis.migrantsNonAccompagnes",
      "Mineurs migrants non accompagnés",
    ),
    color: {
      accentBarClassName: "bg-[hsl(var(--kpi-5))]",
      iconWrapperClassName: "bg-[hsl(var(--kpi-5-soft))] text-[hsl(var(--kpi-5))]",
    },
  },
];
