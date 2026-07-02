import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom"; // 💡 Ajout de useSearchParams
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/AppLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { handleExportToPDF } from '@/lib/generatePdfHelper';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  Legend,
} from "recharts";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Database } from "@/integrations/supabase/types";
import {
  ArrowLeft, Building2, CheckCircle2, ChevronRight, ChevronDown, ChevronUp,
  Activity, MapPin, CalendarDays, Users2, Tent, GraduationCap, Shield,
  ArrowRightLeft, UserPlus, UserMinus, Clock, Users, Handshake, Trophy,
  Globe, TrendingUp, TrendingDown, Minus, Landmark, Target, Medal,
  Sparkles, HardHat, Building, TreePine, FileText,Download
} from "lucide-react";

type Direction = Database["public"]["Tables"]["directions"]["Row"];
type Rapport = Database["public"]["Tables"]["rapports"]["Row"];
type SuiviRemplissage = Database["public"]["Tables"]["suivi_remplissage"]["Row"];
type Activite = Database["public"]["Tables"]["activites"]["Row"];
type Participant = Database["public"]["Tables"]["participants"]["Row"];
type Formation = Database["public"]["Tables"]["formations"]["Row"];
type Partenariat = Database["public"]["Tables"]["partenariats"]["Row"];
type StatistiquesFormation = Database["public"]["Tables"]["statistiques_formation"]["Row"];
type EvolutionRow = {
  name: string;
  Camping: number | null;
  Festivals: number | null;
  Formation: number | null;
  Insertion: number | null;
};

const STATUS_STYLE: Record<string, string> = {
  TERMINE: "bg-success/15 text-success border-success/30",
  EN_COURS: "bg-info/15 text-info border-info/30",
  NON_COMMENCE: "bg-warning/15 text-warning border-warning/30",
  validee: "bg-success/15 text-success border-success/30",
  soumise: "bg-info/15 text-info border-info/30",
};

const STATUS_LABEL: Record<string, string> = {
  TERMINE: "Terminé",
  EN_COURS: "En cours",
  NON_COMMENCE: "Non commencé",
  validee: "Validé",
  soumise: "Soumis",
};

const formatBenchmarkData = (data: any) => {
  const d = data || {};
  return [
    { kpi: "Total des Activités", monScore: d.pref_total_activites || 0, moyenneReg: d.reg_total_activites || 0, isPercentage: false },
    { kpi: "Total Bénéficiaires", monScore: d.pref_total_beneficiaires || 0, moyenneReg: d.reg_total_beneficiaires || 0, isPercentage: false },
    { kpi: "Taux de Couverture", monScore: d.pref_taux_couverture || 0, moyenneReg: d.reg_taux_couverture || 0, isPercentage: true },
    { kpi: "Taux de Féminisation", monScore: d.pref_taux_feminisation || 0, moyenneReg: d.reg_taux_feminisation || 0, isPercentage: true },
    { kpi: "Partenariats Actifs", monScore: d.pref_total_partenariats || 0, moyenneReg: d.reg_total_partenariats || 0, isPercentage: false },
    { kpi: "Établ. Opérationnels", monScore: d.pref_etablissements_actifs || 0, moyenneReg: d.reg_etablissements_actifs || 0, isPercentage: false },
  ];
};

const mapSection6Data = (data: any) => {
  const d = data || {};
  const staffTotal = d.camp_staff_total || 0;
  const benefTotal = d.camp_benef_total || 0;
  const ratioCalcule = staffTotal === 0 || benefTotal === 0 ? "0:0" : `1:${Math.round(benefTotal / staffTotal)}`;

  return {
    activites: {
      nombre_associations: d.act_assocs || 0,
      nombre_clubs: d.act_clubs || 0,
      nombre_conventions: d.act_conventions || 0,
      activites_sportives: d.act_sport || 0,
      activites_culturelles: d.act_cult || 0,
      activites_educatives: d.act_educ || 0,
      renforcement_capacites: d.act_renf || 0,
    },
    camping: {
      participants: {
        total: d.camp_benef_total || 0,
        enfants_mre: d.camp_mre || 0,
        besoins_specifiques: d.camp_besoins_spec || 0,
      },
      encadrement: {
        ratio: ratioCalcule,
        total_staff: d.camp_staff_total || 0,
        hommes: d.camp_staff_h || 0,
        femmes: d.camp_staff_f || 0,
      },
      formations: { total_sessions: d.form_total_sessions || 0, beneficiaires: d.form_beneficiaires || 0 },
    },
    associations: {
      entrants: d.assoc_entrants || 0,
      sortants: d.assoc_sortants || 0,
      ben_entrants: d.ben_entrants || 0,   
      ben_sortants: d.ben_sortants || 0,
    },
    conventions: {
      total_conventions: d.conv_total_global || 0,
      total_partenaires: d.conv_types_distincts || 0,
      repartition: d.repartition_partenaires_json || [],
    },
    insertion: {
      total_activites: d.ins_total_activites || 0,
      partenaires_actifs: d.ins_partenaires_actifs || 0,
      volume_horaire: `${d.ins_volume_h || 0} Heures`,
      genre: { hommes: d.ins_hommes || 0, femmes: d.ins_femmes || 0 },
      milieu: { urbain: d.ins_urbain || 0, rural: d.ins_rural || 0 },
    },
    festivals: {
      total_evenements: d.fest_total || 0,
      total_provinces: d.fest_provinces || 0,
      qualifies: d.fest_qualifies || 0,
      total_participants: (d.fest_hommes || 0) + (d.fest_femmes || 0),
      genre: { hommes: d.fest_hommes || 0, femmes: d.fest_femmes || 0 },
      milieu: { urbain: d.fest_urbain || 0, rural: d.fest_rural || 0 },
    },
    etablissements: {
      total: (d.etab_nouvel || 0) + (d.etab_en_cours || 0) + (d.etab_total_fermes || 0),
      operationnels: 0, 
      nouvellement_creees: d.etab_nouvel || 0,
      en_cours_realisation: d.etab_en_cours || 0,
      fermees: {
        total: d.etab_total_fermes || 0,
        causes: d.causes_fermeture_json || [],
      },
    },
  };
};
const DirectionDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [repartition, setRepartition] = useState<any[]>([]);
  const [searchParams] = useSearchParams(); // 💡 Lecture dynamique de l'année passée en URL
  const { t, i18n } = useTranslation();
  const lang = i18n.language;

  // Récupération de l'année de l'URL ou 2026 par défaut
  const selectedYear = Number(searchParams.get("year")) || 2026; 

  const [direction, setDirection] = useState<Direction | null>(null);
  const [rapport, setRapport] = useState<Rapport | null>(null);
  const [activites, setActivites] = useState<Activite[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [formations, setFormations] = useState<Formation[]>([]);
  const [statistiquesFormation, setStatistiquesFormation] = useState<StatistiquesFormation[]>([]);
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
      setRapport(rap);

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
      
      const s1 = (section1Data as any) || {};

      // 4. Charger l'ensemble des données brutes ET la section 3 (Répartition)
      // 💡 Ajout de section3Data dans le tableau à gauche pour récupérer le résultat
      const [actsData, partsData, formsData, partsData2, section3Data] = await Promise.all([
        supabase.from("activites").select("*").eq("rapport_id", rap.id),
        supabase.from("participants").select("*").eq("rapport_id", rap.id),
        supabase.from("formations").select("*").eq("rapport_id", rap.id),
        supabase.from("partenariats").select("*").eq("rapport_id", rap.id),
        supabase.from("v_dashboard_pref_section3_annuel").select("*").eq("direction_id", id).eq("annee", selectedYear),
      ]);
      
      setActivites(actsData.data || []);
      setParticipants(partsData.data || []);
      setFormations(formsData.data || []);
      setPartenariats(partsData2.data || []);

      // 5. Charger l'ensemble des indicateurs consolidés (Vues analytiques)
      const [evolutionData, benchmarkData, section6Data] = await Promise.all([
        supabase.from("v_dashboard_pref_section4").select("*").eq("direction_id", id).eq("annee", selectedYear),
        supabase.from("v_dashboard_pref_section5_annuel").select("*").eq("direction_id", id).eq("annee", selectedYear).maybeSingle(),
        supabase.from("v_dashboard_pref_section6_annuel").select("*").eq("direction_id", id).eq("annee", selectedYear).maybeSingle(),
      ]);
        
      setEvolution(formatEvolutionData(evolutionData.data ?? []));
      setBenchmark(formatBenchmarkData(benchmarkData.data));
      setDetailed(mapSection6Data(section6Data.data));

      // Enregistrement des données du Header
      setMetriquesGlobales({
        progression: s1.progression_pourcentage || 0,
        statut: s1.statut || "NON_COMMENCE",
        lastUpdate: s1.derniere_mise_a_jour || rap.updated_at
      });

      // 💡 La variable est maintenant correctement définie et utilisable ici
      setRepartition(section3Data.data || []);

      setLoading(false);
    })();
  }, [id, selectedYear]);

  // ==========================================
  // EXTRACTION DES COMPTEURS INTERNES COHÉRENTS
  // ==========================================
  const totalParticipants = participants.reduce((a, p) => a + (p.femmes ?? 0) + (p.hommes ?? 0), 0);
  const totalActivites = activites.length;
  const totalPartenariats = partenariats.reduce((a, p) => a + (p.nombre_conventions ?? 0), 0);

  // Mouvements issus directement de la structure consolidée du composant
  const viewEntrants = detailed.associations?.entrants || 0;
  const viewSortants = detailed.associations?.sortants || 0;
  const benEntrants = detailed.associations?.ben_entrants || 0;
  const benSortants = detailed.associations?.ben_sortants || 0;

  const formatEvolutionData = (dataArray: any[]) => {
    const skeleton: EvolutionRow[] = [
      { name: "T1", Camping: null, Festivals: null, Formation: null, Insertion: null },
      { name: "T2", Camping: null, Festivals: null, Formation: null, Insertion: null },
      { name: "T3", Camping: null, Festivals: null, Formation: null, Insertion: null },
      { name: "T4", Camping: null, Festivals: null, Formation: null, Insertion: null },
    ];
    if (!dataArray || dataArray.length === 0) return skeleton;
    return skeleton.map((quarter) => {
      const existing = dataArray.find((item) => item.name === quarter.name);
      return existing ? { ...quarter, ...existing } : quarter;
    });
  };

  const toggleSection = (section: string) => {
    setOpenSection(openSection === section ? null : section);
  };

  const entrants = detailed.associations?.entrants || 0;
  const sortants = detailed.associations?.sortants || 0;

  const C = {
    k1: "hsl(var(--kpi-1))", k2: "hsl(var(--kpi-2))", k3: "hsl(var(--kpi-3))",
    k4: "hsl(var(--kpi-4))", k5: "hsl(var(--kpi-5))", k6: "hsl(var(--kpi-6))",
    k7: "hsl(var(--kpi-7))", k8: "hsl(var(--kpi-8))", primary: "hsl(var(--primary))",
    success: "hsl(var(--success))", warning: "hsl(var(--warning))",
    destructive: "hsl(var(--destructive))", border: "hsl(var(--border))",
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
      <div className="space-y-8 animate-fade-in">
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
        <section className="space-y-3">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-foreground">
              {t('prefDomainDashboard.keyIndicators')}
            </h2>
          </div>
          <Card className="p-4 sm:p-5 border-border/60 shadow-none">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative p-5 rounded-2xl border border-border/60 bg-card hover:shadow-md transition-all min-h-[150px] flex flex-col justify-between overflow-hidden">
                <span className="absolute inset-y-0 start-0 w-1 bg-[hsl(var(--kpi-2))]" />
                <div className="h-11 w-11 rounded-xl flex items-center justify-center bg-[hsl(var(--kpi-2-soft))] text-[hsl(var(--kpi-2))]">
                  <Activity className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <div className="text-3xl font-extrabold tracking-tight text-foreground tabular-nums">
                    {fmt(benchmark[0]?.monScore || 0)}
                  </div>
                  <div className="text-sm text-muted-foreground leading-snug">
                    {t('prefDomainDashboard.kpis.activities')}
                  </div>
                </div>
              </div>
              <div className="relative p-5 rounded-2xl border border-border/60 bg-card hover:shadow-md transition-all min-h-[150px] flex flex-col justify-between overflow-hidden">
                <span className="absolute inset-y-0 start-0 w-1 bg-[hsl(var(--kpi-3))]" />
                <div className="h-11 w-11 rounded-xl flex items-center justify-center bg-[hsl(var(--kpi-3-soft))] text-[hsl(var(--kpi-3))]">
                  <Users2 className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <div className="text-3xl font-extrabold tracking-tight text-foreground tabular-nums">
                    {fmt(benchmark[1]?.monScore || 0)}
                  </div>
                  <div className="text-sm text-muted-foreground leading-snug">
                    {t('prefDomainDashboard.kpis.beneficiaries')}
                  </div>
                </div>
              </div>
              <div className="relative p-5 rounded-2xl border border-border/60 bg-card hover:shadow-md transition-all min-h-[150px] flex flex-col justify-between overflow-hidden">
                <span className="absolute inset-y-0 start-0 w-1 bg-[hsl(var(--kpi-4))]" />
                <div className="h-11 w-11 rounded-xl flex items-center justify-center bg-[hsl(var(--kpi-4-soft))] text-[hsl(var(--kpi-4))]">
                  <Handshake className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <div className="text-3xl font-extrabold tracking-tight text-foreground tabular-nums">
                    {fmt(benchmark[4]?.monScore || 0)}
                  </div>
                  <div className="text-sm text-muted-foreground leading-snug">
                    {t('prefDomainDashboard.kpis.partnerships')}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div className="relative p-5 rounded-2xl border border-border/60 bg-card hover:shadow-md transition-all min-h-[150px] flex flex-col justify-between overflow-hidden">
                <span className="absolute inset-y-0 start-0 w-1 bg-pink-500" />
                <div className="h-11 w-11 rounded-xl flex items-center justify-center bg-pink-500/10 text-pink-500">
                  <Users className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <div className="text-3xl font-extrabold tracking-tight text-foreground tabular-nums text-pink-600">
                    {benchmark[3]?.monScore || 0}%
                  </div>
                  <div className="text-sm text-muted-foreground leading-snug">
                    {t('prefDomainDashboard.kpis.feminization')}
                  </div>
                </div>
              </div>
              <div className="relative p-5 rounded-2xl border border-border/60 bg-card hover:shadow-md transition-all min-h-[150px] flex flex-col justify-between overflow-hidden">
                <span className="absolute inset-y-0 start-0 w-1 bg-blue-600" />
                <div className="h-11 w-11 rounded-xl flex items-center justify-center bg-blue-600/10 text-blue-600">
                  <Globe className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <div className="text-3xl font-extrabold tracking-tight text-foreground tabular-nums text-blue-600">
                    {benchmark[2]?.monScore || 0}%
                  </div>
                  <div className="text-sm text-muted-foreground leading-snug">
                    {t('prefDomainDashboard.kpis.coverage')}
                  </div>
                </div>
              </div>
              <div className="relative p-5 rounded-2xl border border-border/60 bg-card hover:shadow-md transition-all min-h-[150px] flex flex-col justify-between overflow-hidden">
                <span className="absolute inset-y-0 start-0 w-1 bg-warning" />
                <div className="h-11 w-11 rounded-xl flex items-center justify-center bg-warning/10 text-warning">
                  <Building2 className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <div className="text-3xl font-extrabold tracking-tight text-foreground tabular-nums">
                    {fmt(benchmark[5]?.monScore || 0)}
                  </div>
                  <div className="text-sm text-muted-foreground leading-snug">
                    {t('prefDomainDashboard.kpis.establishments')}
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </section>
        {/* SECTION 3 — Répartition des bénéficiaires */}
        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-bold text-foreground">
              {t("prefDomainDashboard.charts.axeTitle")}
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
            {/* GRAPHIQUE 1 : VOLUME GLOBAL */}
            <Card className="p-5 flex flex-col border-border/60 shadow-none">
              <div className="mb-4">
                <h3 className="text-sm font-bold text-foreground">{t("prefDomainDashboard.charts.volumeTitle")}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {t("prefDomainDashboard.charts.volumeSubtitle")}
                </p>
              </div>
              <div className="h-[250px] w-full mt-auto">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={repartition} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={C.border} />
                    <XAxis
                      dataKey="name"
                      axisLine={{ stroke: "hsl(var(--muted-foreground))" }}
                      tickLine={{ stroke: "hsl(var(--muted-foreground))" }}
                      tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                      dy={10}
                      interval={0}
                      height={36}
                    />
                    <YAxis
                      orientation="left"
                      width={45}
                      axisLine={{ stroke: "hsl(var(--muted-foreground))" }}
                      tickLine={{ stroke: "hsl(var(--muted-foreground))" }}
                      tick={{ 
                        fontSize: 11, 
                        fill: "hsl(var(--muted-foreground))",
                        dx: lang === "ar" ? -18 : 0
                      }}
                      domain={[0, (dataMax: number) => Math.ceil(dataMax / 100) * 100]}
                    />
                    <Tooltip
                      cursor={{ fill: "hsl(var(--muted)/0.4)" }}
                      contentStyle={{ borderRadius: "8px", border: "1px solid hsl(var(--border))", fontSize: "12px" }}
                    />
                    <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} maxBarSize={50} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* GRAPHIQUE 2 : MIXITÉ H/F */}
            <Card className="p-5 flex flex-col border-border/60 shadow-none">
              <div className="mb-4">
                <h3 className="text-sm font-bold text-foreground">
                  {t("prefDomainDashboard.charts.mixityTitle")}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {t("prefDomainDashboard.charts.mixitySubtitle")}
                </p>
              </div>
              <div className="h-[250px] w-full mt-auto">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={repartition} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={C.border} />
                    <XAxis
                      dataKey="name"
                      axisLine={{ stroke: "hsl(var(--muted-foreground))" }}
                      tickLine={{ stroke: "hsl(var(--muted-foreground))" }}
                      tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                      dy={10}
                      interval={0}
                      height={36}
                    />
                    <YAxis
                      orientation="left"
                      width={45}
                      axisLine={{ stroke: "hsl(var(--muted-foreground))" }}
                      tickLine={{ stroke: "hsl(var(--muted-foreground))" }}
                      tick={{ 
                        fontSize: 11, 
                        fill: "hsl(var(--muted-foreground))",
                        dx: lang === "ar" ? -18 : 0
                      }}
                      tickFormatter={(val) => `${val}%`}
                      domain={[0, 100]}
                    />
                    <Tooltip
                      cursor={{ fill: "hsl(var(--muted)/0.4)" }}
                      contentStyle={{ borderRadius: "8px", border: "1px solid hsl(var(--border))", fontSize: "12px" }}
                      formatter={(value: number) => [`${value}%`, ""]}
                    />
                    <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }} iconType="circle" />
                    <Bar dataKey="hommesPct" name={t("prefDomainDashboard.charts.men")} stackId="a" fill="#3b82f6" radius={[0, 0, 4, 4]} maxBarSize={50} />
                    <Bar dataKey="femmesPct" name={t("prefDomainDashboard.charts.women")} stackId="a" fill="#ec4899" radius={[4, 4, 0, 0]} maxBarSize={50} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* GRAPHIQUE 3 : TERRITORIALITÉ */}
            <Card className="p-5 flex flex-col border-border/60 shadow-none">
              <div className="mb-4">
                <h3 className="text-sm font-bold text-foreground">
                  {t("prefDomainDashboard.charts.coverageTitle")}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {t("prefDomainDashboard.charts.coverageSubtitle")}
                </p>
              </div>
              <div className="h-[250px] w-full mt-auto">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={repartition} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={C.border} />
                    <XAxis
                      dataKey="name"
                      axisLine={{ stroke: "hsl(var(--muted-foreground))" }}
                      tickLine={{ stroke: "hsl(var(--muted-foreground))" }}
                      tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                      dy={10}
                      interval={0}
                      height={36}
                    />
                    <YAxis
                      orientation="left"
                      width={45}
                      axisLine={{ stroke: "hsl(var(--muted-foreground))" }}
                      tickLine={{ stroke: "hsl(var(--muted-foreground))" }}
                      tick={{ 
                        fontSize: 11, 
                        fill: "hsl(var(--muted-foreground))",
                        dx: lang === "ar" ? -18 : 0
                      }}
                      tickFormatter={(val) => `${val}%`}
                      domain={[0, 100]}
                    />
                    <Tooltip
                      cursor={{ fill: "hsl(var(--muted)/0.4)" }}
                      contentStyle={{ borderRadius: "8px", border: "1px solid hsl(var(--border))", fontSize: "12px" }}
                      formatter={(value: number) => [`${value}%`, ""]}
                    />
                    <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }} iconType="square" />
                    <Bar dataKey="urbainPct" name={t("prefDomainDashboard.charts.urban")} stackId="a" fill="#f59e0b" radius={[0, 0, 4, 4]} maxBarSize={50} />
                    <Bar dataKey="ruralPct" name={t("prefDomainDashboard.charts.rural")} stackId="a" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={50} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>
        </section>
        {/* SECTION 4 — Évolution temporelle */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-foreground">
              {t("prefDomainDashboard.charts.evolutionTitle")}
            </h2>
          </div>

          <Card className="p-5 border-border/60 shadow-none">
            <div className="mb-6">
              <h3 className="text-sm font-bold text-foreground">
                {t("prefDomainDashboard.charts.evolutionCardTitle")}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {t("prefDomainDashboard.charts.evolutionCardSubtitle")}
              </p>
            </div>

            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={evolution} margin={{ top: 10, right: 30, left: 20, bottom: 20 }}>
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
                  
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="hsl(var(--border))"
                  />
                  
                  {/* --- X Axis Style --- */}
                  <XAxis
                    dataKey="name"
                    axisLine={{ stroke: "hsl(var(--muted-foreground))" }}
                    tickLine={{ stroke: "hsl(var(--muted-foreground))" }}
                    tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                    dy={10}
                    interval={0}
                    height={40}
                    tickFormatter={(value) => t(`prefDomainDashboard.quarters.${String(value).toLowerCase()}`, String(value)) as string}
                  />
                  
                  {/* --- Y Axis Style --- */}
                  <YAxis
                    orientation="left"
                    width={45}
                    axisLine={{ stroke: "hsl(var(--muted-foreground))" }}
                    tickLine={{ stroke: "hsl(var(--muted-foreground))" }}
                    tick={{ 
                      fontSize: 11, 
                      fill: "hsl(var(--muted-foreground))",
                      dx: lang === "ar" ? -18 : 0 
                    }}
                    domain={[0, (dataMax: number) => Math.ceil(dataMax / 100) * 100]}
                  />
                  
                  <Tooltip
                    contentStyle={{
                      borderRadius: "8px",
                      border: "1px solid hsl(var(--border))",
                      fontSize: "12px",
                      backgroundColor: "hsl(var(--background))",
                      color: "hsl(var(--foreground))"
                    }}
                  />
                  
                  <Legend
                    wrapperStyle={{ fontSize: "12px", paddingTop: "20px" }}
                    iconType="circle"
                  />

                  {/* 💡 AJOUT de connectNulls={false} pour couper la courbe proprement */}
                  <Area
                    type="linear"
                    dataKey="Camping"
                    name={t("prefDomainDashboard.programs.camping")}
                    stroke="#3b82f6"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorCamping)"
                    connectNulls={false} 
                  />
                  <Area
                    type="linear"
                    dataKey="Festivals"
                    name={t("prefDomainDashboard.programs.festivals")}
                    stroke="#8b5cf6"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorFestivals)"
                    connectNulls={false}
                  />
                  <Area
                    type="linear"
                    dataKey="Formation"
                    name={t("prefDomainDashboard.programs.formation")}
                    stroke="#ec4899"
                    strokeWidth={2}
                    fill="none"
                    connectNulls={false}
                  />
                  <Area
                    type="linear"
                    dataKey="Insertion"
                    name={t("prefDomainDashboard.programs.insertion")}
                    stroke="#10b981"
                    strokeWidth={2}
                    fill="none"
                    connectNulls={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </section>
        {/* --- SECTION 5 : Benchmark régional --- */}
        <section className="space-y-3">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-foreground">
              {t("prefDomainDashboard.benchmark.title", "Benchmark régional")}
            </h2>
          </div>
          <Card className="bg-card w-full overflow-hidden border-border/60 shadow-none">
            <div className="overflow-x-auto w-full">
              <Table>
                <TableHeader className="bg-muted/50 border-b border-border/60">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className={`${lang === "ar" ? "text-right" : "text-left"} font-semibold py-4 text-muted-foreground uppercase text-[11px] tracking-wider`}>
                      {t("prefDomainDashboard.benchmark.columns.indicator", "Indicateur")}
                    </TableHead>
                    <TableHead className={`${lang === "ar" ? "text-left" : "text-right"} font-semibold text-muted-foreground uppercase text-[11px] tracking-wider`}>
                      {t("prefDomainDashboard.benchmark.columns.prefecture", "Préfecture")}
                    </TableHead>
                    <TableHead className={`${lang === "ar" ? "text-left" : "text-right"} font-semibold text-muted-foreground uppercase text-[11px] tracking-wider`}>
                      {t("prefDomainDashboard.benchmark.columns.regionalAverage", "Moyenne Régionale")}
                    </TableHead>
                    <TableHead className={`${lang === "ar" ? "text-left" : "text-right"} font-semibold text-muted-foreground uppercase text-[11px] tracking-wider`}>
                      {t("prefDomainDashboard.benchmark.columns.variance", "Écart")}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {benchmark.map((item, idx) => {
                    const ecart = Number((item.monScore - item.moyenneReg).toFixed(1));
                    const isPositive = ecart > 0;
                    const isNegative = ecart < 0;
                    const formatValue = (val: number) =>
                      item.isPercentage ? `${val.toFixed(1)}%` : val.toFixed(1);

                    const kpiKeys: Record<string, string> = {
                      "Total des Activités": "totalActivities",
                      "Total Bénéficiaires": "totalBeneficiaries",
                      "Taux de Couverture": "coverageRate",
                      "Taux de Féminisation": "feminisationRate",
                      "Partenariats Actifs": "activePartnerships",
                      "Établ. Opérationnels": "operationalEstab"
                    };
                    const kpiTranslationKey = kpiKeys[item.kpi] || item.kpi;

                    return (
                      <TableRow key={idx} className="hover:bg-muted/20 transition-colors border-border/40">
                        <TableCell className={`${lang === "ar" ? "text-right" : "text-left"} font-medium text-xs sm:text-sm py-3 sm:py-4`}>
                          {t(`prefDomainDashboard.benchmark.kpis.${kpiTranslationKey}`, item.kpi)}
                        </TableCell>
                        
                        <TableCell className={`${lang === "ar" ? "text-left" : "text-right"} font-bold tabular-nums text-xs sm:text-sm`}>
                          <span dir="ltr">{formatValue(item.monScore)}</span>
                        </TableCell>
                        
                        <TableCell className={`${lang === "ar" ? "text-left" : "text-right"} text-muted-foreground tabular-nums text-xs sm:text-sm`}>
                          <span dir="ltr">{formatValue(item.moyenneReg)}</span>
                        </TableCell>
                        
                        <TableCell className={`${lang === "ar" ? "text-left" : "text-right"} tabular-nums text-xs sm:text-sm`}>
                          {/* درنا justify-start فالعربية باش يجيو الأيقونات والناقص مقادين مع اليسار */}
                          <div className={`flex items-center ${lang === "ar" ? "justify-start" : "justify-end"} gap-1`} dir="ltr">
                            {isPositive && (
                              <>
                                <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                                <span className="text-emerald-500 font-bold">
                                  +{formatValue(ecart)}
                                </span>
                              </>
                            )}
                            {isNegative && (
                              <>
                                <TrendingDown className="w-3.5 h-3.5 text-red-500" />
                                <span className="text-red-500 font-bold">{formatValue(ecart)}</span>
                              </>
                            )}
                            {ecart === 0 && (
                              <>
                                <Minus className="w-3.5 h-3.5 text-muted-foreground" />
                                <span className="text-muted-foreground font-medium">0</span>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </Card>
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
                            repArray.map((item: any, index: number) => {
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
                            causesArray.map((item: any, index: number) => {
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
      </div>
    </AppLayout>
  );
};

export default DirectionDetail;