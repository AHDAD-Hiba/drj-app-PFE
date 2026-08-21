import type { TFunction } from "i18next";
import { Card } from "@/components/ui/card";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type {
  InfrastructureBudgetStageDatum,
  InfrastructureDonutDatum,
} from "@/services/PrefDomainDashboardInfrastructureDataService";

interface PrefDomainDashboardSection3InfrastructureProps {
  budget: InfrastructureBudgetStageDatum[];
  etatProjets: InfrastructureDonutDatum[];
  natureProjets: InfrastructureDonutDatum[];
  lang: string;
  t: TFunction;
}

const ETAT_PROJETS_COLORS: Record<string, string> = {
  etudes: "#3b82f6",
  travaux: "#f59e0b",
  livraison: "#8b5cf6",
  acheve: "#10b981",
};

const NATURE_PROJETS_COLORS: Record<string, string> = {
  construction: "hsl(var(--kpi-2))",
  amenagement: "hsl(var(--kpi-4))",
};

const fmtDH = (n: number, lang: string) =>
  `${new Intl.NumberFormat(lang === "ar" ? "ar-MA" : "fr-FR").format(Math.round(n))} DH`;

/**
 * Section3 Infrastructure : 3 cartes uniquement.
 * 1. Budget Fonctionnement vs Investissement (Stacked Bar)
 * 2. État des projets — Études / Travaux / Livraison / Achevé (Donut)
 * 3. Nature des projets — Construction vs Aménagement (Horizontal Bar)
 */
export const PrefDomainDashboardSection3Infrastructure = ({
  budget,
  etatProjets,
  natureProjets,
  lang,
  t,
}: PrefDomainDashboardSection3InfrastructureProps) => {
  const tCategory = (key: string) =>
    t(`prefDomainDashboard.infrastructure.categories.${key}`, key) as string;

  const budgetData = budget.map((row) => ({
    ...row,
    categoryLabel: tCategory(row.category),
  }));

  const etatProjetsData = etatProjets.map((row) => ({
    ...row,
    nameLabel: tCategory(row.name),
  }));

  const natureProjetsData = natureProjets.map((row) => ({
    ...row,
    nameLabel: tCategory(row.name),
  }));

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-foreground">
          {t("prefDomainDashboard.infrastructure.section3.title", "Vue d'ensemble Budget & Projets")}
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Carte 1 : Budget Fonctionnement vs Investissement */}
        <Card className="p-5 flex flex-col">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-foreground">
              {t("prefDomainDashboard.infrastructure.section3.budgetTitle", "Budget Fonctionnement vs Investissement")}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {t("prefDomainDashboard.infrastructure.section3.budgetSubtitle", "Payé vs Reste à payer (DH)")}
            </p>
          </div>
          <div className="h-[250px] w-full mt-auto">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={budgetData}
                margin={{ top: 10, right: lang === "ar" ? 45 : 10, left: lang === "ar" ? 10 : 30, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="categoryLabel"
                  axisLine={{ stroke: "hsl(var(--muted-foreground))" }}
                  tickLine={{ stroke: "hsl(var(--muted-foreground))" }}
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  dy={10}
                  interval={0}
                  height={36}
                />
                <YAxis
                  orientation="left"
                  axisLine={{ stroke: "hsl(var(--muted-foreground))" }}
                  tickLine={{ stroke: "hsl(var(--muted-foreground))" }}
                  width={55}
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))", dx: lang === "ar" ? -18 : 0 }}
                />
                <Tooltip
                  cursor={{ fill: "hsl(var(--muted)/0.4)" }}
                  contentStyle={{ borderRadius: "8px", border: "1px solid hsl(var(--border))", fontSize: "12px" }}
                  formatter={(value: number) => fmtDH(value, lang)}
                />
                <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }} iconType="circle" />
                <Bar
                  dataKey="paye"
                  name={t("prefDomainDashboard.infrastructure.section3.paid", "Payé")}
                  stackId="a"
                  fill="#10b981"
                  radius={[0, 0, 4, 4]}
                  maxBarSize={60}
                />
                <Bar
                  dataKey="reste"
                  name={t("prefDomainDashboard.infrastructure.section3.remaining", "Reste à payer")}
                  stackId="a"
                  fill="#f59e0b"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={60}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Carte 2 : État des projets (Donut) */}
        <Card className="p-5 flex flex-col">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-foreground">
              {t("prefDomainDashboard.infrastructure.section3.projectStateTitle", "État des projets")}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {t(
                "prefDomainDashboard.infrastructure.section3.projectStateSubtitle",
                "Études, Travaux, Livraison, Achevé",
              )}
            </p>
          </div>
          <div className="h-[250px] w-full mt-auto">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={etatProjetsData}
                  dataKey="value"
                  nameKey="nameLabel"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={2}
                >
                  {etatProjetsData.map((entry) => (
                    <Cell key={entry.name} fill={ETAT_PROJETS_COLORS[entry.name] || "hsl(var(--muted-foreground))"} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ borderRadius: "8px", border: "1px solid hsl(var(--border))", fontSize: "12px" }}
                />
                <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Carte 3 : Nature des projets (Horizontal Bar) */}
        <Card className="p-5 flex flex-col">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-foreground">
              {t("prefDomainDashboard.infrastructure.section3.projectNatureTitle", "Nature des projets")}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {t("prefDomainDashboard.infrastructure.section3.projectNatureSubtitle", "Construction vs Aménagement")}
            </p>
          </div>
          <div className="h-[250px] w-full mt-auto">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={natureProjetsData}
                layout="vertical"
                margin={{ top: 10, right: 20, left: lang === "ar" ? 20 : 10, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                <XAxis
                  type="number"
                  allowDecimals={false}
                  axisLine={{ stroke: "hsl(var(--muted-foreground))" }}
                  tickLine={{ stroke: "hsl(var(--muted-foreground))" }}
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                />
                <YAxis
                  type="category"
                  dataKey="nameLabel"
                  axisLine={{ stroke: "hsl(var(--muted-foreground))" }}
                  tickLine={{ stroke: "hsl(var(--muted-foreground))" }}
                  width={90}
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                />
                <Tooltip
                  cursor={{ fill: "hsl(var(--muted)/0.4)" }}
                  contentStyle={{ borderRadius: "8px", border: "1px solid hsl(var(--border))", fontSize: "12px" }}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={40}>
                  {natureProjetsData.map((entry) => (
                    <Cell key={entry.name} fill={NATURE_PROJETS_COLORS[entry.name] || "hsl(var(--primary))"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </section>
  );
};
