import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import type { LucideIcon } from "lucide-react";
import { AlertTriangle, Banknote, Landmark, Percent, ReceiptText } from "lucide-react";
import {
  Bar,
  BarChart,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { InfrastructureRegionalDashboardData } from "@/services/regional/infrastructureRegionalService";
import { formatNumber } from "@/lib/data";

interface InfrastructureRegionalSectionsProps {
  data: InfrastructureRegionalDashboardData;
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

// Même pattern visuel que les KPI cards Jeunesse (RegDomainDashboard.tsx) :
// barre d'accent, icône, valeur, libellé.
function KpiCard({ label, value, locale, icon: Icon, accent, percentage = false }: KpiCardProps) {
  return (
    <Card className="relative overflow-hidden border-border/60 bg-card p-4 sm:p-5 hover:shadow-elegant">
      <span className={`absolute inset-y-0 start-0 w-1 ${accent}`} />
      <Icon className={`mb-3 h-8 w-8 opacity-80 ${accent.replace("bg-", "text-")}`} />
      <div
        className={`text-xl sm:text-2xl font-extrabold tracking-tight tabular-nums ${accent.replace("bg-", "text-")}`}
        dir="ltr"
      >
        {formatNumber(value, locale)}
        {percentage ? "%" : ""}
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

function ChartCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <Card className="p-5 sm:p-6">
      <h3 className="font-bold text-foreground mb-1">{title}</h3>
      {subtitle ? <p className="text-xs text-muted-foreground mb-4">{subtitle}</p> : null}
      <div className="h-[280px]">{children}</div>
    </Card>
  );
}

const PIE_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#0ea5e9"];

const trimestreLabel = (value: string, t: (key: string, fallback: string) => string) => {
  const key = `RegDomainDashboard.quarters.${value.toLowerCase()}`;
  return t(key, value.toUpperCase());
};

const infrastructurePhaseLabel = (raw: string, t: (key: string, fallback: string) => string) => {
  const value = raw?.trim();
  const normalized = value.toLowerCase();
  const phaseMap: Record<string, string> = {
    attente_foncier: t("regDomainDashboard.infra.phases.attente_foncier", "Attente foncier"),
    etudes: t("regDomainDashboard.infra.phases.etudes", "Études"),
    acheve: t("regDomainDashboard.infra.phases.acheve", "Achevé"),
  };
  return phaseMap[normalized] ?? value;
};

const infrastructureTypeLabel = (raw: string, t: (key: string, fallback: string) => string) => {
  const value = raw?.trim();
  const normalized = value.toLowerCase();
  const typeMap: Record<string, string> = {
    maison_jeunes: t(
      "regDomainDashboard.infra.etablissementTypes.maison_jeunes",
      "Maison de Jeunes",
    ),
    club_feminin: t("regDomainDashboard.infra.etablissementTypes.club_feminin", "Club Féminin"),
    centre_socio_sportif: t(
      "regDomainDashboard.infra.etablissementTypes.centre_socio_sportif",
      "Centre Socio-Sportif",
    ),
  };
  return typeMap[normalized] ?? value;
};

export function InfrastructureRegionalSections({
  data,
  locale,
}: InfrastructureRegionalSectionsProps) {
  const { t, i18n } = useTranslation();
  const { kpis: financial, section3: projects, evolution, detailed } = data;
  const blockedProjects = detailed?.blockedProjects ?? { total: 0, projets: [] };
  const isArabic = i18n.language === "ar";
  const legendStyle = {
    fontSize: "11px",
    paddingTop: "10px",
    width: isArabic ? "100%" : undefined,
    maxWidth: isArabic ? 260 : undefined,
  };

  const financialComparison = [
    {
      poste: t("regDomainDashboard.infra.postes.fonctionnement", "Fonctionnement"),
      ...financial.fonctionnement,
    },
    {
      poste: t("regDomainDashboard.infra.postes.investissement", "Investissement"),
      ...financial.investissement,
    },
  ];

  const btpRepartition = [
    {
      name: t("regDomainDashboard.infra.btp.construction", "Construction"),
      value: projects.btp.construction,
    },
    {
      name: t("regDomainDashboard.infra.btp.amenagement", "Aménagement"),
      value: projects.btp.amenagement,
    },
  ];

  const phaseRepartition = projects.partenariat.par_phase.map((row) => ({
    name: infrastructurePhaseLabel(row.phase_projet, t),
    value: row.total,
  }));

  const typeEtablissementRepartition = projects.partenariat.par_types_etablissements.map((row) => ({
    name: infrastructureTypeLabel(row.type_etablissement, t),
    value: row.total,
  }));

  const evolutionFinanciere = evolution.financier.map((row) => ({
    ...row,
    trimestre: trimestreLabel(row.trimestre, t),
  }));

  const evolutionProjets = evolution.projets.map((row) => ({
    ...row,
    trimestre: trimestreLabel(row.trimestre, t),
  }));

  return (
    <div className="space-y-8">
      {/* SECTION 1 : Pilotage financier — équivalent "Indicateurs de Pilotage Stratégique" Jeunesse */}
      <section className="w-full">
        <SectionTitle
          title={t("regDomainDashboard.infra.sectionFinance.title", "Pilotage financier")}
          subtitle={t(
            "regDomainDashboard.infra.sectionFinance.subtitle",
            "Crédits et niveaux d'exécution budgétaire",
          )}
        />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 xl:grid-cols-5">
          <KpiCard
            label={t("regDomainDashboard.infra.kpis.creditsOuverts", "Crédits ouverts")}
            value={financial.credits_ouverts}
            locale={locale}
            icon={Landmark}
            accent="bg-primary"
          />
          <KpiCard
            label={t("regDomainDashboard.infra.kpis.creditsEngages", "Crédits engagés")}
            value={financial.credits_engages}
            locale={locale}
            icon={ReceiptText}
            accent="bg-info"
          />
          <KpiCard
            label={t("regDomainDashboard.infra.kpis.creditsPayes", "Crédits payés")}
            value={financial.credits_payes}
            locale={locale}
            icon={Banknote}
            accent="bg-success"
          />
          <KpiCard
            label={t("regDomainDashboard.infra.kpis.tauxEngagement", "Taux d'engagement")}
            value={financial.taux_engagement}
            locale={locale}
            icon={Percent}
            accent="bg-warning"
            percentage
          />
          <KpiCard
            label={t("regDomainDashboard.infra.kpis.tauxPaiement", "Taux de paiement")}
            value={financial.taux_paiement}
            locale={locale}
            icon={Percent}
            accent="bg-blue-600"
            percentage
          />
        </div>
        <div className="mt-6">
          <ChartCard
            title={t(
              "regDomainDashboard.infra.charts.fonctInvestTitle",
              "Fonctionnement et investissement",
            )}
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={financialComparison}
                margin={
                  isArabic
                    ? { top: 8, right: 12, left: 10, bottom: 0 }
                    : { top: 8, right: 12, left: 0, bottom: 0 }
                }
              >
                <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="poste"
                  tickLine={false}
                  axisLine={false}
                  fontSize={11}
                  tick={{ textAnchor: isArabic ? "end" : "middle", dx: isArabic ? -8 : 0 }}
                />
                <YAxis tickLine={false} axisLine={false} width={44} fontSize={11} />
                <Tooltip
                  formatter={(value: number) => formatNumber(value, locale)}
                  contentStyle={{ borderRadius: "8px", fontSize: "12px" }}
                />
                <Legend iconType="circle" wrapperStyle={legendStyle} />
                <Bar
                  dataKey="credits_ouverts"
                  name={t("regDomainDashboard.infra.kpis.creditsOuverts", "Crédits ouverts")}
                  fill="#3b82f6"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="credits_engages"
                  name={t("regDomainDashboard.infra.kpis.creditsEngages", "Crédits engagés")}
                  fill="#f59e0b"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="credits_payes"
                  name={t("regDomainDashboard.infra.kpis.creditsPayes", "Crédits payés")}
                  fill="#10b981"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      </section>

      {/* SECTION 2 : Structure & Répartition des Projets — équivalent "Structure & Inclusion Sociale" Jeunesse */}
      <section className="mt-8 w-full">
        <SectionTitle
          title={t(
            "regDomainDashboard.infra.section2.title",
            "Structure & Répartition des Projets",
          )}
          subtitle={t(
            "regDomainDashboard.infra.section2.subtitle",
            "Répartition des projets BTP et des partenariats",
          )}
        />
        <Card className="p-5 sm:p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div>
              <h4 className="text-sm font-semibold text-center mb-2">
                {t("regDomainDashboard.infra.charts.btpTitle", "Construction / Aménagement")}
              </h4>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart margin={{ top: 15, right: 0, bottom: 0, left: 0 }}>
                  <Pie
                    data={btpRepartition}
                    dataKey="value"
                    cx="50%"
                    cy="45%"
                    outerRadius={80}
                    strokeWidth={2}
                  >
                    {btpRepartition.map((entry, index) => (
                      <Cell key={entry.name} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatNumber(value, locale)} />
                  <Legend
                    verticalAlign="bottom"
                    wrapperStyle={
                      isArabic
                        ? { paddingTop: "15px", maxWidth: 260, width: "100%" }
                        : { paddingTop: "15px" }
                    }
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-center mb-2">
                {t("regDomainDashboard.infra.charts.phaseTitle", "Partenariats par phase")}
              </h4>
              {phaseRepartition.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart margin={{ top: 15, right: 0, bottom: 0, left: 0 }}>
                    <Pie
                      data={phaseRepartition}
                      dataKey="value"
                      cx="50%"
                      cy="45%"
                      outerRadius={80}
                      strokeWidth={2}
                    >
                      {phaseRepartition.map((entry, index) => (
                        <Cell key={entry.name} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => formatNumber(value, locale)} />
                    <Legend
                      verticalAlign="bottom"
                      wrapperStyle={
                        isArabic
                          ? { paddingTop: "15px", maxWidth: 260, width: "100%" }
                          : { paddingTop: "15px" }
                      }
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-[220px] items-center justify-center text-xs text-muted-foreground">
                  {t("map.noData", "Aucune donnée")}
                </div>
              )}
            </div>

            <div>
              <h4 className="text-sm font-semibold text-center mb-2">
                {t(
                  "regDomainDashboard.infra.charts.typeEtabTitle",
                  "Partenariats par type d'établissement",
                )}
              </h4>
              {typeEtablissementRepartition.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart margin={{ top: 15, right: 0, bottom: 0, left: 0 }}>
                    <Pie
                      data={typeEtablissementRepartition}
                      dataKey="value"
                      cx="50%"
                      cy="45%"
                      outerRadius={80}
                      strokeWidth={2}
                    >
                      {typeEtablissementRepartition.map((entry, index) => (
                        <Cell key={entry.name} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => formatNumber(value, locale)} />
                    <Legend
                      verticalAlign="bottom"
                      wrapperStyle={
                        isArabic
                          ? { paddingTop: "15px", maxWidth: 260, width: "100%" }
                          : { paddingTop: "15px" }
                      }
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-[220px] items-center justify-center text-xs text-muted-foreground">
                  {t("map.noData", "Aucune donnée")}
                </div>
              )}
            </div>
          </div>
        </Card>
      </section>

      {/* SECTION 3 : Dynamique Régionale — équivalent "Dynamique Régionale" Jeunesse, + vigilance projets en souffrance */}
      <section className="mt-8 w-full">
        <SectionTitle
          title={t("RegDomainDashboard.section4.title", "Dynamique Régionale")}
          subtitle={t(
            "regDomainDashboard.infra.section3.subtitle",
            "Évolution trimestrielle des crédits et des projets",
          )}
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-5 sm:p-6">
            <h3 className="font-bold text-foreground mb-1">
              {t("regDomainDashboard.infra.charts.evolCreditsTitle", "Évolution des Crédits")}
            </h3>
            <p className="text-xs text-muted-foreground mb-4">
              {t(
                "regDomainDashboard.infra.charts.evolCreditsSubtitle",
                "Crédits engagés et payés par trimestre",
              )}
            </p>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={evolutionFinanciere}
                  margin={
                    isArabic
                      ? { top: 10, right: 10, left: 45, bottom: 0 }
                      : { top: 10, right: 10, left: 30, bottom: 0 }
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
                    width={isArabic ? 65 : 45}
                    tick={{ fontSize: 11, dx: isArabic ? -25 : 0 }}
                  />

                  <Tooltip
                    contentStyle={{ borderRadius: "8px", fontSize: "12px" }}
                    formatter={(value: number) => formatNumber(value, locale)}
                  />
                  <Legend iconType="circle" wrapperStyle={legendStyle} />
                  <Line
                    type="monotone"
                    dataKey="credits_engages"
                    name={t("regDomainDashboard.infra.kpis.creditsEngages", "Crédits engagés")}
                    stroke="#f59e0b"
                    strokeWidth={3}
                    dot={{ strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                    connectNulls={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="credits_payes"
                    name={t("regDomainDashboard.infra.kpis.creditsPayes", "Crédits payés")}
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

          <Card className="p-5 sm:p-6">
            <h3 className="font-bold text-foreground mb-1">
              {t("regDomainDashboard.infra.charts.evolProjetsTitle", "Évolution des Projets")}
            </h3>
            <p className="text-xs text-muted-foreground mb-4">
              {t(
                "regDomainDashboard.infra.charts.evolProjetsSubtitle",
                "Nombre de projets BTP et partenariats par trimestre",
              )}
            </p>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={evolutionProjets}
                  margin={
                    isArabic
                      ? { top: 10, right: 10, left: 35, bottom: 0 }
                      : { top: 10, right: 10, left: 30, bottom: 0 }
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
                    width={isArabic ? 55 : 45}
                    allowDecimals={false}
                    tick={{ fontSize: 11, dx: isArabic ? -20 : 0 }}
                  />

                  <Tooltip
                    contentStyle={{ borderRadius: "8px", fontSize: "12px" }}
                    formatter={(value: number) => formatNumber(value, locale)}
                  />
                  <Legend iconType="circle" wrapperStyle={legendStyle} />
                  <Line
                    type="monotone"
                    dataKey="projets_btp"
                    name={t("regDomainDashboard.infra.charts.projetsBtpLegend", "Projets BTP")}
                    stroke="#3b82f6"
                    strokeWidth={3}
                    dot={{ strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                    connectNulls={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="projets_partenariat"
                    name={t(
                      "regDomainDashboard.infra.charts.projetsPartenariatLegend",
                      "Projets partenariat",
                    )}
                    stroke="#8b5cf6"
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

        {/* Bloc de vigilance compact — ne constitue pas une 4e section */}
        <div className="mt-6">
          <Card className="overflow-hidden border-border/60 shadow-sm">
            <div className="flex items-center gap-2 border-b border-border/60 bg-muted/30 px-4 py-3 sm:px-5">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <h4 className="text-sm font-bold text-foreground">
                {t("regDomainDashboard.infra.blocked.title", "Projets en souffrance")}
              </h4>
              <span
                className="ms-auto text-xs font-semibold tabular-nums text-destructive"
                dir="ltr"
              >
                {formatNumber(blockedProjects.total, locale)}
              </span>
            </div>
            <div className="max-h-64 overflow-y-auto">
              <Table>
                <TableHeader className="bg-muted/20">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="text-xs text-start">
                      {t("regDomainDashboard.infra.blocked.columns.etablissement", "Établissement")}
                    </TableHead>
                    <TableHead className="text-xs text-start">
                      {t("regDomainDashboard.infra.blocked.columns.cause", "Cause")}
                    </TableHead>
                    <TableHead className="text-xs text-start">
                      {t("regDomainDashboard.infra.blocked.columns.solution", "Solution")}
                    </TableHead>
                    <TableHead className="text-xs text-start">
                      {t("regDomainDashboard.infra.blocked.columns.observation", "Observation")}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {blockedProjects.projets.length > 0 ? (
                    blockedProjects.projets.map((project) => (
                      <TableRow key={project.id} className="border-border/50">
                        <TableCell className="text-sm font-medium text-start">
                          {project.etablissement ?? "—"}
                        </TableCell>
                        <TableCell className="whitespace-normal text-sm text-start">
                          {project.causes_blocage ?? "—"}
                        </TableCell>
                        <TableCell className="whitespace-normal text-sm text-start">
                          {project.solutions_proposees ?? "—"}
                        </TableCell>
                        <TableCell className="whitespace-normal text-sm text-start">
                          {project.observations ?? "—"}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className="py-6 text-center text-sm text-muted-foreground"
                      >
                        {t(
                          "regDomainDashboard.infra.blocked.empty",
                          "Aucun projet en souffrance déclaré.",
                        )}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        </div>
      </section>
    </div>
  );
}

export default InfrastructureRegionalSections;
