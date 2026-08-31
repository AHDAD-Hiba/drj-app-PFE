import type { TFunction } from "i18next";
import { Activity, Gauge, Handshake, Target, Trophy, Users } from "lucide-react";
import type { KpiItem } from "./types";

/**
 * Forme des KPIs bruts du domaine Jeunesse, tels que renvoyés par
 * PrefDomainDashboardDataService (dashboardData.kpis).
 */
export interface JeunesseKpis {
  totalActivities: number;
  totalBeneficiaries: number;
  coverageRate: number;
  feminizationRate: number;
  activePartnerships: number;
  activeEstablishments: number;
}

/**
 * Construit la liste des 6 KPIs du domaine Jeunesse pour Section2.
 * Reconstruit exactement l'ordre, les icônes, les couleurs, les labels
 * et le format existants — aucune régression visuelle.
 */
export const buildJeunesseKpiItems = (
  kpis: JeunesseKpis,
  t: TFunction,
): KpiItem[] => [
  // 1. Total des Activités
  {
    id: "totalActivities",
    icon: <Activity className="h-5 w-5" />,
    value: kpis.totalActivities,
    format: "number",
    label: t("prefDomainDashboard.kpis.activities", "Total des Activités"),
    color: {
      accentBarClassName: "bg-[hsl(var(--kpi-2))]",
      iconWrapperClassName: "bg-[hsl(var(--kpi-2-soft))] text-[hsl(var(--kpi-2))]",
    },
  },
  // 2. Total Bénéficiaires
  {
    id: "totalBeneficiaries",
    icon: <Users className="h-5 w-5" />,
    value: kpis.totalBeneficiaries,
    format: "number",
    label: t("prefDomainDashboard.kpis.beneficiaries", "Total Bénéficiaires"),
    color: {
      accentBarClassName: "bg-[hsl(var(--kpi-3))]",
      iconWrapperClassName: "bg-[hsl(var(--kpi-3-soft))] text-[hsl(var(--kpi-3))]",
    },
  },
  // 3. Taux de Couverture
  {
    id: "coverageRate",
    icon: <Target className="h-5 w-5" />,
    // Comportement original conservé à l'identique (y compris le fallback 12.5)
    value: `${kpis.coverageRate?.toFixed(1) || 12.5}%`,
    format: "text",
    label: t("prefDomainDashboard.kpis.coverage", "Taux de Couverture"),
    color: {
      accentBarClassName: "bg-[hsl(var(--kpi-6))]",
      iconWrapperClassName: "bg-[hsl(var(--kpi-6-soft))] text-[hsl(var(--kpi-6))]",
    },
  },
  // 4. Taux de Féminisation
  {
    id: "feminizationRate",
    icon: <Trophy className="h-5 w-5" />,
    value: `${kpis.feminizationRate.toFixed(1)}%`,
    format: "text",
    label: t("prefDomainDashboard.kpis.feminization", "Taux de Féminisation"),
    color: {
      accentBarClassName: "bg-[hsl(var(--kpi-1))]",
      iconWrapperClassName: "bg-[hsl(var(--kpi-1-soft))] text-[hsl(var(--kpi-1))]",
    },
  },
  // 5. Total Partenariats
  {
    id: "activePartnerships",
    icon: <Handshake className="h-5 w-5" />,
    value: kpis.activePartnerships,
    format: "number",
    label: t("prefDomainDashboard.kpis.partnerships", "Total Partenariats"),
    color: {
      accentBarClassName: "bg-[hsl(var(--kpi-4))]",
      iconWrapperClassName: "bg-[hsl(var(--kpi-4-soft))] text-[hsl(var(--kpi-4))]",
    },
  },
  // 6. Établissements Actifs
  {
    id: "activeEstablishments",
    icon: <Gauge className="h-5 w-5" />,
    value: kpis.activeEstablishments,
    format: "number",
    label: t("prefDomainDashboard.kpis.establishments", "Établissements Actifs"),
    color: {
      accentBarClassName: "bg-[hsl(var(--kpi-5))]",
      iconWrapperClassName: "bg-[hsl(var(--kpi-5-soft))] text-[hsl(var(--kpi-5))]",
    },
  },
];
