import { useEffect, useMemo, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/AppLayout";
import { PrefDomainDashboardSection6 } from "@/components/dashboard/PrefDomainDashboardSection6";
import { PrefDomainDashboardSection2 } from "@/components/dashboard/PrefDomainDashboardSection2";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCategoriesAssociations } from "@/hooks/Jeunesse/useCategoriesAssociations";
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
  Landmark,
  MapPin,
  Medal,
  Building,
  TreePine,
  Briefcase,
  Music,
  Building2,
  FileText,
  Wrench,
  Package,
  Scale
} from "lucide-react";
import { useAuth } from "@/hooks/common/useAuth";
import { type Domain } from "@/lib/domainData";
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


  const [domain, setDomain] = useState<Domain>("JEUNESSE");
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [openSection, setOpenSection] = useState<string | null>("activites");

  const [dashboardData, setDashboardData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [dbDomains, setDbDomains] = useState<any[]>([]); 
  const [loadingDomains, setLoadingDomains] = useState(true);

  const selectedDomainId = useMemo(
    () => dbDomains.find((opt) => opt.code === domain)?.id,
    [dbDomains, domain]
  );

  useEffect(() => {
    const fetchDomains = async () => {
      const { data, error } = await supabase
        .from('domaines')
        .select('*');

      if (data && !error) {
        setDbDomains(data);
      }
      setLoadingDomains(false);
    };

    void fetchDomains();
  }, []);

  const loadDashboardData = useCallback(async () => {
    if (!profile?.direction_id) return;

    setIsLoading(true);
    try {
      // 1. Chercher si au moins un rapport existe pour cette année et cette direction
      const { data: rapport } = await supabase
        .from("rapports")
        .select("id, statut_rapport, commentaire_validation")
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
            correctionComment: null,
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
          .eq("domaine_id", selectedDomainId)
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
          correctionComment: rapport.commentaire_validation ?? null,
          reportStatus: rapport.statut_rapport,
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
  }, [profile?.direction_id, year, selectedDomainId]);

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

  const activeDomainLabel = useMemo(() => {
    const option = dbDomains.find((opt) => opt.code === domain);
    return option ? (lang === "ar" ? option.nom_ar : option.nom_fr) : domain;
  }, [domain, lang, dbDomains]);

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
      {dashboardData.status.reportStatus === "RETOUR_CORRECTION" && (
        <Card className="mb-5 border-orange-500 bg-orange-50">
          <CardContent className="p-4">
            <h3 className="font-bold text-orange-700">
              ⚠ Retour de correction
            </h3>

            <p className="mt-2 text-sm">
              L'équipe régionale demande des modifications.
            </p>

            {dashboardData.status.correctionComment && (
              <div className="mt-3 rounded border bg-white p-3">
                {dashboardData.status.correctionComment}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {dashboardData.status.reportStatus === "VALIDE" && (
        <Card className="mb-5 border-green-500 bg-green-50">
          <CardContent className="p-4">
            <h3 className="font-bold text-green-700 flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5" /> Rapport validé
            </h3>

            <p className="mt-2 text-sm">
              Votre rapport a été validé par l'équipe régionale.
            </p>
          </CardContent>
        </Card>
      )}

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
                  {dbDomains.map((dom) => (
                    <SelectItem key={dom.code} value={dom.code}>
                      {lang === "ar" ? dom.nom_ar : dom.nom_fr}
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
<PrefDomainDashboardSection2 kpis={dashboardData.kpis} lang={lang} t={t} fmt={fmt} />

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
                <PrefDomainDashboardSection6 dashboardData={dashboardData} lang={lang} t={t} openSection={openSection} toggleSection={toggleSection} />
      </div>
    </AppLayout>
  );
};

export default PrefDomainDashboard;