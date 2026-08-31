import { useTranslation } from "react-i18next";
import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  Globe2,
  GraduationCap,
  Percent,
  Shield,
  Users,
} from "lucide-react";
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
import type { PeRegionalDashboardData } from "@/services/regional/peRegionalService";
import { formatNumber } from "@/lib/data";

interface ProtectionEnfanceRegionalSectionsProps {
  data: Pick<PeRegionalDashboardData, "kpis" | "section3" | "evolution">;
  locale: string;
}

interface KpiCardProps {
  label: string;
  value: number;
  locale: string;
  icon: LucideIcon;
  accent: string;
  percentage?: boolean;
}

// Même pattern visuel que les KPI cards Infrastructure/Jeunesse/Femme : barre
// d'accent, icône, valeur, libellé.
function KpiCard({ label, value, locale, icon: Icon, accent, percentage = false }: KpiCardProps) {
  return (
    <Card className="relative overflow-hidden border-border/60 bg-card p-4 sm:p-5 hover:shadow-elegant">
      <span className={`absolute inset-y-0 start-0 w-1 ${accent}`} />
      <Icon className={`mb-3 h-8 w-8 opacity-80 ${accent.replace("bg-", "text-")}`} />
      <div className={`text-xl sm:text-2xl font-extrabold tracking-tight tabular-nums ${accent.replace("bg-", "text-")}`} dir="ltr">
        {formatNumber(value, locale)}{percentage ? "%" : ""}
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

const translatePeCategory = (value: string, t: (key: string, fallback: string) => string) => {
  const normalized = value?.trim().toLowerCase();
  if (normalized === "éducation" || normalized === "education") return t("regDomainDashboard.pe.categories.education", "Éducation");
  if (normalized === "formation") return t("regDomainDashboard.pe.categories.formation", "Formation");
  return value;
};

// Même palette que les PieChart régionaux Infrastructure/Jeunesse/Femme.
const PIE_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#0ea5e9"];

export function ProtectionEnfanceRegionalSections({ data, locale }: ProtectionEnfanceRegionalSectionsProps) {
  const { t, i18n } = useTranslation();
  const isArabic = i18n.language === "ar";
  const legendStyle = isArabic ? { fontSize: "11px", paddingTop: "10px", maxWidth: 260, width: "100%" } : { fontSize: "11px", paddingTop: "10px" };

  const { kpis, section3, evolution } = data;

  const educationFormationChart = section3.educationFormation.map((row) => ({
    ...row,
    name: translatePeCategory(row.name, t),
  }));

  const incidentsParTypeChart = section3.incidentsParType.map((row) => ({
    ...row,
    name: row.name ?? t("regDomainDashboard.pe.categories.formation", "Formation"),
  }));

  const evolutionGenre = evolution.genre.map((row) => ({
    ...row,
    trimestre: trimestreLabel(row.trimestre, t),
  }));

  const evolutionIncidents = evolution.incidents.map((row) => ({
    ...row,
    trimestre: trimestreLabel(row.trimestre, t),
  }));

  return (
    <div className="space-y-8">
      {/* SECTION 2 : KPI PE — 6 KPI, mêmes formules que le niveau préfectoral */}
      <section className="w-full">
        <SectionTitle title={t("regDomainDashboard.pe.section.title", "Indicateurs Protection de l'Enfance")} subtitle={t("regDomainDashboard.generic.kpiRegionalSubtitle", "KPI régionaux, agrégés sur toutes les directions")} />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 xl:grid-cols-6">
          <KpiCard label={t("regDomainDashboard.pe.kpis.beneficiairesPriseEnCharge", "Bénéficiaires en prise en charge")} value={kpis.totalBeneficiairesPriseEnCharge} locale={locale} icon={Users} accent="bg-primary" />
          <KpiCard label={t("regDomainDashboard.pe.kpis.tauxPreparationIntegration", "Taux de préparation à l'intégration")} value={kpis.tauxPreparationIntegrationMoyen} locale={locale} icon={Percent} accent="bg-success" percentage />
          <KpiCard label={t("regDomainDashboard.pe.kpis.beneficiairesEducationFormation", "Bénéficiaires Éducation & Formation")} value={kpis.totalBeneficiairesEducationFormation} locale={locale} icon={GraduationCap} accent="bg-info" />
          <KpiCard label={t("regDomainDashboard.pe.kpis.integrationsLiberteSurveillee", "Intégrations en Liberté Surveillée")} value={kpis.totalIntegrationsLiberteSurveillee} locale={locale} icon={Shield} accent="bg-warning" />
          <KpiCard label={t("regDomainDashboard.pe.kpis.incidentsSignales", "Incidents exceptionnels")} value={kpis.totalIncidentsSignales} locale={locale} icon={AlertTriangle} accent="bg-blue-600" />
          <KpiCard label={t("regDomainDashboard.pe.kpis.migrantsNonAccompagnes", "Mineurs migrants non accompagnés")} value={kpis.totalMigrantsNonAccompagnes} locale={locale} icon={Globe2} accent="bg-pink-600" />
        </div>
      </section>

      {/* SECTION 3 : Formation & Répartition — 2 visualisations, consolidées sur toutes les directions */}
      <section className="mt-8 w-full">
        <SectionTitle title={t("regDomainDashboard.generic.formationRepartitionTitle", "Formation & Répartition")} subtitle={t("regDomainDashboard.pe.section3.subtitle", "Répartition régionale Éducation/Formation et incidents exceptionnels, toutes directions confondues")} />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-5 sm:p-6">
            <h3 className="font-bold text-foreground mb-1">{t("regDomainDashboard.pe.charts.eduFormTitle", "Éducation vs Formation")}</h3>
            <p className="text-xs text-muted-foreground mb-4">{t("regDomainDashboard.pe.charts.eduFormSubtitle", "Bénéficiaires régionaux, agrégés sur l'ensemble des directions")}</p>
            {section3.educationFormation.some((row) => row.value > 0) ? (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart margin={{ top: 15, right: 0, bottom: 0, left: 0 }}>
                  <Pie data={educationFormationChart} dataKey="value" cx="50%" cy="45%" outerRadius={90} strokeWidth={2}>
                    {educationFormationChart.map((entry, index) => (
                      <Cell key={entry.name} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatNumber(value, locale)} />
                  <Legend verticalAlign="bottom" wrapperStyle={legendStyle} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[280px] items-center justify-center text-xs text-muted-foreground">{t("map.noData", "Aucune donnée")}</div>
            )}
          </Card>

          <Card className="p-5 sm:p-6">
            <h3 className="font-bold text-foreground mb-1">{t("regDomainDashboard.pe.charts.incidentsTypeTitle", "Incidents exceptionnels par type")}</h3>
            <p className="text-xs text-muted-foreground mb-4">{t("regDomainDashboard.pe.charts.incidentsTypeSubtitle", "Nombre de cas signalés, agrégés sur l'ensemble des directions")}</p>
            {section3.incidentsParType.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart margin={{ top: 15, right: 0, bottom: 0, left: 0 }}>
                  <Pie data={incidentsParTypeChart} dataKey="value" cx="50%" cy="45%" outerRadius={90} strokeWidth={2}>
                    {incidentsParTypeChart.map((entry, index) => (
                      <Cell key={entry.id} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatNumber(value, locale)} />
                  <Legend verticalAlign="bottom" wrapperStyle={legendStyle} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[280px] items-center justify-center text-xs text-muted-foreground">{t("map.noData", "Aucune donnée")}</div>
            )}
          </Card>
        </div>
      </section>

      {/* SECTION 4 : Évolutions PE — 2 évolutions trimestrielles, consolidées sur toutes les directions */}
      <section className="mt-8 w-full">
        <SectionTitle title={t("RegDomainDashboard.section4.title", "Dynamique Régionale")} subtitle={t("regDomainDashboard.pe.section4.subtitle", "Évolution trimestrielle des bénéficiaires et des incidents exceptionnels")} />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          <Card className="p-5 sm:p-6">
            <h3 className="font-bold text-foreground mb-1">{t("regDomainDashboard.pe.charts.evolGenreTitle", "Évolution garçons / filles")}</h3>
            <p className="text-xs text-muted-foreground mb-4">{t("regDomainDashboard.pe.charts.evolGenreSubtitle", "Bénéficiaires en prise en charge par trimestre")}</p>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={evolutionGenre} margin={isArabic ? { top: 10, right: 35, left: 40, bottom: 0 } : { top: 10, right: 35, left: 20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="trimestre" fontSize={11} tick={{ textAnchor: isArabic ? "end" : "middle", dx: isArabic ? -4 : 0 }} />
                  <YAxis orientation="left" width={isArabic ? 55 : 40} tick={{ fontSize: 11, dx: isArabic ? -20 : 0 }} />
                  <Tooltip contentStyle={{ borderRadius: "8px", fontSize: "12px" }} formatter={(value: number) => formatNumber(value, locale)} />
                  <Legend iconType="circle" wrapperStyle={legendStyle} />
                  <Area type="monotone" dataKey="garcons" name={t("common.gender.garcons", "Garçons")} stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} connectNulls={false} />
                  <Area type="monotone" dataKey="filles" name={t("common.gender.filles", "Filles")} stroke="#ec4899" fill="#ec4899" fillOpacity={0.2} connectNulls={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="p-5 sm:p-6">
            <h3 className="font-bold text-foreground mb-1">{t("regDomainDashboard.pe.charts.evolIncidentsTitle", "Évolution des incidents exceptionnels")}</h3>
            <p className="text-xs text-muted-foreground mb-4">{t("regDomainDashboard.pe.charts.evolIncidentsSubtitle", "Nombre de cas signalés, par trimestre")}</p>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={evolutionIncidents} margin={isArabic ? { top: 10, right: 35, left: 40, bottom: 0 } : { top: 10, right: 35, left: 20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="trimestre" fontSize={11} tick={{ textAnchor: isArabic ? "end" : "middle", dx: isArabic ? -4 : 0 }} />
                  <YAxis orientation="left" width={isArabic ? 55 : 40} tick={{ fontSize: 11, dx: isArabic ? -20 : 0 }} allowDecimals={false} />
                  <Tooltip contentStyle={{ borderRadius: "8px", fontSize: "12px" }} formatter={(value: number) => formatNumber(value, locale)} />
                  <Legend iconType="circle" wrapperStyle={legendStyle} />
                  <Line type="monotone" dataKey="incidents" name={t("regDomainDashboard.pe.kpis.incidentsSignales", "Incidents exceptionnels")} stroke="#f59e0b" strokeWidth={3} dot={{ strokeWidth: 2, r: 4 }} activeDot={{ r: 6, strokeWidth: 0 }} connectNulls={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
          
        </div>
      </section>
    </div>
  );
}

export default ProtectionEnfanceRegionalSections;
