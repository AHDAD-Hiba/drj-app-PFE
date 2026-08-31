import { Card } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  Tooltip,
  ResponsiveContainer,
  Legend,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import type { DashboardTranslator, RepartitionRow } from "./types";

export interface RepartitionChartCardProps {
  title: string;
  subtitle: string;
  data: RepartitionRow[];
  chartType: "volume" | "mixity" | "coverage";
  t: DashboardTranslator;
  lang: string;
  cardClassName?: string;
}

const chartConfig = {
  volume: {
    tooltipFormatter: (value: number) => [value, ""],
    legend: null,
    domain: [0, (dataMax: number) => Math.ceil(dataMax / 100) * 100],
    yTickFormatter: undefined,
  },
  mixity: {
    tooltipFormatter: (value: number) => [`${value}%`, ""],
    legend: true,
    domain: [0, 100],
    yTickFormatter: (value: number | string) => `${value}%`,
  },
  coverage: {
    tooltipFormatter: (value: number) => [`${value}%`, ""],
    legend: true,
    domain: [0, 100],
    yTickFormatter: (value: number | string) => `${value}%`,
  },
};

export const RepartitionCharts = ({
  title,
  subtitle,
  data,
  chartType,
  t,
  lang,
  cardClassName = "",
}: RepartitionChartCardProps) => {
  const config = chartConfig[chartType];
  return (
    <Card className={`p-5 flex flex-col ${cardClassName}`.trim()}>
      <div className="mb-4">
        <h3 className="text-sm font-bold text-foreground">{title}</h3>
        <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
      </div>
      <div className="h-[250px] w-full mt-auto">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 10, right: lang === "ar" ? 45 : 10, left: lang === "ar" ? 10 : 30, bottom: 20 }}
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
              tickFormatter={(value) => t(`prefDomainDashboard.programs.${String(value).toLowerCase()}`, String(value)) as string}
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
              tickFormatter={config.yTickFormatter}
              domain={config.domain as [number, number]}
            />
            <Tooltip
              cursor={{ fill: "hsl(var(--muted)/0.4)" }}
              contentStyle={{
                borderRadius: "8px",
                border: "1px solid hsl(var(--border))",
                fontSize: "12px",
              }}
              formatter={config.tooltipFormatter}
            />
            {config.legend ? <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }} iconType="circle" /> : null}
            {chartType === "volume" ? (
              <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} maxBarSize={50} />
            ) : null}
            {chartType === "mixity" ? (
              <>
                <Bar dataKey="hommesPct" name={t("prefDomainDashboard.charts.men", "Hommes")} stackId="a" fill="#3b82f6" radius={[0, 0, 4, 4]} maxBarSize={50} />
                <Bar dataKey="femmesPct" name={t("prefDomainDashboard.charts.women", "Femmes")} stackId="a" fill="#ec4899" radius={[4, 4, 0, 0]} maxBarSize={50} />
              </>
            ) : null}
            {chartType === "coverage" ? (
              <>
                <Bar dataKey="urbainPct" name={t("prefDomainDashboard.charts.urban", "Urbain")} stackId="a" fill="#f59e0b" radius={[0, 0, 4, 4]} maxBarSize={50} />
                <Bar dataKey="ruralPct" name={t("prefDomainDashboard.charts.rural", "Rural")} stackId="a" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={50} />
              </>
            ) : null}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};
