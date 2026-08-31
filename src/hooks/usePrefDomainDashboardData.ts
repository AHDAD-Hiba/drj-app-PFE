import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { type Domain } from "@/lib/domainData";
import { loadDashboard } from "@/services/PrefDomainDashboardDataService";
import { loadInfrastructureDashboard } from "@/services/PrefDomainDashboardInfrastructureDataService";
import { loadAffairesFemininesDashboard } from "@/services/PrefDomainDashboardAffairesFemininesDataService";
import { loadProtectionEnfanceDashboard } from "@/services/PrefDomainDashboardProtectionEnfanceDataService";
import { loadEnfanceCrechesDashboard } from "@/services/PrefDomainDashboardEnfanceCrechesDataService";
import type { PrefDomainDashboardData } from "@/services/prefDomainDashboardTypes";

export const PROTECTION_ENFANCE_DOMAIN_CODE = "PE";
export const ENFANCE_CRECHES_DOMAIN_CODE = "CRECHES";

interface UsePrefDomainDashboardDataOptions {
  enableRealtime?: boolean;
  lang?: string;
}

export function usePrefDomainDashboardData(
  directionId: string | undefined,
  year: number,
  domain: Domain,
  options: UsePrefDomainDashboardDataOptions = {},
) {
  const { enableRealtime = false, lang = "fr" } = options;

  const [dashboardData, setDashboardData] = useState<PrefDomainDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dbDomains, setDbDomains] = useState<any[]>([]);
  // Domain that `dashboardData` actually belongs to. Kept as separate state
  // (not inferred from `domain`) so we can detect, on every render, whether
  // the currently-selected domain and the currently-held payload are in
  // sync — even on the render that happens right after `domain` changes but
  // before the fetch effect has had a chance to run.
  const [dataDomain, setDataDomain] = useState<Domain | null>(null);
  const [dataYear, setDataYear] = useState<number | null>(null);

  const domainRef = useRef(domain);
  const yearRef = useRef(year);
  useEffect(() => {
    domainRef.current = domain;
  }, [domain]);
  useEffect(() => {
    yearRef.current = year;
  }, [year]);

  const selectedDomainId = useMemo(
    () => dbDomains.find((opt) => opt.code === domain)?.id,
    [dbDomains, domain],
  );

  // Chargé une seule fois (table `domaines`, petite table de référence).
  // `loadDashboardData` ci-dessous attend ce flag avant de partir : sans
  // lui, l'effet de chargement se déclenche une première fois avec
  // `selectedDomainId` encore undefined, PUIS une seconde fois dès que
  // `dbDomains` arrive (nouvelle identité de `loadDashboardData` via
  // `selectedDomainId`) — soit deux exécutions complètes de la requête
  // lourde du dashboard au lieu d'une seule.
  const [domainsLoaded, setDomainsLoaded] = useState(false);

  useEffect(() => {
    const fetchDomains = async () => {
      const { data, error } = await supabase.from("domaines").select("*");
      if (data && !error) {
        setDbDomains(data);
      }
      setDomainsLoaded(true);
    };
    void fetchDomains();
  }, []);

  const loadDashboardData = useCallback(async () => {
    if (!directionId) return;

    const requestDomain = domain;
    const requestYear = year;
    setIsLoading(true);

    try {
      let data: PrefDomainDashboardData;
      switch (requestDomain) {
        case "INFRA":
          data = await loadInfrastructureDashboard(directionId, requestYear, selectedDomainId);
          break;
        case "FEMME":
          data = await loadAffairesFemininesDashboard(directionId, requestYear, selectedDomainId, lang);
          break;
        case PROTECTION_ENFANCE_DOMAIN_CODE:
          data = await loadProtectionEnfanceDashboard(directionId, requestYear, selectedDomainId, lang);
          break;
        case ENFANCE_CRECHES_DOMAIN_CODE:
          data = await loadEnfanceCrechesDashboard(directionId, requestYear, selectedDomainId, lang);
          break;
        case "JEUNESSE":
        default:
          data = await loadDashboard(directionId, requestYear, selectedDomainId);
          break;
      }

      if (requestDomain !== domainRef.current || requestYear !== yearRef.current) return;

      setDashboardData(data);
      setDataDomain(requestDomain);
      setDataYear(requestYear);
    } catch (error) {
      console.error("Erreur lors du chargement du dashboard:", error);
    } finally {
      if (requestDomain === domainRef.current && requestYear === yearRef.current) {
        setIsLoading(false);
      }
    }
  }, [directionId, year, selectedDomainId, domain, lang]);

  useEffect(() => {
    if (!domainsLoaded) return;
    void loadDashboardData();
  }, [loadDashboardData, domainsLoaded]);

  useEffect(() => {
    if (!enableRealtime || !directionId) return;

    const channel = supabase.channel(`pref-dashboard-${directionId}-${domain}`);

    switch (domain) {
      case "INFRA":
        channel
          .on("postgres_changes", { event: "*", schema: "public", table: "infra_depenses" }, loadDashboardData)
          .on("postgres_changes", { event: "*", schema: "public", table: "infra_eau_electricite" }, loadDashboardData)
          .on("postgres_changes", { event: "*", schema: "public", table: "infra_projets_btp" }, loadDashboardData)
          .on("postgres_changes", { event: "*", schema: "public", table: "infra_projets_partenariat" }, loadDashboardData)
          .on("postgres_changes", { event: "*", schema: "public", table: "infra_projets_en_souffrance" }, loadDashboardData);
        break;
      case "FEMME":
        channel
          .on("postgres_changes", { event: "*", schema: "public", table: "af_inscriptions_clubs" }, loadDashboardData)
          .on("postgres_changes", { event: "*", schema: "public", table: "af_inscriptions_ofppt" }, loadDashboardData)
          .on("postgres_changes", { event: "*", schema: "public", table: "af_activites_sensibilisation" }, loadDashboardData)
          .on("postgres_changes", { event: "*", schema: "public", table: "af_portes_ouvertes" }, loadDashboardData)
          .on("postgres_changes", { event: "*", schema: "public", table: "af_formation_cadres" }, loadDashboardData)
          .on("postgres_changes", { event: "*", schema: "public", table: "af_mise_a_jour_reseau" }, loadDashboardData)
          .on("postgres_changes", { event: "*", schema: "public", table: "af_ressources_humaines" }, loadDashboardData)
          .on("postgres_changes", { event: "*", schema: "public", table: "af_integration_laureates" }, loadDashboardData)
          .on("postgres_changes", { event: "*", schema: "public", table: "af_activites_generatrices_revenus" }, loadDashboardData)
          .on("postgres_changes", { event: "*", schema: "public", table: "af_centres_ecoute" }, loadDashboardData)
          .on("postgres_changes", { event: "*", schema: "public", table: "af_suivi_partenariats" }, loadDashboardData)
          .on("postgres_changes", { event: "*", schema: "public", table: "rapports" }, loadDashboardData);
        break;
      case PROTECTION_ENFANCE_DOMAIN_CODE:
        channel
          .on("postgres_changes", { event: "*", schema: "public", table: "pe_statistiques_demographiques" }, loadDashboardData)
          .on("postgres_changes", { event: "*", schema: "public", table: "pe_education" }, loadDashboardData)
          .on("postgres_changes", { event: "*", schema: "public", table: "pe_liberte_surveillee" }, loadDashboardData)
          .on("postgres_changes", { event: "*", schema: "public", table: "pe_rapports_exceptionnels" }, loadDashboardData)
          .on("postgres_changes", { event: "*", schema: "public", table: "pe_activites" }, loadDashboardData)
          .on("postgres_changes", { event: "*", schema: "public", table: "rapports" }, loadDashboardData);
        break;
      case ENFANCE_CRECHES_DOMAIN_CODE:
        channel
          .on("postgres_changes", { event: "*", schema: "public", table: "cr_statistiques_enfants" }, loadDashboardData)
          .on("postgres_changes", { event: "*", schema: "public", table: "cr_demandes_licences" }, loadDashboardData)
          .on("postgres_changes", { event: "*", schema: "public", table: "cr_mouvements_fermetures" }, loadDashboardData)
          .on("postgres_changes", { event: "*", schema: "public", table: "rapports" }, loadDashboardData);
        break;
      case "JEUNESSE":
      default:
        channel
          .on("postgres_changes", { event: "*", schema: "public", table: "activites" }, loadDashboardData)
          .on("postgres_changes", { event: "*", schema: "public", table: "participants" }, loadDashboardData)
          .on("postgres_changes", { event: "*", schema: "public", table: "suivi_remplissage" }, loadDashboardData)
          .on("postgres_changes", { event: "*", schema: "public", table: "rapports" }, loadDashboardData)
          .on("postgres_changes", { event: "*", schema: "public", table: "encadrements" }, loadDashboardData)
          .on("postgres_changes", { event: "*", schema: "public", table: "formations" }, loadDashboardData)
          .on("postgres_changes", { event: "*", schema: "public", table: "statistiques_formation" }, loadDashboardData)
          .on("postgres_changes", { event: "*", schema: "public", table: "partenariats" }, loadDashboardData)
          .on("postgres_changes", { event: "*", schema: "public", table: "activites_insertion" }, loadDashboardData)
          .on("postgres_changes", { event: "*", schema: "public", table: "stats_insertion" }, loadDashboardData)
          .on("postgres_changes", { event: "*", schema: "public", table: "festivals" }, loadDashboardData)
          .on("postgres_changes", { event: "*", schema: "public", table: "statistiques_festivals" }, loadDashboardData)
          .on("postgres_changes", { event: "*", schema: "public", table: "etablissements" }, loadDashboardData)
          .on("postgres_changes", { event: "*", schema: "public", table: "fermetures" }, loadDashboardData)
          .on("postgres_changes", { event: "*", schema: "public", table: "suivi_projets" }, loadDashboardData);
        break;
    }

    channel.subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [directionId, domain, enableRealtime, loadDashboardData]);

  const activeDomainLabel = useMemo(() => {
    const option = dbDomains.find((opt) => opt.code === domain);
    return option ? (lang === "ar" ? option.nom_ar : option.nom_fr) : domain;
  }, [domain, lang, dbDomains]);

  // `dataDomain` only changes together with `dashboardData`. The selected
  // `domain` changes immediately. Content must always be rendered with
  // `contentDomain` (= dataDomain when present) so domain X's payload is
  // never passed to domain Y's KPI/chart builders. During a domain switch
  // we keep the previous payload visible until the new one arrives.
  const isDomainSynced = dataDomain === domain && dataYear === year;
  const contentDomain = dataDomain ?? domain;
  const isInitialLoading = (isLoading || !isDomainSynced) && dashboardData === null;

  return {
    dashboardData,
    dataDomain,
    contentDomain,
    isDomainSynced,
    isLoading: isLoading || !isDomainSynced,
    isInitialLoading,
    dbDomains,
    selectedDomainId,
    activeDomainLabel,
    reload: loadDashboardData,
  };
}