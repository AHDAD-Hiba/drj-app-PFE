import type { TFunction } from "i18next";
import { Card } from "@/components/ui/card";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface Props {
  data: Array<{
    name: string;
    total: number;
    hommesPct: number;
    femmesPct: number;
    urbainPct: number;
    ruralPct: number;
  }>;
  lang: string;
  t: TFunction;
}

export const PrefDomainDashboardSection3Jeunesse = ({ data, lang, t }: Props) => (
  <section className="space-y-4">
    <div>
      <h2 className="text-lg font-bold text-foreground">
        {t("prefDomainDashboard.charts.axeTitle", "Répartition des bénéficiaires par axe")}
      </h2>
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
      <Card className="p-5 flex flex-col">
        <div className="mb-4">
          <h3 className="text-sm font-bold text-foreground">
            {t("prefDomainDashboard.charts.volumeTitle", "Volume Global par Programme")}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {t(
              "prefDomainDashboard.charts.volumeSubtitle",
              "Nombre absolu de bénéficiaires impactés",
            )}
          </p>
        </div>
        <div className="h-[250px] w-full mt-auto">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{
                top: 10,
                right: lang === "ar" ? 45 : 10,
                left: lang === "ar" ? 10 : 30,
                bottom: 20,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <XAxis
                dataKey="name"
                axisLine={{ stroke: "hsl(var(--muted-foreground))" }}
                tickLine={{ stroke: "hsl(var(--muted-foreground))" }}
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                dy={10}
                interval={0}
                height={36}
                tickFormatter={(value) =>
                  t(
                    `prefDomainDashboard.programs.${String(value).toLowerCase()}`,
                    String(value),
                  ) as string
                }
              />
              <YAxis
                orientation="left"
                axisLine={{ stroke: "hsl(var(--muted-foreground))" }}
                tickLine={{ stroke: "hsl(var(--muted-foreground))" }}
                width={45}
                tick={{
                  fontSize: 11,
                  fill: "hsl(var(--muted-foreground))",
                  dx: lang === "ar" ? -18 : 0,
                }}
                domain={[0, (dataMax: number) => Math.ceil(dataMax / 100) * 100]}
              />
              <Tooltip
                cursor={{ fill: "hsl(var(--muted)/0.4)" }}
                contentStyle={{
                  borderRadius: "8px",
                  border: "1px solid hsl(var(--border))",
                  fontSize: "12px",
                }}
              />
              <Bar
                dataKey="total"
                fill="hsl(var(--primary))"
                radius={[4, 4, 0, 0]}
                maxBarSize={50}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="p-5 flex flex-col">
        <div className="mb-4">
          <h3 className="text-sm font-bold text-foreground">
            {t("prefDomainDashboard.charts.mixityTitle", "Mixité H / F par Programme (%)")}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {t("prefDomainDashboard.charts.mixitySubtitle", "Taux de féminisation comparatif")}
          </p>
        </div>
        <div className="h-[250px] w-full mt-auto">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{
                top: 10,
                right: lang === "ar" ? 45 : 10,
                left: lang === "ar" ? 10 : 30,
                bottom: 20,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <XAxis
                dataKey="name"
                axisLine={{ stroke: "hsl(var(--muted-foreground))" }}
                tickLine={{ stroke: "hsl(var(--muted-foreground))" }}
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                dy={10}
                interval={0}
                height={36}
                tickFormatter={(value) =>
                  t(
                    `prefDomainDashboard.programs.${String(value).toLowerCase()}`,
                    String(value),
                  ) as string
                }
              />
              <YAxis
                orientation="left"
                axisLine={{ stroke: "hsl(var(--muted-foreground))" }}
                tickLine={{ stroke: "hsl(var(--muted-foreground))" }}
                width={45}
                tick={{
                  fontSize: 11,
                  fill: "hsl(var(--muted-foreground))",
                  dx: lang === "ar" ? -18 : 0,
                }}
                tickFormatter={(value) => `${value}%`}
                domain={[0, 100]}
              />
              <Tooltip
                cursor={{ fill: "hsl(var(--muted)/0.4)" }}
                contentStyle={{
                  borderRadius: "8px",
                  border: "1px solid hsl(var(--border))",
                  fontSize: "12px",
                }}
                formatter={(value: number) => [`${value}%`, ""]}
              />
              <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }} iconType="circle" />
              <Bar
                dataKey="hommesPct"
                name={t("prefDomainDashboard.charts.men", "Hommes")}
                stackId="a"
                fill="#3b82f6"
                radius={[0, 0, 4, 4]}
                maxBarSize={50}
              />
              <Bar
                dataKey="femmesPct"
                name={t("prefDomainDashboard.charts.women", "Femmes")}
                stackId="a"
                fill="#ec4899"
                radius={[4, 4, 0, 0]}
                maxBarSize={50}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="p-5 flex flex-col">
        <div className="mb-4">
          <h3 className="text-sm font-bold text-foreground">
            {t(
              "prefDomainDashboard.charts.coverageTitle",
              "Couverture Territorial (Urbain / Rural)",
            )}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {t(
              "prefDomainDashboard.charts.coverageSubtitle",
              "Analyse incluant les données estimées",
            )}
          </p>
        </div>
        <div className="h-[250px] w-full mt-auto">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 10, left: 45, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <XAxis
                dataKey="name"
                axisLine={{ stroke: "hsl(var(--muted-foreground))" }}
                tickLine={{ stroke: "hsl(var(--muted-foreground))" }}
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                dy={10}
                interval={0}
                height={36}
                tickFormatter={(value) =>
                  t(
                    `prefDomainDashboard.programs.${String(value).toLowerCase()}`,
                    String(value),
                  ) as string
                }
              />
              <YAxis
                orientation="left"
                axisLine={{ stroke: "hsl(var(--muted-foreground))" }}
                tickLine={{ stroke: "hsl(var(--muted-foreground))" }}
                width={45}
                tick={{
                  fontSize: 11,
                  fill: "hsl(var(--muted-foreground))",
                  dx: lang === "ar" ? -18 : 0,
                }}
                tickFormatter={(value) => `${value}%`}
                domain={[0, 100]}
              />
              <Tooltip
                cursor={{ fill: "hsl(var(--muted)/0.4)" }}
                contentStyle={{
                  borderRadius: "8px",
                  border: "1px solid hsl(var(--border))",
                  fontSize: "12px",
                }}
                formatter={(value: number) => [`${value}%`, ""]}
              />
              <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }} iconType="square" />
              <Bar
                dataKey="urbainPct"
                name={t("prefDomainDashboard.charts.urban", "Urbain")}
                stackId="a"
                fill="#f59e0b"
                radius={[0, 0, 4, 4]}
                maxBarSize={50}
              />
              <Bar
                dataKey="ruralPct"
                name={t("prefDomainDashboard.charts.rural", "Rural")}
                stackId="a"
                fill="#10b981"
                radius={[4, 4, 0, 0]}
                maxBarSize={50}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  </section>
);
