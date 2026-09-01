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
  ProtectionEnfancePriseChargeDatum,
  ProtectionEnfanceIncidentTypeDatum,
  ProtectionEnfanceActiviteDomaineDatum,
} from "@/services/PrefDomainDashboardProtectionEnfanceDataService";

interface PrefDomainDashboardSection3ProtectionEnfanceProps {
  priseEnCharge: ProtectionEnfancePriseChargeDatum[];
  incidentsParType: ProtectionEnfanceIncidentTypeDatum[];
  beneficiairesParDomaine: ProtectionEnfanceActiviteDomaineDatum[];
  lang: string;
  t: TFunction;
}

const PRISE_EN_CHARGE_COLORS: Record<string, string> = {
  centre_sauvegarde: "hsl(var(--kpi-4))",
  liberte_surveillee: "hsl(var(--kpi-2))",
};

const CATEGORICAL_COLORS = [
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
  "#f59e0b",
  "#10b981",
  "#0ea5e9",
  "#f43f5e",
  "#6366f1",
];

const fmtNum = (n: number, lang: string) =>
  new Intl.NumberFormat(lang === "ar" ? "ar-MA" : "fr-FR").format(Math.round(n));

/**
 * Section3 Protection de l'Enfance : 3 cartes uniquement.
 * 1. Centre de sauvegarde vs Liberté surveillée (Donut)
 * 2. Incidents par type (Horizontal Bar, tri décroissant)
 * 3. Bénéficiaires par domaine d'activité (Horizontal Bar, tri décroissant)
 */
export const PrefDomainDashboardSection3ProtectionEnfance = ({
  priseEnCharge,
  incidentsParType,
  beneficiairesParDomaine,
  lang,
  t,
}: PrefDomainDashboardSection3ProtectionEnfanceProps) => {
  const tCategory = (key: string) =>
    t(`prefDomainDashboard.protectionEnfance.categories.${key}`, key) as string;

  const priseEnChargeData = priseEnCharge.map((row) => ({
    ...row,
    nameLabel: tCategory(row.name),
  }));

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-foreground">
          {t(
            "prefDomainDashboard.protectionEnfance.section3.title",
            "Prise en charge, incidents & activités",
          )}
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Carte 1 : Centre de sauvegarde vs Liberté surveillée (Donut) */}
        <Card className="p-5 flex flex-col">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-foreground">
              {t(
                "prefDomainDashboard.protectionEnfance.section3.priseEnChargeTitle",
                "Centre de sauvegarde vs Liberté surveillée",
              )}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {t(
                "prefDomainDashboard.protectionEnfance.section3.priseEnChargeSubtitle",
                "Bénéficiaires (garçons + filles) par type de prise en charge",
              )}
            </p>
          </div>
          <div className="h-[250px] w-full mt-auto">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={priseEnChargeData}
                  dataKey="value"
                  nameKey="nameLabel"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={2}
                >
                  {priseEnChargeData.map((entry) => (
                    <Cell
                      key={entry.name}
                      fill={PRISE_EN_CHARGE_COLORS[entry.name] || "hsl(var(--muted-foreground))"}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    borderRadius: "8px",
                    border: "1px solid hsl(var(--border))",
                    fontSize: "12px",
                  }}
                  formatter={(value: number) => fmtNum(value, lang)}
                />
                <Legend
                  wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }}
                  iconType="circle"
                  formatter={(value: string) =>
                    t(`prefDomainDashboard.protectionEnfance.priseEnChargeTypes.${value}`, value)
                  }
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Carte 2 : Incidents par type (Horizontal Bar) */}
        <Card className="p-5 flex flex-col">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-foreground">
              {t(
                "prefDomainDashboard.protectionEnfance.section3.incidentsTitle",
                "Incidents par type",
              )}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {t(
                "prefDomainDashboard.protectionEnfance.section3.incidentsSubtitle",
                "Nombre de cas signalés, par type d'incident",
              )}
            </p>
          </div>
          <div className="h-[250px] w-full mt-auto">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={incidentsParType}
                layout="vertical"
                margin={{ top: 10, right: 20, left: lang === "ar" ? 30 : 10, bottom: 20 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  horizontal={false}
                  stroke="hsl(var(--border))"
                />
                <XAxis
                  type="number"
                  allowDecimals={false}
                  axisLine={{ stroke: "hsl(var(--muted-foreground))" }}
                  tickLine={{ stroke: "hsl(var(--muted-foreground))" }}
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  tickFormatter={(v: number) => fmtNum(v, lang)}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  orientation="left"
                  axisLine={{ stroke: "hsl(var(--muted-foreground))" }}
                  tickLine={{ stroke: "hsl(var(--muted-foreground))" }}
                  width={100}
                  tick={{
                    fontSize: 11,
                    fill: "hsl(var(--muted-foreground))",
                    textAnchor: "end",
                    dx: lang === "ar" ? -50 : 0,
                  }}
                />
                <Tooltip
                  cursor={{ fill: "hsl(var(--muted)/0.4)" }}
                  contentStyle={{
                    borderRadius: "8px",
                    border: "1px solid hsl(var(--border))",
                    fontSize: "12px",
                  }}
                  formatter={(value: number) => fmtNum(value, lang)}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={40}>
                  {incidentsParType.map((entry, idx) => (
                    <Cell
                      key={entry.id}
                      fill={CATEGORICAL_COLORS[idx % CATEGORICAL_COLORS.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Carte 3 : Bénéficiaires par domaine d'activité (Horizontal Bar) */}
        <Card className="p-5 flex flex-col">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-foreground">
              {t(
                "prefDomainDashboard.protectionEnfance.activitesTitles.title",
                "Bénéficiaires par domaine d'activité",
              )}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {t(
                "prefDomainDashboard.protectionEnfance.activitesTitles.subtitle",
                "Volume de bénéficiaires, par domaine d'activité",
              )}
            </p>
          </div>
          <div className="h-[250px] w-full mt-auto">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={beneficiairesParDomaine}
                layout="vertical"
                margin={{ top: 10, right: 20, left: 10, bottom: 20 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  horizontal={false}
                  stroke="hsl(var(--border))"
                />
                <XAxis
                  type="number"
                  allowDecimals={false}
                  axisLine={{ stroke: "hsl(var(--muted-foreground))" }}
                  tickLine={{ stroke: "hsl(var(--muted-foreground))" }}
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  tickFormatter={(v: number) => fmtNum(v, lang)}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  orientation="left"
                  axisLine={{ stroke: "hsl(var(--muted-foreground))" }}
                  tickLine={{ stroke: "hsl(var(--muted-foreground))" }}
                  width={110}
                  tick={{
                    fontSize: 11,
                    fill: "hsl(var(--muted-foreground))",
                    textAnchor: "end",
                    dx: lang === "ar" ? -90 : 0,
                  }}
                />
                <Tooltip
                  cursor={{ fill: "hsl(var(--muted)/0.4)" }}
                  contentStyle={{
                    borderRadius: "8px",
                    border: "1px solid hsl(var(--border))",
                    fontSize: "12px",
                  }}
                  formatter={(value: number) => fmtNum(value, lang)}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={40}>
                  {beneficiairesParDomaine.map((entry, idx) => (
                    <Cell
                      key={entry.id}
                      fill={CATEGORICAL_COLORS[idx % CATEGORICAL_COLORS.length]}
                    />
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
