import { useEffect, useMemo, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/AppLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCategoriesAssociations } from "@/hooks/useCategoriesAssociations";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  Tooltip,
  ResponsiveContainer,
  Legend,
  XAxis,
  YAxis,
  CartesianGrid,
  Area,
  AreaChart,
} from "recharts";
import {
  Activity,
  Users,
  Handshake,
  Gauge,
  Trophy,
  Calendar,
  Layers,
  FileSpreadsheet,
  CheckCircle2,
  Clock,
  AlertCircle,
  CalendarDays,
  Target,
  TrendingUp,
  TrendingDown,
  Minus,
  ChevronDown,
  ChevronUp,
  Tent,
  Landmark,
  GraduationCap,
  MapPin,
  Medal,
  Building,
  TreePine,
  Briefcase,
  Music,
  Building2,
  FileText,
  Sparkles,
  HardHat,
  Wrench,
  Package,
  Scale,
  Users2,
  Shield,
  HeartHandshake,UserMinus,UserPlus,ArrowRightLeft
} from "lucide-react";
import { DOMAIN_OPTIONS, type Domain } from "@/lib/domainData";
import { useAuth } from "@/hooks/useAuth";

const fmt = (n: number, lang: string) =>
  new Intl.NumberFormat(lang === "ar" ? "ar-MA" : "fr-FR").format(Math.round(n));

type WorkflowStatus = "NON_COMMENCE" | "EN_COURS" | "TERMINE";

const WORKFLOW_STATUS: Record<WorkflowStatus, { label: string; badge: string; icon: any }> = {
  NON_COMMENCE: { label: "NON COMMENCÉ", badge: "bg-warning/15 text-warning", icon: AlertCircle },
  EN_COURS: { label: "EN COURS", badge: "bg-info/15 text-info", icon: Clock },
  TERMINE: { label: "TERMINÉ", badge: "bg-success/15 text-success", icon: CheckCircle2 },
};

// --- FONCTIONS DE FORMATAGE POUR SUPABASE ---

const formatEvolutionData = (dataArray: any[]) => {
  const squeletteAnnee = [
    { name: "T1", Camping: null, Festivals: null, Formation: null, Insertion: null },
    { name: "T2", Camping: null, Festivals: null, Formation: null, Insertion: null },
    { name: "T3", Camping: null, Festivals: null, Formation: null, Insertion: null },
    { name: "T4", Camping: null, Festivals: null, Formation: null, Insertion: null },
  ];

  if (!dataArray || dataArray.length === 0) return squeletteAnnee;

  return squeletteAnnee.map((trimestre) => {
    const donneesExistantes = dataArray.find((d) => d.name === trimestre.name);
    return donneesExistantes ? { ...trimestre, ...donneesExistantes } : trimestre;
  });
};

  const formatBenchmarkData = (data: any) => {
  const d = data || {}; // Si data est null, on utilise un objet vide
  return [
    {
      kpi: "Total des Activités",
      monScore: d.pref_total_activites || 0,
      moyenneReg: d.reg_total_activites || 0,
      isPercentage: false,
    },
    {
      kpi: "Total Bénéficiaires",
      monScore: d.pref_total_beneficiaires || 0,
      moyenneReg: d.reg_total_beneficiaires || 0,
      isPercentage: false,
    },
    {
      kpi: "Taux de Couverture",
      monScore: d.pref_taux_couverture || 0,
      moyenneReg: d.pref_taux_couverture || 0,
      isPercentage: true,
    },
    {
      kpi: "Taux de Féminisation",
      monScore: d.pref_taux_feminisation || 0,
      moyenneReg: d.reg_taux_feminisation || 0,
      isPercentage: true,
    },
    {
      kpi: "Partenariats Actifs",
      monScore: d.pref_total_partenariats || 0,
      moyenneReg: d.reg_total_partenariats || 0,
      isPercentage: false,
    },
    {
      kpi: "Établ. Opérationnels",
      monScore: d.pref_etablissements_actifs || 0,
      moyenneReg: d.reg_etablissements_actifs || 0,
      isPercentage: false,
    },
  ];
};

const mapSection6Data = (data: any) => {
  const d = data || {}; 

  // --- CORRECTION DU RATIO D'ENCADREMENT ---
  const staffTotal = d.camp_staff_total || 0;
  const benefCamping = d.camp_benef_total || 0; // 👈 On utilise les bénéficiaires du CAMPING !

  const ratioCalcule =
    staffTotal === 0 || benefCamping === 0 ? "0:0" : `1:${Math.round(benefCamping / staffTotal)}`;

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
    // 💡 AJOUT : CONNEXION DES MOUVEMENTS ASSOCIATIFS
    associations: {
      entrants: d.assoc_entrants || 0,
      sortants: d.assoc_sortants || 0,
      benef_entrants: d.benef_entrants || 0,
      benef_sortants: d.benef_sortants || 0,
    },
    camping: {
      participants: {
        total: d.camp_benef_total || 0,
        enfants_mre: d.camp_mre || 0,
        besoins_specifiques: d.camp_besoins_spec || 0,
      },
      encadrement: {
        ratio: ratioCalcule, // 👈 Le ratio calculé correctement
        total_staff: d.camp_staff_total || 0,
        hommes: d.camp_staff_h || 0,
        femmes: d.camp_staff_f || 0,
      },
      // 💡 AJOUT : CONNEXION DES FORMATIONS
      formations: { 
        total_sessions: d.form_total_sessions || 0, 
        beneficiaires: d.form_beneficiaires || 0 
      },
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
      total: 0,
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
const PrefDomainDashboard = () => {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const { utilisateur: profile } = useAuth();
  const { items: categoriesAssociations } = useCategoriesAssociations();


  const [domain, setDomain] = useState<Domain>("jeunesse");
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [openSection, setOpenSection] = useState<string | null>("activites");

  const [dashboardData, setDashboardData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadDashboardData = useCallback(async () => {
    if (!profile?.direction_id) return;

    setIsLoading(true);
    try {
      // 1. Chercher si au moins un rapport existe pour cette année et cette direction
      const { data: rapport } = await supabase
        .from("rapports")
        .select("id")
        .eq("direction_id", profile.direction_id)
        .eq("annee", year)
        .limit(1)
        .maybeSingle();

      // 2. Si AUCUN rapport n'est trouvé, on génère un tableau de bord vide (rempli de zéros)
      if (!rapport) {
        setDashboardData({
          status: {
            workflowStatus: "NON_COMMENCE",
            progressPct: 0,
            lastUpdated: null,
          },
          kpis: {
            totalBeneficiaries: 0,
            totalActivities: 0,
            feminizationRate: 0,
            coverageRate: 0,
            activeEstablishments: 0,
            activePartnerships: 0,
          },
          repartition: [],
          evolution: formatEvolutionData([]),
          benchmark: formatBenchmarkData(null),
          detailed: mapSection6Data(null),
        });
        return;
      }

      // 3. Si des rapports existent pour l'année, on charge les vues YTD (Year-To-Date)
      const [resSec1, resSec2, resSec3, resSec4, resSec5, resSec6] = await Promise.all([
        // Section 1 : S'il y a plusieurs rapports, on récupère le plus récent
        supabase
          .from("v_dashboard_pref_section1")
          .select("*")
          .eq("direction_id", profile.direction_id)
          .eq("annee", year)
          .order("trimestre", { ascending: false })
          .limit(1)
          .maybeSingle(),

        // Remplacement par les vues '_annuel' :
        supabase
          .from("v_dashboard_pref_section2_annuel")
          .select("*")
          .eq("direction_id", profile.direction_id)
          .eq("annee", year)
          .maybeSingle(),

        supabase
          .from("v_dashboard_pref_section3_annuel")
          .select("*")
          .eq("direction_id", profile.direction_id)
          .eq("annee", year),

        supabase
          .from("v_dashboard_pref_section4")
          .select("*")
          .eq("direction_id", profile.direction_id)
          .eq("annee", year),

        supabase
          .from("v_dashboard_pref_section5_annuel")
          .select("*")
          .eq("direction_id", profile.direction_id)
          .eq("annee", year)
          .maybeSingle(),

        supabase
          .from("v_dashboard_pref_section6_annuel")
          .select("*")
          .eq("direction_id", profile.direction_id)
          .eq("annee", year)
          .maybeSingle(),
      ]);

      // 4. On met à jour le state avec les vraies données
      setDashboardData({
        status: {
          workflowStatus: resSec1.data?.statut || "NON_COMMENCE",
          progressPct: resSec1.data?.progression_pourcentage || 0,
          lastUpdated: resSec1.data?.derniere_mise_a_jour,
        },
        kpis: {
          totalBeneficiaries: resSec2.data?.total_beneficiaires || 0,
          totalActivities: resSec2.data?.total_activites || 0,
          feminizationRate: resSec2.data?.taux_feminisation || 0,
          coverageRate: resSec2.data?.taux_couverture || 0,
          activeEstablishments: resSec2.data?.etablissements_actifs || 0,
          activePartnerships: resSec2.data?.total_partenariats || 0,
        },
        repartition: resSec3.data || [],
        evolution: formatEvolutionData(resSec4.data),
        benchmark: formatBenchmarkData(resSec5.data),
        detailed: mapSection6Data(resSec6.data),
      });
    } catch (error) {
      console.error("Erreur lors du chargement du dashboard:", error);
    } finally {
      setIsLoading(false);
    }
  }, [profile?.direction_id, year]);

  // 5. Appeler le chargement au démarrage (ou quand l'année change)
  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // 6. Écouteur REALTIME Supabase
  useEffect(() => {
    if (!profile?.direction_id) return;

    // On crée un canal pour écouter les modifications de base de données en direct
    const channel = supabase
      .channel("dashboard-realtime-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "activites" }, () => {
        console.log("Mise à jour détectée : activites");
        loadDashboardData();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "participants" }, () => {
        console.log("Mise à jour détectée : participants");
        loadDashboardData();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "suivi_remplissage" }, () => {
        loadDashboardData();
      })
      // --- AJOUT : STRUCTURE DU RAPPORT ---
      .on("postgres_changes", { event: "*", schema: "public", table: "rapports" }, () => {
        loadDashboardData();
      })

      // --- AJOUT : FORMATIONS & ENCADREMENT ---
      .on("postgres_changes", { event: "*", schema: "public", table: "encadrements" }, () => {
        loadDashboardData();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "formations" }, () => {
        loadDashboardData();
      })
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "statistiques_formation" },
        () => {
          loadDashboardData();
        },
      )

      // --- AJOUT : PARTENARIATS ---
      .on("postgres_changes", { event: "*", schema: "public", table: "partenariats" }, () => {
        loadDashboardData();
      })

      // --- AJOUT : INSERTION SOCIO-ÉCONOMIQUE ---
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "activites_insertion" },
        () => {
          loadDashboardData();
        },
      )
      .on("postgres_changes", { event: "*", schema: "public", table: "stats_insertion" }, () => {
        loadDashboardData();
      })

      // --- AJOUT : FESTIVALS DE JEUNESSE ---
      .on("postgres_changes", { event: "*", schema: "public", table: "festivals" }, () => {
        loadDashboardData();
      })
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "statistiques_festivals" },
        () => {
          loadDashboardData();
        },
      )

      // --- AJOUT : ÉTABLISSEMENTS & INFRASTRUCTURES ---
      .on("postgres_changes", { event: "*", schema: "public", table: "etablissements" }, () => {
        loadDashboardData();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "fermetures" }, () => {
        loadDashboardData();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "suivi_projets" }, () => {
        loadDashboardData();
      })
      // Tu peux chainer d'autres tables ici (festivals, etc.) selon tes besoins
      .subscribe();

    // Nettoyage à la fermeture de la page
    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.direction_id, loadDashboardData]);

  // 1️⃣ DÉPLACE CE BLOC ICI : AVANT LES "IF"
  const activeDomainLabel = useMemo(() => {
    const option = DOMAIN_OPTIONS.find((opt) => opt.value === domain);
    return option ? (lang === "ar" ? option.labelAr : option.labelFr) : domain;
  }, [domain, lang]);

  // LES CONDITIONS DE RETOUR VIENNENT APRÈS TOUS LES HOOKS
  if (isLoading) {
    return (
      <AppLayout>
        <div className="p-12 text-center animate-pulse">
          {t("loadingIndicators", "Chargement des indicateurs...") as string}
        </div>
      </AppLayout>
    );
  }

  // 3️⃣ LES VARIABLES SIMPLES (sans Hooks) RESTENT EN BAS
  const statusKey = dashboardData.status.workflowStatus as WorkflowStatus;
  const rawStatus = WORKFLOW_STATUS[statusKey] || WORKFLOW_STATUS["NON_COMMENCE"];

  const statusMeta = {
  ...rawStatus,
  label: t(`prefDomainDashboard.status.${(statusKey || "NON_COMMENCE").toLowerCase()}`, rawStatus.label)
};
  const StatusIcon = statusMeta.icon;

  const progressPct = dashboardData.status.progressPct || 0;

  const entrants = dashboardData?.detailed?.associations?.entrants || 0;
  const sortants = dashboardData?.detailed?.associations?.sortants || 0;
  const soldeNet = entrants - sortants;

  const toggleSection = (section: string) => {
    setOpenSection(openSection === section ? null : section);
  };
  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in pb-12">
        {/* --- HERO HEADER --- */}
        <div className="gradient-hero rounded-3xl p-6 sm:p-8">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="space-y-3">
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight">
                  {t("domain.title", "Tableau de bord préfectoral")}
                </h1>
                <p className="text-sm text-white/80 mt-1">{year}</p>
              </div>
            </div>
            <Button
              variant="outline"
              className="bg-white/10 border-white/20 hover:bg-white/20 text-white"
            >
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              {t("domain.exportExcel", "Exporter Excel")}
            </Button>
          </div>
        </div>

        {/* --- FILTRES --- */}
        <Card className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1 flex items-center gap-1">
                <Calendar className="h-3 w-3" /> {t("common.year", "Année")}
              </label>
              <Input
                type="number"
                value={year}
                onChange={(e) => setYear(Number(e.target.value) || new Date().getFullYear())}
                className="h-9 bg-card"
                min={2020}
                max={2099}
              />
            </div>
            <div>
              <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1 flex items-center gap-1">
                <Layers className="h-3 w-3" /> {t("common.domain", "Domaine")}
              </label>
              <Select value={domain} onValueChange={(v) => setDomain(v as Domain)}>
                <SelectTrigger className="h-9 bg-card">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DOMAIN_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {lang === "ar" ? opt.labelAr : opt.labelFr}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        {/* --- SECTION 1 : Suivi du rapport --- */}
<section className="space-y-3">
  <div className="flex items-baseline justify-between">
    <h2 className="text-base sm:text-lg font-bold text-foreground">
      {t("prefDomainDashboard.workflow.title", "Suivi du rapport")}
    </h2>
  </div>
  <Card className="p-5 sm:p-6">
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6 items-center">
      
      {/* Statut */}
      <div className={`rounded-xl p-4 ${statusMeta.badge} bg-opacity-30 ring-1 ring-current/20`}>
        <div className="flex items-center gap-2">
          <StatusIcon className="h-4 w-4" />
          <span className="text-[11px] font-semibold uppercase tracking-wider">
            {t("prefDomainDashboard.workflow.status", "Statut")}
          </span>
        </div>
        <div className="text-lg font-extrabold mt-1">{statusMeta.label}</div>
      </div>
      
      {/* Domaine Filtré */}
      <div>
        <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {t("prefDomainDashboard.workflow.filteredDomain", "Domaine Filtré")}
        </div>
        <div className="text-lg font-bold text-foreground mt-1">{activeDomainLabel}</div>
      </div>
      
      {/* Dernière mise à jour */}
      <div>
        <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {t("prefDomainDashboard.workflow.lastUpdate", "Dernière mise à jour")}
        </div>
        <div className="text-lg font-bold text-foreground mt-1 flex items-center gap-1.5">
          <CalendarDays className="h-4 w-4 text-muted-foreground" />
          {dashboardData.status.lastUpdated
            ? new Date(dashboardData.status.lastUpdated).toLocaleDateString(
                i18n.language === 'ar' ? 'ar-MA' : 'fr-FR'
              )
            : "-"}
        </div>
      </div>
      
      {/* Progression */}
      <div>
        <div className="flex items-baseline justify-between mb-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            {t("prefDomainDashboard.workflow.progress", "Progression")}
          </span>
          <span className="text-sm font-bold tabular-nums text-foreground">
            {progressPct}%
          </span>
        </div>
        <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

    </div>
  </Card>
</section>

        {/* --- Section 2: Top KPIs --- */}
<section className="space-y-3">
  <div>
    <h2 className="text-base sm:text-lg font-bold text-foreground">
      {t("prefDomainDashboard.kpis.title", "Top KPIs principaux")}
    </h2>
  </div>
  <Card className="p-4 sm:p-5">
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* 1. Total des Activités */}
      <div className="relative p-5 rounded-2xl border border-border/60 bg-card hover:shadow-md transition-all min-h-[150px] flex flex-col justify-between overflow-hidden">
        <span className="absolute inset-y-0 start-0 w-1 bg-[hsl(var(--kpi-2))]" />
        <div className="h-11 w-11 rounded-xl flex items-center justify-center bg-[hsl(var(--kpi-2-soft))] text-[hsl(var(--kpi-2))]">
          <Activity className="h-5 w-5" />
        </div>
        <div className="space-y-1">
          <div className="text-3xl font-extrabold tracking-tight text-foreground tabular-nums">
            {fmt(dashboardData.kpis.totalActivities, lang)}
          </div>
          <div className="text-sm text-muted-foreground leading-snug">
            {t("prefDomainDashboard.kpis.activities", "Total des Activités")}
          </div>
        </div>
      </div>

      {/* 2. Total Bénéficiaires */}
      <div className="relative p-5 rounded-2xl border border-border/60 bg-card hover:shadow-md transition-all min-h-[150px] flex flex-col justify-between overflow-hidden">
        <span className="absolute inset-y-0 start-0 w-1 bg-[hsl(var(--kpi-3))]" />
        <div className="h-11 w-11 rounded-xl flex items-center justify-center bg-[hsl(var(--kpi-3-soft))] text-[hsl(var(--kpi-3))]">
          <Users className="h-5 w-5" />
        </div>
        <div className="space-y-1">
          <div className="text-3xl font-extrabold tracking-tight text-foreground tabular-nums">
            {fmt(dashboardData.kpis.totalBeneficiaries, lang)}
          </div>
          <div className="text-sm text-muted-foreground leading-snug">
            {t("prefDomainDashboard.kpis.beneficiaries", "Total Bénéficiaires")}
          </div>
        </div>
      </div>

      {/* 3. Taux de Couverture */}
      <div className="relative p-5 rounded-2xl border border-border/60 bg-card hover:shadow-md transition-all min-h-[150px] flex flex-col justify-between overflow-hidden">
        <span className="absolute inset-y-0 start-0 w-1 bg-[hsl(var(--kpi-6))]" />
        <div className="h-11 w-11 rounded-xl flex items-center justify-center bg-[hsl(var(--kpi-6-soft))] text-[hsl(var(--kpi-6))]">
          <Target className="h-5 w-5" />
        </div>
        <div className="space-y-1">
          <div className="text-3xl font-extrabold tracking-tight text-foreground tabular-nums">
            {`${dashboardData.kpis.coverageRate?.toFixed(1) || 12.5}%`}
          </div>
          <div className="text-sm text-muted-foreground leading-snug">
            {t("prefDomainDashboard.kpis.coverage", "Taux de Couverture")}
          </div>
        </div>
      </div>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
      {/* 4. Taux de Féminisation */}
      <div className="relative p-5 rounded-2xl border border-border/60 bg-card hover:shadow-md transition-all min-h-[150px] flex flex-col justify-between overflow-hidden">
        <span className="absolute inset-y-0 start-0 w-1 bg-[hsl(var(--kpi-1))]" />
        <div className="h-11 w-11 rounded-xl flex items-center justify-center bg-[hsl(var(--kpi-1-soft))] text-[hsl(var(--kpi-1))]">
          <Trophy className="h-5 w-5" />
        </div>
        <div className="space-y-1">
          <div className="text-3xl font-extrabold tracking-tight text-foreground tabular-nums">
            {`${dashboardData.kpis.feminizationRate.toFixed(1)}%`}
          </div>
          <div className="text-sm text-muted-foreground leading-snug">
            {t("prefDomainDashboard.kpis.feminization", "Taux de Féminisation")}
          </div>
        </div>
      </div>

      {/* 5. Total Partenariats */}
      <div className="relative p-5 rounded-2xl border border-border/60 bg-card hover:shadow-md transition-all min-h-[150px] flex flex-col justify-between overflow-hidden">
        <span className="absolute inset-y-0 start-0 w-1 bg-[hsl(var(--kpi-4))]" />
        <div className="h-11 w-11 rounded-xl flex items-center justify-center bg-[hsl(var(--kpi-4-soft))] text-[hsl(var(--kpi-4))]">
          <Handshake className="h-5 w-5" />
        </div>
        <div className="space-y-1">
          <div className="text-3xl font-extrabold tracking-tight text-foreground tabular-nums">
            {fmt(dashboardData.kpis.activePartnerships, lang)}
          </div>
          <div className="text-sm text-muted-foreground leading-snug">
            {t("prefDomainDashboard.kpis.partnerships", "Total Partenariats")}
          </div>
        </div>
      </div>

      {/* 6. Établissements Actifs */}
      <div className="relative p-5 rounded-2xl border border-border/60 bg-card hover:shadow-md transition-all min-h-[150px] flex flex-col justify-between overflow-hidden">
        <span className="absolute inset-y-0 start-0 w-1 bg-[hsl(var(--kpi-5))]" />
        <div className="h-11 w-11 rounded-xl flex items-center justify-center bg-[hsl(var(--kpi-5-soft))] text-[hsl(var(--kpi-5))]">
          <Gauge className="h-5 w-5" />
        </div>
        <div className="space-y-1">
          <div className="text-3xl font-extrabold tracking-tight text-foreground tabular-nums">
            {fmt(dashboardData.kpis.activeEstablishments, lang)}
          </div>
          <div className="text-sm text-muted-foreground leading-snug">
            {t("prefDomainDashboard.kpis.establishments", "Établissements Actifs")}
          </div>
        </div>
      </div>
    </div>
  </Card>
</section>

        {/* --- SECTION 3 : Répartition des bénéficiaires --- */}
<section className="space-y-4">
  <div>
    <h2 className="text-lg font-bold text-foreground">
      {t("prefDomainDashboard.charts.axeTitle", "Répartition des bénéficiaires par axe")}
    </h2>
  </div>

  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
    {/* Chart 1: Volume Global */}
    <Card className="p-5 flex flex-col">
      <div className="mb-4">
        <h3 className="text-sm font-bold text-foreground">
          {t("prefDomainDashboard.charts.volumeTitle", "Volume Global par Programme")}
        </h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          {t("prefDomainDashboard.charts.volumeSubtitle", "Nombre absolu de bénéficiaires impactés")}
        </p>
      </div>
      <div className="h-[250px] w-full mt-auto">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={dashboardData.repartition}
            margin={{ top: 10, right: lang === "ar" ? 45 : 10, left: lang === "ar" ? 10 : 30, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
            <XAxis
              dataKey="name"
              axisLine={{ stroke: "hsl(var(--muted-foreground))" }}
              tickLine={{ stroke: "hsl(var(--muted-foreground))" }}
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              dy={10}
              interval={0}
              height={36}
              tickFormatter={(value) => t(`prefDomainDashboard.programs.${String(value).toLowerCase()}`, String(value)) as string}
            />
            <YAxis
  orientation="left" 
  axisLine={{ stroke: "hsl(var(--muted-foreground))" }}
  tickLine={{ stroke: "hsl(var(--muted-foreground))" }}
  width={45} 
  tick={{ 
    fontSize: 11, 
    fill: "hsl(var(--muted-foreground))",
    dx: lang === "ar" ? -18 : 0 
  }}
              domain={[0, (dataMax: number) => Math.ceil(dataMax / 100) * 100]}
            />
            <Tooltip
              cursor={{ fill: "hsl(var(--muted)/0.4)" }}
              contentStyle={{
                borderRadius: "8px",
                border: "1px solid hsl(var(--border))",
                fontSize: "12px",
              }}
            />
            <Bar
              dataKey="total"
              fill="hsl(var(--primary))"
              radius={[4, 4, 0, 0]}
              maxBarSize={50}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>

    {/* Chart 2: Mixité H/F */}
    <Card className="p-5 flex flex-col">
      <div className="mb-4">
        <h3 className="text-sm font-bold text-foreground">
          {t("prefDomainDashboard.charts.mixityTitle", "Mixité H / F par Programme (%)")}
        </h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          {t("prefDomainDashboard.charts.mixitySubtitle", "Taux de féminisation comparatif")}
        </p>
      </div>
      <div className="h-[250px] w-full mt-auto">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={dashboardData.repartition}
            margin={{ top: 10, right: lang === "ar" ? 45 : 10, left: lang === "ar" ? 10 : 30, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
            <XAxis
              dataKey="name"
              axisLine={{ stroke: "hsl(var(--muted-foreground))" }}
              tickLine={{ stroke: "hsl(var(--muted-foreground))" }}
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              dy={10}
              interval={0}
              height={36}
              tickFormatter={(value) => t(`prefDomainDashboard.programs.${String(value).toLowerCase()}`,String(value)) as string}
            />
             <YAxis
  orientation="left" 
  axisLine={{ stroke: "hsl(var(--muted-foreground))" }}
  tickLine={{ stroke: "hsl(var(--muted-foreground))" }}
  width={45} 
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
              contentStyle={{
                borderRadius: "8px",
                border: "1px solid hsl(var(--border))",
                fontSize: "12px",
              }}
              formatter={(value: number) => [`${value}%`, ""]}
            />
            <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }} iconType="circle" />
            <Bar
              dataKey="hommesPct"
              name={t("prefDomainDashboard.charts.men", "Hommes")}
              stackId="a"
              fill="#3b82f6"
              radius={[0, 0, 4, 4]}
              maxBarSize={50}
            />
            <Bar
              dataKey="femmesPct"
              name={t("prefDomainDashboard.charts.women", "Femmes")}
              stackId="a"
              fill="#ec4899"
              radius={[4, 4, 0, 0]}
              maxBarSize={50}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>

    {/* Chart 3: Urbain / Rural */}
    <Card className="p-5 flex flex-col">
      <div className="mb-4">
        <h3 className="text-sm font-bold text-foreground">
          {t("prefDomainDashboard.charts.coverageTitle", "Couverture Territorial (Urbain / Rural)")}
        </h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          {t("prefDomainDashboard.charts.coverageSubtitle", "Analyse incluant les données estimées")}
        </p>
      </div>
      <div className="h-[250px] w-full mt-auto">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={dashboardData.repartition}
            margin={{ top: 10, right: 10, left: 45, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
            <XAxis
              dataKey="name"
              axisLine={{ stroke: "hsl(var(--muted-foreground))" }}
              tickLine={{ stroke: "hsl(var(--muted-foreground))" }}
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              dy={10}
              interval={0}
              height={36}
              tickFormatter={(value) => t(`prefDomainDashboard.programs.${String(value).toLowerCase()}`, String(value)) as string}
            />
             <YAxis
  orientation="left" 
  axisLine={{ stroke: "hsl(var(--muted-foreground))" }}
  tickLine={{ stroke: "hsl(var(--muted-foreground))" }}
  width={45} 
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
              contentStyle={{
                borderRadius: "8px",
                border: "1px solid hsl(var(--border))",
                fontSize: "12px",
              }}
              formatter={(value: number) => [`${value}%`, ""]}
            />
            <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }} iconType="square" />
            <Bar
              dataKey="urbainPct"
              name={t("prefDomainDashboard.charts.urban", "Urbain")}
              stackId="a"
              fill="#f59e0b"
              radius={[0, 0, 4, 4]}
              maxBarSize={50}
            />
            <Bar
              dataKey="ruralPct"
              name={t("prefDomainDashboard.charts.rural", "Rural")}
              stackId="a"
              fill="#10b981"
              radius={[4, 4, 0, 0]}
              maxBarSize={50}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  </div>
</section>

        {/* --- SECTION 4 : Évolution temporelle --- */}
<section className="space-y-4">
  <div className="flex items-center justify-between">
    <h2 className="text-lg font-bold text-foreground">
      {t("prefDomainDashboard.charts.evolutionTitle", "Évolution trimestrielle des bénéficiaires")}
    </h2>
  </div>

  <Card className="p-5">
    <div className="mb-6">
      <h3 className="text-sm font-bold text-foreground">
        {t("prefDomainDashboard.charts.evolutionCardTitle", "Trajectoire des performances par programme")}
      </h3>
      <p className="text-xs text-muted-foreground mt-0.5">
        {t("prefDomainDashboard.charts.evolutionCardSubtitle", "Évolution du nombre de bénéficiaires (T1 à T4) pour les axes éligibles")}
      </p>
    </div>

    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={dashboardData.evolution}
          margin={{ top: 10, right: 30, left: 45, bottom: 20 }}
        >
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
          <XAxis
            dataKey="name"
            axisLine={{ stroke: "hsl(var(--muted-foreground))" }}
            tickLine={{ stroke: "hsl(var(--muted-foreground))" }}
            tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
            dy={10}
            interval={0}
            height={40}
            tickFormatter={(value) => t(`prefDomainDashboard.quarters.${String(value).toLowerCase()}`,String(value)) as string}
          />
          <YAxis
  orientation="left" 
  axisLine={{ stroke: "hsl(var(--muted-foreground))" }}
  tickLine={{ stroke: "hsl(var(--muted-foreground))" }}
  width={45}
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
            }}
          />
          <Legend
            wrapperStyle={{ fontSize: "12px", paddingTop: "20px" }}
            iconType="circle"
          />

          <Area
            type="linear"
            dataKey="Camping"
            name={t("prefDomainDashboard.programs.camping", "Camping")} // ترجمة الإسم فالمبيان
            stroke="#3b82f6"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorCamping)"
          />
          <Area
            type="linear"
            dataKey="Festivals"
            name={t("prefDomainDashboard.programs.festivals", "Festivals")} // ترجمة الإسم فالمبيان
            stroke="#8b5cf6"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorFestivals)"
          />
          <Area
            type="linear"
            dataKey="Formation"
            name={t("prefDomainDashboard.programs.formation", "Formation")} // ترجمة الإسم فالمبيان
            stroke="#ec4899"
            strokeWidth={2}
            fill="none"
          />
          <Area
            type="linear"
            dataKey="Insertion"
            name={t("prefDomainDashboard.programs.insertion", "Insertion")} // ترجمة الإسم فالمبيان
            stroke="#10b981"
            strokeWidth={2}
            fill="none"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  </Card>
</section>

        {/* --- Section 5 : Benchmark régional --- */}
<section className="space-y-3">
  <div>
    <h2 className="text-base sm:text-lg font-bold text-foreground">
      {t("prefDomainDashboard.benchmark.title", "Benchmark régional")}
    </h2>
  </div>
  <Card className="bg-card w-full overflow-x-auto">
    <Table>
      <TableHeader className="bg-muted/50">
        <TableRow>
        <TableHead className={`${lang === "ar" ? "text-right" : "text-left"} font-semibold py-4`}>
        {t("prefDomainDashboard.benchmark.columns.indicator", "Indicateur")}
       </TableHead>
       <TableHead className={`${lang === "ar" ? "text-left" : "text-right"} font-semibold`}>
        {t("prefDomainDashboard.benchmark.columns.prefecture", "Préfecture")}
        </TableHead>
        <TableHead className={`${lang === "ar" ? "text-left" : "text-right"} font-semibold`}>
        {t("prefDomainDashboard.benchmark.columns.regionalAverage", "Moyenne Régionale") as string}
        </TableHead>
        <TableHead className={`${lang === "ar" ? "text-left" : "text-right"} font-semibold`}>
        {t("prefDomainDashboard.benchmark.columns.variance", "Écart") as string}
        </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {dashboardData.benchmark.map((item, idx) => {
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
            <TableRow key={idx} className="hover:bg-muted/20 transition-colors">
              <TableCell className={`${lang === "ar" ? "text-right" : "text-left"} font-medium text-xs sm:text-sm py-3 sm:py-4`}>
              {t(`prefDomainDashboard.benchmark.kpis.${kpiTranslationKey}`, item.kpi) as string}
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
  </Card>
</section>

        {/* --- SECTION 6 : Détails du rapport (Accordion) --- */}
        <section className="space-y-2">
          <h2 className="text-base sm:text-lg font-bold text-foreground">
            {t("prefDomainDashboard.details.title", "Lecture détaillée du rapport") as string}
          </h2>
          <div className="space-y-3">
            {/* ACCORDION ITEM 1: ACTIVITÉS */}
            <Card className="overflow-hidden border-border/70 shadow-none">
              <button
                onClick={() => toggleSection("activites")}
                className="w-full flex items-center justify-between p-4 bg-muted/20 hover:bg-muted/40 transition-colors"
              >
                <div className="flex items-center gap-2 font-bold text-sm text-foreground">
                  <Activity className="h-4 w-4 text-blue-500" /> {t("prefDomainDashboard.details.activities.title", "Activités (Permanentes & Rayonnantes)") as string}
                </div>
                {openSection === "activites" ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </button>

              {openSection === "activites" &&
                (() => {
                  const act = dashboardData.detailed?.activites || {};
                  const totalAnim =
                    (act.activites_sportives || 0) +
                    (act.activites_educatives || 0) +
                    (act.activites_culturelles || 0) +
                    (act.renforcement_capacites || 0);
                  const pctSport = totalAnim
                    ? Math.round(((act.activites_sportives || 0) / totalAnim) * 100)
                    : 0;
                  const pctEduc = totalAnim
                    ? Math.round(((act.activites_educatives || 0) / totalAnim) * 100)
                    : 0;
                  const pctCult = totalAnim
                    ? Math.round(((act.activites_culturelles || 0) / totalAnim) * 100)
                    : 0;
                  const pctRenf = totalAnim
                    ? Math.round(((act.renforcement_capacites || 0) / totalAnim) * 100)
                    : 0;

                  return (
                    <div className="p-5 bg-card border-t border-border/50">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div className="space-y-4">
                          <div>
                            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
                              {t("prefDomainDashboard.details.activities.ecosystem", "Écosystème & Structures") as string}
                            </h4>
                            <div className="grid grid-cols-3 gap-3">
                              <div className="p-3 bg-muted/30 rounded-xl border border-border/50 flex flex-col items-center justify-center text-center">
                                <span className="text-2xl font-black text-foreground" dir="ltr">
                                  {act.nombre_associations || 0}
                                </span>
                                <span className="text-[10px] font-medium text-muted-foreground mt-1">
                                  {t("prefDomainDashboard.details.activities.associations", "Associations") as string}
                                </span>
                              </div>
                              <div className="p-3 bg-muted/30 rounded-xl border border-border/50 flex flex-col items-center justify-center text-center">
                                <span className="text-2xl font-black text-foreground" dir="ltr">
                                  {act.nombre_clubs || 0}
                                </span>
                                <span className="text-[10px] font-medium text-muted-foreground mt-1">
                                  {t("prefDomainDashboard.details.activities.activeClubs", "Clubs Actifs") as string}
                                </span>
                              </div>
                              <div className="p-3 bg-muted/30 rounded-xl border border-border/50 flex flex-col items-center justify-center text-center">
                                <span className="text-2xl font-black text-foreground" dir="ltr">
                                  {act.nombre_conventions || 0}
                                </span>
                                <span className="text-[10px] font-medium text-muted-foreground mt-1">
                                  {t("prefDomainDashboard.details.activities.conventions", "Conventions") as string}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div>
                          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex justify-between items-end">
                            <span>{t("prefDomainDashboard.details.activities.animationVolume", "Volume d'Animation") as string}</span>
                            <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded font-bold">
                              {t("prefDomainDashboard.details.activities.totalActions", { count: totalAnim, defaultValue: `Total: ${totalAnim} Actions` }) as string}
                            </span>
                          </h4>
                          <div className="space-y-3.5">
                            <div>
                              <div className="flex justify-between text-xs mb-1">
                                <span className="font-medium text-foreground">
                                  {t("prefDomainDashboard.details.activities.sportsActivities", "Activités Sportives") as string}
                                </span>
                                <span className="font-bold" dir="ltr">{act.activites_sportives || 0}</span>
                              </div>
                              <div className="w-full bg-muted rounded-full h-1.5">
                                <div
                                  className="bg-orange-500 h-1.5 rounded-full"
                                  style={{ width: `${pctSport}%` }}
                                ></div>
                              </div>
                            </div>

                            <div>
                              <div className="flex justify-between text-xs mb-1">
                                <span className="font-medium text-foreground">
                                  {t("prefDomainDashboard.details.activities.educActivities", "Activités Éducatives") as string}
                                </span>
                                <span className="font-bold" dir="ltr">{act.activites_educatives || 0}</span>
                              </div>
                              <div className="w-full bg-muted rounded-full h-1.5">
                                <div
                                  className="bg-blue-500 h-1.5 rounded-full"
                                  style={{ width: `${pctEduc}%` }}
                                ></div>
                              </div>
                            </div>

                            <div>
                              <div className="flex justify-between text-xs mb-1">
                                <span className="font-medium text-foreground">
                                  {t("prefDomainDashboard.details.activities.cultActivities", "Activités Culturelles") as string}
                                </span>
                                <span className="font-bold" dir="ltr">{act.activites_culturelles || 0}</span>
                              </div>
                              <div className="w-full bg-muted rounded-full h-1.5">
                                <div
                                  className="bg-pink-500 h-1.5 rounded-full"
                                  style={{ width: `${pctCult}%` }}
                                ></div>
                              </div>
                            </div>

                            <div>
                              <div className="flex justify-between text-xs mb-1">
                                <span className="font-medium text-foreground">
                                  {t("prefDomainDashboard.details.activities.capacityBuilding", "Renforcement des capacités") as string}
                                </span>
                                <span className="font-bold" dir="ltr">{act.renforcement_capacites || 0}</span>
                              </div>
                              <div className="w-full bg-muted rounded-full h-1.5">
                                <div
                                  className="bg-purple-500 h-1.5 rounded-full"
                                  style={{ width: `${pctRenf}%` }}
                                ></div>
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
                  <Tent className="h-4 w-4 text-emerald-500" /> {t("prefDomainDashboard.details.camping.title", "Programme National de Camping & Formations") as string}
                </div>
                {openSection === "camping" ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </button>

              {openSection === "camping" &&
                (() => {
                  const camp = dashboardData.detailed?.camping || {};
                  const staffTot = camp.encadrement?.total_staff || 0;
                  const staffH = camp.encadrement?.hommes || 0;
                  const staffF = camp.encadrement?.femmes || 0;
                  const pctStaffH = staffTot ? Math.round((staffH / staffTot) * 100) : 0;
                  const pctStaffF = staffTot ? Math.round((staffF / staffTot) * 100) : 0;

                  return (
                    <div className="p-5 bg-card border-t border-border/50 grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10">
                      <div className="space-y-6">
                        {/* Participants */}
                        <div className="space-y-3">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                            <Users2 className="h-4 w-4" /> {t("prefDomainDashboard.details.camping.participants", "Bénéficiaires & Participants") as string}
                          </h4>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="col-span-2 p-4 bg-emerald-500/10 rounded-xl border border-emerald-500/20 flex items-center justify-between">
                              <div>
                                <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400 block">
                                  {t("prefDomainDashboard.details.camping.totalBeneficiaries", "Total Bénéficiaires") as string}
                                </span>
                                <span className="text-[10px] text-emerald-600/80">
                                  {t("prefDomainDashboard.details.camping.summerCamps", "Colonies de vacances") as string}
                                </span>
                              </div>
                              <span className="text-3xl font-black text-emerald-600" dir="ltr">
                                {fmt(camp.participants?.total || 0, lang)}
                              </span>
                            </div>
                            <div className="p-3 bg-muted/20 rounded-xl border border-border/50">
                              <span className="text-[11px] font-medium text-muted-foreground block mb-1">
                                {t("prefDomainDashboard.details.camping.mreChildren", "Enfants MRE") as string}
                              </span>
                              <span className="text-xl font-bold text-foreground" dir="ltr">
                                {camp.participants?.enfants_mre || 0}
                              </span>
                            </div>
                            <div className="p-3 bg-muted/20 rounded-xl border border-border/50">
                              <span className="text-[11px] font-medium text-muted-foreground block mb-1">
                                {t("prefDomainDashboard.details.camping.specialNeeds", "Besoins Spécifiques") as string}
                              </span>
                              <span className="text-xl font-bold text-foreground" dir="ltr">
                                {camp.participants?.besoins_specifiques || 0}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Encadrement */}
                        <div className="space-y-3">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                            <Shield className="h-4 w-4" /> {t("prefDomainDashboard.details.camping.staffingDevice", "Dispositif d'Encadrement") as string}
                          </h4>
                          <div className="flex gap-3">
                            <div className="flex-1 p-3 bg-blue-500/5 rounded-xl border border-blue-500/10 flex flex-col justify-center items-center">
                              <span className="text-2xl font-black text-blue-600" dir="ltr">
                                {camp.encadrement?.ratio || "0:0"}
                              </span>
                              <span className="text-[10px] text-blue-600/80 font-medium text-center">
                                {t("prefDomainDashboard.details.camping.staffingRatio", "Ratio d'encadrement") as string}
                              </span>

                              <span className="text-[8px] text-muted-foreground mt-1.5 leading-tight text-center">
                                {camp.encadrement?.ratio !== "0:0"
                                  ? (t("prefDomainDashboard.details.camping.ratioDesc", { count: camp.encadrement?.ratio.split(":")[1], defaultValue: `(1 encadrant pour ${camp.encadrement?.ratio.split(":")[1]} bénéficiaires)` }) as string)
                                  : (t("prefDomainDashboard.details.camping.noData", "(Aucune donnée saisie)") as string)}
                              </span>
                            </div>
                            <div className="flex-[2] p-3 bg-muted/20 rounded-xl border border-border/50 flex flex-col justify-between">
                              <div className="flex justify-between items-center mb-2">
                                <span className="text-xs font-medium text-muted-foreground">
                                  {t("prefDomainDashboard.details.camping.mobilizedStaff", "Staff Mobilisé") as string}
                                </span>
                                <span className="text-sm font-bold text-foreground" dir="ltr">
                                  {staffTot}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <div
                                  className="flex-1 h-2 rounded-full bg-blue-500"
                                  style={{ width: `${pctStaffH}%` }}
                                  title={t("prefDomainDashboard.details.camping.menCount", { count: staffH, defaultValue: `${staffH} Hommes` }) as string}
                                ></div>
                                <div
                                  className="flex-1 h-2 rounded-full bg-pink-500"
                                  style={{ width: `${pctStaffF}%` }}
                                  title={t("prefDomainDashboard.details.camping.womenCount", { count: staffF, defaultValue: `${staffF} Femmes` }) as string}
                                ></div>
                              </div>
                              <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                                <span>{t("prefDomainDashboard.details.camping.menCount", { count: staffH, defaultValue: `${staffH} Hommes` }) as string}</span>
                                <span>{t("prefDomainDashboard.details.camping.womenCount", { count: staffF, defaultValue: `${staffF} Femmes` }) as string}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-6">

                        {/* Formations */}
                        <div className="space-y-3">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                            <GraduationCap className="h-4 w-4" /> {t("prefDomainDashboard.details.camping.trainings", "Formations (Encadrement)") as string}
                          </h4>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="p-4 bg-amber-500/5 rounded-xl border border-amber-500/10 flex flex-col justify-center">
                              <span className="text-2xl font-bold text-amber-600" dir="ltr">
                                {camp.formations?.total_sessions || 0}
                              </span>
                              <span className="text-[11px] font-medium text-amber-600/80 mt-1">
                                {t("prefDomainDashboard.details.camping.organizedSessions", "Sessions Organisées") as string}
                              </span>
                            </div>
                            <div className="p-4 bg-amber-500/5 rounded-xl border border-amber-500/10 flex flex-col justify-center">
                              <span className="text-2xl font-bold text-amber-600" dir="ltr">
                                {camp.formations?.beneficiaires || 0}
                              </span>
                              <span className="text-[11px] font-medium text-amber-600/80 mt-1">
                                {t("prefDomainDashboard.details.camping.trainedCadres", "Cadres Formés") as string}
                              </span>
                            </div>
                          </div>
                        </div>

                          {/* MOUVEMENTS DE LA PÉRIODE */}
                        <div className="space-y-4">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                            <ArrowRightLeft className="h-4 w-4" /> {t("prefDomainDashboard.details.camping.movements", "Mouvements de la période")}
                          </h4>
                          
                          {(() => {
                            const assocEntrants = dashboardData.detailed?.associations?.entrants || 0;
                            const assocSortants = dashboardData.detailed?.associations?.sortants || 0;
                            const benEntrants = dashboardData.detailed?.associations?.benef_entrants || 0;
                            const benSortants = dashboardData.detailed?.associations?.benef_sortants || 0;

                            return (
                              <div className="grid grid-cols-2 gap-3">
                                
                                {/* Card 1: Associations Entrantes */}
                                <div className="p-3 bg-emerald-500/5 rounded-xl border border-emerald-500/10 flex flex-col justify-center">
                                  <span className="text-emerald-600 font-semibold text-[11px] flex items-center gap-1.5 mb-1">
                                    <TrendingUp className="h-3.5 w-3.5" /> {t("prefDomainDashboard.details.camping.assocEntrants", "Associations Entrantes")}
                                  </span>
                                  <span className="text-2xl font-bold text-foreground" dir="ltr">{assocEntrants}</span>
                                </div>

                                {/* Card 2: Bénéficiaires Entrants */}
                                <div className="p-3 bg-emerald-500/5 rounded-xl border border-emerald-500/10 flex flex-col justify-center">
                                  <span className="text-emerald-600 font-semibold text-[11px] flex items-center gap-1.5 mb-1">
                                    <UserPlus className="h-3.5 w-3.5" /> {t("prefDomainDashboard.details.camping.benEntrants", "Bénéficiaires Entrants")}
                                  </span>
                                  <span className="text-2xl font-bold text-foreground" dir="ltr">{benEntrants}</span>
                                </div>

                                {/* Card 3: Associations Sortantes */}
                                <div className="p-3 bg-orange-500/5 rounded-xl border border-orange-500/10 flex flex-col justify-center">
                                  <span className="text-orange-600 font-semibold text-[11px] flex items-center gap-1.5 mb-1">
                                    <TrendingDown className="h-3.5 w-3.5" /> {t("prefDomainDashboard.details.camping.assocSortants", "Associations Sortantes")}
                                  </span>
                                  <span className="text-2xl font-bold text-foreground" dir="ltr">{assocSortants}</span>
                                </div>

                                {/* Card 4: Bénéficiaires Sortants */}
                                <div className="p-3 bg-orange-500/5 rounded-xl border border-orange-500/10 flex flex-col justify-center">
                                  <span className="text-orange-600 font-semibold text-[11px] flex items-center gap-1.5 mb-1">
                                    <UserMinus className="h-3.5 w-3.5" /> {t("prefDomainDashboard.details.camping.benSortants", "Bénéficiaires Sortants")}
                                  </span>
                                  <span className="text-2xl font-bold text-foreground" dir="ltr">{benSortants}</span>
                                </div>

                              </div>
                            );
                          })()}
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
                  <Handshake className="h-4 w-4 text-emerald-500" /> {t("prefDomainDashboard.details.conventions.title", "Conventions et Partenariats") as string}
                </div>
                {openSection === "conventions" ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </button>

              {openSection === "conventions" &&
                (() => {
                  const conv = dashboardData.detailed?.conventions || {};
                  const repArray = conv.repartition || [];
                  const totalConv = conv.total_conventions || 1; // || 1 pour éviter div par 0
                  
                  // هاد السطر كيجيب كاع الأنواع من ملف JSON دقة وحدة
                  const translatedTypes = t("prefDomainDashboard.details.conventions.types", { returnObjects: true }) as Record<string, string>;

                  return (
                    <div className="p-5 bg-card border-t border-border/50 grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10">
                      <div className="space-y-4">
                        <h4 className="h-7 text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                          <FileText className="h-4 w-4" /> {t("prefDomainDashboard.details.conventions.summary", "Bilan des Conventions") as string}
                        </h4>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="col-span-2 p-4 bg-emerald-500/10 rounded-xl border border-emerald-500/20 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-emerald-500/20 rounded-lg">
                                <Handshake className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                              </div>
                              <span className="font-bold text-emerald-700 dark:text-emerald-400 text-sm">
                                {t("prefDomainDashboard.details.conventions.totalConventions", "Total Conventions") as string}
                              </span>
                            </div>
                            <span className="text-3xl font-black text-emerald-600 dark:text-emerald-400" dir="ltr">
                              {conv.total_conventions || 0}
                            </span>
                          </div>

                          <div className="col-span-2 p-4 bg-muted/20 rounded-xl border border-border/50 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Building2 className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm font-semibold text-foreground">
                                {t("prefDomainDashboard.details.conventions.partnerTypes", "Types de Partenaires Engagés") as string}
                              </span>
                            </div>
                            <span className="text-xl font-bold text-foreground" dir="ltr">
                              {conv.total_partenaires || 0}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h4 className="h-7 text-xs font-bold uppercase tracking-wider text-muted-foreground flex justify-between items-center">
                          <span className="flex items-center gap-1.5">
                            <Building2 className="h-4 w-4" /> {t("prefDomainDashboard.details.conventions.distributionByType", "Répartition par Type") as string}
                          </span>
                        </h4>

                        <div className="p-4 bg-muted/30 rounded-xl border border-border/50 space-y-4">
                          {repArray.length === 0 ? (
                            <span className="text-sm text-muted-foreground">
                              {t("prefDomainDashboard.details.conventions.noData", "Aucune donnée disponible") as string}
                            </span>
                          ) : (
                            repArray.map((item: any, index: number) => {
                              const percentage = Math.round((item.count / totalConv) * 100);
                              return (
                                <div key={index} className="space-y-1.5">
                                  <div className="flex justify-between items-center text-xs">
                                    {/* هنا كنطبعو الترجمة، وإلا مالقاهاش كيطبع الكلمة الأصلية لي جات من DB */}
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
                  <Landmark className="h-4 w-4 text-indigo-500" /> {t("prefDomainDashboard.details.insertion.title", "Intégration Socio-Économique") as string}
                </div>
                {openSection === "insertion" ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </button>

              {openSection === "insertion" &&
                (() => {
                  const ins = dashboardData.detailed?.insertion || {};
                  const h = ins.genre?.hommes || 0;
                  const f = ins.genre?.femmes || 0;
                  const totGF = h + f;
                  const pctH = totGF ? Math.round((h / totGF) * 100) : 0;
                  const pctF = totGF ? Math.round((f / totGF) * 100) : 0;

                  const urb = ins.milieu?.urbain || 0;
                  const rur = ins.milieu?.rural || 0;
                  const totUR = urb + rur;
                  const pctUrb = totUR ? Math.round((urb / totUR) * 100) : 0;
                  const pctRur = totUR ? Math.round((rur / totUR) * 100) : 0;

                  return (
                    <div className="p-5 bg-card border-t border-border/50 grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10">
                      <div className="space-y-4">
                        <h4 className="h-7 text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                          <Target className="h-4 w-4" /> {t("prefDomainDashboard.details.insertion.summary", "Bilan des Activités") as string}
                        </h4>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="col-span-2 p-4 bg-indigo-500/10 rounded-xl border border-indigo-500/20 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-indigo-500/20 rounded-lg">
                                <Landmark className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                              </div>
                              <span className="font-bold text-indigo-700 dark:text-indigo-400 text-sm">
                                {t("prefDomainDashboard.details.insertion.activitiesDone", "Activités Réalisées") as string}
                              </span>
                            </div>
                            <span className="text-3xl font-black text-indigo-600 dark:text-indigo-400" dir="ltr">
                              {ins.total_activites || 0}
                            </span>
                          </div>
                          <div className="p-3 bg-muted/20 rounded-xl border border-border/50 flex flex-col justify-center">
                            <span className="text-muted-foreground font-semibold text-xs flex items-center gap-1.5 mb-1">
                              <Handshake className="h-3.5 w-3.5 text-orange-500" /> {t("prefDomainDashboard.details.insertion.activePartners", "Partenaires Actifs") as string}
                            </span>
                            <span className="text-2xl font-bold text-foreground" dir="ltr">
                              {ins.partenaires_actifs || 0}
                            </span>
                          </div>
                          <div className="p-3 bg-muted/20 rounded-xl border border-border/50 flex flex-col justify-center">
                            <span className="text-muted-foreground font-semibold text-xs flex items-center gap-1.5 mb-1">
                              <Clock className="h-3.5 w-3.5 text-blue-500" /> {t("prefDomainDashboard.details.insertion.globalVolume", "Volume Global") as string}
                            </span>
                            <span className="text-2xl font-bold text-foreground" dir={lang === "ar" ? "rtl" : "ltr"}>
  {(() => {
    const volume = ins.volume_horaire || "0";
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
                        <h4 className="h-7 text-xs font-bold uppercase tracking-wider text-muted-foreground flex justify-between items-center">
                          <span className="flex items-center gap-1.5">
                            <Users className="h-4 w-4" /> {t("prefDomainDashboard.details.insertion.beneficiaries", "Bénéficiaires") as string}
                          </span>
                          <span className="text-[10px] bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded font-bold border border-indigo-500/20" dir="ltr">
                            {t("prefDomainDashboard.details.insertion.total", "Total") as string}: {totGF}
                          </span>
                        </h4>

                        <div className="p-4 bg-muted/30 rounded-xl border border-border/50 space-y-5">
                          <div className="space-y-2">
                            <div className="flex justify-between items-center text-xs mb-1">
                              <span className="text-foreground font-bold">
                                {t("prefDomainDashboard.details.insertion.genderDistribution", "Répartition par Genre") as string}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 h-3">
                              <div
                                className="h-full rounded-full bg-blue-500"
                                style={{ width: `${pctH}%` }}
                                title={`${t("prefDomainDashboard.details.insertion.men", "Hommes")}: ${h}`}
                              ></div>
                              <div
                                className="h-full rounded-full bg-pink-500"
                                style={{ width: `${pctF}%` }}
                                title={`${t("prefDomainDashboard.details.insertion.women", "Femmes")}: ${f}`}
                              ></div>
                            </div>
                            <div className="flex justify-between text-[10px] text-muted-foreground font-medium">
                              <span className="flex items-center gap-1">
                                <div className="w-2 h-2 rounded-full bg-blue-500"></div> {t("prefDomainDashboard.details.insertion.men", "Hommes") as string}: <span dir="ltr">{h}</span>
                              </span>
                              <span className="flex items-center gap-1">
                                {t("prefDomainDashboard.details.insertion.women", "Femmes") as string}: <span dir="ltr">{f}</span> <div className="w-2 h-2 rounded-full bg-pink-500"></div>
                              </span>
                            </div>
                          </div>

                          <div className="border-t border-border/50 my-2"></div>

                          <div className="space-y-2">
                            <div className="flex justify-between items-center text-xs mb-1">
                              <span className="text-foreground font-bold">
                                {t("prefDomainDashboard.details.insertion.spatialDistribution", "Répartition Spatiale") as string}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 h-3">
                              <div
                                className="h-full rounded-full bg-slate-500"
                                style={{ width: `${pctUrb}%` }}
                                title={`${t("prefDomainDashboard.details.insertion.urban", "Urbain")}: ${urb}`}
                              ></div>
                              <div
                                className="h-full rounded-full bg-emerald-500"
                                style={{ width: `${pctRur}%` }}
                                title={`${t("prefDomainDashboard.details.insertion.rural", "Rural")}: ${rur}`}
                              ></div>
                            </div>
                            <div className="flex justify-between text-[10px] text-muted-foreground font-medium">
                              <span className="flex items-center gap-1">
                                <Building className="h-3 w-3 text-slate-500" /> {t("prefDomainDashboard.details.insertion.urban", "Urbain") as string}: <span dir="ltr">{urb}</span>
                              </span>
                              <span className="flex items-center gap-1">
                                {t("prefDomainDashboard.details.insertion.rural", "Rural") as string}: <span dir="ltr">{rur}</span> <TreePine className="h-3 w-3 text-emerald-500" />
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
                  <Trophy className="h-4 w-4 text-purple-500" /> {t("prefDomainDashboard.details.festivals.title", "Festivals de Jeunesse") as string}
                </div>
                {openSection === "festivals" ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </button>

              {openSection === "festivals" &&
                (() => {
                  const fest = dashboardData.detailed?.festivals || {};
                  const h = fest.genre?.hommes || 0;
                  const f = fest.genre?.femmes || 0;
                  const totGF = h + f;
                  const pctH = totGF ? Math.round((h / totGF) * 100) : 0;
                  const pctF = totGF ? Math.round((f / totGF) * 100) : 0;

                  const urb = fest.milieu?.urbain || 0;
                  const rur = fest.milieu?.rural || 0;
                  const totUR = urb + rur;
                  const pctUrb = totUR ? Math.round((urb / totUR) * 100) : 0;
                  const pctRur = totUR ? Math.round((rur / totUR) * 100) : 0;

                  return (
                    <div className="p-5 bg-card border-t border-border/50 grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10">
                      <div className="space-y-4">
                        <h4 className="h-7 text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                          <Activity className="h-4 w-4" /> {t("prefDomainDashboard.details.festivals.summary", "Événements & Éliminatoires") as string}
                        </h4>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="col-span-2 p-4 bg-purple-500/10 rounded-xl border border-purple-500/20 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-purple-500/20 rounded-lg">
                                <Trophy className="h-5 w-5 text-purple-600" />
                              </div>
                              <span className="font-bold text-purple-700 dark:text-purple-400 text-sm">
                                {t("prefDomainDashboard.details.festivals.organized", "Festivals Organisés") as string}
                              </span>
                            </div>
                            <span className="text-3xl font-black text-purple-600" dir="ltr">
                              {fest.total_evenements || 0}
                            </span>
                          </div>
                          <div className="p-3 bg-muted/20 rounded-xl border border-border/50 flex flex-col justify-center">
                            <span className="text-muted-foreground font-semibold text-xs flex items-center gap-1.5 mb-1">
                              <MapPin className="h-3.5 w-3.5 text-blue-500" /> {t("prefDomainDashboard.details.festivals.provinces", "Provinces (Couverture)") as string}
                            </span>
                            <span className="text-2xl font-bold text-foreground" dir="ltr">
                              {fest.total_provinces || 0}
                            </span>
                          </div>
                          <div className="p-3 bg-amber-500/5 rounded-xl border border-amber-500/20 flex flex-col justify-center">
                            <span className="text-amber-600 font-semibold text-xs flex items-center gap-1.5 mb-1">
                              <Medal className="h-3.5 w-3.5" /> {t("prefDomainDashboard.details.festivals.qualified", "Qualifiés (Finales)") as string}
                            </span>
                            <span className="text-2xl font-bold text-foreground" dir="ltr">
                              {fest.qualifies || 0}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex justify-between items-end">
                          <span className="flex items-center gap-1.5">
                            <Users className="h-4 w-4" /> {t("prefDomainDashboard.details.festivals.demographics", "Démographie des Participants") as string}
                          </span>
                          <span className="text-[10px] bg-purple-500/10 text-purple-600 px-2 py-0.5 rounded font-bold border border-purple-500/20" dir="ltr">
                            {t("prefDomainDashboard.details.festivals.total", "Total") as string}: {totGF}
                          </span>
                        </h4>

                        <div className="p-4 bg-muted/30 rounded-xl border border-border/50 space-y-5">
                          <div className="space-y-2">
                            <div className="flex justify-between items-center text-xs mb-1">
                              <span className="text-foreground font-bold">
                                {t("prefDomainDashboard.details.festivals.genderDistribution", "Répartition par Genre") as string}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 h-3">
                              <div
                                className="h-full rounded-full bg-blue-500"
                                style={{ width: `${pctH}%` }}
                                title={`${t("prefDomainDashboard.details.festivals.men", "Hommes")}: ${h}`}
                              ></div>
                              <div
                                className="h-full rounded-full bg-pink-500"
                                style={{ width: `${pctF}%` }}
                                title={`${t("prefDomainDashboard.details.festivals.women", "Femmes")}: ${f}`}
                              ></div>
                            </div>
                            <div className="flex justify-between text-[10px] text-muted-foreground font-medium">
                              <span className="flex items-center gap-1">
                                <div className="w-2 h-2 rounded-full bg-blue-500"></div> {t("prefDomainDashboard.details.festivals.men", "Hommes") as string}: <span dir="ltr">{h}</span>
                              </span>
                              <span className="flex items-center gap-1">
                                {t("prefDomainDashboard.details.festivals.women", "Femmes") as string}: <span dir="ltr">{f}</span> <div className="w-2 h-2 rounded-full bg-pink-500"></div>
                              </span>
                            </div>
                          </div>

                          <div className="border-t border-border/50 my-2"></div>

                          <div className="space-y-2">
                            <div className="flex justify-between items-center text-xs mb-1">
                              <span className="text-foreground font-bold">
                                {t("prefDomainDashboard.details.festivals.spatialDistribution", "Répartition Spatiale") as string}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 h-3">
                              <div
                                className="h-full rounded-full bg-slate-500"
                                style={{ width: `${pctUrb}%` }}
                                title={`${t("prefDomainDashboard.details.festivals.urban", "Urbain")}: ${urb}`}
                              ></div>
                              <div
                                className="h-full rounded-full bg-emerald-500"
                                style={{ width: `${pctRur}%` }}
                                title={`${t("prefDomainDashboard.details.festivals.rural", "Rural")}: ${rur}`}
                              ></div>
                            </div>
                            <div className="flex justify-between text-[10px] text-muted-foreground font-medium">
                              <span className="flex items-center gap-1">
                                <Building className="h-3 w-3 text-slate-500" /> {t("prefDomainDashboard.details.festivals.urban", "Urbain") as string}: <span dir="ltr">{urb}</span>
                              </span>
                              <span className="flex items-center gap-1">
                                {t("prefDomainDashboard.details.festivals.rural", "Rural") as string}: <span dir="ltr">{rur}</span> <TreePine className="h-3 w-3 text-emerald-500" />
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}
            </Card>

            {/* ACCORDION ITEM 6: ÉTABLISSEMENTS & PARTENARIATS */}
            <Card className="overflow-hidden border-border/70 shadow-none">
              <button
                onClick={() => toggleSection("etablissements")}
                className="w-full flex items-center justify-between p-4 bg-muted/20 hover:bg-muted/40 transition-colors"
              >
                <div className="flex items-center gap-2 font-bold text-sm text-foreground">
                  <Building2 className="h-4 w-4 text-blue-500" /> {t("prefDomainDashboard.details.etablissements.title", "Établissements & Infrastructures") as string}
                </div>
                {openSection === "etablissements" ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </button>

                {openSection === "etablissements" &&
                (() => {
                  const etab = dashboardData.detailed?.etablissements || {};
                  const causesArray = etab.fermees?.causes || [];
                  const totFermes = etab.fermees?.total || 0;
                  
                  const vraiOperationnels = dashboardData.kpis?.activeEstablishments || 0;
                  const vraiTotalParc = vraiOperationnels + totFermes + (etab.en_cours_realisation || 0);
                  const divFermes = totFermes > 0 ? totFermes : 1; 

                  // جلب ترجمات الأسباب دقة وحدة من الـ JSON
                  const translatedCauses = t("prefDomainDashboard.details.etablissements.causes", { returnObjects: true }) as Record<string, string>;

                  return (
                    <div className="p-5 bg-card border-t border-border/50 grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-10">
                      <div className="space-y-4">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex justify-between items-end">
                          <span>{t("prefDomainDashboard.details.etablissements.parcStatus", "Statut du Parc Actuel") as string}</span>
                          <span className="text-[10px] bg-blue-500/10 text-blue-600 px-2 py-0.5 rounded font-bold border border-blue-500/20" dir="ltr">
                            {t("prefDomainDashboard.details.etablissements.total", "Total") as string}: {vraiTotalParc}
                          </span>
                        </h4>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="col-span-2 p-4 bg-emerald-500/10 rounded-xl border border-emerald-500/20 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-emerald-500/20 rounded-lg">
                                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                              </div>
                              <span className="font-bold text-emerald-700 dark:text-emerald-400 text-sm">
                                {t("prefDomainDashboard.details.etablissements.operational", "Opérationnels / Actifs") as string}
                              </span>
                            </div>
                            <span className="text-3xl font-black text-emerald-600" dir="ltr">
                              {vraiOperationnels}
                            </span>
                          </div>

                          <div className="p-3 bg-blue-500/5 rounded-xl border border-blue-500/10 flex flex-col justify-center">
                            <span className="text-blue-600 font-semibold text-xs flex items-center gap-1.5 mb-1">
                              <Sparkles className="h-3.5 w-3.5" /> {t("prefDomainDashboard.details.etablissements.newCreation", "Nouvelle création") as string}
                            </span>
                            <span className="text-2xl font-bold text-foreground" dir="ltr">
                              {etab.nouvellement_creees || 0}
                            </span>
                          </div>

                          <div className="p-3 bg-amber-500/5 rounded-xl border border-amber-500/10 flex flex-col justify-center">
                            <span className="text-amber-600 font-semibold text-xs flex items-center gap-1.5 mb-1">
                              <HardHat className="h-3.5 w-3.5" /> {t("prefDomainDashboard.details.etablissements.underRealization", "En réalisation") as string}
                            </span>
                            <span className="text-2xl font-bold text-foreground" dir="ltr">
                              {etab.en_cours_realisation || 0}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex justify-between items-end">
                          <span>{t("prefDomainDashboard.details.etablissements.fermeturesAnalysis", "Analyse des Fermetures") as string}</span>
                          <span className="text-[10px] bg-red-500/10 text-red-600 px-2 py-0.5 rounded font-bold border border-red-500/20" dir="ltr">
                            {t("prefDomainDashboard.details.etablissements.totalFermees", "Total Fermées") as string}: {etab.fermees?.total || 0}
                          </span>
                        </h4>

                        <div className="p-4 bg-muted/30 rounded-xl border border-border/50 space-y-4">
                          {causesArray.length === 0 ? (
                            <span className="text-sm text-muted-foreground">
                              {t("prefDomainDashboard.details.etablissements.noFermeture", "Aucune fermeture signalée") as string}
                            </span>
                          ) : (
                            causesArray.map((item: any, index: number) => {
                              const percentage = Math.round((item.count / divFermes) * 100);

                              return (
                                <div key={index} className="space-y-1.5">
                                  <div className="flex justify-between items-center text-xs">
                                    <span className="text-foreground font-medium flex items-center gap-1.5">
                                      {/* ترجمة ديناميكية مأخوذة من قاعدة البيانات مباشرة */}
                                      {(translatedCauses && translatedCauses[item.cause]) ? translatedCauses[item.cause] : item.cause}
                                    </span>
                                    <span className="font-bold text-foreground" dir="ltr">{item.count}</span>
                                  </div>
                                  <div className="h-1.5 w-full bg-muted-foreground/20 rounded-full overflow-hidden">
                                    <div
                                      className="h-full bg-amber-500 rounded-full"
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

export default PrefDomainDashboard;