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
  ProtectionEnfanceEvolutionGenreDatum,
  ProtectionEnfanceEvolutionIncidentsDatum,
} from "@/services/PrefDomainDashboardProtectionEnfanceDataService";

interface PrefDomainDashboardSection4ProtectionEnfanceProps {
  genre: ProtectionEnfanceEvolutionGenreDatum[];
  incidents: ProtectionEnfanceEvolutionIncidentsDatum[];
  lang: string;
  t: TFunction;
}

const quarterTickFormatter = (t: TFunction) => (value: string) =>
  t(`prefDomainDashboard.quarters.${String(value).toLowerCase()}`, String(value)) as string;

/**
 * Section4 Protection de l'Enfance : 2 graphiques d'évolution trimestrielle (T1 → T4).
 * 1. Évolution des bénéficiaires — garçons vs filles
 * 2. Évolution des incidents signalés
 */
export const PrefDomainDashboardSection4ProtectionEnfance = ({
  genre,
  incidents,
  lang,
  t,
}: PrefDomainDashboardSection4ProtectionEnfanceProps) => {
  const tickFormatter = quarterTickFormatter(t);

  const yAxisProps = {
    orientation: "left" as const,
    axisLine: { stroke: "hsl(var(--muted-foreground))" },
    tickLine: { stroke: "hsl(var(--muted-foreground))" },
    width: 45,
    tick: { fontSize: 11, fill: "hsl(var(--muted-foreground))", dx: lang === "ar" ? -18 : 0 },
    allowDecimals: false,
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
          {t("prefDomainDashboard.protectionEnfance.section4.title", "Évolution trimestrielle")}
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* 1. Évolution des bénéficiaires — garçons vs filles */}
        <Card className="p-5">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-foreground">
              {t(
                "prefDomainDashboard.protectionEnfance.section4.genreTitle",
                "Évolution des bénéficiaires",
              )}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {t(
                "prefDomainDashboard.protectionEnfance.section4.genreSubtitle",
                "Garçons vs filles (T1 à T4)",
              )}
            </p>
          </div>
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={genre} margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
                <defs>
                  <linearGradient id="colorGarcons" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorFilles" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ec4899" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#ec4899" stopOpacity={0} />
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
                  dataKey="Garcons"
                  name={t("prefDomainDashboard.protectionEnfance.section4.garcons", "Garçons")}
                  stroke="#3b82f6"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorGarcons)"
                  connectNulls
                />
                <Area
                  type="linear"
                  dataKey="Filles"
                  name={t("prefDomainDashboard.protectionEnfance.section4.filles", "Filles")}
                  stroke="#ec4899"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorFilles)"
                  connectNulls
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* 2. Évolution des incidents signalés */}
        <Card className="p-5">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-foreground">
              {t(
                "prefDomainDashboard.protectionEnfance.section4.incidentsTitle",
                "Évolution des incidents signalés",
              )}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {t(
                "prefDomainDashboard.protectionEnfance.section4.incidentsSubtitle",
                "Nombre total de cas signalés (T1 à T4)",
              )}
            </p>
          </div>
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={incidents} margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
                <defs>
                  <linearGradient id="colorIncidents" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
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
                  dataKey="Incidents"
                  name={t("prefDomainDashboard.protectionEnfance.section4.incidents", "Incidents")}
                  stroke="#f59e0b"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorIncidents)"
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
