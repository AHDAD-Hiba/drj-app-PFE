import type { ComponentType } from "react";

export interface DashboardKpis {
  totalBeneficiaries: number;
  totalActivities: number;
  feminizationRate: number;
  coverageRate: number;
  activeEstablishments: number;
  activePartnerships: number;
}

export type DashboardKpiFormat = "number" | "percentage";
export type RepartitionChartType = "volume" | "mixity" | "coverage";

export interface DashboardText {
  translationKey: string;
  fallback: string;
}

export interface DashboardKpiConfig {
  id: keyof DashboardKpis;
  translationKey: string;
  fallback: string;
  icon: ComponentType<{ className?: string }>;
  accentClass: string;
  iconContainerClass: string;
  format: DashboardKpiFormat;
  zeroFallback?: number;
}

export interface RepartitionChartConfig {
  type: RepartitionChartType;
  title: DashboardText;
  subtitle: DashboardText;
}

export interface EvolutionChartConfig {
  title: DashboardText;
  subtitle: DashboardText;
}

export interface DashboardSectionConfig {
  id: "workflow" | "kpis" | "repartition" | "evolution" | "benchmark" | "details";
  title: DashboardText;
  className: string;
  headingClassName: string;
  headingWrapperClassName?: string;
}

export interface DashboardConfig {
  domain: string;
  kpis: readonly DashboardKpiConfig[];
  repartitionCharts: readonly RepartitionChartConfig[];
  evolutionChart: EvolutionChartConfig;
  benchmark: DashboardText;
  sections: readonly DashboardSectionConfig[];
}
