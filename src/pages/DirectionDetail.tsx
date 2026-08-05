import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom"; // 💡 Ajout de useSearchParams
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/AppLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Database } from "@/integrations/supabase/types";
import { formatBenchmarkData, formatEvolutionData, mapSection6Data } from "@/lib/dashboardHelpers";
import { BenchmarkTable } from "@/components/dashboard/BenchmarkTable";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { EvolutionChart } from "@/components/dashboard/EvolutionChart";
import { KPIGrid } from "@/components/dashboard/KPIGrid";
import { RepartitionCharts } from "@/components/dashboard/RepartitionCharts";
import type { EvolutionRow, RepartitionRow } from "@/components/dashboard/types";
import {
  ArrowLeft, Building2, CheckCircle2, ChevronRight, ChevronDown, ChevronUp,
  Activity, MapPin, CalendarDays, Users2, Tent, GraduationCap, Shield,
  ArrowRightLeft, UserPlus, UserMinus, Clock, Users, Handshake, Trophy,
  Globe, TrendingUp, TrendingDown, Landmark, Target, Medal,
  Sparkles, HardHat, Building, TreePine, FileText
} from "lucide-react";

type Direction = Database["public"]["Tables"]["directions"]["Row"];
type Rapport = Database["public"]["Tables"]["rapports"]["Row"];
type Partenariat = Database["public"]["Tables"]["partenariats"]["Row"];

const STATUS_STYLE: Record<string, string> = {
  TERMINE: "bg-success/15 text-success border-success/30",
  EN_COURS: "bg-info/15 text-info border-info/30",
  NON_COMMENCE: "bg-warning/15 text-warning border-warning/30",
  validee: "bg-success/15 text-success border-success/30",
  soumise: "bg-info/15 text-info border-info/30",
};

const DirectionDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [repartition, setRepartition] = useState<RepartitionRow[]>([]);
  const [searchParams] = useSearchParams(); // 💡 Lecture dynamique de l'année passée en URL
  const { t, i18n } = useTranslation();
  const lang = i18n.language;

  // Récupération de l'année de l'URL ou 2026 par défaut
  const selectedYear = Number(searchParams.get("year")) || 2026; 

  const [direction, setDirection] = useState<Direction | null>(null);
  const [partenariats, setPartenariats] = useState<Partenariat[]>([]);
  const [evolution, setEvolution] = useState<EvolutionRow[]>([]);
  const [benchmark, setBenchmark] = useState(() => formatBenchmarkData(null));
  const [detailed, setDetailed] = useState<ReturnType<typeof mapSection6Data>>(() => mapSection6Data(null));
  const [openSection, setOpenSection] = useState<string | null>("activites");
  const [loading, setLoading] = useState(true);
  
  // État unifié pour les métriques de la Section 1 (Header)
  const [metriquesGlobales, setMetriquesGlobales] = useState({
    progression: 0,
    statut: "NON_COMMENCE",
    lastUpdate: null as string | null
  });

  const fmt = (n: number) =>
    new Intl.NumberFormat(lang === "ar" ? "ar-MA" : "fr-FR").format(Math.round(n));

  useEffect(() => {
    if (!id) return;

    (async () => {
      setLoading(true);
      
      // 1. Charger les métadonnées de la Direction
      const { data: dir } = await supabase.from("directions").select("*").eq("id", id).maybeSingle();
      setDirection(dir);

      // 2. Charger le dernier rapport de l'année sélectionnée
      const { data: rap } = await supabase
        .from("rapports")
        .select("*")
        .eq("direction_id", id)
        .eq("annee", selectedYear)
        .order("trimestre", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!rap) {
        setBenchmark(formatBenchmarkData(null));
        setDetailed(mapSection6Data(null));
        setMetriquesGlobales({ progression: 0, statut: "NON_COMMENCE", lastUpdate: null });
        setRepartition([]);
        setLoading(false);
        return;
      }

      // 3. Charger le suivi global via la vue préfectorale de la Section 1
      const { data: section1Data } = await supabase
        .from("v_dashboard_pref_section1")
        .select("*")
        .eq("rapport_id", rap.id)
        .maybeSingle();
      
      const s1 = (section1Data ?? {}) as { progression_pourcentage?: number; statut?: string; derniere_mise_a_jour?: string | null };

      // 4. Charger l'ensemble des données brutes ET la section 3 (Répartition)
      // 💡 Ajout de section3Data dans le tableau à gauche pour récupérer le résultat
      const [, , , partsData2, section3Data] = await Promise.all([
        supabase.from("activites").select("*").eq("rapport_id", rap.id),
        supabase.from("participants").select("*").eq("rapport_id", rap.id),
        supabase.from("formations").select("*").eq("rapport_id", rap.id),
        supabase.from("partenariats").select("*").eq("rapport_id", rap.id),
        supabase.from("v_dashboard_pref_section3_annuel").select("*").eq("direction_id", id).eq("annee", selectedYear),
      ]);
      
      setPartenariats(partsData2.data || []);

      // 5. Charger l'ensemble des indicateurs consolidés (Vues analytiques)
      const [evolutionData, benchmarkData, section6Data] = await Promise.all([
        supabase.from("v_dashboard_pref_section4").select("*").eq("direction_id", id).eq("annee", selectedYear),
        supabase.from("v_dashboard_pref_section5_annuel").select("*").eq("direction_id", id).eq("annee", selectedYear).maybeSingle(),
        supabase.from("v_dashboard_pref_section6_annuel").select("*").eq("direction_id", id).eq("annee", selectedYear).maybeSingle(),
      ]);
        
      setEvolution(formatEvolutionData((evolutionData.data ?? []) as EvolutionRow[]));
      setBenchmark(formatBenchmarkData(benchmarkData.data));
      setDetailed(mapSection6Data(section6Data.data));

      // Enregistrement des données du Header
      setMetriquesGlobales({
        progression: s1.progression_pourcentage || 0,
        statut: s1.statut || "NON_COMMENCE",
        lastUpdate: s1.derniere_mise_a_jour || rap.updated_at
      });

      // 💡 La variable est maintenant correctement définie et utilisable ici
      setRepartition((section3Data.data ?? []) as RepartitionRow[]);

      setLoading(false);
    })();
  }, [id, selectedYear]);

  // Mouvements issus directement de la structure consolidée du composant
  const viewEntrants = detailed.associations?.entrants || 0;
  const viewSortants = detailed.associations?.sortants || 0;
  const benEntrants = detailed.associations?.ben_entrants || 0;
  const benSortants = detailed.associations?.ben_sortants || 0;

  const toggleSection = (section: string) => {
    setOpenSection(openSection === section ? null : section);
  };


  if (loading) {
    return (
      <AppLayout>
        <div className="p-12 text-center animate-pulse text-muted-foreground">
          {t("RegDomainDashboard.loadingPrefecture", "Chargement de l'analyse détaillée de la préfecture...")}
        </div>
      </AppLayout>
    );
  }

  if (!direction) {
    return (
      <AppLayout>
        <Card className="p-8 text-center border-border/60">
          <div className="mx-auto h-14 w-14 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
            <Building2 className="h-7 w-7 text-muted-foreground" />
          </div>
          <h2 className="text-lg font-bold text-foreground">Direction introuvable</h2>
          <Button variant="outline" size="sm" onClick={() => navigate("/directions")} className="mt-4 gap-2">
            <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
            {t("detail.back")}
          </Button>
        </Card>
      </AppLayout>
    );
  }
  return (
    <AppLayout>
      <DashboardShell>
        {/* HEADER / SECTION 1 */}
        <Card className="overflow-hidden rounded-xl border-border/60 shadow-none">
          <div className="p-5 sm:p-6 border-b border-border bg-gradient-to-br from-primary/5 via-card to-card">
            <nav className="flex items-center gap-1.5 text-xs text-muted-foreground mb-3">
              <button onClick={() => navigate("/directions")} className="hover:text-primary transition-smooth font-medium">
                {t('nav.directions')}
              </button>
              <ChevronRight className="h-3.5 w-3.5" />
              <span className="text-foreground font-semibold">{lang === 'ar' ? direction.nom_ar : direction.nom_fr}</span>
            </nav>

            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                  {lang === 'ar' ? direction.nom_ar : direction.nom_fr}
                </h2>
                <div className="flex flex-wrap items-center gap-2 mt-3">
                  <Badge variant="outline" className="text-[10px] border-border/60 shadow-none">
                    <MapPin className="h-3 w-3 me-1 text-primary" />
                    {t('directionDetails.region')}
                  </Badge>
                  
                  {/* (Statut) */}
                  <Badge variant="outline" className={`text-[10px] shadow-none ${STATUS_STYLE[metriquesGlobales.statut] || STATUS_STYLE["NON_COMMENCE"]}`}>
                    <CheckCircle2 className="h-3 w-3 me-1" />
                    {metriquesGlobales.statut ? t(`status.${metriquesGlobales.statut}`) : t('directionDetails.notStarted')}
                  </Badge>
                  
                  <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/20 shadow-none">
                    <Activity className="h-3 w-3 me-1" />
                    {t('directionDetails.progression')} {metriquesGlobales.progression}%
                  </Badge>
                  
                  {metriquesGlobales.lastUpdate && (
                    <Badge variant="outline" className="text-[10px] border-border/60 shadow-none">
                      <CalendarDays className="h-3 w-3 me-1" />
                      {t('directionDetails.lastUpdate')} {new Date(metriquesGlobales.lastUpdate).toLocaleDateString(lang === 'ar' ? "ar-MA" : "fr-FR")}
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-5">
              <div className="flex justify-between text-[11px] text-muted-foreground mb-1.5">
                <span>{t('directionDetails.inputProgress')}</span>
                <span className="tabular-nums font-semibold">{metriquesGlobales.progression}%</span>
              </div>
              <Progress value={metriquesGlobales.progression} className="h-2" />
            </div>
          </div>
        </Card>
        {/* SECTION 2 — Top KPIs */}
        <KPIGrid
          title={t("prefDomainDashboard.keyIndicators")}
          metrics={[
            {
              label: t("prefDomainDashboard.kpis.activities"),
              value: fmt(benchmark[0]?.monScore || 0),
              icon: Activity,
              accentClass: "bg-[hsl(var(--kpi-2))]",
              iconContainerClass: "bg-[hsl(var(--kpi-2-soft))] text-[hsl(var(--kpi-2))]",
            },
            {
              label: t("prefDomainDashboard.kpis.beneficiaries"),
              value: fmt(benchmark[1]?.monScore || 0),
              icon: Users2,
              accentClass: "bg-[hsl(var(--kpi-3))]",
              iconContainerClass: "bg-[hsl(var(--kpi-3-soft))] text-[hsl(var(--kpi-3))]",
            },
            {
              label: t("prefDomainDashboard.kpis.partnerships"),
              value: fmt(benchmark[4]?.monScore || 0),
              icon: Handshake,
              accentClass: "bg-[hsl(var(--kpi-4))]",
              iconContainerClass: "bg-[hsl(var(--kpi-4-soft))] text-[hsl(var(--kpi-4))]",
            },
            {
              label: t("prefDomainDashboard.kpis.feminization"),
              value: `${benchmark[3]?.monScore || 0}%`,
              icon: Users,
              accentClass: "bg-pink-500",
              iconContainerClass: "bg-pink-500/10 text-pink-500",
              valueClassName: "text-pink-600",
            },
            {
              label: t("prefDomainDashboard.kpis.coverage"),
              value: `${benchmark[2]?.monScore || 0}%`,
              icon: Globe,
              accentClass: "bg-blue-600",
              iconContainerClass: "bg-blue-600/10 text-blue-600",
              valueClassName: "text-blue-600",
            },
            {
              label: t("prefDomainDashboard.kpis.establishments"),
              value: fmt(benchmark[5]?.monScore || 0),
              icon: Building2,
              accentClass: "bg-warning",
              iconContainerClass: "bg-warning/10 text-warning",
            },
          ]}
          className="border-border/60 shadow-none"
        />
        {/* SECTION 3 — Répartition des bénéficiaires */}
        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-bold text-foreground">
              {t("prefDomainDashboard.charts.axeTitle")}
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
            <RepartitionCharts
              title={t("prefDomainDashboard.charts.volumeTitle")}
              subtitle={t("prefDomainDashboard.charts.volumeSubtitle")}
              data={repartition}
              chartType="volume"
              t={(key: string, fallback?: string) => t(key, fallback ?? key)}
              lang={lang}
              cardClassName="border-border/60 shadow-none"
            />
            <RepartitionCharts
              title={t("prefDomainDashboard.charts.mixityTitle")}
              subtitle={t("prefDomainDashboard.charts.mixitySubtitle")}
              data={repartition}
              chartType="mixity"
              t={(key: string, fallback?: string) => t(key, fallback ?? key)}
              lang={lang}
              cardClassName="border-border/60 shadow-none"
            />
            <RepartitionCharts
              title={t("prefDomainDashboard.charts.coverageTitle")}
              subtitle={t("prefDomainDashboard.charts.coverageSubtitle")}
              data={repartition}
              chartType="coverage"
              t={(key: string, fallback?: string) => t(key, fallback ?? key)}
              lang={lang}
              cardClassName="border-border/60 shadow-none"
            />
          </div>
        </section>
        {/* SECTION 4 — Évolution temporelle */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-foreground">
              {t("prefDomainDashboard.charts.evolutionTitle")}
            </h2>
          </div>

          <EvolutionChart
            title={t("prefDomainDashboard.charts.evolutionCardTitle")}
            subtitle={t("prefDomainDashboard.charts.evolutionCardSubtitle")}
            data={evolution}
            t={(key: string, fallback?: string) => t(key, fallback ?? key)}
            lang={lang}
            cardClassName="border-border/60 shadow-none"
          />
        </section>
        {/* --- SECTION 5 : Benchmark régional --- */}
        <section className="space-y-3">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-foreground">
              {t("prefDomainDashboard.benchmark.title", "Benchmark régional")}
            </h2>
          </div>
          <BenchmarkTable
            rows={benchmark}
            t={(key: string, fallback?: string) => t(key, fallback ?? key)}
            lang={lang}
            className="bg-card w-full overflow-hidden border-border/60 shadow-none"
          />
        </section>
        {/* SECTION 6 — Lecture détaillée du rapport */}
        <section className="space-y-2">
          <h2 className="text-base sm:text-lg font-bold text-foreground">
            {t("prefDomainDashboard.details.title", "Lecture détaillée du rapport")}
          </h2>
          <div className="space-y-3">
            
            {/* ACCORDION ITEM 1: ACTIVITÉS */}
            <Card className="overflow-hidden border-border/70 shadow-none">
              <button
                onClick={() => toggleSection("activites")}
                className="w-full flex items-center justify-between p-4 bg-muted/20 hover:bg-muted/40 transition-colors"
              >
                <div className="flex items-center gap-2 font-bold text-sm text-foreground">
                  <Activity className="h-4 w-4 text-blue-500" /> 
                  {t("prefDomainDashboard.details.activities.title", "Activités (Permanentes & Rayonnantes)")}
                </div>
                {openSection === "activites" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>

              {openSection === "activites" &&
                (() => {
                  const act = detailed.activites;
                  const totalAnim =
                    (act.activites_sportives || 0) +
                    (act.activites_educatives || 0) +
                    (act.activites_culturelles || 0) +
                    (act.renforcement_capacites || 0);
                  const pctSport = totalAnim ? Math.round(((act.activites_sportives || 0) / totalAnim) * 100) : 0;
                  const pctEduc = totalAnim ? Math.round(((act.activites_educatives || 0) / totalAnim) * 100) : 0;
                  const pctCult = totalAnim ? Math.round(((act.activites_culturelles || 0) / totalAnim) * 100) : 0;
                  const pctRenf = totalAnim ? Math.round(((act.renforcement_capacites || 0) / totalAnim) * 100) : 0;

                  return (
                    <div className="p-5 bg-card border-t border-border/50">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div className="space-y-4">
                          <div>
                            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
                              {t("prefDomainDashboard.details.activities.ecosystem", "Écosystème & Structures")}
                            </h4>
                            <div className="grid grid-cols-3 gap-3">
                              <div className="p-3 bg-muted/30 rounded-xl border border-border/50 flex flex-col items-center justify-center text-center">
                                <span className="text-2xl font-black text-foreground">
                                  {act.nombre_associations || 0}
                                </span>
                                <span className="text-[10px] font-medium text-muted-foreground mt-1">
                                  {t("prefDomainDashboard.details.activities.associations", "Associations")}
                                </span>
                              </div>
                              <div className="p-3 bg-muted/30 rounded-xl border border-border/50 flex flex-col items-center justify-center text-center">
                                <span className="text-2xl font-black text-foreground">
                                  {act.nombre_clubs || 0}
                                </span>
                                <span className="text-[10px] font-medium text-muted-foreground mt-1">
                                  {t("prefDomainDashboard.details.activities.activeClubs", "Clubs Actifs")}
                                </span>
                              </div>
                              <div className="p-3 bg-muted/30 rounded-xl border border-border/50 flex flex-col items-center justify-center text-center">
                                <span className="text-2xl font-black text-foreground">
                                  {act.nombre_conventions || 0}
                                </span>
                                <span className="text-[10px] font-medium text-muted-foreground mt-1">
                                  {t("prefDomainDashboard.details.activities.conventions", "Conventions")}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div>
                          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex justify-between items-end">
                            <span>{t("prefDomainDashboard.details.activities.animationVolume", "Volume d'Animation")}</span>
                            <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded font-bold" dir="ltr">
                              {/* هنا خدمنا بالمتغير count باش تترجم صحيحة فالعربية والفرنسية */}
                              {t("prefDomainDashboard.details.activities.totalActions", { count: totalAnim })}
                            </span>
                          </h4>
                          <div className="space-y-3.5">
                            <div>
                              <div className="flex justify-between text-xs mb-1">
                                <span className="font-medium text-foreground">
                                  {t("prefDomainDashboard.details.activities.sportsActivities", "Activités Sportives")}
                                </span>
                                <span className="font-bold">{act.activites_sportives || 0}</span>
                              </div>
                              <div className="w-full bg-muted rounded-full h-1.5">
                                <div className="bg-orange-500 h-1.5 rounded-full" style={{ width: `${pctSport}%` }}></div>
                              </div>
                            </div>

                            <div>
                              <div className="flex justify-between text-xs mb-1">
                                <span className="font-medium text-foreground">
                                  {t("prefDomainDashboard.details.activities.educActivities", "Activités Éducatives")}
                                </span>
                                <span className="font-bold">{act.activites_educatives || 0}</span>
                              </div>
                              <div className="w-full bg-muted rounded-full h-1.5">
                                <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${pctEduc}%` }}></div>
                              </div>
                            </div>

                            <div>
                              <div className="flex justify-between text-xs mb-1">
                                <span className="font-medium text-foreground">
                                  {t("prefDomainDashboard.details.activities.cultActivities", "Activités Culturelles")}
                                </span>
                                <span className="font-bold">{act.activites_culturelles || 0}</span>
                              </div>
                              <div className="w-full bg-muted rounded-full h-1.5">
                                <div className="bg-pink-500 h-1.5 rounded-full" style={{ width: `${pctCult}%` }}></div>
                              </div>
                            </div>

                            <div>
                              <div className="flex justify-between text-xs mb-1">
                                <span className="font-medium text-foreground">
                                  {t("prefDomainDashboard.details.activities.capacityBuilding", "Renforcement des capacités")}
                                </span>
                                <span className="font-bold">{act.renforcement_capacites || 0}</span>
                              </div>
                              <div className="w-full bg-muted rounded-full h-1.5">
                                <div className="bg-purple-500 h-1.5 rounded-full" style={{ width: `${pctRenf}%` }}></div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}
            </Card>

            {/* ACCORDION ITEM 2: CAMPING & FORMATION */}
            <Card className="overflow-hidden border-border/70 shadow-none">
              <button
                onClick={() => toggleSection("camping")}
                className="w-full flex items-center justify-between p-4 bg-muted/20 hover:bg-muted/40 transition-colors"
              >
                <div className="flex items-center gap-2 font-bold text-sm text-foreground">
                  <Tent className="h-4 w-4 text-emerald-500" /> 
                  {t("prefDomainDashboard.details.camping.title", "Programme National de Camping & Formations")}
                </div>
                {openSection === "camping" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>

              {openSection === "camping" &&
                (() => {
                  const camp = detailed.camping;
                  const staffTot = camp.encadrement?.total_staff || 0;
                  const staffH = camp.encadrement?.hommes || 0;
                  const staffF = camp.encadrement?.femmes || 0;
                  const pctStaffH = staffTot ? Math.round((staffH / staffTot) * 100) : 0;
                  const pctStaffF = staffTot ? Math.round((staffF / staffTot) * 100) : 0;

                  const entrants = detailed.associations?.entrants || 0;
                  const sortants = detailed.associations?.sortants || 0;

                  return (
                    <div className="p-5 bg-card border-t border-border/50 grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10">
                      <div className="space-y-6">
                        <div className="space-y-3">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                            <Users2 className="h-4 w-4" /> 
                            {t("prefDomainDashboard.details.camping.participants", "Bénéficiaires & Participants")}
                          </h4>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="col-span-2 p-4 bg-emerald-500/10 rounded-xl border border-emerald-500/20 flex items-center justify-between">
                              <div>
                                <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400 block">
                                  {t("prefDomainDashboard.details.camping.totalBeneficiaries", "Total Bénéficiaires")}
                                </span>
                                <span className="text-[10px] text-emerald-600/80">
                                  {t("prefDomainDashboard.details.camping.summerCamps", "Colonies de vacances")}
                                </span>
                              </div>
                              <span className="text-3xl font-black text-emerald-600" dir="ltr">
                                {fmt(camp.participants?.total || 0)}
                              </span>
                            </div>
                            <div className="p-3 bg-muted/20 rounded-xl border border-border/50">
                              <span className="text-[11px] font-medium text-muted-foreground block mb-1">
                                {t("prefDomainDashboard.details.camping.mreChildren", "Enfants MRE")}
                              </span>
                              <span className="text-xl font-bold text-foreground" dir="ltr">{camp.participants?.enfants_mre || 0}</span>
                            </div>
                            <div className="p-3 bg-muted/20 rounded-xl border border-border/50">
                              <span className="text-[11px] font-medium text-muted-foreground block mb-1">
                                {t("prefDomainDashboard.details.camping.specialNeeds", "Besoins Spécifiques")}
                              </span>
                              <span className="text-xl font-bold text-foreground" dir="ltr">{camp.participants?.besoins_specifiques || 0}</span>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                            <Shield className="h-4 w-4" /> 
                            {t("prefDomainDashboard.details.camping.staffingDevice", "Dispositif d'Encadrement")}
                          </h4>
                          <div className="flex gap-3">
                            <div className="flex-1 p-3 bg-blue-500/5 rounded-xl border border-blue-500/10 flex flex-col justify-center items-center">
                              <span className="text-2xl font-black text-blue-600" dir="ltr">{camp.encadrement?.ratio || "0:0"}</span>
                              <span className="text-[10px] text-blue-600/80 font-medium text-center">
                                {t("prefDomainDashboard.details.camping.staffingRatio", "Ratio d'encadrement")}
                              </span>
                            </div>
                            <div className="flex-[2] p-3 bg-muted/20 rounded-xl border border-border/50 flex flex-col justify-between">
                              <div className="flex justify-between items-center mb-2">
                                <span className="text-xs font-medium text-muted-foreground">
                                  {t("prefDomainDashboard.details.camping.mobilizedStaff", "Staff Mobilisé")}
                                </span>
                                <span className="text-sm font-bold text-foreground" dir="ltr">{staffTot}</span>
                              </div>
                              <div className="flex items-center gap-2" dir="ltr">
                                <div className="flex-1 h-2 rounded-full bg-blue-500" style={{ width: `${pctStaffH}%` }}></div>
                                <div className="flex-1 h-2 rounded-full bg-pink-500" style={{ width: `${pctStaffF}%` }}></div>
                              </div>
                              <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                                <span>{t("prefDomainDashboard.details.camping.menCount", { count: staffH })}</span>
                                <span>{t("prefDomainDashboard.details.camping.womenCount", { count: staffF })}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-6">
                        <div className="space-y-3">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                            <GraduationCap className="h-4 w-4" /> 
                            {t("prefDomainDashboard.details.camping.trainings", "Formations (Encadrement)")}
                          </h4>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="p-4 bg-amber-500/5 rounded-xl border border-amber-500/10 flex flex-col justify-center text-center">
                              <span className="text-2xl font-bold text-amber-600" dir="ltr">{camp.formations?.total_sessions || 0}</span>
                              <span className="text-[11px] font-medium text-amber-600/80 mt-1">
                                {t("prefDomainDashboard.details.camping.organizedSessions", "Sessions Organisées")}
                              </span>
                            </div>
                            <div className="p-4 bg-amber-500/5 rounded-xl border border-amber-500/10 flex flex-col justify-center text-center">
                              <span className="text-2xl font-bold text-amber-600" dir="ltr">{camp.formations?.beneficiaires || 0}</span>
                              <span className="text-[11px] font-medium text-amber-600/80 mt-1">
                                {t("prefDomainDashboard.details.camping.trainedCadres", "Cadres Formés")}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        {/* MOUVEMENTS DES ASSOCIATIONS */}
                        <div className="space-y-4">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                            <ArrowRightLeft className="h-4 w-4" /> 
                            {t("prefDomainDashboard.details.camping.movements", "Mouvements des associations")}
                          </h4>
                          <div className="grid grid-cols-2 gap-3">
                            
                            {/* Associations Entrantes */}
                            <div className="p-3 bg-emerald-500/5 rounded-xl border border-emerald-500/10 flex flex-col justify-center">
                              <span className="text-emerald-600 font-semibold text-[11px] flex items-center gap-1.5 mb-1">
                                <TrendingUp className="h-3.5 w-3.5" /> 
                                {t("prefDomainDashboard.details.camping.assocEntrants", "Associations Entrantes")}
                              </span>
                              <span className="text-2xl font-bold text-foreground" dir="ltr">{viewEntrants}</span>
                            </div>

                            {/* Bénéficiaires Entrants */}
                            <div className="p-3 bg-emerald-500/5 rounded-xl border border-emerald-500/10 flex flex-col justify-center">
                              <span className="text-emerald-600 font-semibold text-[11px] flex items-center gap-1.5 mb-1">
                                <UserPlus className="h-3.5 w-3.5" /> 
                                {t("prefDomainDashboard.details.camping.benEntrants", "Bénéficiaires Entrants")}
                              </span>
                              <span className="text-2xl font-bold text-foreground" dir="ltr">{benEntrants}</span>
                            </div>

                            {/* Associations Sortantes */}
                            <div className="p-3 bg-orange-500/5 rounded-xl border border-orange-500/10 flex flex-col justify-center">
                              <span className="text-orange-600 font-semibold text-[11px] flex items-center gap-1.5 mb-1">
                                <TrendingDown className="h-3.5 w-3.5" /> 
                                {t("prefDomainDashboard.details.camping.assocSortants", "Associations Sortantes")}
                              </span>
                              <span className="text-2xl font-bold text-foreground" dir="ltr">{viewSortants}</span>
                            </div>

                            {/* Bénéficiaires Sortants */}
                            <div className="p-3 bg-orange-500/5 rounded-xl border border-orange-500/10 flex flex-col justify-center">
                              <span className="text-orange-600 font-semibold text-[11px] flex items-center gap-1.5 mb-1">
                                <UserMinus className="h-3.5 w-3.5" /> 
                                {t("prefDomainDashboard.details.camping.benSortants", "Bénéficiaires Sortants")}
                              </span>
                              <span className="text-2xl font-bold text-foreground" dir="ltr">{benSortants}</span>
                            </div>

                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}
            </Card>
            {/* ACCORDION ITEM 3: CONVENTIONS & PARTENARIATS */}
            <Card className="overflow-hidden border-border/70 shadow-none">
              <button
                onClick={() => toggleSection("conventions")}
                className="w-full flex items-center justify-between p-4 bg-muted/20 hover:bg-muted/40 transition-colors"
              >
                <div className="flex items-center gap-2 font-bold text-sm text-foreground">
                  <Handshake className="h-4 w-4 text-emerald-500" /> 
                  {t("prefDomainDashboard.details.conventions.title", "Conventions et Partenariats")}
                </div>
                {openSection === "conventions" ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </button>

              {openSection === "conventions" &&
                (() => {
                  const conv = detailed.conventions; 
                  
                  const repArray = conv?.repartition || [];
                  const totalConv = conv?.total_conventions || 1; 
                  
                  const translatedTypes = t("prefDomainDashboard.details.conventions.types", { returnObjects: true }) as Record<string, string>;

                  return (
                    <div className="p-5 bg-card border-t border-border/50 grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10">
                      <div className="space-y-4">
                        <h4 className="h-7 text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                          <FileText className="h-4 w-4" /> 
                          {t("prefDomainDashboard.details.conventions.summary", "Bilan des Conventions")}
                        </h4>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="col-span-2 p-4 bg-emerald-500/10 rounded-xl border border-emerald-500/20 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-emerald-500/20 rounded-lg">
                                <Handshake className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                              </div>
                              <span className="font-bold text-emerald-700 dark:text-emerald-400 text-sm">
                                {t("prefDomainDashboard.details.conventions.totalConventions", "Total Conventions")}
                              </span>
                            </div>
                            <span className="text-3xl font-black text-emerald-600 dark:text-emerald-400" dir="ltr">
                              {conv?.total_conventions || 0}
                            </span>
                          </div>

                          <div className="col-span-2 p-4 bg-muted/20 rounded-xl border border-border/50 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Building2 className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm font-semibold text-foreground">
                                {t("prefDomainDashboard.details.conventions.partnerTypes", "Types de Partenaires Engagés")}
                              </span>
                            </div>
                            <span className="text-xl font-bold text-foreground" dir="ltr">
                              {conv?.total_partenaires || 0}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h4 className="h-7 text-xs font-bold uppercase tracking-wider text-muted-foreground flex justify-between items-center">
                          <span className="flex items-center gap-1.5">
                            <Building2 className="h-4 w-4" /> 
                            {t("prefDomainDashboard.details.conventions.distributionByType", "Répartition par Type")}
                          </span>
                        </h4>

                        <div className="p-4 bg-muted/30 rounded-xl border border-border/50 space-y-4">
                          {repArray.length === 0 ? (
                            <span className="text-sm text-muted-foreground">
                              {t("prefDomainDashboard.details.conventions.noData", "Aucune donnée disponible")}
                            </span>
                          ) : (
                            repArray.map((item, index) => {
                              const percentage = Math.round((item.count / totalConv) * 100);
                              return (
                                <div key={index} className="space-y-1.5">
                                  <div className="flex justify-between items-center text-xs">
                                    <span className="text-foreground font-medium">
                                      {(translatedTypes && translatedTypes[item.type]) ? translatedTypes[item.type] : item.type}
                                    </span>
                                    <span className="text-muted-foreground font-bold" dir="ltr">
                                      {item.count}{" "}
                                      <span className="text-[10px] font-normal">
                                        ({percentage}%)
                                      </span>
                                    </span>
                                  </div>
                                  <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                                    <div
                                      className="h-full bg-emerald-500 rounded-full"
                                      style={{ width: `${percentage}%` }}
                                    ></div>
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })()}
            </Card>

            {/* ACCORDION ITEM 4: INSERTION */}
            <Card className="overflow-hidden border-border/70 shadow-none">
              <button
                onClick={() => toggleSection("insertion")}
                className="w-full flex items-center justify-between p-4 bg-muted/20 hover:bg-muted/40 transition-colors"
              >
                <div className="flex items-center gap-2 font-bold text-sm text-foreground">
                  <Landmark className="h-4 w-4 text-indigo-500" /> 
                  {t("prefDomainDashboard.details.insertion.title", "Intégration Socio-Économique")}
                </div>
                {openSection === "insertion" ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </button>

              {openSection === "insertion" &&
                (() => {
                  const ins = detailed?.insertion;
                  const h = ins?.genre?.hommes || 0;
                  const f = ins?.genre?.femmes || 0;
                  const totGF = h + f;
                  const pctH = totGF ? Math.round((h / totGF) * 100) : 0;
                  const pctF = totGF ? Math.round((f / totGF) * 100) : 0;
                  
                  const urb = ins?.milieu?.urbain || 0;
                  const rur = ins?.milieu?.rural || 0;
                  const totUR = urb + rur;
                  const pctUrb = totUR ? Math.round((urb / totUR) * 100) : 0;
                  const pctRur = totUR ? Math.round((rur / totUR) * 100) : 0;

                  return (
                    <div className="p-5 bg-card border-t border-border/50 grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10">
                      <div className="space-y-4">
                        <h4 className="h-7 text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                          <Target className="h-4 w-4" /> 
                          {t("prefDomainDashboard.details.insertion.summary", "Bilan des Activités")}
                        </h4>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="col-span-2 p-4 bg-indigo-500/10 rounded-xl border border-indigo-500/20 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-indigo-500/20 rounded-lg">
                                <Landmark className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                              </div>
                              <span className="font-bold text-indigo-700 dark:text-indigo-400 text-sm">
                                {t("prefDomainDashboard.details.insertion.activitiesDone", "Activités Réalisées")}
                              </span>
                            </div>
                            <span className="text-3xl font-black text-indigo-600 dark:text-indigo-400" dir="ltr">
                              {ins?.total_activites || 0}
                            </span>
                          </div>
                          
                          <div className="p-3 bg-muted/20 rounded-xl border border-border/50 flex flex-col justify-center">
                            <span className="text-muted-foreground font-semibold text-xs flex items-center gap-1.5 mb-1">
                              <Handshake className="h-3.5 w-3.5 text-orange-500" /> 
                              {t("prefDomainDashboard.details.insertion.activePartners", "Partenaires Actifs")}
                            </span>
                            <span className="text-2xl font-bold text-foreground" dir="ltr">
                              {ins?.partenaires_actifs || 0}
                            </span>
                          </div>
                          
                          <div className="p-3 bg-muted/20 rounded-xl border border-border/50 flex flex-col justify-center">
                            <span className="text-muted-foreground font-semibold text-xs flex items-center gap-1.5 mb-1">
                              <Clock className="h-3.5 w-3.5 text-blue-500" /> 
                              {t("prefDomainDashboard.details.insertion.globalVolume", "Volume Global")}
                            </span>
                            {/* هنا فين زدنا اللوجيك ديالك بالحرف مع ins?. */}
                            <span className="text-2xl font-bold text-foreground" dir={lang === "ar" ? "rtl" : "ltr"}>
                              {(() => {
                                const volume = ins?.volume_horaire || "0";
                                if (lang === "ar") {
                                  return volume.toString().toLowerCase().includes("heures")
                                    ? volume.toString().toLowerCase().replace("heures", "ساعات")
                                    : `${volume} ساعات`;
                                }
                                return volume;
                              })()}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex justify-between items-end">
                          <span className="flex items-center gap-1.5">
                            <Users className="h-4 w-4" /> 
                            {t("prefDomainDashboard.details.insertion.beneficiaries", "Bénéficiaires")}
                          </span>
                          <span className="text-[10px] bg-indigo-500/10 text-indigo-600 px-2 py-0.5 rounded font-bold border border-indigo-500/20" dir="ltr">
                            {t("prefDomainDashboard.details.insertion.total", "Total")}: {totGF}
                          </span>
                        </h4>
                        
                        <div className="p-4 bg-muted/30 rounded-xl border border-border/50 space-y-5">
                          {/* Répartition par Genre */}
                          <div className="space-y-2">
                            <span className="text-foreground font-bold text-xs">
                              {t("prefDomainDashboard.details.insertion.genderDistribution", "Répartition par Genre")}
                            </span>
                            <div className="flex items-center gap-1.5 h-3">
                              <div className="h-full rounded-full bg-blue-500" style={{ width: `${pctH}%` }} title={`Hommes: ${h}`}></div>
                              <div className="h-full rounded-full bg-pink-500" style={{ width: `${pctF}%` }} title={`Femmes: ${f}`}></div>
                            </div>
                            <div className="flex justify-between text-[10px] text-muted-foreground font-medium">
                              <span className="flex items-center gap-1" dir="ltr">
                                <div className="w-2 h-2 rounded-full bg-blue-500"></div> 
                                {t("prefDomainDashboard.details.insertion.men", "Hommes")}: {h}
                              </span>
                              <span className="flex items-center gap-1" dir="ltr">
                                {t("prefDomainDashboard.details.insertion.women", "Femmes")}: {f} 
                                <div className="w-2 h-2 rounded-full bg-pink-500"></div>
                              </span>
                            </div>
                          </div>
                          
                          <div className="border-t border-border/50 my-2"></div>
                          
                          {/* Répartition Spatiale */}
                          <div className="space-y-2">
                            <span className="text-foreground font-bold text-xs">
                              {t("prefDomainDashboard.details.insertion.spatialDistribution", "Répartition Spatiale")}
                            </span>
                            <div className="flex items-center gap-1.5 h-3">
                              <div className="h-full rounded-full bg-slate-500" style={{ width: `${pctUrb}%` }} title={`Urbain: ${urb}`}></div>
                              <div className="h-full rounded-full bg-emerald-500" style={{ width: `${pctRur}%` }} title={`Rural: ${rur}`}></div>
                            </div>
                            <div className="flex justify-between text-[10px] text-muted-foreground font-medium">
                              <span className="flex items-center gap-1" dir="ltr">
                                <Building className="h-3 w-3 text-slate-500" /> 
                                {t("prefDomainDashboard.details.insertion.urban", "Urbain")}: {urb}
                              </span>
                              <span className="flex items-center gap-1" dir="ltr">
                                {t("prefDomainDashboard.details.insertion.rural", "Rural")}: {rur} 
                                <TreePine className="h-3 w-3 text-emerald-500" />
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}
            </Card>

            {/* ACCORDION ITEM 5: FESTIVALS */}
            <Card className="overflow-hidden border-border/70 shadow-none">
              <button
                onClick={() => toggleSection("festivals")}
                className="w-full flex items-center justify-between p-4 bg-muted/20 hover:bg-muted/40 transition-colors"
              >
                <div className="flex items-center gap-2 font-bold text-sm text-foreground">
                  <Trophy className="h-4 w-4 text-purple-500" /> 
                  {t("prefDomainDashboard.details.festivals.title", "Festivals de Jeunesse")}
                </div>
                {openSection === "festivals" ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </button>

              {openSection === "festivals" &&
                (() => {
                  // حماية الكود باستعمال ?. لمنع أخطاء TypeScript
                  const fest = detailed?.festivals;
                  const h = fest?.genre?.hommes || 0;
                  const f = fest?.genre?.femmes || 0;
                  const totGF = h + f;
                  const pctH = totGF ? Math.round((h / totGF) * 100) : 0;
                  const pctF = totGF ? Math.round((f / totGF) * 100) : 0;
                  
                  const urb = fest?.milieu?.urbain || 0;
                  const rur = fest?.milieu?.rural || 0;
                  const totUR = urb + rur;
                  const pctUrb = totUR ? Math.round((urb / totUR) * 100) : 0;
                  const pctRur = totUR ? Math.round((rur / totUR) * 100) : 0;

                  return (
                    <div className="p-5 bg-card border-t border-border/50 grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10">
                      <div className="space-y-4">
                        <h4 className="h-7 text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                          <Activity className="h-4 w-4" /> 
                          {t("prefDomainDashboard.details.festivals.summary", "Événements & Éliminatoires")}
                        </h4>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="col-span-2 p-4 bg-purple-500/10 rounded-xl border border-purple-500/20 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-purple-500/20 rounded-lg">
                                <Trophy className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                              </div>
                              <span className="font-bold text-purple-700 dark:text-purple-400 text-sm">
                                {t("prefDomainDashboard.details.festivals.organized", "Festivals Organisés")}
                              </span>
                            </div>
                            <span className="text-3xl font-black text-purple-600 dark:text-purple-400" dir="ltr">
                              {fest?.total_evenements || 0}
                            </span>
                          </div>
                          
                          <div className="p-3 bg-muted/20 rounded-xl border border-border/50 flex flex-col justify-center">
                            <span className="text-muted-foreground font-semibold text-xs flex items-center gap-1.5 mb-1">
                              <MapPin className="h-3.5 w-3.5 text-blue-500" /> 
                              {t("prefDomainDashboard.details.festivals.provinces", "Provinces (Couverture)")}
                            </span>
                            <span className="text-2xl font-bold text-foreground" dir="ltr">
                              {fest?.total_provinces || 0}
                            </span>
                          </div>
                          
                          <div className="p-3 bg-amber-500/5 rounded-xl border border-amber-500/20 flex flex-col justify-center">
                            <span className="text-amber-600 font-semibold text-xs flex items-center gap-1.5 mb-1">
                              <Medal className="h-3.5 w-3.5" /> 
                              {t("prefDomainDashboard.details.festivals.qualified", "Qualifiés (Finales)")}
                            </span>
                            <span className="text-2xl font-bold text-foreground" dir="ltr">
                              {fest?.qualifies || 0}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex justify-between items-end">
                          <span className="flex items-center gap-1.5">
                            <Users className="h-4 w-4" /> 
                            {t("prefDomainDashboard.details.festivals.demographics", "Démographie des Participants")}
                          </span>
                          <span className="text-[10px] bg-purple-500/10 text-purple-600 px-2 py-0.5 rounded font-bold border border-purple-500/20" dir="ltr">
                            {t("prefDomainDashboard.details.festivals.total", "Total")}: {totGF}
                          </span>
                        </h4>
                        
                        <div className="p-4 bg-muted/30 rounded-xl border border-border/50 space-y-5">
                          {/* Répartition par Genre */}
                          <div className="space-y-2">
                            <span className="text-foreground font-bold text-xs">
                              {t("prefDomainDashboard.details.festivals.genderDistribution", "Répartition par Genre")}
                            </span>
                            <div className="flex items-center gap-1.5 h-3">
                              <div className="h-full rounded-full bg-blue-500" style={{ width: `${pctH}%` }} title={`Hommes: ${h}`}></div>
                              <div className="h-full rounded-full bg-pink-500" style={{ width: `${pctF}%` }} title={`Femmes: ${f}`}></div>
                            </div>
                            <div className="flex justify-between text-[10px] text-muted-foreground font-medium">
                              <span className="flex items-center gap-1" dir="ltr">
                                <div className="w-2 h-2 rounded-full bg-blue-500"></div> 
                                {t("prefDomainDashboard.details.festivals.men", "Hommes")}: {h}
                              </span>
                              <span className="flex items-center gap-1" dir="ltr">
                                {t("prefDomainDashboard.details.festivals.women", "Femmes")}: {f} 
                                <div className="w-2 h-2 rounded-full bg-pink-500"></div>
                              </span>
                            </div>
                          </div>
                          
                          <div className="border-t border-border/50 my-2"></div>
                          
                          {/* Répartition Spatiale */}
                          <div className="space-y-2">
                            <span className="text-foreground font-bold text-xs">
                              {t("prefDomainDashboard.details.festivals.spatialDistribution", "Répartition Spatiale")}
                            </span>
                            <div className="flex items-center gap-1.5 h-3">
                              <div className="h-full rounded-full bg-slate-500" style={{ width: `${pctUrb}%` }} title={`Urbain: ${urb}`}></div>
                              <div className="h-full rounded-full bg-emerald-500" style={{ width: `${pctRur}%` }} title={`Rural: ${rur}`}></div>
                            </div>
                            <div className="flex justify-between text-[10px] text-muted-foreground font-medium">
                              <span className="flex items-center gap-1" dir="ltr">
                                <Building className="h-3 w-3 text-slate-500" /> 
                                {t("prefDomainDashboard.details.festivals.urban", "Urbain")}: {urb}
                              </span>
                              <span className="flex items-center gap-1" dir="ltr">
                                {t("prefDomainDashboard.details.festivals.rural", "Rural")}: {rur} 
                                <TreePine className="h-3 w-3 text-emerald-500" />
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}
            </Card>

            {/* ACCORDION ITEM 6: ÉTABLISSEMENTS */}
            <Card className="overflow-hidden border-border/70 shadow-none">
              <button
                onClick={() => toggleSection("etablissements")}
                className="w-full flex items-center justify-between p-4 bg-muted/20 hover:bg-muted/40 transition-colors"
              >
                <div className="flex items-center gap-2 font-bold text-sm text-foreground">
                  <Building2 className="h-4 w-4 text-blue-500" /> 
                  {t("prefDomainDashboard.details.etablissements.title", "Établissements & Infrastructures")}
                </div>
                {openSection === "etablissements" ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </button>

              {openSection === "etablissements" &&
                (() => {
                  const etab = detailed?.etablissements;
                  const causesArray = etab?.fermees?.causes || [];
                  const totFermes = etab?.fermees?.total || 1;
                  
                  const totalParc = (etab?.nouvellement_creees || 0) + (etab?.en_cours_realisation || 0) + (etab?.fermees?.total || 0);

                  return (
                    <div className="p-5 bg-card border-t border-border/50 grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-10">
                      <div className="space-y-4">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex justify-between items-end">
                          <span>{t("prefDomainDashboard.details.etablissements.parcStatus", "Statut du Parc Actuel")}</span>
                          <span className="text-[10px] bg-blue-500/10 text-blue-600 px-2 py-0.5 rounded font-bold border border-blue-500/20" dir="ltr">
                            {t("prefDomainDashboard.details.etablissements.total", "Total")}: {totalParc}
                          </span>
                        </h4>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="p-3 bg-blue-500/5 rounded-xl border border-blue-500/10 flex flex-col justify-center">
                            <span className="text-blue-600 font-semibold text-xs flex items-center gap-1.5 mb-1">
                              <Sparkles className="h-3.5 w-3.5" /> 
                              {t("prefDomainDashboard.details.etablissements.newCreation", "Nouvelle création")}
                            </span>
                            <span className="text-2xl font-bold text-foreground" dir="ltr">
                              {etab?.nouvellement_creees || 0}
                            </span>
                          </div>

                          <div className="p-3 bg-amber-500/5 rounded-xl border border-amber-500/10 flex flex-col justify-center">
                            <span className="text-amber-600 font-semibold text-xs flex items-center gap-1.5 mb-1">
                              <HardHat className="h-3.5 w-3.5" /> 
                              {t("prefDomainDashboard.details.etablissements.underRealization", "En réalisation")}
                            </span>
                            <span className="text-2xl font-bold text-foreground" dir="ltr">
                              {etab?.en_cours_realisation || 0}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex justify-between items-end">
                          <span>{t("prefDomainDashboard.details.etablissements.fermeturesAnalysis", "Analyse des Fermetures")}</span>
                          <span className="text-[10px] bg-red-500/10 text-red-600 px-2 py-0.5 rounded font-bold border border-red-500/20" dir="ltr">
                            {t("prefDomainDashboard.details.etablissements.totalFermees", "Total Fermées")}: {etab?.fermees?.total || 0}
                          </span>
                        </h4>

                        <div className="p-4 bg-muted/30 rounded-xl border border-border/50 space-y-4">
                          {causesArray.length === 0 ? (
                            <span className="text-sm text-muted-foreground block text-center py-2">
                              {t("prefDomainDashboard.details.etablissements.noFermeture", "Aucune fermeture signalée")}
                            </span>
                          ) : (
                            causesArray.map((item, index) => {
                              const percentage = Math.round((item.count / totFermes) * 100);
                              return (
                                <div key={index} className="space-y-1.5">
                                  <div className="flex justify-between items-center text-xs">
                                    <span className="text-foreground font-medium flex items-center gap-1.5">
                                      {t(`prefDomainDashboard.details.etablissements.causes.${item.cause}`, item.cause) as string}
                                    </span>
                                    <span className="font-bold text-foreground" dir="ltr">{item.count}</span>
                                  </div>
                                  <div className="h-1.5 w-full bg-muted-foreground/20 rounded-full overflow-hidden">
                                    <div 
                                      className="h-full bg-amber-500 rounded-full transition-all duration-500" 
                                      style={{ width: `${percentage}%` }}
                                    ></div>
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })()}
            </Card>
          </div>
        </section>       
      </DashboardShell>
    </AppLayout>
  );
};

export default DirectionDetail;