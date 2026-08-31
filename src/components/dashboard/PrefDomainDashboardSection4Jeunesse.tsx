import type { TFunction } from "i18next";
import { Card } from "@/components/ui/card";
import { Area, AreaChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

interface Props {
  // Champs optionnels : reflète la forme réelle de `JeunesseEvolutionDatum`
  // (src/services/PrefDomainDashboardDataService.ts), qui ne garantit pas
  // la présence de chaque programme pour chaque trimestre.
  data: Array<{
    name: string;
    Camping?: number | null;
    Festivals?: number | null;
    Formation?: number | null;
    Insertion?: number | null;
  }>;
  lang: string;
  t: TFunction;
}

export const PrefDomainDashboardSection4Jeunesse = ({ data, lang, t }: Props) => (
  <section className="space-y-4">
    <div className="flex items-center justify-between">
      <h2 className="text-lg font-bold text-foreground">
        {t("prefDomainDashboard.charts.evolutionTitle", "Évolution trimestrielle des bénéficiaires")}
      </h2>
    </div>

    <div className="grid grid-cols-1 gap-4 md:gap-6">
      <Card className="p-5">
        <div className="mb-6">
          <h3 className="text-sm font-bold text-foreground">
            {t("prefDomainDashboard.charts.evolutionCardTitle", "Trajectoire des performances par programme")}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {t("prefDomainDashboard.charts.evolutionCardSubtitle", "Évolution du nombre de bénéficiaires (T1 à T4) pour les axes éligibles")}
          </p>
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
              <XAxis dataKey="name" axisLine={{ stroke: "hsl(var(--muted-foreground))" }} tickLine={{ stroke: "hsl(var(--muted-foreground))" }} tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} dy={10} interval={0} height={40} tickFormatter={(value) => t(`prefDomainDashboard.quarters.${String(value).toLowerCase()}`, String(value)) as string} />
              <YAxis orientation="left" axisLine={{ stroke: "hsl(var(--muted-foreground))" }} tickLine={{ stroke: "hsl(var(--muted-foreground))" }} width={45} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))", dx: lang === "ar" ? -18 : 0 }} domain={[0, (dataMax: number) => Math.ceil(dataMax / 100) * 100]} />
              <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid hsl(var(--border))", fontSize: "12px" }} />
              <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "20px" }} iconType="circle" />
              <Area type="linear" dataKey="Camping" name={t("prefDomainDashboard.programs.camping", "Camping")} stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorCamping)" />
              <Area type="linear" dataKey="Festivals" name={t("prefDomainDashboard.programs.festivals", "Festivals")} stroke="#8b5cf6" strokeWidth={2} fillOpacity={1} fill="url(#colorFestivals)" />
              <Area type="linear" dataKey="Formation" name={t("prefDomainDashboard.programs.formation", "Formation")} stroke="#ec4899" strokeWidth={2} fill="none" />
              <Area type="linear" dataKey="Insertion" name={t("prefDomainDashboard.programs.insertion", "Insertion")} stroke="#10b981" strokeWidth={2} fill="none" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  </section>
);
