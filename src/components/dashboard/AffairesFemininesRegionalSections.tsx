import { useTranslation } from "react-i18next";
import type { LucideIcon } from "lucide-react";
import {
  Ear,
  GraduationCap,
  HandCoins,
  Handshake,
  Percent,
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
import type { FemmeRegionalDashboardData } from "@/services/regional/femmeRegionalService";
import { formatNumber } from "@/lib/data";

interface AffairesFemininesRegionalSectionsProps {
  data: Pick<FemmeRegionalDashboardData, "kpis" | "section3" | "evolution">;
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

// Même pattern visuel que les KPI cards Infrastructure/Jeunesse : barre
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

// Même palette que les PieChart régionaux Infrastructure/Jeunesse.
const PIE_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#0ea5e9"];

export function AffairesFemininesRegionalSections({ data, locale }: AffairesFemininesRegionalSectionsProps) {
  const { t, i18n } = useTranslation();
  const isArabic = i18n.language === "ar";
  const legendStyle = isArabic ? { fontSize: "11px", paddingTop: "10px", maxWidth: 260, width: "100%" } : { fontSize: "11px", paddingTop: "10px" };

  const { kpis, section3, evolution } = data;

  const formationParSecteurChart = section3.formationParSecteur.map((row) => ({
    name: row.nom,
    value: row.total,
  }));

  const evolutionIntegration = evolution.integration.map((row) => ({
    ...row,
    trimestre: trimestreLabel(row.trimestre, t),
  }));

  const evolutionActiviteSociale = evolution.activiteSociale.map((row) => ({
    ...row,
    trimestre: trimestreLabel(row.trimestre, t),
  }));

  return (
    <div className="space-y-8">
      {/* SECTION 2 : KPI Femme — 6 KPI, mêmes formules que le niveau préfectoral */}
      <section className="w-full">
        <SectionTitle title={t("regDomainDashboard.femme.section.title", "Indicateurs Affaires Féminines")} subtitle={t("regDomainDashboard.generic.kpiRegionalSubtitle", "KPI régionaux, agrégés sur toutes les directions")} />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 xl:grid-cols-6">
          <KpiCard label={t("regDomainDashboard.femme.kpis.inscriptionsFormation", "Inscriptions en formation")} value={kpis.totalInscriptionsFormation} locale={locale} icon={GraduationCap} accent="bg-primary" />
          <KpiCard label={t("regDomainDashboard.femme.kpis.tauxIntegrationLaureates", "Taux d'intégration des lauréates")} value={kpis.tauxIntegrationLaureates} locale={locale} icon={Percent} accent="bg-success" percentage />
          <KpiCard label={t("regDomainDashboard.femme.kpis.beneficiairesSensibilisation", "Bénéficiaires sensibilisation + portes ouvertes")} value={kpis.totalBeneficiairesSensibilisationPortesOuvertes} locale={locale} icon={Users} accent="bg-info" />
          <KpiCard label={t("regDomainDashboard.femme.kpis.beneficiairesAgr", "Bénéficiaires AGR")} value={kpis.totalBeneficiairesAgr} locale={locale} icon={HandCoins} accent="bg-warning" />
          <KpiCard label={t("regDomainDashboard.femme.kpis.partenariatsSuivis", "Partenariats suivis")} value={kpis.totalPartenariatsSuivis} locale={locale} icon={Handshake} accent="bg-blue-600" />
          <KpiCard label={t("regDomainDashboard.femme.kpis.seancesEcoute", "Séances d'écoute")} value={kpis.totalSeancesCentresEcoute} locale={locale} icon={Ear} accent="bg-pink-600" />
        </div>
      </section>

      {/* SECTION 3 : Formation & Répartition — répartition régionale par secteur, agrégée sur toutes les directions */}
      <section className="mt-8 w-full">
        <SectionTitle title={t("regDomainDashboard.generic.formationRepartitionTitle", "Formation & Répartition")} subtitle={t("regDomainDashboard.femme.section3.subtitle", "Répartition régionale de la formation par secteur, toutes directions confondues")} />
        <Card className="p-5 sm:p-6">
          <h3 className="font-bold text-foreground mb-1">{t("regDomainDashboard.femme.charts.formationSecteurTitle", "Formation professionnelle par secteur")}</h3>
          <p className="text-xs text-muted-foreground mb-4">{t("regDomainDashboard.femme.charts.formationSecteurSubtitle", "Inscriptions OFPPT, agrégées par secteur pour l'ensemble de la région")}</p>
          {formationParSecteurChart.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart margin={{ top: 15, right: 0, bottom: 0, left: 0 }}>
                <Pie 
                  data={formationParSecteurChart.map(item => ({
                    ...item,
                    name: t(`affairesFeminines.secteurs.${item.name}`, item.name) as string
                  }))} 
                  dataKey="value" 
                  cx="50%" 
                  cy="45%" 
                  outerRadius={90} 
                  strokeWidth={2}
                >
                  {formationParSecteurChart.map((entry, index) => (
                    <Cell key={entry.name} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => formatNumber(value, locale)} />
                <Legend 
                  verticalAlign="bottom" 
                  wrapperStyle={legendStyle} 
                  formatter={(value: string) => t(`affairesFeminines.secteurs.${value}`, value) as string}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-[280px] items-center justify-center text-xs text-muted-foreground">{t("map.noData", "Aucune donnée")}</div>
          )}
        </Card>
      </section>

      {/* SECTION 4 : Évolutions Femme — 2 évolutions trimestrielles, mêmes données que le niveau préfectoral */}
      <section className="mt-8 w-full">
        <SectionTitle title={t("RegDomainDashboard.section4.title", "Dynamique Régionale")} subtitle={t("regDomainDashboard.femme.section4.subtitle", "Évolution trimestrielle de l'intégration des lauréates et de l'activité sociale")} />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-5 sm:p-6">
            <h3 className="font-bold text-foreground mb-1">{t("regDomainDashboard.femme.charts.evolIntegrationTitle", "Évolution intégration des lauréates")}</h3>
            <p className="text-xs text-muted-foreground mb-4">{t("regDomainDashboard.femme.charts.evolIntegrationSubtitle", "Lauréates et intégrées par trimestre")}</p>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={evolutionIntegration} margin={isArabic ? { top: 10, right: 10, left: 40, bottom: 0 } : { top: 10, right: 10, left: 20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="trimestre" fontSize={11} tick={{ textAnchor: isArabic ? "end" : "middle", dx: isArabic ? -4 : 0 }} />
                  
                  <YAxis orientation="left" width={isArabic ? 55 : 40} tick={{ fontSize: 11, dx: isArabic ? -20 : 0 }} />
                  
                  <Tooltip contentStyle={{ borderRadius: "8px", fontSize: "12px" }} formatter={(value: number) => formatNumber(value, locale)} />
                  <Legend iconType="circle" wrapperStyle={legendStyle} />
                  <Area type="monotone" dataKey="laureates" name={t("regDomainDashboard.femme.legend.laureates", "Lauréates")} stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} connectNulls={false} />
                  <Area type="monotone" dataKey="integrees" name={t("regDomainDashboard.femme.legend.integrees", "Intégrées")} stroke="#10b981" fill="#10b981" fillOpacity={0.2} connectNulls={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="p-5 sm:p-6">
            <h3 className="font-bold text-foreground mb-1">{t("regDomainDashboard.femme.charts.evolActiviteSocialeTitle", "Évolution activité sociale")}</h3>
            <p className="text-xs text-muted-foreground mb-4">{t("regDomainDashboard.femme.charts.evolActiviteSocialeSubtitle", "Bénéficiaires AGR, séances d'écoute et partenariats")}</p>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={evolutionActiviteSociale} margin={isArabic ? { top: 10, right: 40, left: 40, bottom: 0 } : { top: 10, right: 10, left: 20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="trimestre" fontSize={11} tick={{ textAnchor: isArabic ? "end" : "middle", dx: isArabic ? -4 : 0 }} />
                  
                  <YAxis yAxisId="left" orientation="left" width={isArabic ? 55 : 40} tick={{ fontSize: 11, dx: isArabic ? -20 : 0 }} />
                  
                  <YAxis yAxisId="right" orientation="right" width={isArabic ? 55 : 40} tick={{ fontSize: 11, dx: isArabic ? 20 : 0 }} allowDecimals={false} />
                  
                  <Tooltip contentStyle={{ borderRadius: "8px", fontSize: "12px" }} formatter={(value: number) => formatNumber(value, locale)} />
                  <Legend iconType="circle" wrapperStyle={legendStyle} />
                  <Line yAxisId="left" type="monotone" dataKey="beneficiairesAgr" name={t("regDomainDashboard.femme.kpis.beneficiairesAgr", "Bénéficiaires AGR")} stroke="#f59e0b" strokeWidth={3} dot={{ strokeWidth: 2, r: 4 }} activeDot={{ r: 6, strokeWidth: 0 }} connectNulls={false} />
                  <Line yAxisId="left" type="monotone" dataKey="seancesCentresEcoute" name={t("regDomainDashboard.femme.kpis.seancesEcoute", "Séances d'écoute")} stroke="#8b5cf6" strokeWidth={3} dot={{ strokeWidth: 2, r: 4 }} activeDot={{ r: 6, strokeWidth: 0 }} connectNulls={false} />
                  <Line yAxisId="right" type="monotone" dataKey="partenariatsSuivis" name={t("regDomainDashboard.femme.kpis.partenariatsSuivis", "Partenariats suivis")} stroke="#0ea5e9" strokeWidth={3} dot={{ strokeWidth: 2, r: 4 }} activeDot={{ r: 6, strokeWidth: 0 }} connectNulls={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      </section>
    </div>
  );
}

export default AffairesFemininesRegionalSections;
