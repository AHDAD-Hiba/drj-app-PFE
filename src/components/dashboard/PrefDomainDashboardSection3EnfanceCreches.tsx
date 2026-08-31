import type { TFunction } from "i18next";
import { Card } from "@/components/ui/card";
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { EnfanceCrechesSection3Data } from "@/services/PrefDomainDashboardEnfanceCrechesDataService";

interface Props {
  data: EnfanceCrechesSection3Data;
  lang: string;
  t: TFunction;
}

const COLORS = ["#3b82f6", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#0ea5e9"];

const fmtNum = (n: number, lang: string) =>
  new Intl.NumberFormat(lang === "ar" ? "ar-MA" : "fr-FR").format(Math.round(n));

export const PrefDomainDashboardSection3EnfanceCreches = ({ data, lang, t }: Props) => {
  const translatedChildrenByZone = data.enfantsParZone.map((row) => ({
    ...row,
    name:
      row.name === "Urbain"
        ? t("prefDomainDashboard.enfanceCreches.section6.enfants.urbain", "Urbain")
        : row.name === "Rural"
          ? t("prefDomainDashboard.enfanceCreches.section6.enfants.rural", "Rural")
          : row.name,
  }));

  return (
  <section className="space-y-4">
    <div>
      <h2 className="text-lg font-bold text-foreground">
        {t("prefDomainDashboard.enfanceCreches.section3.title", "Demandes, statuts & enfants")}
      </h2>
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
      <Card className="p-5 flex flex-col">
        <div className="mb-4">
          <h3 className="text-sm font-bold text-foreground">
            {t("prefDomainDashboard.enfanceCreches.section3.demandesTypeTitle", "Demandes de licences par type")}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {t("prefDomainDashboard.enfanceCreches.section3.demandesTypeSubtitle", "Volume par type de demande")}
          </p>
        </div>
        <div className="h-[250px] w-full mt-auto">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.demandesParType} layout="vertical" margin={{ top: 10, right: 20, left: lang === "ar" ? 20 : 10, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
              <XAxis type="number" allowDecimals={false} tickFormatter={(value: number) => fmtNum(value, lang)} />
              <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))", textAnchor: "end", dx: lang === "ar" ? -60 : 0 }}/>
              <Tooltip formatter={(value: number) => fmtNum(value, lang)} />
              <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={40}>
                {data.demandesParType.map((entry, idx) => (
                  <Cell key={entry.id} fill={COLORS[idx % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="p-5 flex flex-col">
        <div className="mb-4">
          <h3 className="text-sm font-bold text-foreground">
            {t("prefDomainDashboard.enfanceCreches.section3.demandesStatutTitle", "Demandes de licences par statut")}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {t("prefDomainDashboard.enfanceCreches.section3.demandesStatutSubtitle", "Répartition par statut")}
          </p>
        </div>
        <div className="h-[250px] w-full mt-auto">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data.demandesParStatut} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={2}>
                {data.demandesParStatut.map((entry, idx) => (
                  <Cell key={entry.id} fill={COLORS[idx % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => fmtNum(value, lang)} />
              <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }} iconType="circle" />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="p-5 flex flex-col lg:col-span-2">
        <div className="mb-4">
          <h3 className="text-sm font-bold text-foreground">
            {t("prefDomainDashboard.enfanceCreches.section3.enfantsZoneTitle", "Enfants pris en charge : Garçons/Filles × Urbain/Rural")}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {t("prefDomainDashboard.enfanceCreches.section3.enfantsZoneSubtitle", "Répartition par zone géographique")}
          </p>
        </div>
        <div className="h-[250px] w-full mt-auto">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={translatedChildrenByZone} margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <XAxis dataKey="name" />
              <YAxis allowDecimals={false} tickFormatter={(value: number) => fmtNum(value, lang)} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))", textAnchor: "end", dx: lang === "ar" ? -20 : 0 }}/>
              <Tooltip formatter={(value: number) => fmtNum(value, lang)} />
              <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }} iconType="circle" />
              <Bar dataKey="Garcons" name={t("prefDomainDashboard.enfanceCreches.section4.garcons", "Garçons")} fill="#3b82f6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Filles" name={t("prefDomainDashboard.enfanceCreches.section4.filles", "Filles")} fill="#ec4899" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  </section>
);
};
