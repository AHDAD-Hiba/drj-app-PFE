import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/common/useAuth";
import { AppLayout } from "@/components/AppLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from 'react-router-dom';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
  LineChart,
  Line,
  XAxis,
  YAxis,AreaChart,Area,CartesianGrid,
} from "recharts";
import {
  RegionalCompletionTracking,
  type RegionalCompletionTrackingProps,
} from "@/components/dashboard/RegionalCompletionTracking";
import {
  RegionalDirectionPerformance,
} from "@/components/dashboard/RegionalDirectionPerformance";
import {
  RegionalDirectionsTable,
} from "@/components/dashboard/RegionalDirectionsTable";
import { RegionalTopThree } from "@/components/dashboard/RegionalTopThree";
import { InfrastructureRegionalSections } from "@/components/dashboard/InfrastructureRegionalSections";
import { AffairesFemininesRegionalSections } from "@/components/dashboard/AffairesFemininesRegionalSections";
import { ProtectionEnfanceRegionalSections } from "@/components/dashboard/ProtectionEnfanceRegionalSections";
import { EnfanceCrechesRegionalSections } from "@/components/dashboard/EnfanceCrechesRegionalSections";
import {
  RegionalFilters,
  type RegionalDomainOption,
} from "@/components/dashboard/RegionalFilters";
import {
  Users,
  Building2,
  Handshake,
  CheckCircle2,
  Clock,
  FileSpreadsheet,
  Activity,
  AlertCircle,
  PersonStanding,
  XCircle,
  ArrowUpDown, Map ,FileText,Download
} from "lucide-react";
import { formatNumber } from "@/lib/data";
import { DEFAULT_YEAR } from "@/components/YearSwitcher";
import {
  REGIONAL_DOMAIN_CODES,
  type RegionalDashboardPayload,
  type RegionalDomainCode,
} from "@/services/regional/regionalDashboardServices";
import { useRegionalDomainDashboardData } from "@/hooks/useRegionalDomainDashboardData";
import type { InfrastructureRegionalDashboardData } from "@/services/regional/infrastructureRegionalService";
import type { FemmeRegionalDashboardData } from "@/services/regional/femmeRegionalService";
import type { JeunesseRegionalDashboardData } from "@/services/regional/jeunesseRegionalService";
import type { PeRegionalDashboardData } from "@/services/regional/peRegionalService";
import type { CrechesRegionalDashboardData } from "@/services/regional/crechesRegionalService";

const isJeunesseDashboard = (data: RegionalDashboardPayload): data is JeunesseRegionalDashboardData =>
  "total_beneficiaires" in data.kpis;
const isInfrastructureDashboard = (data: RegionalDashboardPayload): data is InfrastructureRegionalDashboardData =>
  "credits_ouverts" in data.kpis;
const isFemmeDashboard = (data: RegionalDashboardPayload): data is FemmeRegionalDashboardData =>
  "totalInscriptionsFormation" in data.kpis;
const isPeDashboard = (data: RegionalDashboardPayload): data is PeRegionalDashboardData =>
  "totalBeneficiairesPriseEnCharge" in data.kpis;
const isCrechesDashboard = (data: RegionalDashboardPayload): data is CrechesRegionalDashboardData =>
  "enfantsPrisesEnCharge" in data.kpis;

const isRegionalDomainCode = (value: string): value is RegionalDomainCode =>
  REGIONAL_DOMAIN_CODES.some((code) => code === value);

const RegDomainDashboard = () => {
  
  const { t, i18n } = useTranslation();
  const { utilisateur, isRegional } = useAuth();
  const [year, setYear] = useState<number>(DEFAULT_YEAR);
  const [filterDomain, setFilterDomain] = useState<RegionalDomainCode>("JEUNESSE");
  const { data: dashboardData, loading, isRefreshing, error, contentDomain } = useRegionalDomainDashboardData(
    filterDomain,
    year,
    i18n.language,
  );
  const navigate = useNavigate();
  const dashboardRef = useRef<HTMLDivElement>(null);

  // State variables needed for the second half
  const [selectedDirection, setSelectedDirection] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" } | null>(null);

  const [dbDomains, setDbDomains] = useState<any[]>([]);

useEffect(() => {
  const fetchDomains = async () => {
    const { data } = await supabase.from("domaines").select("*");
    if (data) setDbDomains(data);
  };
  fetchDomains();
}, []);

  

  const directionComparisons = dashboardData?.comparison.directions ?? [];
  const regionalStatus = dashboardData?.status;
  const jeunesseDashboard = dashboardData && isJeunesseDashboard(dashboardData) ? dashboardData : null;
  const jeunesseKpis = jeunesseDashboard?.kpis ?? {
    total_beneficiaires: 0, total_activites: 0, etablissements_actifs: 0,
    total_partenariats: 0, taux_feminisation: 0, taux_couverture: 0,
  };
  const jeunesseSection3 = jeunesseDashboard?.section3 ?? {
    domaine_educatif: 0, domaine_culturel: 0, domaine_sportif: 0, domaine_capacite: 0,
    femmes: 0, hommes: 0, rural: 0, urbain: 0,
  };
  const jeunesseEvolution = jeunesseDashboard?.evolution ?? { activites: [], etablissements: [] };
  const infrastructureDashboard = dashboardData && isInfrastructureDashboard(dashboardData) ? dashboardData : null;
  const femmeDashboard = dashboardData && isFemmeDashboard(dashboardData) ? dashboardData : null;
  const peDashboard = dashboardData && isPeDashboard(dashboardData) ? dashboardData : null;
  const crechesDashboard = dashboardData && isCrechesDashboard(dashboardData) ? dashboardData : null;

  // Access control: only regional team can access
  if (loading) {
    return (
      <AppLayout>
        <div className="grid gap-4">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="h-24 bg-muted/50 rounded-xl animate-pulse"
            />
          ))}
        </div>
      </AppLayout>
    );
  }
  
  if (!isRegional) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <XCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">
              {t("common.accessDenied", "Accès refusé")}
            </h2>
            <p className="text-muted-foreground">
              {t(
                "common.regionalAccessOnly",
                "Cette page est réservée à l'équipe régionale."
              )}
            </p>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (error && dashboardData === null) {
    return (
      <AppLayout>
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="flex max-w-md items-center gap-3 rounded-md border border-destructive/40 bg-destructive/5 p-5 text-destructive" role="alert">
            <AlertCircle className="h-6 w-6 shrink-0" />
            <span>{t("RegDomainDashboard.loadError", "Le chargement du tableau de bord a echoue. Veuillez reessayer.")}</span>
          </div>
        </div>
      </AppLayout>
    );
  }

  // Global completion tracking
  const totalDirections = directionComparisons.length;
  
  //  On vérifie le vrai champ 'statut' retourné par la vue SQL
  const completedCount = regionalStatus?.completedDirections ?? 0;
  const inProgressCount = regionalStatus?.inProgressDirections ?? 0;
  
  // Ceux qui n'ont même pas de ligne dans la vue (ou statut non commencé)
  const notStartedCount = totalDirections - completedCount - inProgressCount;

  const completedPct = totalDirections > 0 ? Math.round((completedCount / totalDirections) * 100) : 0;
  const inProgressPct = totalDirections > 0 ? Math.round((inProgressCount / totalDirections) * 100) : 0;
  const notStartedPct = totalDirections > 0 ? Math.round((notStartedCount / totalDirections) * 100) : 0;

  const handleSort = (key: string) => {
    let direction: "asc" | "desc" = "asc";
    if (sortConfig && sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const translateDirectionName = (rawName: string) => {
    const normalizedName = (rawName || "").trim();
    const fallbackName = normalizedName || "Direction";
    const translationKey = normalizedName.toLowerCase();
    return t(`prefectures.${translationKey}`, fallbackName) as string;
  };

// Processing comparative data for table and insights (À affiner dans la prochaine étape)
// NOUVEAU FORMATAGE DES DONNÉES DU TABLEAU ET DES TOP 3
const directionsData = directionComparisons.map((direction) => ({
    id: direction.id,
    name: direction.name,
    metric_primary: direction.primary ?? 0,
    metric_secondary: direction.secondary ?? 0,
    statut: direction.status,
    score: direction.score ?? 0,
    rang_regional: direction.rank ?? 99
  }));

  const filteredDirections = directionsData.filter((d) =>
    d.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedDirections = [...filteredDirections].sort((a, b) => {
    if (!sortConfig) return a.rang_regional - b.rang_regional;
    const { key, direction } = sortConfig;
    const valueFor = (item: (typeof directionsData)[number]) => {
      if (key === "score") return item.score;
      if (key === "metric_primary") return item.metric_primary;
      if (key === "metric_secondary") return item.metric_secondary;
      return item.rang_regional;
    };
    if (valueFor(a) < valueFor(b)) return direction === "asc" ? -1 : 1;
    if (valueFor(a) > valueFor(b)) return direction === "asc" ? 1 : -1;
    return 0;
  });

  const isInfrastructure = contentDomain === "INFRA";
  const isJeunesse = contentDomain === "JEUNESSE";
  const isFemme = contentDomain === "FEMME";
  const isPE = contentDomain === "PE";
  const isCreches = contentDomain === "CRECHES";

  const rankedDirections = sortedDirections.map((d) => ({
    ...d,
    rang: isJeunesse || isInfrastructure || isFemme || isPE || isCreches
      ? d.rang_regional < 99 ? d.rang_regional : null
      : null,
  }));
  const topMetricPrimary = [...directionsData]
    .sort((a, b) => b.metric_primary - a.metric_primary)
    .slice(0, 3);

  const topMetricSecondary = [...directionsData]
    .sort((a, b) => b.metric_secondary - a.metric_secondary)
    .slice(0, 3);

  const selectedDirectionData = directionsData.find((d) => d.id === selectedDirection);

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        
        {/* Hero */}
        <div className="relative overflow-hidden rounded-2xl gradient-hero p-6 sm:p-8 text-primary-foreground shadow-elegant">
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold mt-2">
                {t("regionDashboard.title", "Tableau de bord régional DRJ")}
              </h1>
              <p className="text-sm sm:text-base opacity-90 mt-1">
                {t("regionDashboard.subtitle", "Vue globale de la région Casablanca-Settat")}
              </p>
            </div>
            
            <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
            </div>
          </div>
          <div className="absolute -top-12 -end-12 w-48 h-48 rounded-full bg-secondary/30 blur-3xl" />
          <div className="absolute -bottom-8 -start-8 w-40 h-40 rounded-full bg-primary-glow/40 blur-2xl" />
        </div>

        <div ref={dashboardRef} className="flex flex-col gap-6 w-full">

        <RegionalFilters
          year={year}
          onYearChange={setYear}
          filterDomain={filterDomain}
          onFilterDomainChange={(domain) => {
            if (isRegionalDomainCode(domain)) setFilterDomain(domain);
          }}
          domains={dbDomains as RegionalDomainOption[]}
          yearLabel={t("common.year", "Année")}
          domainLabel={t("common.domain", "Domaine")}
        />

        {isRefreshing && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground" role="status">
            <Activity className="h-4 w-4 animate-pulse" />
            {t("RegDomainDashboard.refreshing", "Mise a jour du tableau de bord...")}
          </div>
        )}

        {error && (
          <div className="flex items-center gap-3 rounded-md border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive" role="alert">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span>{t("RegDomainDashboard.loadError", "Le chargement du tableau de bord a echoue. Veuillez reessayer.")}</span>
          </div>
        )}

        <RegionalCompletionTracking
          totalDirections={directionComparisons.length}
          completedCount={completedCount}
          inProgressCount={inProgressCount}
          title={t("RegDomainDashboard.tracking", "Suivi du remplissage")}
          summaryText={t("RegDomainDashboard.submittedCount", "{{n}} / {{total}} directions ont terminé", {
            n: completedCount,
            total: directionComparisons.length,
          })}
          statusLabels={{
            completed: t("RegDomainDashboard.status.termine", "Terminé"),
            inProgress: t("RegDomainDashboard.status.en_cours", "En cours"),
            notStarted: t("RegDomainDashboard.status.non_commence", "Non commencé"),
          }}
        />

        {isJeunesse && <>
        {/* SECTION 2 : KPI Cards */}
        <section className="mb-8 w-full mt-8">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="text-xl font-bold text-foreground">
                {t("RegDomainDashboard.kpis.title", "Indicateurs de Pilotage Stratégique")}
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
            <Card className="relative p-4 sm:p-5 border-border/60 hover:shadow-elegant overflow-hidden bg-card">
              <span className="absolute inset-y-0 start-0 w-1 bg-primary" />
              <Users className="h-8 w-8 mb-3 text-primary opacity-80" />
              <div className="text-xl sm:text-2xl font-extrabold tracking-tight tabular-nums text-primary">
                {formatNumber(jeunesseKpis.total_beneficiaires, i18n.language)}
              </div>
              <div className="text-xs text-muted-foreground mt-1 font-medium leading-tight">
                {t("RegDomainDashboard.kpis.totalBeneficiaires", "Total Bénéficiaires")}
              </div>
            </Card>

            <Card className="relative p-4 sm:p-5 border-border/60 hover:shadow-elegant overflow-hidden bg-card">
              <span className="absolute inset-y-0 start-0 w-1 bg-info" />
              <Activity className="h-8 w-8 mb-3 text-info opacity-80" />
              <div className="text-xl sm:text-2xl font-extrabold tracking-tight tabular-nums text-info">
                {formatNumber(jeunesseKpis.total_activites, i18n.language)}
              </div>
              <div className="text-xs text-muted-foreground mt-1 font-medium leading-tight">
                {t("RegDomainDashboard.kpis.totalActivities", "Total activités")}
              </div>
            </Card>

            <Card className="relative p-4 sm:p-5 border-border/60 hover:shadow-elegant overflow-hidden bg-card">
              <span className="absolute inset-y-0 start-0 w-1 bg-warning" />
              <Building2 className="h-8 w-8 mb-3 text-warning opacity-80" />
              <div className="text-xl sm:text-2xl font-extrabold tracking-tight tabular-nums text-warning">
                {formatNumber(jeunesseKpis.etablissements_actifs, i18n.language)}
              </div>
              <div className="text-xs text-muted-foreground mt-1 font-medium leading-tight">
                {t("RegDomainDashboard.kpis.activeEstablishments", "Établissements actifs")}
              </div>
            </Card>

            <Card className="relative p-4 sm:p-5 border-border/60 hover:shadow-elegant overflow-hidden bg-card">
              <span className="absolute inset-y-0 start-0 w-1 bg-success" />
              <Handshake className="h-8 w-8 mb-3 text-success opacity-80" />
              <div className="text-xl sm:text-2xl font-extrabold tracking-tight tabular-nums text-success">
                {formatNumber(jeunesseKpis.total_partenariats, i18n.language)}
              </div>
              <div className="text-xs text-muted-foreground mt-1 font-medium leading-tight">
                {t("RegDomainDashboard.kpis.totalPartnerships", "Partenariats conclus")}
              </div>
            </Card>

            <Card className="relative p-4 sm:p-5 border-border/60 hover:shadow-elegant overflow-hidden bg-card">
              <span className="absolute inset-y-0 start-0 w-1 bg-pink-500" />
              <PersonStanding className="h-8 w-8 mb-3 text-pink-500 opacity-80" />
              <div className="text-xl sm:text-2xl font-extrabold tracking-tight tabular-nums text-pink-500">
                <span dir="ltr">{Number(jeunesseKpis.taux_feminisation).toFixed(1)}%</span>
              </div>
              <div className="text-xs text-muted-foreground mt-1 font-medium leading-tight">
                {t("RegDomainDashboard.kpis.feminisation", "Taux de Féminisation")}
              </div>
            </Card>

            <Card className="relative p-4 sm:p-5 border-border/60 hover:shadow-elegant overflow-hidden bg-card">
              <span className="absolute inset-y-0 start-0 w-1 bg-blue-600" />
              <Map className="h-8 w-8 mb-3 text-blue-600 opacity-80" />
              <div className="text-xl sm:text-2xl font-extrabold tracking-tight tabular-nums text-blue-600">
                <span dir="ltr">{jeunesseKpis.taux_couverture}%</span>
              </div>
              <div className="text-xs text-muted-foreground mt-1 font-medium leading-tight">
                {t("RegDomainDashboard.kpis.couverture", "Taux de Couverture")}
              </div>
            </Card>
          </div>
        </section>

        {/* SECTION 3 : Structure & Inclusion sociale */}
        <section className="mt-8 w-full">
          <div className="mb-4">
            <h3 className="font-bold text-lg text-foreground mb-1">
              {t("RegDomainDashboard.section3.title", "Structure & Inclusion Sociale")}
            </h3>
            <p className="text-sm text-muted-foreground">
              {t("RegDomainDashboard.section3.subtitle", "Analyse démographique et territoriale")}
            </p>
          </div>

          <Card className="p-5 sm:p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div>
                <h4 className="text-sm font-semibold text-center mb-2">
                  {t("RegDomainDashboard.section3.domainChartTitle", "Répartition par Domaine")}
                </h4>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart margin={{ top: 15, right: 0, bottom: 0, left: 0 }}>
                    <Pie
                      data={[
                        { name: t("RegDomainDashboard.section3.domains.educatif", "Éducatif"), value: jeunesseSection3.domaine_educatif },
                        { name: t("RegDomainDashboard.section3.domains.culturel", "Culturel"), value: jeunesseSection3.domaine_culturel },
                        { name: t("RegDomainDashboard.section3.domains.sportif", "Sportif"), value: jeunesseSection3.domaine_sportif },
                        { name: t("RegDomainDashboard.section3.domains.capacite", "Capacité"), value: jeunesseSection3.domaine_capacite },
                      ]}
                      dataKey="value"
                      cx="50%"
                      cy="45%"
                      outerRadius={80}
                      strokeWidth={2}
                    >
                      <Cell fill="#3b82f6" />
                      <Cell fill="#10b981" />
                      <Cell fill="#f59e0b" />
                      <Cell fill="#8b5cf6" />
                    </Pie>
                    <Tooltip />
                    <Legend verticalAlign="bottom" wrapperStyle={{ paddingTop: "15px" }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-center mb-2">
                  {t("RegDomainDashboard.section3.genderChartTitle", "Inclusion Genre")}
                </h4>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart margin={{ top: 15, right: 0, bottom: 0, left: 0 }}>
                    <Pie
                      data={[
                        { name: t("RegDomainDashboard.section3.gender.femmes", "Femmes"), value: jeunesseSection3.femmes },
                        { name: t("RegDomainDashboard.section3.gender.hommes", "Hommes"), value: jeunesseSection3.hommes }
                      ]}
                      dataKey="value"
                      cx="50%"
                      cy="45%"
                      outerRadius={80}
                      strokeWidth={2}
                    >
                      <Cell fill="#ec4899" />
                      <Cell fill="#3b82f6" />
                    </Pie>
                    <Tooltip />
                    <Legend verticalAlign="bottom" wrapperStyle={{ paddingTop: "15px" }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-center mb-2">
                  {t("RegDomainDashboard.section3.territoryChartTitle", "Structure Territoriale")}
                </h4>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart margin={{ top: 15, right: 0, bottom: 0, left: 0 }}>
                    <Pie
                      data={[
                        { name: t("RegDomainDashboard.section3.territory.rural", "Rural"), value: jeunesseSection3.rural },
                        { name: t("RegDomainDashboard.section3.territory.urbain", "Urbain"), value: jeunesseSection3.urbain },
                      ]}
                      dataKey="value"
                      cx="50%"
                      cy="45%"
                      outerRadius={80}
                      strokeWidth={2}
                    >
                      <Cell fill="#10b981" />
                      <Cell fill="#f59e0b" />
                    </Pie>
                    <Tooltip />
                    <Legend verticalAlign="bottom" wrapperStyle={{ paddingTop: "15px" }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </Card>
        </section>

        {/* SECTION 4 : Dynamique Régionale */}
        <section className="mt-8 w-full">
          <div className="mb-4">
            <h2 className="text-xl font-bold text-foreground">
              {t("RegDomainDashboard.section4.title", "Dynamique Régionale")}
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              {t("RegDomainDashboard.section4.subtitle", "Évolution des activités et partenariats durant l'année")}
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* CARD 1 */}
            <Card className="p-5 sm:p-6">
              <h3 className="font-bold text-foreground mb-1">
                {t("RegDomainDashboard.section4.activitiesTitle", "Évolution Trimestrielle des Activités")}
              </h3>
              <p className="text-xs text-muted-foreground mb-4">
                {t("RegDomainDashboard.section4.activitiesSubtitle", "Volume global des activités réalisées")}
              </p>

              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart 
                    data={jeunesseEvolution.activites}
                    margin={{ 
                      top: 10, 
                      right: i18n.language === "ar" ? 45 : 10, 
                      left: i18n.language === "ar" ? 10 : 30, 
                      bottom: 0 
                    }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="hsl(var(--border))"
                    />
                    <XAxis
                      dataKey="trimestre"
                      fontSize={11}
                      tickFormatter={(value) => t(`RegDomainDashboard.quarters.${String(value).toLowerCase()}`, String(value))}
                    />
                    <YAxis
                      orientation="left"
                      width={45}
                      tick={{ 
                        fontSize: 11, 
                        dx: i18n.language === "ar" ? -18 : 0 
                      }}
                    />
                    <Tooltip 
                      labelFormatter={(label) => t(`RegDomainDashboard.quarters.${String(label).toLowerCase()}`, String(label))}
                    />
                    <Area
                      type="monotone"
                      dataKey="total_activites"
                      stroke="#10b981"
                      fill="rgba(16, 185, 129, 0.20)"
                      strokeWidth={3}
                      connectNulls={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* CARD 2 */}
            <Card className="p-5 sm:p-6">
              <h3 className="font-bold text-foreground mb-1">
                {t("RegDomainDashboard.section4.establishmentsTitle", "Évolution de l'État des Établissements")}
              </h3>
              <p className="text-xs text-muted-foreground mb-4">
                {t("RegDomainDashboard.section4.establishmentsSubtitle", "Suivi trimestriel de l'infrastructure")}
              </p>
              
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart 
                    data={jeunesseEvolution.etablissements}
                    margin={{ 
                      top: 10, 
                      right: i18n.language === "ar" ? 45 : 10, 
                      left: i18n.language === "ar" ? 10 : 30, 
                      bottom: 0 
                    }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="hsl(var(--border))"
                      vertical={false} 
                    />
                    <XAxis
                      dataKey="trimestre"
                      fontSize={11}
                      tickFormatter={(value) => t(`RegDomainDashboard.quarters.${String(value).toLowerCase()}`, String(value))}
                    />
                    <YAxis
                      orientation="left"
                      width={45}
                      tick={{ 
                        fontSize: 11, 
                        dx: i18n.language === "ar" ? -18 : 0 
                      }}
                    />
                    <Tooltip 
                      contentStyle={{ borderRadius: '8px', fontSize: '12px' }} 
                      labelFormatter={(label) => t(`RegDomainDashboard.quarters.${String(label).toLowerCase()}`, String(label))}
                    />
                    <Legend 
                      iconType="circle" 
                      wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} 
                    />

                    {/* Ligne Verte */}
                    <Line
                      type="monotone"
                      dataKey="fonctionnels"
                      name={t("RegDomainDashboard.section4.status.fonctionnels", "Fonctionnels")}
                      stroke="#10B981" 
                      strokeWidth={3}
                      dot={{ strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6, strokeWidth: 0 }}
                      connectNulls={false}
                    />

                    {/* Ligne Bleue */}
                    <Line
                      type="monotone"
                      dataKey="travaux"
                      name={t("RegDomainDashboard.section4.status.travaux", "En travaux")}
                      stroke="#3B82F6" 
                      strokeWidth={3}
                      dot={{ strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6, strokeWidth: 0 }}
                      connectNulls={false}
                    />

                    {/* Ligne Rouge */}
                    <Line
                      type="monotone"
                      dataKey="fermes"
                      name={t("RegDomainDashboard.section4.status.fermes", "Fermés")}
                      stroke="#EF4444" 
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

        </>}

        {isInfrastructure && infrastructureDashboard && (
          <InfrastructureRegionalSections
            data={infrastructureDashboard}
            locale={i18n.language}
          />
        )}

        {isFemme && femmeDashboard && (
          <AffairesFemininesRegionalSections
            data={femmeDashboard}
            locale={i18n.language}
          />
        )}

        {isPE && peDashboard && (
          <ProtectionEnfanceRegionalSections
            data={peDashboard}
            locale={i18n.language}
          />
        )}

        {isCreches && crechesDashboard && (
          <EnfanceCrechesRegionalSections
            data={crechesDashboard}
            locale={i18n.language}
          />
        )}

        <RegionalDirectionPerformance
          title={t("RegDomainDashboard.section5.title", "Performance des Directions")}
          subtitle={t("RegDomainDashboard.section5.subtitle", "Classement et comparaison régionale")}
        >
          <RegionalTopThree
            primary={{
              label: isInfrastructure
                ? t("regDomainDashboard.infra.metrics.budgetExecutionRate", "Taux d'exécution budgétaire")
                : isFemme
                ? t("regDomainDashboard.femme.kpis.inscriptionsFormation", "Inscriptions en formation")
                : isPE
                ? t("regDomainDashboard.pe.kpis.beneficiairesPriseEnCharge", "Bénéficiaires en prise en charge")
                : isCreches
                ? t("regDomainDashboard.creches.kpis.enfantsPrisEnCharge", "Enfants pris en charge")
                : t("RegDomainDashboard.section5.topActivities", "Top 3 par Activités"),
              items: topMetricPrimary.map((item) => ({ id: item.id, name: item.name, value: item.metric_primary })),
              accentClassName: "text-primary",
            }}
            secondary={{
              label: isInfrastructure
                ? t("regDomainDashboard.infra.metrics.projectsCount", "Nombre de projets")
                : isFemme
                ? t("regDomainDashboard.femme.kpis.beneficiairesAgr", "Bénéficiaires AGR")
                : isPE
                ? t("regDomainDashboard.pe.kpis.incidentsSignales", "Incidents exceptionnels")
                : isCreches
                ? t("regDomainDashboard.creches.kpis.demandesLicencesTraitees", "Demandes de licences traitées")
                : t("RegDomainDashboard.section5.topBeneficiaries", "Top 3 par Bénéficiaires"),
              items: topMetricSecondary.map((item) => ({ id: item.id, name: item.name, value: item.metric_secondary })),
              accentClassName: "text-success",
            }}
            formatValue={(value) => `${formatNumber(value, i18n.language)}${isInfrastructure ? "%" : ""}`}
            renderItemName={(item) => t(`prefectures.${item.name.toLowerCase()}`, item.name) as string}
          />
          <RegionalDirectionsTable
            rows={rankedDirections.map((row) => ({
              id: row.id,
              name: translateDirectionName(row.name),
              statut: row.statut,
              score: row.score,
              rang: row.rang,
              metric_primary: row.metric_primary,
              metric_secondary: row.metric_secondary,
            }))}
            onSort={handleSort}
            sortConfig={sortConfig}
            title={t("RegDomainDashboard.section5.tableTitle", "Tableau Comparatif des Directions")}
            subtitle={t("RegDomainDashboard.section5.tableSubtitle", "Classement détaillé et état d'avancement")}
            rankLabel={t("RegDomainDashboard.section5.columns.rank", "Rang")}
            directionLabel={t("RegDomainDashboard.section5.columns.direction", "Direction")}
            scoreLabel={t("RegDomainDashboard.section5.columns.score", "Score Global")}
            statusLabel={t("RegDomainDashboard.section5.columns.status", "Statut")}
            metricPrimaryLabel={isInfrastructure ? t("regDomainDashboard.infra.metrics.budgetExecutionRate", "Taux d'exécution budgétaire") : isFemme ? t("regDomainDashboard.femme.kpis.inscriptionsFormation", "Inscriptions en formation") : isPE ? t("regDomainDashboard.pe.kpis.beneficiairesPriseEnCharge", "Bénéficiaires en prise en charge") : isCreches ? t("regDomainDashboard.creches.kpis.enfantsPrisEnCharge", "Enfants pris en charge") : t("RegDomainDashboard.section5.columns.metricPrimary", "Activités")}
            metricSecondaryLabel={isInfrastructure ? t("regDomainDashboard.infra.metrics.projectsCount", "Nombre de projets") : isFemme ? t("regDomainDashboard.femme.kpis.beneficiairesAgr", "Bénéficiaires AGR") : isPE ? t("regDomainDashboard.pe.kpis.incidentsSignales", "Incidents exceptionnels") : isCreches ? t("regDomainDashboard.creches.kpis.demandesLicencesTraitees", "Demandes de licences traitées") : t("RegDomainDashboard.section5.columns.metricSecondary", "Bénéficiaires")}
            formatPrimaryMetric={(value) => `${formatNumber(value, i18n.language)}${isInfrastructure ? "%" : ""}`}
            formatSecondaryMetric={(value) => formatNumber(value, i18n.language)}
            statusLabels={{
              NON_COMMENCE: t("RegDomainDashboard.section5.status.NON_COMMENCE", "Non commencé"),
              TERMINE: t("RegDomainDashboard.section5.status.TERMINE", "Terminé"),
              EN_COURS: t("RegDomainDashboard.section5.status.EN_COURS", "En cours"),
            }}
            onRowClick={(id) => navigate(`/directions/${id}?domain=${filterDomain}&year=${year}`)}
          />
        </RegionalDirectionPerformance>
        </div>

      </div>
    </AppLayout>
  );
};

export default RegDomainDashboard;
