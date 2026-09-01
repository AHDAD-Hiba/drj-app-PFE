import type { TFunction } from "i18next";
import { AlertTriangle, HardHat, Handshake, Target, TrendingUp, Wallet } from "lucide-react";
import type { KpiItem } from "./types";
import type { InfrastructureKpisRaw } from "@/services/PrefDomainDashboardInfrastructureDataService";

const formatAmount = (n: number, lang: string) =>
  `${new Intl.NumberFormat(lang === "ar" ? "ar-MA" : "fr-FR").format(Math.round(n))} DH`;

/**
 * Construit les 6 KPIs du domaine Infrastructure pour Section2.
 * Les icônes et couleurs sont propres à ce domaine — Section2 ne
 * décide jamais quelle icône utiliser.
 */
export const buildInfrastructureKpiItems = (
  kpis: InfrastructureKpisRaw,
  t: TFunction,
  lang: string,
): KpiItem[] => {
  return [
    // 1. Taux d'exécution budgétaire (Σ crédits payés / Σ crédits ouverts)
    {
      id: "budgetExecutionRate",
      icon: <Target className="h-5 w-5" />,
      value: `${kpis.budgetExecutionRate.toFixed(1)}%`,
      format: "text",
      label: t(
        "prefDomainDashboard.infrastructure.kpis.executionRate",
        "Taux d'exécution budgétaire",
      ),
      color: {
        accentBarClassName: "bg-[hsl(var(--kpi-6))]",
        iconWrapperClassName: "bg-[hsl(var(--kpi-6-soft))] text-[hsl(var(--kpi-6))]",
      },
    },
    // 2. Taux d'engagement budgétaire (Σ crédits engagés / Σ crédits ouverts)
    {
      id: "budgetEngagementRate",
      icon: <TrendingUp className="h-5 w-5" />,
      value: `${kpis.budgetEngagementRate.toFixed(1)}%`,
      format: "text",
      label: t(
        "prefDomainDashboard.infrastructure.kpis.engagementRate",
        "Taux d'engagement budgétaire",
      ),
      color: {
        accentBarClassName: "bg-[hsl(var(--kpi-1))]",
        iconWrapperClassName: "bg-[hsl(var(--kpi-1-soft))] text-[hsl(var(--kpi-1))]",
      },
    },
    // 3. Nombre projets BTP (construction + aménagement)
    {
      id: "totalProjetsBtp",
      icon: <HardHat className="h-5 w-5" />,
      value: kpis.totalProjetsBtp,
      format: "number",
      label: t("prefDomainDashboard.infrastructure.kpis.projetsBtp", "Nombre projets BTP"),
      color: {
        accentBarClassName: "bg-[hsl(var(--kpi-2))]",
        iconWrapperClassName: "bg-[hsl(var(--kpi-2-soft))] text-[hsl(var(--kpi-2))]",
      },
    },
    // 4. Nombre projets Partenariat
    {
      id: "totalProjetsPartenariat",
      icon: <Handshake className="h-5 w-5" />,
      value: kpis.totalProjetsPartenariat,
      format: "number",
      label: t(
        "prefDomainDashboard.infrastructure.kpis.projetsPartenariat",
        "Nombre projets Partenariat",
      ),
      color: {
        accentBarClassName: "bg-[hsl(var(--kpi-4))]",
        iconWrapperClassName: "bg-[hsl(var(--kpi-4-soft))] text-[hsl(var(--kpi-4))]",
      },
    },
    // 5. Nombre projets en souffrance
    {
      id: "totalProjetsEnSouffrance",
      icon: <AlertTriangle className="h-5 w-5" />,
      value: kpis.totalProjetsEnSouffrance,
      format: "number",
      label: t(
        "prefDomainDashboard.infrastructure.kpis.projetsEnSouffrance",
        "Nombre projets en souffrance",
      ),
      color: {
        accentBarClassName: "bg-[hsl(var(--kpi-3))]",
        iconWrapperClassName: "bg-[hsl(var(--kpi-3-soft))] text-[hsl(var(--kpi-3))]",
      },
    },
    // 6. Montant total des arriérés (Eau + Électricité)
    {
      id: "totalArrieres",
      icon: <Wallet className="h-5 w-5" />,
      value: formatAmount(kpis.totalArrieres, lang),
      format: "text",
      label: t("prefDomainDashboard.infrastructure.kpis.arrieres", "Montant total des arriérés"),
      color: {
        accentBarClassName: "bg-[hsl(var(--kpi-5))]",
        iconWrapperClassName: "bg-[hsl(var(--kpi-5-soft))] text-[hsl(var(--kpi-5))]",
      },
    },
  ];
};
