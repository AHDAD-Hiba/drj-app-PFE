import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import type { PrefDomainBenchmarkRow } from "@/components/dashboard/PrefDomainBenchmarkTable";
import type { DashboardData } from "@/services/prefDomainDashboardTypes";
import { averageDirectionalKpis, filterByRapportIds, loadRegionalDirectionIds, loadRegionalReportsForDirectionIds, uniqueIds } from "@/services/prefDomainRegionalBenchmark";

// --- Service dédié au domaine "Affaires Féminines" ---
// Suit exactement le même contrat que PrefDomainDashboardInfrastructureDataService.ts
// (Infrastructure) et PrefDomainDashboardDataService.ts (Jeunesse) mais reste
// totalement indépendant : aucune dépendance croisée, aucune table métier autre
// que les 11 tables af_* (+ af_secteurs / af_filieres et la table système
// "rapports" + la vue "v_dashboard_pref_section1" pour le statut/la progression).
//
// Toute l'agrégation (sommes, taux, regroupements, évolution trimestrielle)
// est faite ICI. Les builders (section2/AffairesFemininesKpiConfig.tsx,
// section6/AffairesFemininesSection6Blocks.tsx) et les composants Section3/4
// ne font que de la présentation à partir des données déjà calculées.
//
// IMPORTANT — Sécurité `.toFixed()` : toutes les valeurs numériques exposées sont
// garanties des nombres (jamais undefined/null) afin d'éviter l'erreur
// "Cannot read properties of undefined (reading 'toFixed')".

type AfInscriptionsClubsRow = Database["public"]["Tables"]["af_inscriptions_clubs"]["Row"];
type AfInscriptionsOfpptRow = Database["public"]["Tables"]["af_inscriptions_ofppt"]["Row"];
type AfActivitesSensibilisationRow =
  Database["public"]["Tables"]["af_activites_sensibilisation"]["Row"];
type AfPortesOuvertesRow = Database["public"]["Tables"]["af_portes_ouvertes"]["Row"];
type AfFormationCadresRow = Database["public"]["Tables"]["af_formation_cadres"]["Row"];
type AfMiseAJourReseauRow = Database["public"]["Tables"]["af_mise_a_jour_reseau"]["Row"];
type AfRessourcesHumainesRow = Database["public"]["Tables"]["af_ressources_humaines"]["Row"];
type AfIntegrationLaureatesRow = Database["public"]["Tables"]["af_integration_laureates"]["Row"];
type AfActivitesGeneratricesRevenusRow =
  Database["public"]["Tables"]["af_activites_generatrices_revenus"]["Row"];
type AfCentresEcouteRow = Database["public"]["Tables"]["af_centres_ecoute"]["Row"];
type AfSuiviPartenariatsRow = Database["public"]["Tables"]["af_suivi_partenariats"]["Row"];
type AfSecteursRow = Database["public"]["Tables"]["af_secteurs"]["Row"];
type AfFilieresRow = Database["public"]["Tables"]["af_filieres"]["Row"];
type RapportRow = Database["public"]["Tables"]["rapports"]["Row"];

// --- Types exposés (consommés par les builders Section2/Section6 et les Sections 3/4) ---

export interface AffairesFemininesKpisRaw {
  /** Σ inscrites_annee_2 (clubs) + Σ inscrites_annee_2 (OFPPT) */
  totalInscriptionsFormation: number;
  /** Σ nombre_integrees / Σ nombre_laureates × 100 (%) */
  tauxIntegrationLaureates: number;
  /** Σ(benef_urbain + benef_rural) sensibilisation + Σ nombre_beneficiaires portes ouvertes */
  totalBeneficiairesSensibilisationPortesOuvertes: number;
  /** Σ nombre_beneficiaires AGR */
  totalBeneficiairesAgr: number;
  /** COUNT(*) af_suivi_partenariats */
  totalPartenariatsSuivis: number;
  /** Σ nombre_seances centres d'écoute */
  totalSeancesCentresEcoute: number;
}

/** Visualisation 1 (Section 3) : Formation professionnelle par secteur (Horizontal Bar) */
export interface AffairesFemininesFormationSecteurDatum {
  /** clé stable (secteur_id), utilisée pour la couleur */
  secteurId: string;
  /** nom selon la langue active (nom_fr / nom_ar) */
  nom: string;
  /** Σ inscrites_annee_2 pour ce secteur */
  total: number;
}

/** Visualisation 2 (Section 3) : Répartition Urbain / Rural (Stacked Bar) */
export interface AffairesFemininesUrbainRuralDatum {
  name: string; // "Urbain" | "Rural" (clé stable, traduite par le composant)
  urbain: number;
  rural: number;
  total: number;
  urbainPct: number;
  ruralPct: number;
}

export interface AffairesFemininesSection3Data {
  formationParSecteur: AffairesFemininesFormationSecteurDatum[];
  urbainRural: AffairesFemininesUrbainRuralDatum[];
}

/** Visualisation 3 (Section 4) : Évolution intégration des lauréates (Area, T1→T4) */
export interface AffairesFemininesEvolutionIntegrationDatum {
  name: string; // "T1".."T4"
  laureates: number | null;
  integrees: number | null;
}

/** Visualisation 4 (Section 4) : Évolution activité sociale — double axe Y (T1→T4) */
export interface AffairesFemininesEvolutionActiviteSocialeDatum {
  name: string; // "T1".."T4"
  /** Axe gauche : Σ nombre_beneficiaires AGR */
  beneficiairesAgr: number | null;
  /** Axe gauche : Σ nombre_seances centres d'écoute */
  seancesCentresEcoute: number | null;
  /** Axe droit : COUNT(*) partenariats */
  partenariatsSuivis: number | null;
}

export interface AffairesFemininesEvolutionData {
  integration: AffairesFemininesEvolutionIntegrationDatum[];
  activiteSociale: AffairesFemininesEvolutionActiviteSocialeDatum[];
}

/** Données détaillées consommées par section6/AffairesFemininesSection6Blocks.tsx */
export interface AffairesFemininesSection6Data {
  formationProfessionnelle: {
    totalInscriptionsClubs: number;
    totalInscriptionsOfppt: number;
    parFiliere: { filiere: string; inscriptions: number }[];
    parSecteur: { secteur: string; inscriptions: number }[];
    parNiveau: { niveau: string; inscriptions: number }[];
  };
  insertionAgr: {
    totalLaureates: number;
    totalIntegrees: number;
    tauxIntegration: number;
    beneficiairesAgr: number;
    partenairesAgr: string[];
  };
  sensibilisationPortesOuvertes: {
    totalActivites: number;
    totalBeneficiaires: number;
    totalUrbain: number;
    totalRural: number;
    totalPortesOuvertes: number;
    totalBeneficiairesPortesOuvertes: number;
  };
  centresEcoute: {
    totalSeances: number;
    totalCas: number;
    parTypeSoutien: { type: string; count: number }[];
  };
  ressourcesHumainesCadres: {
    ressourcesDisponibles: number;
    ressourcesBesoin: number;
    parProfil: { profil: string; nombre: number }[];
    cadresFormes: number;
    parDomaineFormation: { domaine: string; cadres: number }[];
  };
  reseauPartenariats: {
    mouvements: { type: string; count: number }[];
    partenariatsSuivis: number;
    sujetsPartenariats: string[];
  };
}

export type AffairesFemininesDashboardData = DashboardData<
  AffairesFemininesKpisRaw,
  AffairesFemininesSection3Data,
  AffairesFemininesEvolutionData,
  AffairesFemininesSection6Data
>;

// --- Helpers d'agrégation (privés) ---

const sumBy = <T,>(rows: T[], selector: (row: T) => number | null | undefined): number =>
  rows.reduce((acc, row) => acc + (selector(row) || 0), 0);

const ratioPct = (numerator: number, denominator: number): number =>
  denominator > 0 ? (numerator / denominator) * 100 : 0;

const TRIMESTRE_LABELS: Record<string, "T1" | "T2" | "T3" | "T4"> = {
  t1: "T1",
  t2: "T2",
  t3: "T3",
  t4: "T4",
};

const emptyEvolutionIntegration = (): AffairesFemininesEvolutionIntegrationDatum[] =>
  (["T1", "T2", "T3", "T4"] as const).map((name) => ({ name, laureates: null, integrees: null }));

const emptyEvolutionActiviteSociale = (): AffairesFemininesEvolutionActiviteSocialeDatum[] =>
  (["T1", "T2", "T3", "T4"] as const).map((name) => ({
    name,
    beneficiairesAgr: null,
    seancesCentresEcoute: null,
    partenariatsSuivis: null,
  }));

// --- Requêtes par section (privées) ---

const loadStatus = async (rapportId: string, domaineId?: string) => {
  const baseQuery = supabase
    .from("suivi_remplissage")
    .select("id, rapport_id, domaine_id, statut, progression_pourcentage, updated_at")
    .eq("rapport_id", rapportId);
  const query = domaineId ? baseQuery.eq("domaine_id", domaineId) : baseQuery;

  const { data } = await query.order("updated_at", { ascending: false }).limit(1).maybeSingle();
  return data;
};

const loadRapports = async (directionId: string, year: number): Promise<RapportRow[]> => {
  const { data } = await supabase
    .from("rapports")
    .select("id, statut_rapport, commentaire_correction, trimestre")
    .eq("direction_id", directionId)
    .eq("annee", year)
    .order("trimestre", { ascending: false });
  return (data || []) as RapportRow[];
};

const loadInscriptionsClubs = async (rapportIds: string[]) => {
  const { data } = await supabase
    .from("af_inscriptions_clubs")
    .select("*")
    .in("rapport_id", rapportIds);
  return (data || []) as AfInscriptionsClubsRow[];
};

const loadInscriptionsOfppt = async (rapportIds: string[]) => {
  const { data } = await supabase
    .from("af_inscriptions_ofppt")
    .select("*")
    .in("rapport_id", rapportIds);
  return (data || []) as AfInscriptionsOfpptRow[];
};

const loadActivitesSensibilisation = async (rapportIds: string[]) => {
  const { data } = await supabase
    .from("af_activites_sensibilisation")
    .select("*")
    .in("rapport_id", rapportIds);
  return (data || []) as AfActivitesSensibilisationRow[];
};

const loadPortesOuvertes = async (rapportIds: string[]) => {
  const { data } = await supabase.from("af_portes_ouvertes").select("*").in("rapport_id", rapportIds);
  return (data || []) as AfPortesOuvertesRow[];
};

const loadFormationCadres = async (rapportIds: string[]) => {
  const { data } = await supabase
    .from("af_formation_cadres")
    .select("*")
    .in("rapport_id", rapportIds);
  return (data || []) as AfFormationCadresRow[];
};

const loadMiseAJourReseau = async (rapportIds: string[]) => {
  const { data } = await supabase
    .from("af_mise_a_jour_reseau")
    .select("*")
    .in("rapport_id", rapportIds);
  return (data || []) as AfMiseAJourReseauRow[];
};

const loadRessourcesHumaines = async (rapportIds: string[]) => {
  const { data } = await supabase
    .from("af_ressources_humaines")
    .select("*")
    .in("rapport_id", rapportIds);
  return (data || []) as AfRessourcesHumainesRow[];
};

const loadIntegrationLaureates = async (rapportIds: string[]) => {
  const { data } = await supabase
    .from("af_integration_laureates")
    .select("*")
    .in("rapport_id", rapportIds);
  return (data || []) as AfIntegrationLaureatesRow[];
};

const loadActivitesGeneratricesRevenus = async (rapportIds: string[]) => {
  const { data } = await supabase
    .from("af_activites_generatrices_revenus")
    .select("*")
    .in("rapport_id", rapportIds);
  return (data || []) as AfActivitesGeneratricesRevenusRow[];
};

const loadCentresEcoute = async (rapportIds: string[]) => {
  const { data } = await supabase.from("af_centres_ecoute").select("*").in("rapport_id", rapportIds);
  return (data || []) as AfCentresEcouteRow[];
};

const loadSuiviPartenariats = async (rapportIds: string[]) => {
  const { data } = await supabase
    .from("af_suivi_partenariats")
    .select("*")
    .in("rapport_id", rapportIds);
  return (data || []) as AfSuiviPartenariatsRow[];
};

const loadSecteurs = async () => {
  const { data } = await supabase.from("af_secteurs").select("*");
  return (data || []) as AfSecteursRow[];
};

const loadFilieres = async () => {
  const { data } = await supabase.from("af_filieres").select("*");
  return (data || []) as AfFilieresRow[];
};

// --- Transformations (privées) ---

const buildKpis = (
  inscriptionsClubs: AfInscriptionsClubsRow[],
  inscriptionsOfppt: AfInscriptionsOfpptRow[],
  integrationLaureates: AfIntegrationLaureatesRow[],
  activitesSensibilisation: AfActivitesSensibilisationRow[],
  portesOuvertes: AfPortesOuvertesRow[],
  activitesGeneratricesRevenus: AfActivitesGeneratricesRevenusRow[],
  centresEcoute: AfCentresEcouteRow[],
  suiviPartenariats: AfSuiviPartenariatsRow[],
): AffairesFemininesKpisRaw => {
  const totalClubs = sumBy(inscriptionsClubs, (r) => r.inscrites_annee_2);
  const totalOfppt = sumBy(inscriptionsOfppt, (r) => r.inscrites_annee_2);

  const totalLaureates = sumBy(integrationLaureates, (r) => r.nombre_laureates);
  const totalIntegrees = sumBy(integrationLaureates, (r) => r.nombre_integrees);

  const sensibilisationTotal = sumBy(
    activitesSensibilisation,
    (r) => (r.benef_urbain || 0) + (r.benef_rural || 0),
  );
  const portesOuvertesTotal = sumBy(portesOuvertes, (r) => r.nombre_beneficiaires);

  return {
    totalInscriptionsFormation: totalClubs + totalOfppt,
    tauxIntegrationLaureates: ratioPct(totalIntegrees, totalLaureates),
    totalBeneficiairesSensibilisationPortesOuvertes: sensibilisationTotal + portesOuvertesTotal,
    totalBeneficiairesAgr: sumBy(activitesGeneratricesRevenus, (r) => r.nombre_beneficiaires),
    totalPartenariatsSuivis: suiviPartenariats.length,
    totalSeancesCentresEcoute: sumBy(centresEcoute, (r) => r.nombre_seances),
  };
};

const buildSection3 = (
  inscriptionsOfppt: AfInscriptionsOfpptRow[],
  secteurs: AfSecteursRow[],
  activitesSensibilisation: AfActivitesSensibilisationRow[],
  lang: string,
): AffairesFemininesSection3Data => {
  // --- Visualisation 1 : Formation professionnelle par secteur ---
  const secteurById = new Map(secteurs.map((s) => [s.id, s]));
  const bySecteur = new Map<string, number>();
  inscriptionsOfppt.forEach((r) => {
    if (!r.secteur_id) return;
    bySecteur.set(r.secteur_id, (bySecteur.get(r.secteur_id) || 0) + (r.inscrites_annee_2 || 0));
  });

  const formationParSecteur: AffairesFemininesFormationSecteurDatum[] = Array.from(
    bySecteur.entries(),
  ).map(([secteurId, total]) => {
    const secteur = secteurById.get(secteurId);
    const nom = secteur ? (lang === "ar" ? secteur.nom_ar : secteur.nom_fr || secteur.nom_ar) : secteurId;
    return { secteurId, nom, total };
  });
  // Tri par volume décroissant
  formationParSecteur.sort((a, b) => b.total - a.total);

  // --- Visualisation 2 : Répartition Urbain / Rural ---
  const urbain = sumBy(activitesSensibilisation, (r) => r.benef_urbain);
  const rural = sumBy(activitesSensibilisation, (r) => r.benef_rural);
  const total = urbain + rural;

  const urbainRural: AffairesFemininesUrbainRuralDatum[] = [
    {
      name: "Urbain",
      urbain,
      rural: 0,
      total,
      urbainPct: total > 0 ? (urbain / total) * 100 : 0,
      ruralPct: 0,
    },
    {
      name: "Rural",
      urbain: 0,
      rural,
      total,
      urbainPct: 0,
      ruralPct: total > 0 ? (rural / total) * 100 : 0,
    },
  ];

  return { formationParSecteur, urbainRural };
};

const buildEvolution = (
  rapportTrimestreById: Map<string, string | null>,
  integrationLaureates: AfIntegrationLaureatesRow[],
  activitesGeneratricesRevenus: AfActivitesGeneratricesRevenusRow[],
  centresEcoute: AfCentresEcouteRow[],
  suiviPartenariats: AfSuiviPartenariatsRow[],
): AffairesFemininesEvolutionData => {
  const integration = emptyEvolutionIntegration();
  const activiteSociale = emptyEvolutionActiviteSociale();

  const trimestreLabelForRapport = (rapportId: string | null): "T1" | "T2" | "T3" | "T4" | null => {
    if (!rapportId) return null;
    const trimestre = rapportTrimestreById.get(rapportId);
    if (!trimestre) return null;
    return TRIMESTRE_LABELS[trimestre] ?? null;
  };

  // --- Visualisation 3 : Évolution intégration des lauréates ---
  const integrationByQuarter = new Map<string, { laureates: number; integrees: number }>();
  integrationLaureates.forEach((r) => {
    const label = trimestreLabelForRapport(r.rapport_id);
    if (!label) return;
    const acc = integrationByQuarter.get(label) || { laureates: 0, integrees: 0 };
    acc.laureates += r.nombre_laureates || 0;
    acc.integrees += r.nombre_integrees || 0;
    integrationByQuarter.set(label, acc);
  });
  integration.forEach((row) => {
    const acc = integrationByQuarter.get(row.name);
    if (acc) {
      row.laureates = acc.laureates;
      row.integrees = acc.integrees;
    }
  });

  // --- Visualisation 4 : Évolution activité sociale (double axe Y) ---
  const agrByQuarter = new Map<string, number>();
  activitesGeneratricesRevenus.forEach((r) => {
    const label = trimestreLabelForRapport(r.rapport_id);
    if (!label) return;
    agrByQuarter.set(label, (agrByQuarter.get(label) || 0) + (r.nombre_beneficiaires || 0));
  });

  const seancesByQuarter = new Map<string, number>();
  centresEcoute.forEach((r) => {
    const label = trimestreLabelForRapport(r.rapport_id);
    if (!label) return;
    seancesByQuarter.set(label, (seancesByQuarter.get(label) || 0) + (r.nombre_seances || 0));
  });

  const partenariatsByQuarter = new Map<string, number>();
  suiviPartenariats.forEach((r) => {
    const label = trimestreLabelForRapport(r.rapport_id);
    if (!label) return;
    partenariatsByQuarter.set(label, (partenariatsByQuarter.get(label) || 0) + 1);
  });

  activiteSociale.forEach((row) => {
    if (agrByQuarter.has(row.name)) row.beneficiairesAgr = agrByQuarter.get(row.name)!;
    if (seancesByQuarter.has(row.name))
      row.seancesCentresEcoute = seancesByQuarter.get(row.name)!;
    if (partenariatsByQuarter.has(row.name))
      row.partenariatsSuivis = partenariatsByQuarter.get(row.name)!;
  });

  return { integration, activiteSociale };
};

const buildBenchmark = (
  kpis: AffairesFemininesKpisRaw,
  regionalAverages: Partial<Record<keyof AffairesFemininesKpisRaw, number>> = {},
): PrefDomainBenchmarkRow[] => {
  const regional = (key: keyof AffairesFemininesKpisRaw, fallback = 0) =>
    Number.isFinite(regionalAverages[key]) ? (regionalAverages[key] as number) : fallback;

  return [
    {
      kpi: "Total inscriptions formation",
      monScore: kpis.totalInscriptionsFormation,
      moyenneReg: regional("totalInscriptionsFormation", 0),
      isPercentage: false,
    },
    {
      kpi: "Taux d'intégration des lauréates",
      monScore: kpis.tauxIntegrationLaureates,
      moyenneReg: regional("tauxIntegrationLaureates", 0),
      isPercentage: true,
    },
    {
      kpi: "Bénéficiaires sensibilisation + portes ouvertes",
      monScore: kpis.totalBeneficiairesSensibilisationPortesOuvertes,
      moyenneReg: regional("totalBeneficiairesSensibilisationPortesOuvertes", 0),
      isPercentage: false,
    },
    {
      kpi: "Bénéficiaires AGR",
      monScore: kpis.totalBeneficiairesAgr,
      moyenneReg: regional("totalBeneficiairesAgr", 0),
      isPercentage: false,
    },
    {
      kpi: "Partenariats suivis",
      monScore: kpis.totalPartenariatsSuivis,
      moyenneReg: regional("totalPartenariatsSuivis", 0),
      isPercentage: false,
    },
    {
      kpi: "Séances centres d'écoute",
      monScore: kpis.totalSeancesCentresEcoute,
      moyenneReg: regional("totalSeancesCentresEcoute", 0),
      isPercentage: false,
    },
  ];
};

const buildDetailed = (
  inscriptionsClubs: AfInscriptionsClubsRow[],
  inscriptionsOfppt: AfInscriptionsOfpptRow[],
  integrationLaureates: AfIntegrationLaureatesRow[],
  activitesGeneratricesRevenus: AfActivitesGeneratricesRevenusRow[],
  activitesSensibilisation: AfActivitesSensibilisationRow[],
  portesOuvertes: AfPortesOuvertesRow[],
  centresEcoute: AfCentresEcouteRow[],
  ressourcesHumaines: AfRessourcesHumainesRow[],
  formationCadres: AfFormationCadresRow[],
miseAJourReseau: AfMiseAJourReseauRow[],
  suiviPartenariats: AfSuiviPartenariatsRow[],
  secteurs: AfSecteursRow[],
  filieres: AfFilieresRow[],
  lang: string,
): AffairesFemininesSection6Data => {
  const filiereById = new Map(filieres.map((f) => [f.id, f]));
  const secteurById = new Map(secteurs.map((s) => [s.id, s]));

  // Bloc 1 : Formation Professionnelle
  const inscriptionsByFiliere = new Map<string, number>();
  [...inscriptionsClubs, ...inscriptionsOfppt].forEach((r) => {
    if (!r.filiere_id) return;
    inscriptionsByFiliere.set(
      r.filiere_id,
      (inscriptionsByFiliere.get(r.filiere_id) || 0) + (r.inscrites_annee_2 || 0),
    );
  });
  const parFiliere = Array.from(inscriptionsByFiliere.entries())
    .map(([filiereId, inscriptions]) => {
      const f = filiereById.get(filiereId);
      return {
        filiere: f ? (lang === "ar" ? f.nom_ar || f.nom_fr : f.nom_fr || f.nom_ar) : filiereId,
        inscriptions,
      };
    })
    .sort((a, b) => b.inscriptions - a.inscriptions);

  const inscriptionsBySecteur = new Map<string, number>();
  inscriptionsOfppt.forEach((r) => {
    if (!r.secteur_id) return;
    inscriptionsBySecteur.set(
      r.secteur_id,
      (inscriptionsBySecteur.get(r.secteur_id) || 0) + (r.inscrites_annee_2 || 0),
    );
  });
const parSecteur = Array.from(inscriptionsBySecteur.entries())
    .map(([secteurId, inscriptions]) => {
      const s = secteurById.get(secteurId);
      return {
        secteur: s ? (lang === "ar" ? s.nom_ar || s.nom_fr : s.nom_fr || s.nom_ar) : secteurId,
        inscriptions,
      };
    })
    .sort((a, b) => b.inscriptions - a.inscriptions);

  const inscriptionsByNiveau = new Map<string, number>();
  inscriptionsOfppt.forEach((r) => {
    if (!r.niveau_formation) return;
    inscriptionsByNiveau.set(
      r.niveau_formation,
      (inscriptionsByNiveau.get(r.niveau_formation) || 0) + (r.inscrites_annee_2 || 0),
    );
  });
  const parNiveau = Array.from(inscriptionsByNiveau.entries())
    .map(([niveau, inscriptions]) => ({ niveau, inscriptions }))
    .sort((a, b) => b.inscriptions - a.inscriptions);

  // Bloc 2 : Insertion & AGR
  const totalLaureates = sumBy(integrationLaureates, (r) => r.nombre_laureates);
  const totalIntegrees = sumBy(integrationLaureates, (r) => r.nombre_integrees);
  const partenairesAgr = Array.from(
    new Set(
      activitesGeneratricesRevenus
        .map((r) => r.partenaires)
        .filter((p): p is string => !!p && p.trim().length > 0),
    ),
  );

  // Bloc 3 : Sensibilisation & Portes Ouvertes
  const totalUrbain = sumBy(activitesSensibilisation, (r) => r.benef_urbain);
  const totalRural = sumBy(activitesSensibilisation, (r) => r.benef_rural);
  const totalBenefActivites = sumBy(
    activitesSensibilisation,
    (r) => (r.benef_urbain || 0) + (r.benef_rural || 0),
  );

  // Bloc 4 : Centres d'Écoute
  const ecouteByType = new Map<string, number>();
  centresEcoute.forEach((r) => {
    const type = r.type_soutien?.trim() || "non_precise";
    ecouteByType.set(type, (ecouteByType.get(type) || 0) + 1);
  });

  // Bloc 5 : Ressources Humaines & Cadres
  const rhProfileCounts = new Map<string, number>();
  ressourcesHumaines.forEach((r) => {
    const key = r.profile?.trim() || "non_precise";
    rhProfileCounts.set(key, (rhProfileCounts.get(key) || 0) + (r.nombre || 0));
  });
  const cadresByDomaine = new Map<string, number>();
  formationCadres.forEach((r) => {
    const domaine = r.domaine_formation?.trim() || "non_precise";
    cadresByDomaine.set(domaine, (cadresByDomaine.get(domaine) || 0) + (r.nombre_cadres || 0));
  });

  // Bloc 6 : Réseau & Partenariats
  const mouvementsByType = new Map<string, number>();
  miseAJourReseau.forEach((r) => {
    const type = r.type_mise_a_jour || "non_precise";
    mouvementsByType.set(type, (mouvementsByType.get(type) || 0) + 1);
  });
  const sujetsPartenariats = Array.from(
    new Set(
      suiviPartenariats
        .map((r) => r.sujet_partenariat)
        .filter((s): s is string => !!s && s.trim().length > 0),
    ),
  );

  return {
    formationProfessionnelle: {
      totalInscriptionsClubs: sumBy(inscriptionsClubs, (r) => r.inscrites_annee_2),
      totalInscriptionsOfppt: sumBy(inscriptionsOfppt, (r) => r.inscrites_annee_2),
      parFiliere,
      parSecteur,
      parNiveau,
    },
    insertionAgr: {
      totalLaureates,
      totalIntegrees,
      tauxIntegration: ratioPct(totalIntegrees, totalLaureates),
      beneficiairesAgr: sumBy(activitesGeneratricesRevenus, (r) => r.nombre_beneficiaires),
      partenairesAgr,
    },
    sensibilisationPortesOuvertes: {
      totalActivites: activitesSensibilisation.length,
      totalBeneficiaires: totalBenefActivites,
      totalUrbain,
      totalRural,
      totalPortesOuvertes: portesOuvertes.length,
      totalBeneficiairesPortesOuvertes: sumBy(portesOuvertes, (r) => r.nombre_beneficiaires),
    },
    centresEcoute: {
      totalSeances: sumBy(centresEcoute, (r) => r.nombre_seances),
      totalCas: sumBy(centresEcoute, (r) => r.nombre_cas),
      parTypeSoutien: Array.from(ecouteByType.entries()).map(([type, count]) => ({ type, count })),
    },
    ressourcesHumainesCadres: {
      ressourcesDisponibles: sumBy(
        ressourcesHumaines.filter((r) => r.type_rh === "disponible"),
        (r) => r.nombre,
      ),
      ressourcesBesoin: sumBy(
        ressourcesHumaines.filter((r) => r.type_rh === "besoin"),
        (r) => r.nombre,
      ),
      parProfil: Array.from(rhProfileCounts.entries()).map(([profil, nombre]) => ({ profil, nombre })),
      cadresFormes: sumBy(formationCadres, (r) => r.nombre_cadres),
      parDomaineFormation: Array.from(cadresByDomaine.entries()).map(([domaine, cadres]) => ({
        domaine,
        cadres,
      })),
    },
    reseauPartenariats: {
      mouvements: Array.from(mouvementsByType.entries()).map(([type, count]) => ({ type, count })),
      partenariatsSuivis: suiviPartenariats.length,
      sujetsPartenariats,
    },
  };
};

// --- Fonction unique exposée ---

export const loadAffairesFemininesDashboard = async (
  directionId: string,
  year: number,
  domaineId?: string,
  lang: string = "fr",
): Promise<AffairesFemininesDashboardData> => {
  const emptyKpis: AffairesFemininesKpisRaw = {
    totalInscriptionsFormation: 0,
    tauxIntegrationLaureates: 0,
    totalBeneficiairesSensibilisationPortesOuvertes: 0,
    totalBeneficiairesAgr: 0,
    totalPartenariatsSuivis: 0,
    totalSeancesCentresEcoute: 0,
  };

  const regionalDirectionIdsPromise = loadRegionalDirectionIds(directionId);

  // 1. Chercher si au moins un rapport existe pour cette année et cette direction
  const rapports = await loadRapports(directionId, year);

  // 2. Si AUCUN rapport n'est trouvé, on retourne un tableau de bord vide
  if (rapports.length === 0) {
    return {
      status: {
        workflowStatus: "NON_COMMENCE",
        progressPct: 0,
        lastUpdated: null,
        correctionComment: null,
      },
      kpis: emptyKpis,
      section3: {
        formationParSecteur: [],
        urbainRural: [
          {
            name: "Urbain",
            urbain: 0,
            rural: 0,
            total: 0,
            urbainPct: 0,
            ruralPct: 0,
          },
          {
            name: "Rural",
            urbain: 0,
            rural: 0,
            total: 0,
            urbainPct: 0,
            ruralPct: 0,
          },
        ],
      },
      evolution: {
        integration: emptyEvolutionIntegration(),
        activiteSociale: emptyEvolutionActiviteSociale(),
      },
benchmark: buildBenchmark(emptyKpis),
      detailed: buildDetailed([], [], [], [], [], [], [], [], [], [], [], [], [], lang),
    };
  }

  const rapportIds = rapports.map((r) => r.id);
  const localRapportIdSet = new Set(rapportIds);
  const rapportTrimestreById = new Map<string, string | null>(rapports.map((r) => [r.id, r.trimestre]));
  const latestRapport = rapports[0]; // déjà trié par trimestre décroissant

  const regionalDirectionIds = await regionalDirectionIdsPromise;
  const regionalRapports = await loadRegionalReportsForDirectionIds(regionalDirectionIds, year);
  const regionalRapportIds = regionalRapports.map((r) => r.id);
  const regionalRapportIdsByDirection = new Map<string, Set<string>>();
  regionalRapports.forEach((report) => {
    if (!report.direction_id) return;
    const ids = regionalRapportIdsByDirection.get(report.direction_id) ?? new Set<string>();
    ids.add(report.id);
    regionalRapportIdsByDirection.set(report.direction_id, ids);
  });

  const fetchIds = uniqueIds([...rapportIds, ...regionalRapportIds]);
  const [
    status,
    clubsAll,
    ofpptAll,
    sensibilisationAll,
    portesOuvertesAll,
    formationCadresAll,
    reseauAll,
    rhAll,
    laureatesAll,
    agrAll,
    ecouteAll,
    partenariatsAll,
    secteurs,
    filieres,
  ] = await Promise.all([
    loadStatus(latestRapport.id, domaineId),
    loadInscriptionsClubs(fetchIds),
    loadInscriptionsOfppt(fetchIds),
    loadActivitesSensibilisation(fetchIds),
    loadPortesOuvertes(fetchIds),
    loadFormationCadres(fetchIds),
    loadMiseAJourReseau(fetchIds),
    loadRessourcesHumaines(fetchIds),
    loadIntegrationLaureates(fetchIds),
    loadActivitesGeneratricesRevenus(fetchIds),
    loadCentresEcoute(fetchIds),
    loadSuiviPartenariats(fetchIds),
    loadSecteurs(),
    loadFilieres(),
  ]);
  const inscriptionsClubs = filterByRapportIds(clubsAll, localRapportIdSet);
  const inscriptionsOfppt = filterByRapportIds(ofpptAll, localRapportIdSet);
  const activitesSensibilisation = filterByRapportIds(sensibilisationAll, localRapportIdSet);
  const portesOuvertes = filterByRapportIds(portesOuvertesAll, localRapportIdSet);
  const formationCadres = filterByRapportIds(formationCadresAll, localRapportIdSet);
  const miseAJourReseau = filterByRapportIds(reseauAll, localRapportIdSet);
  const ressourcesHumaines = filterByRapportIds(rhAll, localRapportIdSet);
  const integrationLaureates = filterByRapportIds(laureatesAll, localRapportIdSet);
  const activitesGeneratricesRevenus = filterByRapportIds(agrAll, localRapportIdSet);
  const centresEcoute = filterByRapportIds(ecouteAll, localRapportIdSet);
  const suiviPartenariats = filterByRapportIds(partenariatsAll, localRapportIdSet);
  const regionalInscriptionsClubs = clubsAll;
  const regionalInscriptionsOfppt = ofpptAll;
  const regionalActivitesSensibilisation = sensibilisationAll;
  const regionalPortesOuvertes = portesOuvertesAll;
  const regionalIntegrationLaureates = laureatesAll;
  const regionalActivitesGeneratricesRevenus = agrAll;
  const regionalCentresEcoute = ecouteAll;
  const regionalSuiviPartenariats = partenariatsAll;

  const regionalAverage = averageDirectionalKpis(
    regionalDirectionIds
      .map((regionalDirectionId) => {
        const ids = regionalRapportIdsByDirection.get(regionalDirectionId);
        if (!ids || ids.size === 0) return null;
        return buildKpis(
          regionalInscriptionsClubs.filter((row) => row.rapport_id && ids.has(row.rapport_id)),
          regionalInscriptionsOfppt.filter((row) => row.rapport_id && ids.has(row.rapport_id)),
          regionalIntegrationLaureates.filter((row) => row.rapport_id && ids.has(row.rapport_id)),
          regionalActivitesSensibilisation.filter((row) => row.rapport_id && ids.has(row.rapport_id)),
          regionalPortesOuvertes.filter((row) => row.rapport_id && ids.has(row.rapport_id)),
          regionalActivitesGeneratricesRevenus.filter((row) => row.rapport_id && ids.has(row.rapport_id)),
          regionalCentresEcoute.filter((row) => row.rapport_id && ids.has(row.rapport_id)),
          regionalSuiviPartenariats.filter((row) => row.rapport_id && ids.has(row.rapport_id)),
        );
      })
      .filter((value): value is AffairesFemininesKpisRaw => value !== null),
  ) as Partial<Record<keyof AffairesFemininesKpisRaw, number>>;

  const kpis = buildKpis(
    inscriptionsClubs,
    inscriptionsOfppt,
    integrationLaureates,
    activitesSensibilisation,
    portesOuvertes,
    activitesGeneratricesRevenus,
    centresEcoute,
    suiviPartenariats,
  );

  const workflowStatus = status?.statut || (latestRapport.statut_rapport === "VALIDE"
    ? "TERMINE"
    : latestRapport.statut_rapport === "NON_COMMENCE"
      ? "NON_COMMENCE"
      : "EN_COURS");
  const progressPct = status?.progression_pourcentage ?? (workflowStatus === "TERMINE" ? 100 : workflowStatus === "EN_COURS" ? 50 : 0);

  return {
    status: {
      workflowStatus,
      progressPct,
      lastUpdated: status?.updated_at ?? latestRapport.updated_at,
      correctionComment: latestRapport.commentaire_correction ?? null,
      reportStatus: latestRapport.statut_rapport,
    },
    kpis,
section3: buildSection3(inscriptionsOfppt, secteurs, activitesSensibilisation, lang),
    evolution: buildEvolution(
      rapportTrimestreById,
      integrationLaureates,
      activitesGeneratricesRevenus,
      centresEcoute,
      suiviPartenariats,
    ),
    benchmark: buildBenchmark(kpis, regionalAverage),
    detailed: buildDetailed(
      inscriptionsClubs,
      inscriptionsOfppt,
      integrationLaureates,
      activitesGeneratricesRevenus,
      activitesSensibilisation,
      portesOuvertes,
      centresEcoute,
      ressourcesHumaines,
      formationCadres,
      miseAJourReseau,
suiviPartenariats,
      secteurs,
      filieres,
      lang,
    ),
  };
};