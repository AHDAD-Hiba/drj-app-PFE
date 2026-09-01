import { useTranslation } from "react-i18next";
import type { LucideIcon } from "lucide-react";
import { Baby, BriefcaseBusiness, Clock3, HousePlus, ShieldCheck, Users } from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Card } from "@/components/ui/card";
import type { CrechesRegionalDashboardData } from "@/services/regional/crechesRegionalService";
import { formatNumber } from "@/lib/data";

interface EnfanceCrechesRegionalSectionsProps {
  data: Pick<CrechesRegionalDashboardData, "kpis" | "section3" | "evolution">;
  locale: string;
}

interface KpiCardProps {
  label: string;
  value: number;
  locale: string;
  icon: LucideIcon;
  accent: string;
  suffix?: string;
}

// Même pattern visuel que les KPI cards Infrastructure/Jeunesse/Femme/PE :
// barre d'accent, icône, valeur, libellé.
function KpiCard({ label, value, locale, icon: Icon, accent, suffix = "" }: KpiCardProps) {
  return (
    <Card className="relative overflow-hidden border-border/60 bg-card p-4 sm:p-5 hover:shadow-elegant">
      <span className={`absolute inset-y-0 start-0 w-1 ${accent}`} />
      <Icon className={`mb-3 h-8 w-8 opacity-80 ${accent.replace("bg-", "text-")}`} />
      <div
        className={`text-xl sm:text-2xl font-extrabold tracking-tight tabular-nums ${accent.replace("bg-", "text-")}`}
        dir="ltr"
      >
        {formatNumber(value, locale)}
        {suffix}
      </div>
      <div className="mt-1 text-xs font-medium leading-tight text-muted-foreground">{label}</div>
    </Card>
  );
}

function SectionTitle({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mb-4">
      <h2 className="text-xl font-bold text-foreground">{title}</h2>
      <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
    </div>
  );
}

const trimestreLabel = (value: string, t: (key: string, fallback: string) => string) => {
  const key = `RegDomainDashboard.quarters.${value.toLowerCase()}`;
  return t(key, value.toUpperCase());
};

// Même palette que les PieChart régionaux Jeunesse/Infrastructure/Femme/PE.
const PIE_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#0ea5e9"];

export function EnfanceCrechesRegionalSections({
  data,
  locale,
}: EnfanceCrechesRegionalSectionsProps) {
  const { t, i18n } = useTranslation();
  const isArabic = i18n.language === "ar";
  const legendStyle = isArabic
    ? { fontSize: "11px", paddingTop: "10px", maxWidth: 260, width: "100%" }
    : { fontSize: "11px", paddingTop: "10px" };

  const { kpis, section3, evolution } = data;

  const evolutionEnfants = evolution.enfants.map((row) => ({
    ...row,
    trimestre: trimestreLabel(row.trimestre, t),
  }));

  const evolutionMouvements = evolution.mouvements.map((row) => ({
    ...row,
    trimestre: trimestreLabel(row.trimestre, t),
  }));

  return (
    <div className="space-y-8">
      {/* SECTION 2 : KPI Crèche — 6 KPI, mêmes formules que le niveau préfectoral */}
      <section className="w-full">
        <SectionTitle
          title={t("regDomainDashboard.creches.section.title", "Indicateurs Crèche")}
          subtitle={t(
            "regDomainDashboard.generic.kpiRegionalSubtitle",
            "KPI régionaux, agrégés sur toutes les directions",
          )}
        />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 xl:grid-cols-6">
          <KpiCard
            label={t(
              "regDomainDashboard.creches.kpis.enfantsPrisEnCharge",
              "Enfants pris en charge",
            )}
            value={kpis.enfantsPrisesEnCharge}
            locale={locale}
            icon={Users}
            accent="bg-primary"
          />
          <KpiCard
            label={t(
              "regDomainDashboard.creches.kpis.demandesLicencesTraitees",
              "Demandes de licences traitées",
            )}
            value={kpis.demandesLicencesTraitees}
            locale={locale}
            icon={ShieldCheck}
            accent="bg-success"
          />
          <KpiCard
            label={t(
              "regDomainDashboard.creches.kpis.delaiMoyenTraitement",
              "Délai moyen de traitement (jours)",
            )}
            value={Math.round(kpis.delaiMoyenTraitementJours * 10) / 10}
            locale={locale}
            icon={Clock3}
            accent="bg-info"
            suffix=" j"
          />
          <KpiCard
            label={t("regDomainDashboard.creches.kpis.cadresAssermentes", "Cadres assermentés")}
            value={kpis.cadresAssermentes}
            locale={locale}
            icon={BriefcaseBusiness}
            accent="bg-warning"
          />
          <KpiCard
            label={t(
              "regDomainDashboard.creches.kpis.crechesLabellisees",
              "Crèches labellisées qualité",
            )}
            value={kpis.crechesLabelliseesQualite}
            locale={locale}
            icon={HousePlus}
            accent="bg-blue-600"
          />
          <KpiCard
            label={t("regDomainDashboard.creches.kpis.fermeturesSignalees", "Fermetures")}
            value={kpis.fermeturesCrechesSignalees}
            locale={locale}
            icon={Baby}
            accent="bg-pink-600"
          />
        </div>
      </section>

      {/* SECTION 3 : Répartition régionale */}
      <section className="mt-8 w-full">
        <SectionTitle
          title={t("regDomainDashboard.creches.section3.title", "Répartition Régionale")}
          subtitle={t(
            "regDomainDashboard.creches.section3.subtitle",
            "Demandes de licences, toutes directions confondues",
          )}
        />
        <div className="grid grid-cols-1 gap-6">
          <Card className="p-5 sm:p-6">
            <h3 className="font-bold text-foreground mb-1">
              {t(
                "regDomainDashboard.creches.charts.demandesStatutTitle",
                "Demandes de licences par statut",
              )}
            </h3>
            <p className="text-xs text-muted-foreground mb-4">
              {t(
                "regDomainDashboard.creches.charts.volumeRegionalSubtitle",
                "Volume régional, agrégé sur l'ensemble des directions",
              )}
            </p>
            {section3.demandesParStatut.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart margin={{ top: 15, right: 0, bottom: 0, left: 0 }}>
                  <Pie
                    data={section3.demandesParStatut}
                    dataKey="value"
                    cx="50%"
                    cy="45%"
                    outerRadius={90}
                    strokeWidth={2}
                  >
                    {section3.demandesParStatut.map((entry, index) => (
                      <Cell key={entry.id} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatNumber(value, locale)} />
                  <Legend verticalAlign="bottom" wrapperStyle={legendStyle} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[280px] items-center justify-center text-xs text-muted-foreground">
                {t("map.noData", "Aucune donnée")}
              </div>
            )}
          </Card>
        </div>
      </section>

      {/* SECTION 4 : Évolutions Crèche — 2 évolutions trimestrielles, consolidées sur toutes les directions */}
      <section className="mt-8 w-full">
        <SectionTitle
          title={t("RegDomainDashboard.section4.title", "Dynamique Régionale")}
          subtitle={t(
            "regDomainDashboard.creches.section4.subtitle",
            "Évolution trimestrielle des enfants pris en charge et des mouvements de crèches",
          )}
        />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-5 sm:p-6">
            <h3 className="font-bold text-foreground mb-1">
              {t(
                "regDomainDashboard.creches.charts.evolEnfantsTitle",
                "Évolution des enfants pris en charge",
              )}
            </h3>
            <p className="text-xs text-muted-foreground mb-4">
              {t(
                "regDomainDashboard.creches.charts.evolEnfantsSubtitle",
                "Garçons vs filles, par trimestre",
              )}
            </p>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={evolutionEnfants}
                  margin={
                    isArabic
                      ? { top: 10, right: 35, left: 40, bottom: 0 }
                      : { top: 10, right: 35, left: 20, bottom: 0 }
                  }
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="hsl(var(--border))"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="trimestre"
                    fontSize={11}
                    tick={{ textAnchor: isArabic ? "end" : "middle", dx: isArabic ? -4 : 0 }}
                  />

                  <YAxis
                    orientation="left"
                    width={isArabic ? 55 : 40}
                    tick={{ fontSize: 11, dx: isArabic ? -20 : 0 }}
                  />

                  <Tooltip
                    contentStyle={{ borderRadius: "8px", fontSize: "12px" }}
                    formatter={(value: number) => formatNumber(value, locale)}
                  />
                  <Legend iconType="circle" wrapperStyle={legendStyle} />
                  <Area
                    type="monotone"
                    dataKey="garcons"
                    name={t("common.gender.garcons", "Garçons")}
                    stroke="#3b82f6"
                    fill="#3b82f6"
                    fillOpacity={0.2}
                    connectNulls={false}
                  />
                  <Area
                    type="monotone"
                    dataKey="filles"
                    name={t("common.gender.filles", "Filles")}
                    stroke="#ec4899"
                    fill="#ec4899"
                    fillOpacity={0.2}
                    connectNulls={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="p-5 sm:p-6">
            <h3 className="font-bold text-foreground mb-1">
              {t(
                "regDomainDashboard.creches.charts.evolMouvementsTitle",
                "Évolution des mouvements",
              )}
            </h3>
            <p className="text-xs text-muted-foreground mb-4">
              {t(
                "regDomainDashboard.creches.charts.evolMouvementsSubtitle",
                "Fermetures vs réouvertures, par trimestre",
              )}
            </p>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={evolutionMouvements}
                  margin={
                    isArabic
                      ? { top: 10, right: 35, left: 40, bottom: 0 }
                      : { top: 10, right: 35, left: 20, bottom: 0 }
                  }
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="hsl(var(--border))"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="trimestre"
                    fontSize={11}
                    tick={{ textAnchor: isArabic ? "end" : "middle", dx: isArabic ? -4 : 0 }}
                  />

                  <YAxis
                    orientation="left"
                    width={isArabic ? 55 : 40}
                    tick={{ fontSize: 11, dx: isArabic ? -20 : 0 }}
                    allowDecimals={false}
                  />

                  <Tooltip
                    contentStyle={{ borderRadius: "8px", fontSize: "12px" }}
                    formatter={(value: number) => formatNumber(value, locale)}
                  />
                  <Legend iconType="circle" wrapperStyle={legendStyle} />
                  <Line
                    type="monotone"
                    dataKey="fermetures"
                    name={t("regDomainDashboard.creches.kpis.fermeturesSignalees", "Fermetures")}
                    stroke="#f59e0b"
                    strokeWidth={3}
                    dot={{ strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                    connectNulls={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="reouvertures"
                    name={t("regDomainDashboard.creches.legend.reouvertures", "Réouvertures")}
                    stroke="#10b981"
                    strokeWidth={3}
                    dot={{ strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                    connectNulls={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      </section>
    </div>
  );
}

export default EnfanceCrechesRegionalSections;
