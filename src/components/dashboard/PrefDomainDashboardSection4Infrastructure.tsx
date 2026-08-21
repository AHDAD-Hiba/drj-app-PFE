import type { TFunction } from "i18next";
import { Card } from "@/components/ui/card";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type {
  InfrastructureEvolutionBudgetDatum,
  InfrastructureEvolutionArrieresDatum,
  InfrastructureEvolutionProjetsDatum,
} from "@/services/PrefDomainDashboardInfrastructureDataService";

interface PrefDomainDashboardSection4InfrastructureProps {
  budget: InfrastructureEvolutionBudgetDatum[];
  arrieres: InfrastructureEvolutionArrieresDatum[];
  projets: InfrastructureEvolutionProjetsDatum[];
  lang: string;
  t: TFunction;
}

const quarterTickFormatter = (t: TFunction) => (value: string) =>
  t(`prefDomainDashboard.quarters.${String(value).toLowerCase()}`, String(value)) as string;

/**
 * Section4 Infrastructure : 3 graphiques d'évolution trimestrielle (T1 → T4).
 * 1. Évolution budgétaire (Ouverts vs Payés)
 * 2. Évolution des arriérés Eau / Électricité
 * 3. Évolution du nombre de projets (BTP vs Partenariat)
 */
export const PrefDomainDashboardSection4Infrastructure = ({
  budget,
  arrieres,
  projets,
  lang,
  t,
}: PrefDomainDashboardSection4InfrastructureProps) => {
  const tickFormatter = quarterTickFormatter(t);

  const yAxisProps = {
    orientation: "left" as const,
    axisLine: { stroke: "hsl(var(--muted-foreground))" },
    tickLine: { stroke: "hsl(var(--muted-foreground))" },
    width: 55,
    tick: { fontSize: 11, fill: "hsl(var(--muted-foreground))", dx: lang === "ar" ? -18 : 0 },
  };

  const xAxisProps = {
    dataKey: "name",
    axisLine: { stroke: "hsl(var(--muted-foreground))" },
    tickLine: { stroke: "hsl(var(--muted-foreground))" },
    tick: { fontSize: 12, fill: "hsl(var(--muted-foreground))" },
    dy: 10,
    interval: 0 as const,
    height: 40,
    tickFormatter,
  };

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-foreground">
          {t("prefDomainDashboard.infrastructure.section4.title", "Évolution trimestrielle")}
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* 1. Évolution budgétaire */}
        <Card className="p-5">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-foreground">
              {t("prefDomainDashboard.infrastructure.section4.budgetTitle", "Évolution budgétaire")}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {t("prefDomainDashboard.infrastructure.section4.budgetSubtitle", "Crédits ouverts vs payés (DH)")}
            </p>
          </div>
          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={budget} margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
                <defs>
                  <linearGradient id="colorOuverts" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorPayes" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis {...xAxisProps} />
                <YAxis {...yAxisProps} />
                <Tooltip
                  contentStyle={{ borderRadius: "8px", border: "1px solid hsl(var(--border))", fontSize: "12px" }}
                />
                <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }} iconType="circle" />
                <Area
                  type="linear"
                  dataKey="Ouverts"
                  name={t("prefDomainDashboard.infrastructure.section4.ouverts", "Ouverts")}
                  stroke="#3b82f6"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorOuverts)"
                  connectNulls
                />
                <Area
                  type="linear"
                  dataKey="Payes"
                  name={t("prefDomainDashboard.infrastructure.section4.payes", "Payés")}
                  stroke="#10b981"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorPayes)"
                  connectNulls
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* 2. Évolution des arriérés Eau / Électricité */}
        <Card className="p-5">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-foreground">
              {t("prefDomainDashboard.infrastructure.section4.arrearsTitle", "Évolution des arriérés")}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {t("prefDomainDashboard.infrastructure.section4.arrearsSubtitle", "Eau vs Électricité (DH)")}
            </p>
          </div>
          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={arrieres} margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
                <defs>
                  <linearGradient id="colorEau" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis {...xAxisProps} />
                <YAxis {...yAxisProps} />
                <Tooltip
                  contentStyle={{ borderRadius: "8px", border: "1px solid hsl(var(--border))", fontSize: "12px" }}
                />
                <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }} iconType="circle" />
                <Area
                  type="linear"
                  dataKey="Eau"
                  name={t("prefDomainDashboard.infrastructure.section4.water", "Eau")}
                  stroke="#0ea5e9"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorEau)"
                  connectNulls
                />
                <Area
                  type="linear"
                  dataKey="Electricite"
                  name={t("prefDomainDashboard.infrastructure.section4.electricity", "Électricité")}
                  stroke="#f59e0b"
                  strokeWidth={2}
                  fill="none"
                  connectNulls
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* 3. Évolution du nombre de projets (BTP vs Partenariat) */}
        <Card className="p-5">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-foreground">
              {t("prefDomainDashboard.infrastructure.section4.projectsTitle", "Évolution du nombre de projets")}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {t("prefDomainDashboard.infrastructure.section4.projectsSubtitle", "BTP vs Partenariat")}
            </p>
          </div>
          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={projets} margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
                <defs>
                  <linearGradient id="colorBtp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis {...xAxisProps} />
                <YAxis {...yAxisProps} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ borderRadius: "8px", border: "1px solid hsl(var(--border))", fontSize: "12px" }}
                />
                <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }} iconType="circle" />
                <Area
                  type="linear"
                  dataKey="BTP"
                  name={t("prefDomainDashboard.infrastructure.section4.btp", "BTP")}
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorBtp)"
                  connectNulls
                />
                <Area
                  type="linear"
                  dataKey="Partenariat"
                  name={t("prefDomainDashboard.infrastructure.section4.partenariat", "Partenariat")}
                  stroke="#ec4899"
                  strokeWidth={2}
                  fill="none"
                  connectNulls
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </section>
  );
};
