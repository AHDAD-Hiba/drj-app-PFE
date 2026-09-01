import type { TFunction } from "i18next";
import { Card } from "@/components/ui/card";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type {
  AffairesFemininesEvolutionIntegrationDatum,
  AffairesFemininesEvolutionActiviteSocialeDatum,
} from "@/services/PrefDomainDashboardAffairesFemininesDataService";

interface PrefDomainDashboardSection4AffairesFemininesProps {
  integration: AffairesFemininesEvolutionIntegrationDatum[];
  activiteSociale: AffairesFemininesEvolutionActiviteSocialeDatum[];
  lang: string;
  t: TFunction;
}

const fmtNum = (n: number, lang: string) =>
  new Intl.NumberFormat(lang === "ar" ? "ar-MA" : "fr-FR").format(Math.round(n));

const quarterTickFormatter = (t: TFunction) => (value: string) =>
  t(`prefDomainDashboard.quarters.${String(value).toLowerCase()}`, String(value)) as string;

/**
 * Section4 Affaires Féminines : 2 graphiques d'évolution trimestrielle (T1 → T4).
 * 1. Évolution de l'intégration des lauréates (Area — Lauréates vs Intégrées)
 * 2. Évolution de l'activité sociale (Line — DOUBLE AXE Y :
 *    gauche = Bénéficiaires AGR + Séances centres d'écoute ;
 *    droite = Partenariats suivis). Les unités étant différentes, on ne mélange
 *    jamais visuellement les natures : le tooltip précise chaque unité.
 */
export const PrefDomainDashboardSection4AffairesFeminines = ({
  integration,
  activiteSociale,
  lang,
  t,
}: PrefDomainDashboardSection4AffairesFemininesProps) => {
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
          {t("prefDomainDashboard.affairesFeminines.section4.title", "Évolution trimestrielle")}
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* 1. Évolution de l'intégration des lauréates (Area) */}
        <Card className="p-5">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-foreground">
              {t(
                "prefDomainDashboard.affairesFeminines.section4.integrationTitle",
                "Évolution de l'intégration des lauréates",
              )}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {t(
                "prefDomainDashboard.affairesFeminines.section4.integrationSubtitle",
                "Lauréates vs intégrées (T1 à T4)",
              )}
            </p>
          </div>
          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={integration} margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
                <defs>
                  <linearGradient id="afColorLaureates" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="afColorIntegrees" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ec4899" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#ec4899" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis {...xAxisProps} />
                <YAxis {...yAxisProps} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    borderRadius: "8px",
                    border: "1px solid hsl(var(--border))",
                    fontSize: "12px",
                  }}
                  formatter={(value: number, name) => [fmtNum(value, lang), name as string]}
                />
                <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }} iconType="circle" />
                <Area
                  type="linear"
                  dataKey="laureates"
                  name={t("prefDomainDashboard.affairesFeminines.laureates", "Lauréates")}
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#afColorLaureates)"
                  connectNulls
                />
                <Area
                  type="linear"
                  dataKey="integrees"
                  name={t("prefDomainDashboard.affairesFeminines.integrees", "Intégrées")}
                  stroke="#ec4899"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#afColorIntegrees)"
                  connectNulls
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* 2. Évolution de l'activité sociale (Line — DOUBLE AXE Y) */}
        <Card className="p-5">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-foreground">
              {t(
                "prefDomainDashboard.affairesFeminines.section4.activiteSocialeTitle",
                "Évolution de l'activité sociale",
              )}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {t(
                "prefDomainDashboard.affairesFeminines.section4.activiteSocialeSubtitle",
                "Bénéficiaires & séances (gauche) — Partenariats (droite)",
              )}
            </p>
          </div>
          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={activiteSociale}
                margin={{ top: 10, right: 15, left: 10, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis {...xAxisProps} />
                {/* Axe gauche : Bénéficiaires AGR + Séances centres d'écoute */}
                <YAxis
                  yAxisId="left"
                  orientation="left"
                  axisLine={{ stroke: "hsl(var(--muted-foreground))" }}
                  tickLine={{ stroke: "hsl(var(--muted-foreground))" }}
                  width={55}
                  tick={{
                    fontSize: 11,
                    fill: "hsl(var(--muted-foreground))",
                    dx: lang === "ar" ? -18 : 0,
                  }}
                  allowDecimals={false}
                  label={{
                    value: t(
                      "prefDomainDashboard.affairesFeminines.section4.leftAxis",
                      "Bénéficiaires / Séances",
                    ),
                    angle: -90,
                    position: "insideLeft",
                    fontSize: 10,
                    fill: "hsl(var(--muted-foreground))",
                  }}
                />
                {/* Axe droit : Partenariats suivis */}
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  axisLine={{ stroke: "hsl(var(--muted-foreground))" }}
                  tickLine={{ stroke: "hsl(var(--muted-foreground))" }}
                  width={45}
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: "8px",
                    border: "1px solid hsl(var(--border))",
                    fontSize: "12px",
                  }}
                  formatter={(value: number | string, name: number | string) => {
                    const n = Number(value) || 0;
                    const label = name as string;
                    // On précise l'unité/nature de chaque série pour éviter toute
                    // confusion entre des valeurs de natures différentes.
                    if (
                      label ===
                      t(
                        "prefDomainDashboard.affairesFeminines.beneficiairesAgr",
                        "Bénéficiaires AGR",
                      )
                    ) {
                      return [`${fmtNum(n, lang)} bénéficiaires`, label];
                    }
                    if (
                      label ===
                      t(
                        "prefDomainDashboard.affairesFeminines.seancesCentresEcoute",
                        "Séances Centres d'Écoute",
                      )
                    ) {
                      return [`${fmtNum(n, lang)} séances`, label];
                    }
                    if (
                      label ===
                      t(
                        "prefDomainDashboard.affairesFeminines.partenariatsSuivis",
                        "Partenariats suivis",
                      )
                    ) {
                      return [`${n} partenariats`, label];
                    }
                    return [fmtNum(n, lang), label];
                  }}
                />
                <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }} iconType="circle" />
                {/* Axe gauche */}
                <Line
                  yAxisId="left"
                  type="linear"
                  dataKey="beneficiairesAgr"
                  name={t(
                    "prefDomainDashboard.affairesFeminines.beneficiairesAgr",
                    "Bénéficiaires AGR",
                  )}
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={false}
                  connectNulls
                />
                <Line
                  yAxisId="left"
                  type="linear"
                  dataKey="seancesCentresEcoute"
                  name={t(
                    "prefDomainDashboard.affairesFeminines.seancesCentresEcoute",
                    "Séances Centres d'Écoute",
                  )}
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={false}
                  connectNulls
                />
                {/* Axe droit */}
                <Line
                  yAxisId="right"
                  type="linear"
                  dataKey="partenariatsSuivis"
                  name={t(
                    "prefDomainDashboard.affairesFeminines.partenariatsSuivis",
                    "Partenariats suivis",
                  )}
                  stroke="#f59e0b"
                  strokeWidth={2}
                  dot={false}
                  connectNulls
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </section>
  );
};
