import { Card } from "@/components/ui/card";
import {
  AreaChart,
  Area,
  Tooltip,
  ResponsiveContainer,
  Legend,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import type { DashboardTranslator, EvolutionRow } from "./types";

interface EvolutionChartProps {
  title: string;
  subtitle: string;
  data: EvolutionRow[];
  t: DashboardTranslator;
  lang: string;
  cardClassName?: string;
}

export const EvolutionChart = ({ title, subtitle, data, t, lang, cardClassName = "" }: EvolutionChartProps) => {
  return (
    <Card className={`p-5 ${cardClassName}`.trim()}>
      <div className="mb-6">
        <h3 className="text-sm font-bold text-foreground">{title}</h3>
        <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
      </div>

      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 30, left: 45, bottom: 20 }}>
            <defs>
              <linearGradient id="colorCamping" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorFestivals" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
            <XAxis
              dataKey="name"
              axisLine={{ stroke: "hsl(var(--muted-foreground))" }}
              tickLine={{ stroke: "hsl(var(--muted-foreground))" }}
              tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
              dy={10}
              interval={0}
              height={40}
              tickFormatter={(value) => t(`prefDomainDashboard.quarters.${String(value).toLowerCase()}`, String(value)) as string}
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
              contentStyle={{
                borderRadius: "8px",
                border: "1px solid hsl(var(--border))",
                fontSize: "12px",
              }}
            />
            <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "20px" }} iconType="circle" />
            <Area
              type="linear"
              dataKey="Camping"
              name={t("prefDomainDashboard.programs.camping", "Camping")}
              stroke="#3b82f6"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorCamping)"
            />
            <Area
              type="linear"
              dataKey="Festivals"
              name={t("prefDomainDashboard.programs.festivals", "Festivals")}
              stroke="#8b5cf6"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorFestivals)"
            />
            <Area
              type="linear"
              dataKey="Formation"
              name={t("prefDomainDashboard.programs.formation", "Formation")}
              stroke="#ec4899"
              strokeWidth={2}
              fill="none"
            />
            <Area
              type="linear"
              dataKey="Insertion"
              name={t("prefDomainDashboard.programs.insertion", "Insertion")}
              stroke="#10b981"
              strokeWidth={2}
              fill="none"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};
