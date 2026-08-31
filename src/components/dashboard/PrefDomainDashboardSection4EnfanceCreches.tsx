import type { TFunction } from "i18next";
import { Card } from "@/components/ui/card";
import { Area, AreaChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { EnfanceCrechesEvolutionData } from "@/services/PrefDomainDashboardEnfanceCrechesDataService";

interface Props {
  data: EnfanceCrechesEvolutionData;
  lang: string;
  t: TFunction;
}

const quarterTickFormatter = (t: TFunction) => (value: string) =>
  t(`prefDomainDashboard.quarters.${String(value).toLowerCase()}`, String(value)) as string;

const fmtNum = (n: number, lang: string) =>
  new Intl.NumberFormat(lang === "ar" ? "ar-MA" : "fr-FR").format(Math.round(n));

export const PrefDomainDashboardSection4EnfanceCreches = ({ data, lang, t }: Props) => {
  const tickFormatter = quarterTickFormatter(t);
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-foreground">{t("prefDomainDashboard.enfanceCreches.section4.title", "Évolution trimestrielle")}</h2>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <Card className="p-5">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-foreground">{t("prefDomainDashboard.enfanceCreches.section4.enfantsTitle", "Évolution des enfants pris en charge")}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{t("prefDomainDashboard.enfanceCreches.section4.enfantsSubtitle", "Garçons vs filles par trimestre")}</p>
          </div>
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.enfants} margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tickFormatter={tickFormatter} />
                <YAxis allowDecimals={false} tickFormatter={(value: number) => fmtNum(value, lang)} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))", textAnchor: "end", dx: lang === "ar" ? -20 : 0 }}/>
                <Tooltip formatter={(value: number) => fmtNum(value, lang)} />
                <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }} iconType="circle" />
                <Area type="linear" dataKey="Garcons" name={t("prefDomainDashboard.enfanceCreches.section4.garcons", "Garçons")} stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} connectNulls />
                <Area type="linear" dataKey="Filles" name={t("prefDomainDashboard.enfanceCreches.section4.filles", "Filles")} stroke="#ec4899" fill="#ec4899" fillOpacity={0.2} connectNulls />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-foreground">{t("prefDomainDashboard.enfanceCreches.section4.mouvementsTitle", "Évolution des mouvements")}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{t("prefDomainDashboard.enfanceCreches.section4.mouvementsSubtitle", "Fermetures vs réouvertures par trimestre")}</p>
          </div>
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.mouvements} margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tickFormatter={tickFormatter} />
                <YAxis allowDecimals={false} tickFormatter={(value: number) => fmtNum(value, lang)} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))", textAnchor: "end", dx: lang === "ar" ? -20 : 0 }}/>
                <Tooltip formatter={(value: number) => fmtNum(value, lang)} />
                <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }} iconType="circle" />
                <Line type="linear" dataKey="Fermetures" name={t("prefDomainDashboard.enfanceCreches.section4.fermetures", "Fermetures")} stroke="#f59e0b" strokeWidth={2} connectNulls />
                <Line type="linear" dataKey="Reouvertures" name={t("prefDomainDashboard.enfanceCreches.section4.reouvertures", "Réouvertures")} stroke="#10b981" strokeWidth={2} connectNulls />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </section>
  );
};
