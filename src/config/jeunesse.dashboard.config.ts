import { Activity, Gauge, Handshake, Target, Trophy, Users } from "lucide-react";
import type { DashboardConfig } from "./dashboard.types";

export const jeunesseDashboardConfig: DashboardConfig = {
  domain: "jeunesse",
  kpis: [
    {
      id: "totalActivities",
      translationKey: "prefDomainDashboard.kpis.activities",
      fallback: "Total des Activités",
      icon: Activity,
      accentClass: "bg-[hsl(var(--kpi-2))]",
      iconContainerClass: "bg-[hsl(var(--kpi-2-soft))] text-[hsl(var(--kpi-2))]",
      format: "number",
    },
    {
      id: "totalBeneficiaries",
      translationKey: "prefDomainDashboard.kpis.beneficiaries",
      fallback: "Total Bénéficiaires",
      icon: Users,
      accentClass: "bg-[hsl(var(--kpi-3))]",
      iconContainerClass: "bg-[hsl(var(--kpi-3-soft))] text-[hsl(var(--kpi-3))]",
      format: "number",
    },
    {
      id: "coverageRate",
      translationKey: "prefDomainDashboard.kpis.coverage",
      fallback: "Taux de Couverture",
      icon: Target,
      accentClass: "bg-[hsl(var(--kpi-6))]",
      iconContainerClass: "bg-[hsl(var(--kpi-6-soft))] text-[hsl(var(--kpi-6))]",
      format: "percentage",
      zeroFallback: 12.5,
    },
    {
      id: "feminizationRate",
      translationKey: "prefDomainDashboard.kpis.feminization",
      fallback: "Taux de Féminisation",
      icon: Trophy,
      accentClass: "bg-[hsl(var(--kpi-1))]",
      iconContainerClass: "bg-[hsl(var(--kpi-1-soft))] text-[hsl(var(--kpi-1))]",
      format: "percentage",
    },
    {
      id: "activePartnerships",
      translationKey: "prefDomainDashboard.kpis.partnerships",
      fallback: "Total Partenariats",
      icon: Handshake,
      accentClass: "bg-[hsl(var(--kpi-4))]",
      iconContainerClass: "bg-[hsl(var(--kpi-4-soft))] text-[hsl(var(--kpi-4))]",
      format: "number",
    },
    {
      id: "activeEstablishments",
      translationKey: "prefDomainDashboard.kpis.establishments",
      fallback: "Établissements Actifs",
      icon: Gauge,
      accentClass: "bg-[hsl(var(--kpi-5))]",
      iconContainerClass: "bg-[hsl(var(--kpi-5-soft))] text-[hsl(var(--kpi-5))]",
      format: "number",
    },
  ],
  repartitionCharts: [
    {
      type: "volume",
      title: {
        translationKey: "prefDomainDashboard.charts.volumeTitle",
        fallback: "Volume Global par Programme",
      },
      subtitle: {
        translationKey: "prefDomainDashboard.charts.volumeSubtitle",
        fallback: "Nombre absolu de bénéficiaires impactés",
      },
    },
    {
      type: "mixity",
      title: {
        translationKey: "prefDomainDashboard.charts.mixityTitle",
        fallback: "Mixité H / F par Programme (%)",
      },
      subtitle: {
        translationKey: "prefDomainDashboard.charts.mixitySubtitle",
        fallback: "Taux de féminisation comparatif",
      },
    },
    {
      type: "coverage",
      title: {
        translationKey: "prefDomainDashboard.charts.coverageTitle",
        fallback: "Couverture Territorial (Urbain / Rural)",
      },
      subtitle: {
        translationKey: "prefDomainDashboard.charts.coverageSubtitle",
        fallback: "Analyse incluant les données estimées",
      },
    },
  ],
  evolutionChart: {
    title: {
      translationKey: "prefDomainDashboard.charts.evolutionCardTitle",
      fallback: "Trajectoire des performances par programme",
    },
    subtitle: {
      translationKey: "prefDomainDashboard.charts.evolutionCardSubtitle",
      fallback: "Évolution du nombre de bénéficiaires (T1 à T4) pour les axes éligibles",
    },
  },
  benchmark: {
    translationKey: "prefDomainDashboard.benchmark.title",
    fallback: "Benchmark régional",
  },
  sections: [
    {
      id: "workflow",
      title: { translationKey: "prefDomainDashboard.workflow.title", fallback: "Suivi du rapport" },
      className: "space-y-3",
      headingClassName: "text-base sm:text-lg font-bold text-foreground",
      headingWrapperClassName: "flex items-baseline justify-between",
    },
    {
      id: "kpis",
      title: {
        translationKey: "prefDomainDashboard.keyIndicators",
        fallback: "Top KPIs principaux",
      },
      className: "",
      headingClassName: "",
    },
    {
      id: "repartition",
      title: {
        translationKey: "prefDomainDashboard.charts.axeTitle",
        fallback: "Répartition des bénéficiaires par axe",
      },
      className: "space-y-4",
      headingClassName: "text-lg font-bold text-foreground",
    },
    {
      id: "evolution",
      title: {
        translationKey: "prefDomainDashboard.charts.evolutionTitle",
        fallback: "Évolution trimestrielle des bénéficiaires",
      },
      className: "space-y-4",
      headingClassName: "text-lg font-bold text-foreground",
      headingWrapperClassName: "flex items-center justify-between",
    },
    {
      id: "benchmark",
      title: {
        translationKey: "prefDomainDashboard.benchmark.title",
        fallback: "Benchmark régional",
      },
      className: "space-y-3",
      headingClassName: "text-base sm:text-lg font-bold text-foreground",
    },
    {
      id: "details",
      title: {
        translationKey: "prefDomainDashboard.details.title",
        fallback: "Lecture détaillée du rapport",
      },
      className: "space-y-2",
      headingClassName: "text-base sm:text-lg font-bold text-foreground",
    },
  ],
};
