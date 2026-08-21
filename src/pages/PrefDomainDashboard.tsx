import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/AppLayout";
import { PrefDomainDashboardSection6 } from "@/components/dashboard/PrefDomainDashboardSection6";
import { PrefDomainDashboardSection2 } from "@/components/dashboard/PrefDomainDashboardSection2";
import { buildJeunesseKpiItems } from "@/components/dashboard/section2/JeunesseKpiConfig";
import { buildJeunesseSection6Blocks } from "@/components/dashboard/section6/JeunesseSection6Blocks";
import { PrefDomainDashboardSection1, PrefDomainDashboardSection1Alerts } from "@/components/dashboard/PrefDomainDashboardSection1";
import { PrefDomainDashboardSection5 } from "@/components/dashboard/PrefDomainDashboardSection5";
import { PrefDomainDashboardSection3Infrastructure } from "@/components/dashboard/PrefDomainDashboardSection3Infrastructure";
import { PrefDomainDashboardSection4Infrastructure } from "@/components/dashboard/PrefDomainDashboardSection4Infrastructure";
import { buildInfrastructureKpiItems } from "@/components/dashboard/section2/InfrastructureKpiConfig";
import { buildInfrastructureSection6Blocks } from "@/components/dashboard/section6/InfrastructureSection6Blocks";
import { PrefDomainDashboardSection3AffairesFeminines } from "@/components/dashboard/PrefDomainDashboardSection3AffairesFeminines";
import { PrefDomainDashboardSection4AffairesFeminines } from "@/components/dashboard/PrefDomainDashboardSection4AffairesFeminines";
import { buildAffairesFemininesKpiItems } from "@/components/dashboard/section2/AffairesFemininesKpiConfig";
import { buildAffairesFemininesSection6Blocks } from "@/components/dashboard/section6/AffairesFemininesSection6Blocks";
import { buildProtectionEnfanceSection6Blocks } from "@/components/dashboard/section6/ProtectionEnfanceSection6Blocks";
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
import { loadDashboard } from "@/services/PrefDomainDashboardDataService";
import { loadInfrastructureDashboard } from "@/services/PrefDomainDashboardInfrastructureDataService";
import { loadAffairesFemininesDashboard } from "@/services/PrefDomainDashboardAffairesFemininesDataService";
import { loadProtectionEnfanceDashboard } from "@/services/PrefDomainDashboardProtectionEnfanceDataService";
import { loadEnfanceCrechesDashboard } from "@/services/PrefDomainDashboardEnfanceCrechesDataService";
import { buildProtectionEnfanceKpiItems } from "@/components/dashboard/section2/ProtectionEnfanceKpiConfig";
import { buildEnfanceCrechesKpiItems } from "@/components/dashboard/section2/EnfanceCrechesKpiConfig";
import { PrefDomainDashboardSection3ProtectionEnfance } from "@/components/dashboard/PrefDomainDashboardSection3ProtectionEnfance";
import { PrefDomainDashboardSection4ProtectionEnfance } from "@/components/dashboard/PrefDomainDashboardSection4ProtectionEnfance";
import { PrefDomainDashboardSection3EnfanceCreches } from "@/components/dashboard/PrefDomainDashboardSection3EnfanceCreches";
import { PrefDomainDashboardSection4EnfanceCreches } from "@/components/dashboard/PrefDomainDashboardSection4EnfanceCreches";
import { buildEnfanceCrechesSection6Blocks } from "@/components/dashboard/section6/EnfanceCrechesSection6Blocks";

// ⚠️ Codes des domaines spécialisés déjà implémentés dans le dashboard.
const PROTECTION_ENFANCE_DOMAIN_CODE = "PE";
const ENFANCE_CRECHES_DOMAIN_CODE = "CRECHES";
const fmt = (n: number, lang: string) =>
  new Intl.NumberFormat(lang === "ar" ? "ar-MA" : "fr-FR").format(Math.round(n));

type WorkflowStatus = "NON_COMMENCE" | "EN_COURS" | "TERMINE";

const WORKFLOW_STATUS: Record<WorkflowStatus, { label: string; badge: string; icon: any }> = {
  NON_COMMENCE: { label: "NON COMMENCÉ", badge: "bg-warning/15 text-warning", icon: AlertCircle },
  EN_COURS: { label: "EN COURS", badge: "bg-info/15 text-info", icon: Clock },
  TERMINE: { label: "TERMINÉ", badge: "bg-success/15 text-success", icon: CheckCircle2 },
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

  // Ref pour tracker le domaine courant et prévenir les race conditions
  // Si la réponse arrive après un changement de domaine, on l'ignore
  const domainRef = useRef(domain);
  useEffect(() => {
    domainRef.current = domain;
  }, [domain]);

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
    console.log("🔴 ENTER loadDashboardData");
    if (!profile?.direction_id){
      console.log("❌ NO direction_id");
      return;
    }
    // Snapshot du domaine au lancement de CETTE requête
    const requestDomain = domain;
    console.log("🔴 requestDomain =", JSON.stringify(requestDomain));
  console.log("🔴 current domain =", JSON.stringify(domainRef.current));

    setIsLoading(true);
    try {
      console.log("🔴 BEFORE SWITCH");
      // Sélection du service de chargement selon le domaine sélectionné.
      // Le switch centralise ce choix et facilite l'ajout de futurs domaines.
      let data;
switch (requestDomain) {
        case "INFRA":
          console.log("🏗️ ENTERED INFRA CASE");
          data = await loadInfrastructureDashboard(profile.direction_id, year, selectedDomainId);
          break;
case "FEMME":
          console.log("👩 ENTERED FEMME CASE");
          data = await loadAffairesFemininesDashboard(profile.direction_id, year, selectedDomainId, lang);
          break;
        case PROTECTION_ENFANCE_DOMAIN_CODE:
          console.log("🧒 ENTERED PROTECTION ENFANCE CASE");
          data = await loadProtectionEnfanceDashboard(profile.direction_id, year, selectedDomainId, lang);
          break;
        case ENFANCE_CRECHES_DOMAIN_CODE:
          console.log("🏡 ENTERED ENFANCE CRECHES CASE");
          data = await loadEnfanceCrechesDashboard(profile.direction_id, year, selectedDomainId, lang);
          break;
        case "JEUNESSE":
        default:
           console.log("👥 ENTERED JEUNESSE CASE");
          data = await loadDashboard(profile.direction_id, year, selectedDomainId);
          break;
      }

      // Garde anti-race condition : on ignore toute réponse arrivée après un changement de domaine
      if (requestDomain !== domainRef.current) {
        console.warn(`⚠️ Réponse obsolète ignorée : domaine demandé=${requestDomain}, domaine courant=${domainRef.current}`);
        return;
      }

      console.log("setDashboardData <-", domain, data.kpis);
      console.log("SERVICE CHOISI =", domain);
      setDashboardData(data);
      console.log("dashboard envoyé");
    } catch (error) {
      console.error("Erreur lors du chargement du dashboard:", error);
    } finally {
      // On ne désactive le loader que si c'est toujours la bonne requête
      if (requestDomain === domainRef.current) {
        setIsLoading(false);
      }
    }
  }, [profile?.direction_id, year, selectedDomainId, domain]);

  // 5. Appeler le chargement au démarrage (ou quand l'année change)
  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // 6. Écouteur REALTIME Supabase
  useEffect(() => {
    if (!profile?.direction_id) return;

    // On crée un canal pour écouter les modifications de base de données en direct.
    // Les tables écoutées dépendent du domaine sélectionné : le switch centralise
    // ce choix et facilite l'ajout de futurs domaines.
    const channel = supabase.channel("dashboard-realtime-changes");

    switch (domain) {
      case "INFRA":
        channel
          .on("postgres_changes", { event: "*", schema: "public", table: "infra_depenses" }, () => {
            loadDashboardData();
          })
          .on(
            "postgres_changes",
            { event: "*", schema: "public", table: "infra_eau_electricite" },
            () => {
              loadDashboardData();
            },
          )
          .on("postgres_changes", { event: "*", schema: "public", table: "infra_projets_btp" }, () => {
            loadDashboardData();
          })
          .on(
            "postgres_changes",
            { event: "*", schema: "public", table: "infra_projets_partenariat" },
            () => {
              loadDashboardData();
            },
          )
          .on(
            "postgres_changes",
            { event: "*", schema: "public", table: "infra_projets_en_souffrance" },
            () => {
loadDashboardData();
            },
          );
        break;

      case "FEMME":
        // --- Dashboard Affaires Féminines : 11 tables af_* + rapports (statut/progression) ---
        channel
          .on("postgres_changes", { event: "*", schema: "public", table: "af_inscriptions_clubs" }, () => {
            loadDashboardData();
          })
          .on("postgres_changes", { event: "*", schema: "public", table: "af_inscriptions_ofppt" }, () => {
            loadDashboardData();
          })
          .on(
            "postgres_changes",
            { event: "*", schema: "public", table: "af_activites_sensibilisation" },
            () => {
              loadDashboardData();
            },
          )
          .on("postgres_changes", { event: "*", schema: "public", table: "af_portes_ouvertes" }, () => {
            loadDashboardData();
          })
          .on("postgres_changes", { event: "*", schema: "public", table: "af_formation_cadres" }, () => {
            loadDashboardData();
          })
          .on("postgres_changes", { event: "*", schema: "public", table: "af_mise_a_jour_reseau" }, () => {
            loadDashboardData();
          })
          .on(
            "postgres_changes",
            { event: "*", schema: "public", table: "af_ressources_humaines" },
            () => {
              loadDashboardData();
            },
          )
          .on(
            "postgres_changes",
            { event: "*", schema: "public", table: "af_integration_laureates" },
            () => {
              loadDashboardData();
            },
          )
          .on(
            "postgres_changes",
            { event: "*", schema: "public", table: "af_activites_generatrices_revenus" },
            () => {
              loadDashboardData();
            },
          )
          .on("postgres_changes", { event: "*", schema: "public", table: "af_centres_ecoute" }, () => {
            loadDashboardData();
          })
          .on("postgres_changes", { event: "*", schema: "public", table: "af_suivi_partenariats" }, () => {
            loadDashboardData();
          })
          .on("postgres_changes", { event: "*", schema: "public", table: "rapports" }, () => {
            loadDashboardData();
          });
        break;

      case PROTECTION_ENFANCE_DOMAIN_CODE:
        // --- Dashboard Protection de l'Enfance : tables pe_* utilisées par les Sections 1 à 4 ---
        channel
          .on(
            "postgres_changes",
            { event: "*", schema: "public", table: "pe_statistiques_demographiques" },
            () => {
              loadDashboardData();
            },
          )
          .on("postgres_changes", { event: "*", schema: "public", table: "pe_education" }, () => {
            loadDashboardData();
          })
          .on(
            "postgres_changes",
            { event: "*", schema: "public", table: "pe_liberte_surveillee" },
            () => {
              loadDashboardData();
            },
          )
          .on(
            "postgres_changes",
            { event: "*", schema: "public", table: "pe_rapports_exceptionnels" },
            () => {
              loadDashboardData();
            },
          )
          .on("postgres_changes", { event: "*", schema: "public", table: "pe_activites" }, () => {
            loadDashboardData();
          })
          .on("postgres_changes", { event: "*", schema: "public", table: "rapports" }, () => {
            loadDashboardData();
          });
        break;

      case ENFANCE_CRECHES_DOMAIN_CODE:
        channel
          .on("postgres_changes", { event: "*", schema: "public", table: "cr_statistiques_enfants" }, () => {
            loadDashboardData();
          })
          .on("postgres_changes", { event: "*", schema: "public", table: "cr_demandes_licences" }, () => {
            loadDashboardData();
          })
          .on("postgres_changes", { event: "*", schema: "public", table: "cr_mouvements_fermetures" }, () => {
            loadDashboardData();
          })
          .on("postgres_changes", { event: "*", schema: "public", table: "rapports" }, () => {
            loadDashboardData();
          });
        break;

      case "JEUNESSE":
      default:
        // --- Dashboard Jeunesse : liste des tables STRICTEMENT inchangée ---
        channel
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
          });
        // Tu peux chainer d'autres tables ici (festivals, etc.) selon tes besoins
        break;
    }

    channel.subscribe();

    // Nettoyage à la fermeture de la page
    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.direction_id, loadDashboardData, domain]);

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

  const progressPct = dashboardData.status.progressPct || 0;

  const entrants = dashboardData?.detailed?.associations?.entrants || 0;
  const sortants = dashboardData?.detailed?.associations?.sortants || 0;
  const soldeNet = entrants - sortants;

  const toggleSection = (section: string) => {
    setOpenSection(openSection === section ? null : section);
  };

  // Changement de domaine : on doit forcer isLoading=true DANS LE MÊME
  // batch synchrone que setDomain. Sinon, React commit un premier rendu
  // avec domain déjà à jour (ex: "INFRA") mais isLoading et dashboardData
  // encore ceux de l'ancien domaine (ex: "JEUNESSE"), le temps que l'effet
  // qui déclenche loadDashboardData() s'exécute après ce rendu. Pendant
  // cette fenêtre, buildSection2Items() route bien vers
  // buildInfrastructureKpiItems(), mais avec dashboardData.kpis qui a
  // encore la forme Jeunesse -> kpis.budgetExecutionRate est undefined ->
  // crash sur .toFixed(). En mettant à jour isLoading et domain dans le
  // même gestionnaire d'événement, React (batching automatique) les
  // applique dans le même rendu, donc le garde `if (isLoading) return ...`
  // intercepte systématiquement cette fenêtre avant que buildSection2Items
  // ne soit jamais appelé avec des données d'un autre domaine.
  const handleDomainChange = (value: string) => {
    setIsLoading(true);
    setDomain(value as Domain);
  };

  // Sélection des KPIs de Section2 selon le domaine (switch pour préparer
  // facilement l'ajout de futurs domaines).
  const buildSection2Items = () => {
    switch (domain) {
      case "INFRA":
        console.log("🔎 INFRA BUILD INPUT =", {
          domain,
          dashboardData,
          kpis: dashboardData?.kpis,
          budgetExecutionRate: dashboardData?.kpis?.budgetExecutionRate,
          budgetEngagementRate: dashboardData?.kpis?.budgetEngagementRate,
        });
return buildInfrastructureKpiItems(dashboardData.kpis, t, lang);
      case "FEMME":
        return buildAffairesFemininesKpiItems(dashboardData.kpis, t, lang);
      case PROTECTION_ENFANCE_DOMAIN_CODE:
        return buildProtectionEnfanceKpiItems(dashboardData.kpis, t);
      case ENFANCE_CRECHES_DOMAIN_CODE:
        return buildEnfanceCrechesKpiItems(dashboardData.kpis, t);
      case "JEUNESSE":
      default:
        return buildJeunesseKpiItems(dashboardData.kpis, t);
    }
  };

  // Sélection des blocs de Section6 selon le domaine.
  const buildSection6Blocks = () => {
    switch (domain) {
case "INFRA":
        return buildInfrastructureSection6Blocks(dashboardData.detailed, lang, t);
      case "FEMME":
        return buildAffairesFemininesSection6Blocks(dashboardData.detailed, lang, t);
      case PROTECTION_ENFANCE_DOMAIN_CODE:
        return buildProtectionEnfanceSection6Blocks(dashboardData.detailed, lang, t);
      case ENFANCE_CRECHES_DOMAIN_CODE:
        return buildEnfanceCrechesSection6Blocks(dashboardData.detailed, lang, t);
      case "JEUNESSE":
      default:
        return buildJeunesseSection6Blocks(dashboardData, lang, t);
    }
  };

  // Sélection des graphiques de Section3 + Section4 selon le domaine.
  // Le rendu Jeunesse ci-dessous est repris à l'identique (inchangé),
  // simplement encapsulé dans le cas "JEUNESSE" du switch.
  const renderDomainCharts = () => {
    switch (domain) {
      case "INFRA":
        return (
          <>
            <PrefDomainDashboardSection3Infrastructure
              budget={dashboardData.section3.budget}
              etatProjets={dashboardData.section3.etatProjets}
              natureProjets={dashboardData.section3.natureProjets}
              lang={lang}
              t={t}
            />
            <PrefDomainDashboardSection4Infrastructure
              budget={dashboardData.evolution.budget}
              arrieres={dashboardData.evolution.arrieres}
              projets={dashboardData.evolution.projets}
              lang={lang}
              t={t}
            />
          </>
);

      case "FEMME":
        return (
          <>
<PrefDomainDashboardSection3AffairesFeminines
              formationParSecteur={dashboardData.section3.formationParSecteur}
              urbainRural={dashboardData.section3.urbainRural}
              lang={lang}
              t={t}
            />
            <PrefDomainDashboardSection4AffairesFeminines
              integration={dashboardData.evolution.integration}
              activiteSociale={dashboardData.evolution.activiteSociale}
              lang={lang}
              t={t}
            />
          </>
        );

      case PROTECTION_ENFANCE_DOMAIN_CODE:
        return (
          <>
            <PrefDomainDashboardSection3ProtectionEnfance
              priseEnCharge={dashboardData.section3.priseEnCharge}
              incidentsParType={dashboardData.section3.incidentsParType}
              beneficiairesParDomaine={dashboardData.section3.beneficiairesParDomaine}
              lang={lang}
              t={t}
            />
            <PrefDomainDashboardSection4ProtectionEnfance
              genre={dashboardData.evolution.genre}
              incidents={dashboardData.evolution.incidents}
              lang={lang}
              t={t}
            />
          </>
        );

      case ENFANCE_CRECHES_DOMAIN_CODE:
        return (
          <>
            <PrefDomainDashboardSection3EnfanceCreches data={dashboardData.section3} lang={lang} t={t} />
            <PrefDomainDashboardSection4EnfanceCreches data={dashboardData.evolution} lang={lang} t={t} />
          </>
        );

      case "JEUNESSE":
      default:
        return (
          <>
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

          </>
        );
    }
  };

  return (
    <AppLayout>
      <PrefDomainDashboardSection1Alerts
        reportStatus={dashboardData.status.reportStatus}
        correctionComment={dashboardData.status.correctionComment}
      />

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
              <Select value={domain} onValueChange={handleDomainChange}>
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
<PrefDomainDashboardSection1
  statusMeta={statusMeta}
  progressPct={progressPct}
  activeDomainLabel={activeDomainLabel}
  lastUpdated={dashboardData.status.lastUpdated}
  lang={lang}
  t={t}
/>

        {/* --- Section 2: Top KPIs --- */}
<PrefDomainDashboardSection2 items={buildSection2Items()} lang={lang} t={t} />

        {renderDomainCharts()}
        {/* --- Section 5 : Benchmark régional --- */}
<PrefDomainDashboardSection5 benchmark={dashboardData.benchmark} lang={lang} t={t} />

        {/* --- SECTION 6 : Détails du rapport (Accordion) --- */}
                <PrefDomainDashboardSection6 blocks={buildSection6Blocks()} t={t} openSection={openSection} toggleSection={toggleSection} />
      </div>
    </AppLayout>
  );
};

export default PrefDomainDashboard;