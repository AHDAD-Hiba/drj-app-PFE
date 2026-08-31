import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import type { RegionalDashboardData, RegionalStatus } from "./types";

// --- Service régional Affaires Féminines (FEMME) ---
//
// Suit exactement le même pattern que infrastructureRegionalService.ts :
// agrégation régionale et par direction faite entièrement en TypeScript,
// à partir des tables métier brutes af_* (aucune vue SQL régionale dédiée
// n'existe pour ce domaine, contrairement à Jeunesse).
//
// Relation exploitée, identique à Infrastructure :
//   af_* .rapport_id -> rapports.id -> rapports.direction_id -> directions.id
//
// Les 6 KPI et les 2 visualisations/2 évolutions reprennent exactement les
// formules déjà utilisées et validées au niveau préfectoral dans
// PrefDomainDashboardAffairesFemininesDataService.ts (buildKpis, buildSection3,
// buildEvolution, buildDetailed), simplement ré-agrégées sur toutes les
// directions de la région au lieu d'une seule.
//
// Score : formule interne existante (FEMME_SCORE_WEIGHTS), exposée via
// comparison.score.methodology — pas une méthodologie régionale universelle.

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
type RapportRow = Pick<Database["public"]["Tables"]["rapports"]["Row"], "id" | "direction_id" | "statut_rapport" | "trimestre">;
type DirectionRow = Pick<Database["public"]["Tables"]["directions"]["Row"], "id" | "nom_fr" | "nom_ar">;

// --- Types exposés (consommés par AffairesFemininesRegionalSections.tsx) ---

export interface FemmeRegionalKpis {
  /** Σ inscrites_annee_2 (clubs) + Σ inscrites_annee_2 (OFPPT) */
  totalInscriptionsFormation: number;
  /** Σ nombre_integrees / Σ nombre_laureates × 100 (%) — ratio recalculé sur les sommes régionales, jamais moyenne des taux par direction */
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

export interface FemmeFormationSecteurDatum {
  secteurId: string;
  nom: string;
  total: number;
}

export interface FemmeUrbainRuralDatum {
  name: string; // "Urbain" | "Rural"
  urbain: number;
  rural: number;
  total: number;
  urbainPct: number;
  ruralPct: number;
}

export interface FemmeSection3Data {
  formationParSecteur: FemmeFormationSecteurDatum[];
  urbainRural: FemmeUrbainRuralDatum[];
}

export interface FemmeEvolutionIntegrationDatum {
  trimestre: string; // "t1".."t4"
  laureates: number | null;
  integrees: number | null;
}

export interface FemmeEvolutionActiviteSocialeDatum {
  trimestre: string; // "t1".."t4"
  beneficiairesAgr: number | null;
  seancesCentresEcoute: number | null;
  partenariatsSuivis: number | null;
}

export interface FemmeSection6Data {
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

export interface FemmeRegionalData {
  kpis: FemmeRegionalKpis;
  section3: FemmeSection3Data;
  evolution: {
    integration: FemmeEvolutionIntegrationDatum[];
    activiteSociale: FemmeEvolutionActiviteSocialeDatum[];
  };
  detailed: FemmeSection6Data;
}

export type FemmeRegionalDashboardData = RegionalDashboardData<
  FemmeRegionalKpis,
  FemmeSection3Data,
  FemmeRegionalData["evolution"],
  FemmeSection6Data
>;

interface FemmeDirectionData {
  id: string;
  nom_fr: string | null;
  statut: RegionalStatus;
  score: number;
  rang_regional: number;
  metric_primary: number;
  metric_secondary: number;
}

// --- Helpers d'agrégation (privés, mêmes formules que le service préfectoral) ---

const sumBy = <T,>(rows: T[], selector: (row: T) => number | null | undefined): number =>
  rows.reduce((acc, row) => acc + (selector(row) || 0), 0);

const ratioPct = (numerator: number, denominator: number): number =>
  denominator > 0 ? (numerator / denominator) * 100 : 0;

const TRIMESTRES = ["t1", "t2", "t3", "t4"] as const;

const toRegionalStatus = (statut: RapportRow["statut_rapport"]): RegionalStatus => {
  if (statut === "VALIDE") return "TERMINE";
  if (statut === "NON_COMMENCE") return "NON_COMMENCE";
  return "EN_COURS";
};

/**
 * Statut par direction — pattern directionStatus repris à l'identique
 * d'infrastructureRegionalService.ts.
 */
const directionStatus = (rapports: RapportRow[]): RegionalStatus => {
  if (rapports.length === 0 || rapports.every((rapport) => rapport.statut_rapport === "NON_COMMENCE")) {
    return "NON_COMMENCE";
  }
  return rapports.every((rapport) => rapport.statut_rapport === "VALIDE") ? "TERMINE" : "EN_COURS";
};

const secteurLabel = (secteur: AfSecteursRow | undefined, fallback: string, lang: string = "fr"): string =>
  secteur ? (lang === "ar" ? secteur.nom_ar || secteur.nom_fr : secteur.nom_fr || secteur.nom_ar) || fallback : fallback;

const filiereLabel = (filiere: AfFilieresRow | undefined, fallback: string, lang: string = "fr"): string =>
  filiere ? (lang === "ar" ? filiere.nom_ar || filiere.nom_fr : filiere.nom_fr || filiere.nom_ar) || fallback : fallback;

// --- Requêtes Supabase (privées) ---

const loadAllRows = async <T>(table: string, rapportIds: string[]): Promise<T[]> => {
  if (rapportIds.length === 0) return [];
  const { data, error } = await supabase.from(table as any).select("*").in("rapport_id", rapportIds);
  if (error) {
    // Pattern d'erreur identique à Infrastructure : on ne masque pas
    // l'erreur, mais on ne casse pas le dashboard régional pour autant —
    // la table est simplement considérée vide pour ce chargement.
    console.error(`[femmeRegionalService] Erreur lors du chargement de ${table} :`, error);
    return [];
  }
  return (data ?? []) as T[];
};

// --- Construction des KPI régionaux (6 KPI, mêmes formules que buildKpis préfectoral) ---

const buildKpis = (
  inscriptionsClubs: AfInscriptionsClubsRow[],
  inscriptionsOfppt: AfInscriptionsOfpptRow[],
  integrationLaureates: AfIntegrationLaureatesRow[],
  activitesSensibilisation: AfActivitesSensibilisationRow[],
  portesOuvertes: AfPortesOuvertesRow[],
  activitesGeneratricesRevenus: AfActivitesGeneratricesRevenusRow[],
  centresEcoute: AfCentresEcouteRow[],
  suiviPartenariats: AfSuiviPartenariatsRow[],
): FemmeRegionalKpis => {
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
    // Ratio recalculé sur les sommes régionales — jamais une moyenne des
    // taux par direction (voir en-tête du fichier).
    tauxIntegrationLaureates: ratioPct(totalIntegrees, totalLaureates),
    totalBeneficiairesSensibilisationPortesOuvertes: sensibilisationTotal + portesOuvertesTotal,
    totalBeneficiairesAgr: sumBy(activitesGeneratricesRevenus, (r) => r.nombre_beneficiaires),
    totalPartenariatsSuivis: suiviPartenariats.length,
    totalSeancesCentresEcoute: sumBy(centresEcoute, (r) => r.nombre_seances),
  };
};

interface FemmeScoreKpis {
  totalInscriptionsFormation: number;
  tauxIntegrationLaureates: number;
  totalBeneficiairesSensibilisationPortesOuvertes: number;
  totalBeneficiairesAgr: number;
  totalPartenariatsSuivis: number;
  totalSeancesCentresEcoute: number;
}

const FEMME_SCORE_WEIGHTS = {
  totalInscriptionsFormation: 25,
  tauxIntegrationLaureates: 20,
  totalBeneficiairesSensibilisationPortesOuvertes: 15,
  totalBeneficiairesAgr: 15,
  totalPartenariatsSuivis: 12.5,
  totalSeancesCentresEcoute: 12.5,
} as const;

const clampScore = (score: number) =>
  Number.isFinite(score) ? Math.max(0, Math.min(100, score)) : 0;

const relativeKpiScore = (directionValue: number, regionalValue: number) =>
  regionalValue > 0 ? (directionValue / regionalValue) * 100 : 0;

const calculateFemmeScore = (
  directionKpis: FemmeScoreKpis,
  regionalKpis: FemmeScoreKpis,
  isActive: boolean,
) => {
  if (!isActive) return 0;

  const scores = (Object.keys(FEMME_SCORE_WEIGHTS) as Array<keyof FemmeScoreKpis>).map((kpi) =>
    relativeKpiScore(directionKpis[kpi], regionalKpis[kpi]) * (FEMME_SCORE_WEIGHTS[kpi] / 100),
  );

  return clampScore(scores.reduce((total, score) => total + score, 0));
};

// --- Construction des KPI par direction ---

const kpisForRows = (
  inscriptionsClubs: AfInscriptionsClubsRow[],
  inscriptionsOfppt: AfInscriptionsOfpptRow[],
  integrationLaureates: AfIntegrationLaureatesRow[],
  activitesSensibilisation: AfActivitesSensibilisationRow[],
  portesOuvertes: AfPortesOuvertesRow[],
  activitesGeneratricesRevenus: AfActivitesGeneratricesRevenusRow[],
  centresEcoute: AfCentresEcouteRow[],
  suiviPartenariats: AfSuiviPartenariatsRow[],
) => {
  const totalInscriptions =
    sumBy(inscriptionsClubs, (r) => r.inscrites_annee_2) + sumBy(inscriptionsOfppt, (r) => r.inscrites_annee_2);
  const totalLaureates = sumBy(integrationLaureates, (r) => r.nombre_laureates);
  const totalIntegrees = sumBy(integrationLaureates, (r) => r.nombre_integrees);
  const totalBeneficiairesSensibilisationPortesOuvertes =
    sumBy(activitesSensibilisation, (r) => (r.benef_urbain || 0) + (r.benef_rural || 0)) +
    sumBy(portesOuvertes, (r) => r.nombre_beneficiaires);
  const totalBeneficiaires =
    sumBy(activitesSensibilisation, (r) => (r.benef_urbain || 0) + (r.benef_rural || 0)) +
    sumBy(portesOuvertes, (r) => r.nombre_beneficiaires) +
    sumBy(activitesGeneratricesRevenus, (r) => r.nombre_beneficiaires);
  return {
    totalInscriptions,
    totalBeneficiaires,
    scoreKpis: {
      totalInscriptionsFormation: totalInscriptions,
      tauxIntegrationLaureates: ratioPct(totalIntegrees, totalLaureates),
      totalBeneficiairesSensibilisationPortesOuvertes,
      totalBeneficiairesAgr: sumBy(activitesGeneratricesRevenus, (r) => r.nombre_beneficiaires),
      totalPartenariatsSuivis: suiviPartenariats.length,
      totalSeancesCentresEcoute: sumBy(centresEcoute, (r) => r.nombre_seances),
    } satisfies FemmeScoreKpis,
  };
};

// --- Construction des visualisations Section 3 ---

const buildSection3 = (
  inscriptionsOfppt: AfInscriptionsOfpptRow[],
  secteurs: AfSecteursRow[],
  activitesSensibilisation: AfActivitesSensibilisationRow[],
  lang: string = "fr",
): FemmeSection3Data => {
  const secteurById = new Map(secteurs.map((s) => [s.id, s]));
  const bySecteur = new Map<string, number>();
  inscriptionsOfppt.forEach((r) => {
    if (!r.secteur_id) return;
    bySecteur.set(r.secteur_id, (bySecteur.get(r.secteur_id) || 0) + (r.inscrites_annee_2 || 0));
  });

  const formationParSecteur: FemmeFormationSecteurDatum[] = Array.from(bySecteur.entries())
    .map(([secteurId, total]) => ({
      secteurId,
      nom: secteurLabel(secteurById.get(secteurId), secteurId, lang),
      total,
    }))
    .sort((a, b) => b.total - a.total);

  const urbain = sumBy(activitesSensibilisation, (r) => r.benef_urbain);
  const rural = sumBy(activitesSensibilisation, (r) => r.benef_rural);
  const total = urbain + rural;

  const urbainRural: FemmeUrbainRuralDatum[] = [
    { name: "Urbain", urbain, rural: 0, total, urbainPct: total > 0 ? (urbain / total) * 100 : 0, ruralPct: 0 },
    { name: "Rural", urbain: 0, rural, total, urbainPct: 0, ruralPct: total > 0 ? (rural / total) * 100 : 0 },
  ];

  return { formationParSecteur, urbainRural };
};

// --- Construction des évolutions Section 4 ---
//
// Règle stricte (identique à buildEvolutionFinanciere/buildEvolutionProjets
// d'Infrastructure) : un trimestre reste `null` uniquement si aucun rapport
// n'a été soumis pour ce trimestre sur toute la région ; s'il existe au
// moins un rapport mais aucune ligne af_* pour ce trimestre, la valeur
// réelle est 0.

const buildEvolution = (
  integrationLaureates: AfIntegrationLaureatesRow[],
  activitesGeneratricesRevenus: AfActivitesGeneratricesRevenusRow[],
  centresEcoute: AfCentresEcouteRow[],
  suiviPartenariats: AfSuiviPartenariatsRow[],
  trimestreByRapport: Map<string, string | null>,
  trimestresAvecRapport: Set<string>,
) => {
  const rowsForTrimestre = <T extends { rapport_id: string | null }>(rows: T[], trimestre: string) =>
    rows.filter((row) => row.rapport_id && trimestreByRapport.get(row.rapport_id) === trimestre);

  const integration: FemmeEvolutionIntegrationDatum[] = TRIMESTRES.map((trimestre) => {
    if (!trimestresAvecRapport.has(trimestre)) {
      return { trimestre, laureates: null, integrees: null };
    }
    const rows = rowsForTrimestre(integrationLaureates, trimestre);
    return {
      trimestre,
      laureates: sumBy(rows, (r) => r.nombre_laureates),
      integrees: sumBy(rows, (r) => r.nombre_integrees),
    };
  });

  const activiteSociale: FemmeEvolutionActiviteSocialeDatum[] = TRIMESTRES.map((trimestre) => {
    if (!trimestresAvecRapport.has(trimestre)) {
      return { trimestre, beneficiairesAgr: null, seancesCentresEcoute: null, partenariatsSuivis: null };
    }
    const agrRows = rowsForTrimestre(activitesGeneratricesRevenus, trimestre);
    const ecouteRows = rowsForTrimestre(centresEcoute, trimestre);
    const partenariatsRows = rowsForTrimestre(suiviPartenariats, trimestre);
    return {
      trimestre,
      beneficiairesAgr: sumBy(agrRows, (r) => r.nombre_beneficiaires),
      seancesCentresEcoute: sumBy(ecouteRows, (r) => r.nombre_seances),
      partenariatsSuivis: partenariatsRows.length,
    };
  });

  return { integration, activiteSociale };
};

// --- Construction des blocs détaillés Section 6 (6 blocs, mêmes formules que buildDetailed préfectoral) ---

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
  lang: string = "fr",
): FemmeSection6Data => {
  const filiereById = new Map(filieres.map((f) => [f.id, f]));
  const secteurById = new Map(secteurs.map((s) => [s.id, s]));

  const inscriptionsByFiliere = new Map<string, number>();
  [...inscriptionsClubs, ...inscriptionsOfppt].forEach((r) => {
    if (!r.filiere_id) return;
    inscriptionsByFiliere.set(r.filiere_id, (inscriptionsByFiliere.get(r.filiere_id) || 0) + (r.inscrites_annee_2 || 0));
  });
  const parFiliere = Array.from(inscriptionsByFiliere.entries())
    .map(([filiereId, inscriptions]) => ({ filiere: filiereLabel(filiereById.get(filiereId), filiereId, lang), inscriptions }))
    .sort((a, b) => b.inscriptions - a.inscriptions);

  const inscriptionsBySecteur = new Map<string, number>();
  inscriptionsOfppt.forEach((r) => {
    if (!r.secteur_id) return;
    inscriptionsBySecteur.set(r.secteur_id, (inscriptionsBySecteur.get(r.secteur_id) || 0) + (r.inscrites_annee_2 || 0));
  });
  const parSecteur = Array.from(inscriptionsBySecteur.entries())
    .map(([secteurId, inscriptions]) => ({ secteur: secteurLabel(secteurById.get(secteurId), secteurId, lang), inscriptions }))
    .sort((a, b) => b.inscriptions - a.inscriptions);

  const inscriptionsByNiveau = new Map<string, number>();
  inscriptionsOfppt.forEach((r) => {
    if (!r.niveau_formation) return;
    inscriptionsByNiveau.set(r.niveau_formation, (inscriptionsByNiveau.get(r.niveau_formation) || 0) + (r.inscrites_annee_2 || 0));
  });
  const parNiveau = Array.from(inscriptionsByNiveau.entries())
    .map(([niveau, inscriptions]) => ({ niveau, inscriptions }))
    .sort((a, b) => b.inscriptions - a.inscriptions);

  const totalLaureates = sumBy(integrationLaureates, (r) => r.nombre_laureates);
  const totalIntegrees = sumBy(integrationLaureates, (r) => r.nombre_integrees);
  const partenairesAgr = Array.from(
    new Set(activitesGeneratricesRevenus.map((r) => r.partenaires).filter((p): p is string => !!p && p.trim().length > 0)),
  );

  const totalUrbain = sumBy(activitesSensibilisation, (r) => r.benef_urbain);
  const totalRural = sumBy(activitesSensibilisation, (r) => r.benef_rural);
  const totalBenefActivites = sumBy(activitesSensibilisation, (r) => (r.benef_urbain || 0) + (r.benef_rural || 0));

  const ecouteByType = new Map<string, number>();
  centresEcoute.forEach((r) => {
    const type = r.type_soutien?.trim() || "non_precise";
    ecouteByType.set(type, (ecouteByType.get(type) || 0) + 1);
  });

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

  const mouvementsByType = new Map<string, number>();
  miseAJourReseau.forEach((r) => {
    const type = r.type_mise_a_jour || "non_precise";
    mouvementsByType.set(type, (mouvementsByType.get(type) || 0) + 1);
  });
  const sujetsPartenariats = Array.from(
    new Set(suiviPartenariats.map((r) => r.sujet_partenariat).filter((s): s is string => !!s && s.trim().length > 0)),
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
      ressourcesDisponibles: sumBy(ressourcesHumaines.filter((r) => r.type_rh === "disponible"), (r) => r.nombre),
      ressourcesBesoin: sumBy(ressourcesHumaines.filter((r) => r.type_rh === "besoin"), (r) => r.nombre),
      parProfil: Array.from(rhProfileCounts.entries()).map(([profil, nombre]) => ({ profil, nombre })),
      cadresFormes: sumBy(formationCadres, (r) => r.nombre_cadres),
      parDomaineFormation: Array.from(cadresByDomaine.entries()).map(([domaine, cadres]) => ({ domaine, cadres })),
    },
    reseauPartenariats: {
      mouvements: Array.from(mouvementsByType.entries()).map(([type, count]) => ({ type, count })),
      partenariatsSuivis: suiviPartenariats.length,
      sujetsPartenariats,
    },
  };
};

/**
 * Charge les données annuelles régionales Affaires Féminines (FEMME) à
 * partir du chemin réel af_* -> rapports -> directions.
 * Le score par direction est calculé avec FEMME_SCORE_WEIGHTS (voir comparison.score).
 */
export async function loadFemmeRegionalDashboard(year: number, lang: string = "fr"): Promise<FemmeRegionalDashboardData> {
  const [directionsResult, rapportsResult, secteursResult, filieresResult] = await Promise.all([
    supabase.from("directions").select("id, nom_fr, nom_ar"),
    supabase.from("rapports").select("id, direction_id, statut_rapport, trimestre").eq("annee", year),
    supabase.from("af_secteurs").select("*"),
    supabase.from("af_filieres").select("*"),
  ]);

  const directions = (directionsResult.data ?? []) as DirectionRow[];
  const rapports = (rapportsResult.data ?? []) as RapportRow[];
  const secteurs = (secteursResult.data ?? []) as AfSecteursRow[];
  const filieres = (filieresResult.data ?? []) as AfFilieresRow[];
  const rapportIds = rapports.map((rapport) => rapport.id);

  const [
    inscriptionsClubs,
    inscriptionsOfppt,
    activitesSensibilisation,
    portesOuvertes,
    formationCadres,
    miseAJourReseau,
    ressourcesHumaines,
    integrationLaureates,
    activitesGeneratricesRevenus,
    centresEcoute,
    suiviPartenariats,
  ] = await Promise.all([
    loadAllRows<AfInscriptionsClubsRow>("af_inscriptions_clubs", rapportIds),
    loadAllRows<AfInscriptionsOfpptRow>("af_inscriptions_ofppt", rapportIds),
    loadAllRows<AfActivitesSensibilisationRow>("af_activites_sensibilisation", rapportIds),
    loadAllRows<AfPortesOuvertesRow>("af_portes_ouvertes", rapportIds),
    loadAllRows<AfFormationCadresRow>("af_formation_cadres", rapportIds),
    loadAllRows<AfMiseAJourReseauRow>("af_mise_a_jour_reseau", rapportIds),
    loadAllRows<AfRessourcesHumainesRow>("af_ressources_humaines", rapportIds),
    loadAllRows<AfIntegrationLaureatesRow>("af_integration_laureates", rapportIds),
    loadAllRows<AfActivitesGeneratricesRevenusRow>("af_activites_generatrices_revenus", rapportIds),
    loadAllRows<AfCentresEcouteRow>("af_centres_ecoute", rapportIds),
    loadAllRows<AfSuiviPartenariatsRow>("af_suivi_partenariats", rapportIds),
  ]);

  // --- Regroupement par direction (pattern rapportsByDirection / rowsForDirection d'Infrastructure) ---
  const rapportsByDirection = new Map<string, RapportRow[]>();
  rapports.forEach((rapport) => {
    if (!rapport.direction_id) return;
    const directionRapports = rapportsByDirection.get(rapport.direction_id) ?? [];
    directionRapports.push(rapport);
    rapportsByDirection.set(rapport.direction_id, directionRapports);
  });
  const rapportIdsByDirection = new Map(
    Array.from(rapportsByDirection, ([directionId, directionRapports]) => [directionId, new Set(directionRapports.map((r) => r.id))]),
  );
  const rowsForDirection = <T extends { rapport_id: string | null }>(rows: T[], directionId: string): T[] => {
    const ids = rapportIdsByDirection.get(directionId);
    return ids ? rows.filter((row) => row.rapport_id && ids.has(row.rapport_id)) : [];
  };

  // --- KPI régionaux (6 KPI) ---
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

  // --- Section 3 (2 visualisations) ---
  const section3 = buildSection3(inscriptionsOfppt, secteurs, activitesSensibilisation, lang);

  // --- Section 4 (2 évolutions trimestrielles) ---
  const trimestreByRapport = new Map<string, string | null>(rapports.map((r) => [r.id, r.trimestre]));
  const trimestresAvecRapport = new Set(
    rapports.map((r) => r.trimestre).filter((t): t is NonNullable<typeof t> => Boolean(t)),
  );
  const evolution = buildEvolution(
    integrationLaureates,
    activitesGeneratricesRevenus,
    centresEcoute,
    suiviPartenariats,
    trimestreByRapport,
    trimestresAvecRapport,
  );

  // --- Section 6 (6 blocs détaillés) ---
  const detailed = buildDetailed(
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
  );

  // --- Performance par direction : KPI, score et classement régional ---
  const directionsData: FemmeDirectionData[] = directions.map((direction) => {
    const directionReports = rapportsByDirection.get(direction.id) ?? [];
    const status = directionStatus(directionReports);
    const { totalInscriptions, totalBeneficiaires, scoreKpis } = kpisForRows(
      rowsForDirection(inscriptionsClubs, direction.id),
      rowsForDirection(inscriptionsOfppt, direction.id),
      rowsForDirection(integrationLaureates, direction.id),
      rowsForDirection(activitesSensibilisation, direction.id),
      rowsForDirection(portesOuvertes, direction.id),
      rowsForDirection(activitesGeneratricesRevenus, direction.id),
      rowsForDirection(centresEcoute, direction.id),
      rowsForDirection(suiviPartenariats, direction.id),
    );
    const isActive = Object.values(scoreKpis).some((value) => value > 0);

    return {
      id: direction.id,
      nom_fr: direction.nom_fr,
      nom: direction.nom_fr,
      statut: status,
      score: calculateFemmeScore(scoreKpis, kpis, isActive && status !== "NON_COMMENCE"),
      rang_regional: 99,
      metric_primary: totalInscriptions,
      metric_secondary: totalBeneficiaires,
    };
  });

  directionsData.sort((left, right) => right.score - left.score);
  let rankableIndex = 0;
  directionsData.forEach((direction, index) => {
    if (direction.score <= 0 || direction.statut === "NON_COMMENCE") return;
    rankableIndex += 1;
    direction.rang_regional = index > 0 && direction.score === directionsData[index - 1].score
      ? directionsData[index - 1].rang_regional
      : rankableIndex;
  });

  const completedDirections = directionsData.filter((direction) => direction.statut === "TERMINE").length;
  const inProgressDirections = directionsData.filter((direction) => direction.statut === "EN_COURS").length;
  return {
    status: { hasData: rapportIds.length > 0, submittedReports: rapports.length, completedDirections, inProgressDirections, notStartedDirections: directionsData.length - completedDirections - inProgressDirections },
    kpis,
    section3,
    evolution,
    detailed,
    comparison: {
      directions: directionsData.map((direction) => ({ id: direction.id, name: direction.nom_fr || `Direction ${direction.id}`, status: direction.statut, primary: direction.metric_primary, secondary: direction.metric_secondary, rank: direction.rang_regional < 99 ? direction.rang_regional : null, score: direction.score })),
      primary: { key: "inscriptions_formation", label: "Inscriptions en formation", regionalAverage: directionsData.length ? kpis.totalInscriptionsFormation / directionsData.length : null },
      secondary: { key: "beneficiaires_accompagnes", label: "Bénéficiaires accompagnés", regionalAverage: directionsData.length ? directionsData.reduce((total, direction) => total + direction.metric_secondary, 0) / directionsData.length : null },
      score: { label: "Score Affaires Féminines", methodology: "Pondération existante : inscriptions formation 25 %, taux d'intégration 20 %, sensibilisation/portes ouvertes 15 %, AGR 15 %, partenariats 12,5 %, séances d'écoute 12,5 %. Score relatif à la région, borné 0–100." },
    },
  };
}
