import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { AppLayout } from "@/components/AppLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from 'react-router-dom';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  ArrowUpDown,
  Trophy, Map 
} from "lucide-react";
import { formatNumber } from "@/lib/data";
import { exportDashboardXlsx } from "@/lib/excelExport";
import { DEFAULT_YEAR } from "@/components/YearSwitcher";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const RegionDashboard = () => {
  const { t, i18n } = useTranslation();
  const { utilisateur, isRegional } = useAuth();
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [prefectures, setPrefectures] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState<number>(DEFAULT_YEAR);
  const [filterDomain, setFilterDomain] = useState<string>("jeunesse");
  const navigate = useNavigate();
  // State variables needed for the second half
  const [selectedDirection, setSelectedDirection] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" } | null>(null);

  const [kpiData, setKpiData] = useState({
    total_beneficiaires: 0,
    total_activites: 0,
    etablissements_actifs: 0,
    total_partenariats: 0,
    taux_feminisation: 0,
    taux_couverture: 0,
  });

  const [section3Data, setSection3Data] = useState({
    domaine_educatif: 0,
    domaine_culturel: 0,
    domaine_sportif: 0,
    domaine_capacite: 0,
    femmes: 0,
    hommes: 0,
    rural: 0,
    urbain: 0,
  });

  const [evolutionActivites, setEvolutionActivites] = useState<any[]>([]);
  const [evolutionEtablissements, setEvolutionEtablissements] = useState<any[]>([]);

  useEffect(() => {
    setLoading(true);

  Promise.all([
    supabase.from("v_dashboard_reg_section1_annuel").select("*").eq("annee", year),
    supabase.from("directions").select("*"),
    supabase.from("v_dashboard_pref_score_jeunesse").select("*").eq("annee", year),
    supabase.from("v_dashboard_reg_section2_annuel").select("*").eq("annee", year).maybeSingle(),
    supabase.from("v_dashboard_reg_section3_annuel").select("*").eq("annee", year).maybeSingle(),
    supabase.from("v_dashboard_reg_section4_trimestriel").select("*").eq("annee", year).order("trimestre", { ascending: true })
    ]).then(([subs, dirs, scores, sec2, sec3, sec4]) => {
      const dirsWithScores = (dirs.data ?? []).map((pref) => {
        const scoreRow = (scores.data ?? []).find((s) => s.direction_id === pref.id) as any || {}; // 👈 Ajout de 'as any'
        const sub = (subs.data ?? []).find((s) => s.direction_id === pref.id) as any || {}; // 👈 Ajout de 'as any'
        
        return {
          ...pref,
          score: scoreRow.score_jeunesse || 0,
          rang_regional: scoreRow.rang_regional || 99,
          pref_total_activites: scoreRow.pref_total_activites || 0,
          pref_total_beneficiaires: scoreRow.pref_total_beneficiaires || 0,
          statut: sub.statut || "NON_COMMENCE"
        };
      });

      setSubmissions(subs.data ?? []);
      setPrefectures(dirsWithScores);

    // 💡 MISE À JOUR DE L'ÉTAT KPI
    if (sec2.data) {
      setKpiData({
        total_beneficiaires: sec2.data.total_beneficiaires || 0,
        total_activites: sec2.data.total_activites || 0,
        etablissements_actifs: sec2.data.etablissements_actifs || 0,
        total_partenariats: sec2.data.total_partenariats || 0,
        taux_feminisation: sec2.data.taux_feminisation || 0,
        taux_couverture: sec2.data.taux_couverture || 0,
      });
    } else {
      // Remise à zéro si l'année est vide
      setKpiData({ total_beneficiaires: 0, total_activites: 0, etablissements_actifs: 0, total_partenariats: 0, taux_feminisation: 0, taux_couverture: 0 });
    }

    if (sec3.data) {
        setSection3Data({
          domaine_educatif: sec3.data.act_educatives || 0,
          domaine_culturel: sec3.data.act_culturelles || 0,
          domaine_sportif: sec3.data.act_sportives || 0,
          domaine_capacite: sec3.data.act_renforcement || 0,
          femmes: sec3.data.total_femmes || 0,
          hommes: sec3.data.total_hommes || 0,
          rural: sec3.data.total_rural || 0,
          urbain: sec3.data.total_urbain || 0,
        });
      } else {
        setSection3Data({ domaine_educatif: 0, domaine_culturel: 0, domaine_sportif: 0, domaine_capacite: 0, femmes: 0, hommes: 0, rural: 0, urbain: 0 });
      }

      if (sec4.data) {
        // On crée un squelette vide pour forcer l'axe X à toujours afficher les 4 trimestres
        const trimestresVides = ["T1", "T2", "T3", "T4"];

        const activitesData = trimestresVides.map((tLabel) => {
          // On cherche si la BDD a retourné ce trimestre (en ignorant la casse et les "Tt")
          const row = sec4.data.find(r => 
             r.trimestre?.toString().includes(tLabel.replace('T', ''))
          );
          
          return {
            trimestre: tLabel, // "T1", "T2", etc. (Toujours propre)
            // On utilise null et non 0 pour que la ligne s'arrête au lieu de plonger
            total_activites: row ? row.total_activites : null 
          };
        });

        const etablissementsData = trimestresVides.map((tLabel) => {
          const row = sec4.data.find(r => 
             r.trimestre?.toString().includes(tLabel.replace('T', ''))
          );
          
          return {
            trimestre: tLabel,
            fonctionnels: row ? row.fonctionnels : null,
            travaux: row ? row.travaux : null,
            fermes: row ? row.fermes : null
          };
        });

        setEvolutionActivites(activitesData);
        setEvolutionEtablissements(etablissementsData);
      } else {
        // Si aucune donnée, on affiche quand même l'axe X vide
        const emptyData = ["T1", "T2", "T3", "T4"].map(t => ({ trimestre: t }));
        setEvolutionActivites(emptyData);
        setEvolutionEtablissements(emptyData);
      }
    setLoading(false);
  });

  }, [year, filterDomain]);
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
  

  // Global completion tracking
  const totalDirections = prefectures.length;
  
  // 💡 On vérifie le vrai champ 'statut' retourné par la vue SQL
  const completedCount = submissions.filter((s) => s.statut === "TERMINE" || s.statut === "validee").length;
  const inProgressCount = submissions.filter((s) => s.statut === "EN_COURS" || s.statut === "soumise").length;
  
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
// Processing comparative data for table and insights (À affiner dans la prochaine étape)
// 💡 NOUVEAU FORMATAGE DES DONNÉES DU TABLEAU ET DES TOP 3
const directionsData = prefectures.map((pref) => ({
    id: pref.id,
    name: pref.nom_fr || pref.nom || `Direction ${pref.id}`,
    activities: pref.pref_total_activites || 0,
    beneficiaries: pref.pref_total_beneficiaires || 0,
    statut: pref.statut || "NON_COMMENCE",
    score: pref.score || 0,
    rang_regional: pref.rang_regional || 99
  }));

  const filteredDirections = directionsData.filter((d) =>
    d.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedDirections = [...filteredDirections].sort((a, b) => {
    if (!sortConfig) return a.rang_regional - b.rang_regional;
    const { key, direction } = sortConfig;
    if ((a as any)[key] < (b as any)[key]) return direction === "asc" ? -1 : 1;
    if ((a as any)[key] > (b as any)[key]) return direction === "asc" ? 1 : -1;
    return 0;
  });

  const rankedDirections = sortedDirections.map((d, index) => ({
    ...d,
    rang: index + 1 
  }));
  const topActivites = [...directionsData]
    .sort((a, b) => b.activities - a.activities)
    .slice(0, 3);

  const topBeneficiaires = [...directionsData]
    .sort((a, b) => b.beneficiaries - a.beneficiaries)
    .slice(0, 3);

  const selectedDirectionData = directionsData.find((d) => d.id === selectedDirection);

  const maxActivities = Math.max(...(rankedDirections.map(d => d.activities || 0)), 1);

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        
        {/* Hero */}
        <div className="relative overflow-hidden rounded-2xl gradient-hero p-6 sm:p-8 text-primary-foreground shadow-elegant">
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider opacity-80">
                {t("dashboard.welcomeBack", { name: utilisateur?.nom ?? "" })}
              </p>
              <h1 className="text-2xl sm:text-3xl font-extrabold mt-2">
                {t("regionDashboard.title", "Tableau de bord régional DRJ")}
              </h1>
              <p className="text-sm sm:text-base opacity-90 mt-1">
                {t("regionDashboard.subtitle", "Vue globale de la région Casablanca-Settat")}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
              <Button
                size="sm"
                variant="secondary"
                onClick={() =>
                  exportDashboardXlsx(
                    directionsData,
                    [
                      { label: t("dashboard.kpi.beneficiaries"), value: formatNumber(kpiData.total_beneficiaires, i18n.language) },
                      { label: t("dashboard.kpi.associations"), value: formatNumber(kpiData.total_activites, i18n.language) },
                    ],
                    i18n.language,
                    t,
                    year
                  )
                }
                className="gap-1.5 bg-white/15 hover:bg-white/25 text-white border-0 backdrop-blur-sm"
              >
                <FileSpreadsheet className="h-4 w-4" />
                Excel
              </Button>
            </div>
          </div>
          <div className="absolute -top-12 -end-12 w-48 h-48 rounded-full bg-secondary/30 blur-3xl" />
          <div className="absolute -bottom-8 -start-8 w-40 h-40 rounded-full bg-primary-glow/40 blur-2xl" />
        </div>

        {/* Filters */}
        <Card className="p-4 sm:p-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                {t("common.year", "Année")}
              </span>
              <input
                id="year-selector"
                title="Sélectionner l'année"
                placeholder="Année"
                type="number"
                value={year}
                onChange={(e) => setYear(Number(e.target.value) || DEFAULT_YEAR)}
                min={2020}
                max={2099}
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              />
            </div>
            <div className="space-y-1">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                {t("common.domain", "Domaine")}
              </span>
              <Select value={filterDomain} onValueChange={setFilterDomain}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="jeunesse">{t("domain.options.jeunesse", "Jeunesse")}</SelectItem>
                  <SelectItem value="femme" disabled>{t("domain.options.femme", "Femme / Fille")}</SelectItem>
                  <SelectItem value="enfants" disabled>{t("domain.options.enfance", "Enfance")}</SelectItem>
                  <SelectItem value="creche" disabled>{t("domain.options.creche", "Crèche")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        {/* SECTION 1 : Suivi de Remplissage */}
        <section className="mb-6 w-full">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="text-xl font-bold text-foreground">
                {t('domain.tracking', 'Suivi du remplissage')}
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {t('domain.submittedCount', '{{n}} / {{total}} directions ont terminé', { 
                  n: completedCount, 
                  total: prefectures.length 
                })}
              </p>
            </div>
          </div>

          <Card className="p-5 sm:p-6 shadow-sm border-muted">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
              {[
                { key: 'completed', label: t('status.termine', 'Terminé'), pct: completedPct, count: completedCount, bg: 'bg-success/10', ring: 'ring-success/20', text: 'text-success', icon: CheckCircle2 },
                { key: 'in_progress', label: t('status.en_cours', 'En cours'), pct: inProgressPct, count: inProgressCount, bg: 'bg-warning/10', ring: 'ring-warning/20', text: 'text-warning', icon: Clock },
                { key: 'not_started', label: t('status.non_commence', 'Non commencé'), pct: notStartedPct, count: notStartedCount, bg: 'bg-destructive/10', ring: 'ring-destructive/20', text: 'text-destructive', icon: AlertCircle }
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.key} className={`rounded-lg p-3 ${item.bg} ring-1 ${item.ring}`}>
                    <div className={`flex items-center gap-1.5 ${item.text}`}>
                      <Icon className="h-3.5 w-3.5" />
                      <span className="text-[11px] font-semibold">{item.label}</span>
                    </div>
                    <div className={`text-2xl font-extrabold tabular-nums mt-1 ${item.text}`}>
                      {Math.round(item.pct)}%
                    </div>
                    <div className="text-[10px] text-muted-foreground tabular-nums mt-0.5">
                      {item.count} / {prefectures.length}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </section>

        {/* SECTION 2 : KPI Cards */}
        <section className="mb-8 w-full mt-8">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="text-xl font-bold text-foreground">
                {t("regionDashboard.kpis.title", "Indicateurs de Pilotage Stratégique")}
              </h2>
              {/* ... */}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
            <Card className="relative p-4 sm:p-5 border-border/60 hover:shadow-elegant overflow-hidden bg-card">
              <span className="absolute inset-y-0 start-0 w-1 bg-primary" />
              <Users className="h-8 w-8 mb-3 text-primary opacity-80" />
              <div className="text-xl sm:text-2xl font-extrabold tracking-tight tabular-nums text-primary">
                {formatNumber(kpiData.total_beneficiaires, i18n.language)} {/* 👈 Remplacer data par kpiData */}
              </div>
              <div className="text-xs text-muted-foreground mt-1 font-medium leading-tight">
                {t("regionDashboard.kpi.totalBeneficiaires", "Total Bénéficiaires")}
              </div>
            </Card>

            <Card className="relative p-4 sm:p-5 border-border/60 hover:shadow-elegant overflow-hidden bg-card">
              <span className="absolute inset-y-0 start-0 w-1 bg-info" />
              <Activity className="h-8 w-8 mb-3 text-info opacity-80" />
              <div className="text-xl sm:text-2xl font-extrabold tracking-tight tabular-nums text-info">
                {formatNumber(kpiData.total_activites, i18n.language)} {/* 👈 Remplacer data par kpiData */}
              </div>
              <div className="text-xs text-muted-foreground mt-1 font-medium leading-tight">
                {t("regionDashboard.kpi.totalActivities", "Total activités")}
              </div>
            </Card>

            <Card className="relative p-4 sm:p-5 border-border/60 hover:shadow-elegant overflow-hidden bg-card">
              <span className="absolute inset-y-0 start-0 w-1 bg-warning" />
              <Building2 className="h-8 w-8 mb-3 text-warning opacity-80" />
              <div className="text-xl sm:text-2xl font-extrabold tracking-tight tabular-nums text-warning">
                {formatNumber(kpiData.etablissements_actifs, i18n.language)} {/* 👈 Remplacer data par kpiData */}
              </div>
              <div className="text-xs text-muted-foreground mt-1 font-medium leading-tight">
                {t("regionDashboard.kpi.activeEstablishments", "Établissements actifs")}
              </div>
            </Card>

            <Card className="relative p-4 sm:p-5 border-border/60 hover:shadow-elegant overflow-hidden bg-card">
              <span className="absolute inset-y-0 start-0 w-1 bg-success" />
              <Handshake className="h-8 w-8 mb-3 text-success opacity-80" />
              <div className="text-xl sm:text-2xl font-extrabold tracking-tight tabular-nums text-success">
                {formatNumber(kpiData.total_partenariats, i18n.language)} {/* 👈 Remplacer data par kpiData */}
              </div>
              <div className="text-xs text-muted-foreground mt-1 font-medium leading-tight">
                {t("regionDashboard.kpi.totalPartnerships", "Partenariats conclus")}
              </div>
            </Card>

            <Card className="relative p-4 sm:p-5 border-border/60 hover:shadow-elegant overflow-hidden bg-card">
              <span className="absolute inset-y-0 start-0 w-1 bg-pink-500" />
              <PersonStanding className="h-8 w-8 mb-3 text-pink-500 opacity-80" />
              <div className="text-xl sm:text-2xl font-extrabold tracking-tight tabular-nums text-pink-500">
                {kpiData.taux_feminisation}% {/* 👈 Remplacer data par kpiData */}
              </div>
              <div className="text-xs text-muted-foreground mt-1 font-medium leading-tight">
                {t("regionDashboard.kpi.feminisation", "Taux de Féminisation")}
              </div>
            </Card>

            <Card className="relative p-4 sm:p-5 border-border/60 hover:shadow-elegant overflow-hidden bg-card">
              <span className="absolute inset-y-0 start-0 w-1 bg-blue-600" />
              <Map className="h-8 w-8 mb-3 text-blue-600 opacity-80" />
              <div className="text-xl sm:text-2xl font-extrabold tracking-tight tabular-nums text-blue-600">
                {kpiData.taux_couverture}% {/* 👈 Remplacer data par kpiData */}
              </div>
              <div className="text-xs text-muted-foreground mt-1 font-medium leading-tight">
                {t("regionDashboard.kpi.couverture", "Taux de Couverture")}
              </div>
            </Card>
          </div>
        </section>
        {/* SECTION 3 : Structure & Inclusion sociale */}
        <section className="mt-8">
          <div className="mb-4">
            <h3 className="font-bold text-lg text-foreground mb-1">
              Structure & Inclusion Sociale
            </h3>
            <p className="text-sm text-muted-foreground">
              Analyse démographique et territoriale
            </p>
          </div>

          <Card className="p-5 sm:p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div>
                <h4 className="text-sm font-semibold text-center mb-2">Répartition par Domaine</h4>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart margin={{ top: 15, right: 0, bottom: 0, left: 0 }}>
                    <Pie
                      data={[
                        { name: "Éducatif", value: section3Data.domaine_educatif },
                        { name: "Culturel", value: section3Data.domaine_culturel },
                        { name: "Sportif", value: section3Data.domaine_sportif },
                        { name: "Capacité", value: section3Data.domaine_capacite },
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
                <h4 className="text-sm font-semibold text-center mb-2">Inclusion Genre</h4>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart margin={{ top: 15, right: 0, bottom: 0, left: 0 }}>
                    <Pie
                      data={[
                        { name: "Femmes", value: section3Data.femmes },
                        { name: "Hommes", value: section3Data.hommes }
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
                <h4 className="text-sm font-semibold text-center mb-2">Structure Territoriale</h4>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart margin={{ top: 15, right: 0, bottom: 0, left: 0 }}>
                    <Pie
                      data={[
                        { name: "Rural", value: section3Data.rural },
                        { name: "Urbain", value: section3Data.urbain },
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
        <section className="mt-8">
          <div className="mb-4">
            <h2 className="text-xl font-bold text-foreground">
              Dynamique Régionale
            </h2>

            <p className="text-xs text-muted-foreground mt-1">
              Évolution des activités et partenariats durant l'année
            </p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* CARD 1 */}

            <Card className="p-5 sm:p-6">

              <h3 className="font-bold text-foreground mb-1">
                Évolution Trimestrielle des Activités
              </h3>

              <p className="text-xs text-muted-foreground mb-4">
                Volume global des activités réalisées
              </p>

              <div className="h-[280px]">

                <ResponsiveContainer width="100%" height="100%">

                  <AreaChart data={evolutionActivites}>

                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="hsl(var(--border))"
                    />

                    <XAxis
                      dataKey="trimestre"
                      fontSize={11}
                    />

                    <YAxis
                      fontSize={11}
                    />

                    <Tooltip />

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
            Évolution de l'État des Établissements
          </h3>
          <p className="text-xs text-muted-foreground mb-4">
            Suivi trimestriel de l'infrastructure
          </p>
          
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              {/* 
              */}
              <LineChart data={evolutionEtablissements}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(var(--border))"
                  vertical={false} 
                />
                
                <XAxis
                  dataKey="trimestre"
                  fontSize={11}
                  
                />
                
                <YAxis
                  fontSize={11}
                
                />
                
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', fontSize: '12px' }} 
                />
                
                <Legend 
                  iconType="circle" 
                  wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} 
                />

                {/* 🟢 Ligne Verte */}
                <Line
                  type="monotone"
                  dataKey="fonctionnels"
                  name="Fonctionnels"
                  stroke="#10B981" 
                  strokeWidth={3}
                  dot={{ strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                  connectNulls={false} /* 👈 AJOUTER CECI */
                />

                {/* 🔵 Ligne Bleue */}
                <Line
                  type="monotone"
                  dataKey="travaux"
                  name="En travaux"
                  stroke="#3B82F6" 
                  strokeWidth={3}
                  dot={{ strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                  connectNulls={false} /* 👈 AJOUTER CECI */
                />

                {/* 🔴 Ligne Rouge */}
                <Line
                  type="monotone"
                  dataKey="fermes"
                  name="Fermés"
                  stroke="#EF4444" 
                  strokeWidth={3}
                  dot={{ strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                  connectNulls={false} /* 👈 AJOUTER CECI */
                />

              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

          </div>
        </section>

        {/* SECTION 5 */}
        <section className="mt-8">

          <div className="mb-4">
            <h2 className="text-xl font-bold">
              Performance des Directions
            </h2>

            <p className="text-xs text-muted-foreground">
              Classement et comparaison régionale
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-6 mb-6">

              {/* TOP ACTIVITES */}
            <Card className="p-5 border-border/60 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <Trophy className="h-5 w-5 text-primary" />
                <h3 className="font-bold text-base text-foreground">
                  Top 3 Activités
                </h3>
              </div>

              <div className="space-y-3">
                {topActivites.map((item, index) => {
                  // تحديد ألوان السطر والدائرة لكل رتبة بدقة
                  let rowStyle = "bg-muted/40 border border-transparent";
                  let badgeStyle = "bg-muted text-muted-foreground border-transparent";

                  if (index === 0) {
                    rowStyle = "bg-amber-500/10 border border-amber-500/20"; // Gold Row
                    badgeStyle = "bg-amber-500/20 text-amber-800 border-amber-500/30"; // Gold Badge
                  } else if (index === 1) {
                    rowStyle = "bg-slate-400/10 border border-slate-400/20"; // Silver Row
                    badgeStyle = "bg-slate-400/20 text-slate-800 border-slate-400/30"; // Silver Badge
                  } else if (index === 2) {
                    rowStyle = "bg-orange-500/10 border border-orange-500/20"; // Bronze Row
                    badgeStyle = "bg-orange-500/20 text-orange-800 border-orange-500/30"; // Bronze Badge
                  }

                  return (
                    <div
                      key={item.name}
                      className={`flex items-center justify-between p-3 rounded-xl transition-all duration-200 ${rowStyle}`}
                    >
                      <div className="flex items-center gap-3">
                        {/* الدائرة دابا ولات متناسقة مع السطر */}
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center font-extrabold text-xs border ${badgeStyle}`}>
                          {index + 1}
                        </div>
                        <span className="font-semibold text-sm text-foreground">
                          {item.name}
                        </span>
                      </div>
                      <span className="font-bold text-sm text-foreground tabular-nums">
                        {item.activities}
                      </span>
                    </div>
                  );
                })}
              </div>
            </Card>

              {/* TOP BENEFICIAIRES */}
            <Card className="p-5 border-border/60 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <Trophy className="h-5 w-5 text-success" />
                <h3 className="font-bold text-base text-foreground">
                  Top 3 Bénéficiaires
                </h3>
              </div>

              <div className="space-y-3">
                {topBeneficiaires.map((item, index) => {
                  let rowStyle = "bg-muted/40 border border-transparent";
                  let badgeStyle = "bg-muted text-muted-foreground border-transparent";

                  if (index === 0) {
                    rowStyle = "bg-amber-500/10 border border-amber-500/20";
                    badgeStyle = "bg-amber-500/20 text-amber-800 border-amber-500/30";
                  } else if (index === 1) {
                    rowStyle = "bg-slate-400/10 border border-slate-400/20";
                    badgeStyle = "bg-slate-400/20 text-slate-800 border-slate-400/30";
                  } else if (index === 2) {
                    rowStyle = "bg-orange-500/10 border border-orange-500/20";
                    badgeStyle = "bg-orange-500/20 text-orange-800 border-orange-500/30";
                  }

                  return (
                    <div
                      key={item.id || item.name}
                      className={`flex items-center justify-between p-3 rounded-xl transition-all duration-200 ${rowStyle}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center font-extrabold text-xs border ${badgeStyle}`}>
                          {index + 1}
                        </div>
                        <span className="font-semibold text-sm text-foreground">
                          {item.name}
                        </span>
                      </div>
                      <span className="font-bold text-sm text-foreground tabular-nums">
                        {item.beneficiaries?.toLocaleString('fr-FR') || 0}
                      </span>
                    </div>
                  );
                })}
              </div>
            </Card>

          </div>

        {/* TABLEAU */}
          <Card className="p-5 sm:p-6 border-border/60 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-bold text-lg text-foreground">
                  Tableau Comparatif des Directions
                </h3>
                <p className="text-[12px] text-muted-foreground mt-1">
                  Classement détaillé et état d'avancement
                </p>
              </div>
            </div>

            <div className="rounded-md border border-border/50 overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow className="hover:bg-transparent border-border/50">
                    <TableHead className="w-[80px] text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Rang</TableHead>
                    <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Direction</TableHead>
                    
                    {/* Score Global */}
                    <TableHead 
                      className="text-center text-[11px] font-bold uppercase tracking-wider text-muted-foreground cursor-pointer hover:text-primary transition-colors group"
                      onClick={() => handleSort && handleSort("score")}
                    >
                      <div className="flex items-center justify-center gap-1.5">
                        Score Global
                        <ArrowUpDown className="h-3 w-3 text-muted-foreground/50 group-hover:text-primary transition-colors" />
                      </div>
                    </TableHead>
                    
                    <TableHead className="text-right text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Statut</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {rankedDirections.map((row, index) => {
                    const rowStatus = row.statut || "NON_COMMENCE";
                    
                    let statusConfig = {
                      label: 'Non commencé',
                      badgeClass: 'bg-destructive/10 ring-1 ring-destructive/20 text-destructive border-0',
                      Icon: AlertCircle, 
                    };

                    if (rowStatus === 'TERMINE') {
                      statusConfig = {
                        label: 'Terminé', 
                        badgeClass: 'bg-success/10 ring-1 ring-success/20 text-success border-0',
                        Icon: CheckCircle2,
                      };
                    } else if (rowStatus === 'EN_COURS') {
                      statusConfig = {
                        label: 'En cours',
                        badgeClass: 'bg-warning/10 ring-1 ring-warning/20 text-warning border-0',
                        Icon: Clock,
                      };
                    }

                    let rankBadgeStyle = "bg-muted text-muted-foreground border-transparent";
                    if (index === 0) { 
                      rankBadgeStyle = "bg-amber-500/20 text-amber-800 border-amber-500/30"; 
                    } else if (index === 1) { 
                      rankBadgeStyle = "bg-slate-400/20 text-slate-800 border-slate-400/30"; 
                    } else if (index === 2) { 
                      rankBadgeStyle = "bg-orange-500/20 text-orange-800 border-orange-500/30"; 
                    }

                    return (
                      <TableRow 
                        key={row.id || index}
                        className="cursor-pointer hover:bg-muted/30 transition-colors border-border/50" // السطر بقا نقي وعادي
                        onClick={() => navigate(`/directions/${row.id}`)}
                      >
                        {/* Rang */}
                        <TableCell>
                          <div className={`w-7 h-7 flex items-center justify-center rounded-full text-xs font-extrabold border ${rankBadgeStyle}`}>
                            {row.rang || index + 1}
                          </div>
                        </TableCell>

                        {/* Direction */}
                        <TableCell className="font-semibold text-sm text-foreground">
                          {row.name}
                        </TableCell>

                        {/* Score Global */}
                        <TableCell className="text-center">
                          <span className="font-extrabold tabular-nums text-[15px] text-foreground">
                            {row.score || 0}%
                          </span>
                        </TableCell>

                        {/* Statut */}
                        <TableCell className="text-right">
                          <Badge variant="outline" className={`gap-1.5 px-2.5 py-1 shadow-none ${statusConfig.badgeClass}`}>
                            <statusConfig.Icon className="h-3.5 w-3.5" />
                            <span className="font-semibold text-xs tracking-wide">{statusConfig.label}</span>
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </Card>
        </section>

      </div>
    </AppLayout>
  );
};

export default RegionDashboard;