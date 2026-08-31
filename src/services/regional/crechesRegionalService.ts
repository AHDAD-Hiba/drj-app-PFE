import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import type { RegionalDashboardData, RegionalStatus } from "./types";

// --- Service régional Crèche / Enfance Crèches (code domaine réel : "CRECHES") ---
//
// Suit exactement le même pattern que peRegionalService.ts / femmeRegionalService.ts :
// agrégation régionale et par direction faite entièrement en TypeScript, à partir
// des tables métier brutes cr_* (aucune vue SQL régionale dédiée n'existe pour ce
// domaine).
//
// Relation exploitée, identique à PE/Femme :
//   cr_*.rapport_id -> rapports.id -> rapports.direction_id -> directions.id
//
// Structure validée avant implémentation (analyse structurelle préalable) :
//   Section 2 — 6 KPI (formules reprises à l'identique de
//     PrefDomainDashboardEnfanceCrechesDataService.ts, buildKpis)
//   Section 3 — PieChart Demandes de licences par statut (consolidation
//     régionale d'une répartition déjà existante au Préfectoral, agrégée sur
//     toutes les directions)
//     (consolidation régionale des demandes par statut)
//   Section 4 — 2 évolutions trimestrielles (enfants garçons/filles,
//     fermetures/réouvertures)
//   Section 5 — Performance des Directions (générique, alimentée via
//     metric_primary/metric_secondary)
//   Section 6 — supprimée (détails déjà disponibles au niveau préfectoral,
//     aucune valeur ajoutée régionale identifiée lors de l'analyse)
//
// ⚠️ KPI 3 (délai moyen de traitement) : `delai_moyen_traitement_jours` est une
// colonne renseignée directement en jours par ligne cr_traitement_licences,
// sans numérateur/dénominateur pondérable dans le schéma. Le Préfectoral
// utilise déjà une moyenne simple des lignes renseignées (voir buildKpis dans
// PrefDomainDashboardEnfanceCrechesDataService.ts) — même formule reproduite
// ici, sans pondération inventée (comportement identique à PE pour
// tauxPreparationIntegrationMoyen).
//
type CrStatistiquesEnfantsRow = Database["public"]["Tables"]["cr_statistiques_enfants"]["Row"];
type CrTraitementLicencesRow = Database["public"]["Tables"]["cr_traitement_licences"]["Row"];
type CrCadresAssermentesRow = Database["public"]["Tables"]["cr_cadres_assermentes"]["Row"];
type CrLabelQualiteRow = Database["public"]["Tables"]["cr_label_qualite"]["Row"];
type CrMouvementsFermeturesRow = Database["public"]["Tables"]["cr_mouvements_fermetures"]["Row"];
type CrDemandesLicencesRow = Database["public"]["Tables"]["cr_demandes_licences"]["Row"];
type RefCrStatutsDemandeRow = Database["public"]["Tables"]["ref_cr_statuts_demande"]["Row"];
type RapportRow = Pick<Database["public"]["Tables"]["rapports"]["Row"], "id" | "direction_id" | "statut_rapport" | "trimestre">;
type DirectionRow = Pick<Database["public"]["Tables"]["directions"]["Row"], "id" | "nom_fr" | "nom_ar">;

// --- Types exposés (consommés par EnfanceCrechesRegionalSections.tsx) ---

export interface CrechesRegionalKpis {
  /** KPI 1 — Σ (garcons + filles) — cr_statistiques_enfants */
  enfantsPrisesEnCharge: number;
  /** KPI 2 — Σ nombre_demandes_traitees — cr_traitement_licences */
  demandesLicencesTraitees: number;
  /** KPI 3 — moyenne de delai_moyen_traitement_jours (lignes renseignées uniquement, toutes directions) — ⚠️ voir en-tête du fichier */
  delaiMoyenTraitementJours: number;
  /** KPI 4 — Σ nombre_cadres — cr_cadres_assermentes */
  cadresAssermentes: number;
  /** KPI 5 — COUNT(statut_label = 'obtenue') — cr_label_qualite */
  crechesLabelliseesQualite: number;
  /** KPI 6 — Σ nombre_creches (type_mouvement = 'fermeture') — cr_mouvements_fermetures */
  fermeturesCrechesSignalees: number;
}

/** Visualisation 1 de Section3 : demandes de licences par statut, consolidé région */
export interface CrechesDemandesStatutDatum {
  id: string;
  /** libellé déjà résolu (fr avec repli ar) depuis ref_cr_statuts_demande */
  name: string;
  value: number;
}

export interface CrechesSection3Data {
  demandesParStatut: CrechesDemandesStatutDatum[];
}

/** Évolution 1 de Section4 : enfants garçons vs filles par trimestre */
export interface CrechesEvolutionEnfantsDatum {
  trimestre: string; // "t1".."t4"
  garcons: number | null;
  filles: number | null;
}

/** Évolution 2 de Section4 : fermetures vs réouvertures par trimestre */
export interface CrechesEvolutionMouvementsDatum {
  trimestre: string; // "t1".."t4"
  fermetures: number | null;
  reouvertures: number | null;
}

export interface CrechesRegionalData {
  kpis: CrechesRegionalKpis;
  section3: CrechesSection3Data;
  evolution: {
    enfants: CrechesEvolutionEnfantsDatum[];
    mouvements: CrechesEvolutionMouvementsDatum[];
  };
}

export type CrechesRegionalDashboardData = RegionalDashboardData<
  CrechesRegionalKpis,
  CrechesSection3Data,
  CrechesRegionalData["evolution"]
>;

interface CrechesDirectionData {
  id: string;
  nom_fr: string | null;
  statut: RegionalStatus;
  score: number;
  rang_regional: number;
  metric_primary: number;
  metric_secondary: number;
}

interface CrechesScoreKpis {
  enfantsPrisesEnCharge: number;
  demandesLicencesTraitees: number;
  delaiMoyenTraitementJours: number;
  cadresAssermentes: number;
  crechesLabelliseesQualite: number;
  fermeturesCrechesSignalees: number;
}

const CRECHES_SCORE_WEIGHTS = {
  enfantsPrisesEnCharge: 25,
  demandesLicencesTraitees: 20,
  delaiMoyenTraitementJours: 15,
  cadresAssermentes: 15,
  crechesLabelliseesQualite: 12.5,
  fermeturesCrechesSignalees: 12.5,
} as const;

const clampScore = (score: number) =>
  Number.isFinite(score) ? Math.max(0, Math.min(100, score)) : 0;

const positiveKpiScore = (directionValue: number, regionalValue: number) =>
  regionalValue > 0 ? (directionValue / regionalValue) * 100 : 0;

const negativeKpiScore = (directionValue: number, regionalValue: number) =>
  regionalValue > 0 ? (directionValue > 0 ? (regionalValue / directionValue) * 100 : 100) : 100;

const calculateCrechesScore = (
  directionKpis: CrechesScoreKpis,
  regionalKpis: CrechesScoreKpis,
  isActive: boolean,
) => {
  if (!isActive) return 0;

  const score =
    positiveKpiScore(directionKpis.enfantsPrisesEnCharge, regionalKpis.enfantsPrisesEnCharge) * (CRECHES_SCORE_WEIGHTS.enfantsPrisesEnCharge / 100) +
    positiveKpiScore(directionKpis.demandesLicencesTraitees, regionalKpis.demandesLicencesTraitees) * (CRECHES_SCORE_WEIGHTS.demandesLicencesTraitees / 100) +
    negativeKpiScore(directionKpis.delaiMoyenTraitementJours, regionalKpis.delaiMoyenTraitementJours) * (CRECHES_SCORE_WEIGHTS.delaiMoyenTraitementJours / 100) +
    positiveKpiScore(directionKpis.cadresAssermentes, regionalKpis.cadresAssermentes) * (CRECHES_SCORE_WEIGHTS.cadresAssermentes / 100) +
    positiveKpiScore(directionKpis.crechesLabelliseesQualite, regionalKpis.crechesLabelliseesQualite) * (CRECHES_SCORE_WEIGHTS.crechesLabelliseesQualite / 100) +
    negativeKpiScore(directionKpis.fermeturesCrechesSignalees, regionalKpis.fermeturesCrechesSignalees) * (CRECHES_SCORE_WEIGHTS.fermeturesCrechesSignalees / 100);

  return clampScore(score);
};

// --- Helpers d'agrégation (privés, mêmes formules que le service préfectoral) ---

const sumBy = <T,>(rows: T[], selector: (row: T) => number | null | undefined): number =>
  rows.reduce((acc, row) => acc + (selector(row) || 0), 0);

const average = (values: number[]): number =>
  values.length === 0 ? 0 : values.reduce((acc, v) => acc + v, 0) / values.length;

const TRIMESTRES = ["t1", "t2", "t3", "t4"] as const;

const toRegionalStatus = (statut: RapportRow["statut_rapport"]): RegionalStatus => {
  if (statut === "VALIDE") return "TERMINE";
  if (statut === "NON_COMMENCE") return "NON_COMMENCE";
  return "EN_COURS";
};

/** Statut par direction — pattern directionStatus repris à l'identique de peRegionalService.ts. */
const directionStatus = (rapports: RapportRow[]): RegionalStatus => {
  if (rapports.length === 0 || rapports.every((rapport) => rapport.statut_rapport === "NON_COMMENCE")) {
    return "NON_COMMENCE";
  }
  return rapports.every((rapport) => rapport.statut_rapport === "VALIDE") ? "TERMINE" : "EN_COURS";
};

const kpisForRows = (
  stats: CrStatistiquesEnfantsRow[],
  traitementLicences: CrTraitementLicencesRow[],
  cadresAssermentes: CrCadresAssermentesRow[],
  labelQualite: CrLabelQualiteRow[],
  mouvementsFermetures: CrMouvementsFermeturesRow[],
): CrechesScoreKpis => ({
  enfantsPrisesEnCharge: sumBy(stats, (row) => (row.garcons || 0) + (row.filles || 0)),
  demandesLicencesTraitees: sumBy(traitementLicences, (row) => row.nombre_demandes_traitees),
  delaiMoyenTraitementJours: average(
    traitementLicences
      .map((row) => row.delai_moyen_traitement_jours)
      .filter((value): value is number => value !== null && value !== undefined),
  ),
  cadresAssermentes: sumBy(cadresAssermentes, (row) => row.nombre_cadres),
  crechesLabelliseesQualite: labelQualite.filter((row) => row.statut_label === "obtenue").length,
  fermeturesCrechesSignalees: sumBy(
    mouvementsFermetures.filter((row) => row.type_mouvement === "fermeture"),
    (row) => row.nombre_creches,
  ),
});

// --- Requêtes Supabase (privées) ---

const loadAllRows = async <T>(table: string, rapportIds: string[]): Promise<T[]> => {
  if (rapportIds.length === 0) return [];
  const { data, error } = await supabase.from(table as any).select("*").in("rapport_id", rapportIds);
  if (error) {
    // Pattern d'erreur identique à PE/Femme/Infrastructure : on ne masque pas
    // l'erreur, mais on ne casse pas le dashboard régional pour autant — la
    // table est simplement considérée vide pour ce chargement.
    console.error(`[crechesRegionalService] Erreur lors du chargement de ${table} :`, error);
    return [];
  }
  return (data ?? []) as T[];
};

// --- Construction des KPI régionaux (6 KPI, mêmes formules que buildKpis préfectoral) ---

const buildKpis = (
  stats: CrStatistiquesEnfantsRow[],
  traitementLicences: CrTraitementLicencesRow[],
  cadresAssermentes: CrCadresAssermentesRow[],
  labelQualite: CrLabelQualiteRow[],
  mouvementsFermetures: CrMouvementsFermeturesRow[],
): CrechesRegionalKpis => ({
  enfantsPrisesEnCharge: sumBy(stats, (s) => (s.garcons || 0) + (s.filles || 0)),
  demandesLicencesTraitees: sumBy(traitementLicences, (row) => row.nombre_demandes_traitees),
  // ⚠️ Moyenne simple des lignes renseignées, toutes directions confondues — voir en-tête du fichier
  delaiMoyenTraitementJours: average(
    traitementLicences.map((row) => row.delai_moyen_traitement_jours).filter((v): v is number => v !== null && v !== undefined),
  ),
  cadresAssermentes: sumBy(cadresAssermentes, (row) => row.nombre_cadres),
  crechesLabelliseesQualite: labelQualite.filter((row) => row.statut_label === "obtenue").length,
  fermeturesCrechesSignalees: sumBy(
    mouvementsFermetures.filter((row) => row.type_mouvement === "fermeture"),
    (row) => row.nombre_creches,
  ),
});

// --- Construction Section 3 (2 visualisations, consolidées sur toutes les directions) ---

const buildSection3 = (
  demandesLicences: CrDemandesLicencesRow[],
  statutsDemande: RefCrStatutsDemandeRow[],
  lang: string,
): CrechesSection3Data => {
  // --- Visualisation 1 : demandes de licences par statut (jointure ref_cr_statuts_demande) ---
  const statutById = new Map(statutsDemande.map((item) => [item.id, item]));
  const demandesByStatut = new Map<string, number>();
  demandesLicences.forEach((row) => {
    const key = row.statut_demande_id || "unknown";
    demandesByStatut.set(key, (demandesByStatut.get(key) || 0) + (row.nombre_demandes || 0));
  });
  const demandesParStatut: CrechesDemandesStatutDatum[] = Array.from(demandesByStatut.entries())
    .map(([id, value]) => {
      const ref = statutById.get(id);
      // Pattern repris de secteurLabel dans femmeRegionalService.ts : le
      // Dashboard Régional n'exposant pas encore de sélecteur de langue
      // propre, on retient le libellé français avec repli sur l'arabe.
      const name = ref
        ? lang === "ar"
          ? ref.libelle_ar || ref.libelle_fr
          : ref.libelle_fr || ref.libelle_ar
        : id;
      return { id, name, value };
    })
    .sort((a, b) => b.value - a.value);

  return { demandesParStatut };
};

// --- Construction des évolutions Section 4 ---
//
// Règle stricte (identique à peRegionalService.ts) : un trimestre reste `null`
// uniquement si aucun rapport n'a été soumis pour ce trimestre sur toute la
// région ; s'il existe au moins un rapport mais aucune ligne cr_* pour ce
// trimestre, la valeur réelle est 0.

const buildEvolution = (
  stats: CrStatistiquesEnfantsRow[],
  mouvementsFermetures: CrMouvementsFermeturesRow[],
  trimestreByRapport: Map<string, string | null>,
  trimestresAvecRapport: Set<string>,
) => {
  const rowsForTrimestre = <T extends { rapport_id: string | null }>(rows: T[], trimestre: string) =>
    rows.filter((row) => row.rapport_id && trimestreByRapport.get(row.rapport_id) === trimestre);

  const enfants: CrechesEvolutionEnfantsDatum[] = TRIMESTRES.map((trimestre) => {
    if (!trimestresAvecRapport.has(trimestre)) {
      return { trimestre, garcons: null, filles: null };
    }
    const rows = rowsForTrimestre(stats, trimestre);
    return {
      trimestre,
      garcons: sumBy(rows, (s) => s.garcons),
      filles: sumBy(rows, (s) => s.filles),
    };
  });

  const mouvements: CrechesEvolutionMouvementsDatum[] = TRIMESTRES.map((trimestre) => {
    if (!trimestresAvecRapport.has(trimestre)) {
      return { trimestre, fermetures: null, reouvertures: null };
    }
    const rows = rowsForTrimestre(mouvementsFermetures, trimestre);
    return {
      trimestre,
      fermetures: sumBy(
        rows.filter((row) => row.type_mouvement === "fermeture"),
        (row) => row.nombre_creches,
      ),
      reouvertures: sumBy(
        rows.filter((row) => row.type_mouvement === "reouverture"),
        (row) => row.nombre_creches,
      ),
    };
  });

  return { enfants, mouvements };
};

/**
 * Charge les données annuelles régionales Crèche (CRECHES) à partir du chemin
 * réel cr_* -> rapports -> directions.
 * Pas de `detailed` régional. Score : CRECHES_SCORE_WEIGHTS (voir comparison.score).
 */
export async function loadCrechesRegionalDashboard(year: number, lang = "fr"): Promise<CrechesRegionalDashboardData> {
  const [directionsResult, rapportsResult, statutsDemandeResult] = await Promise.all([
    supabase.from("directions").select("id, nom_fr, nom_ar"),
    supabase.from("rapports").select("id, direction_id, statut_rapport, trimestre").eq("annee", year),
    supabase.from("ref_cr_statuts_demande").select("*"),
  ]);

  const directions = (directionsResult.data ?? []) as DirectionRow[];
  const rapports = (rapportsResult.data ?? []) as RapportRow[];
  const statutsDemande = (statutsDemandeResult.data ?? []) as RefCrStatutsDemandeRow[];
  const rapportIds = rapports.map((rapport) => rapport.id);

  const [stats, traitementLicences, cadresAssermentes, labelQualite, mouvementsFermetures, demandesLicences] = await Promise.all([
    loadAllRows<CrStatistiquesEnfantsRow>("cr_statistiques_enfants", rapportIds),
    loadAllRows<CrTraitementLicencesRow>("cr_traitement_licences", rapportIds),
    loadAllRows<CrCadresAssermentesRow>("cr_cadres_assermentes", rapportIds),
    loadAllRows<CrLabelQualiteRow>("cr_label_qualite", rapportIds),
    loadAllRows<CrMouvementsFermeturesRow>("cr_mouvements_fermetures", rapportIds),
    loadAllRows<CrDemandesLicencesRow>("cr_demandes_licences", rapportIds),
  ]);

  // --- Regroupement par direction (pattern rapportsByDirection / rowsForDirection de PE/Femme/Infrastructure) ---
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
  const kpis = buildKpis(stats, traitementLicences, cadresAssermentes, labelQualite, mouvementsFermetures);

  // --- Section 3 (2 visualisations) ---
  const section3 = buildSection3(demandesLicences, statutsDemande, lang);

  // --- Section 4 (2 évolutions trimestrielles) ---
  const trimestreByRapport = new Map<string, string | null>(rapports.map((r) => [r.id, r.trimestre]));
  const trimestresAvecRapport = new Set(
    rapports.map((r) => r.trimestre).filter((t): t is NonNullable<typeof t> => Boolean(t)),
  );
  const evolution = buildEvolution(stats, mouvementsFermetures, trimestreByRapport, trimestresAvecRapport);

  const regionalKpis = kpisForRows(stats, traitementLicences, cadresAssermentes, labelQualite, mouvementsFermetures);

  // --- Performance par direction : KPI, score et classement régional ---
  const directionsData: CrechesDirectionData[] = directions.map((direction) => {
    const directionReports = rapportsByDirection.get(direction.id) ?? [];
    const status = directionStatus(directionReports);
    const directionKpis = kpisForRows(
      rowsForDirection(stats, direction.id),
      rowsForDirection(traitementLicences, direction.id),
      rowsForDirection(cadresAssermentes, direction.id),
      rowsForDirection(labelQualite, direction.id),
      rowsForDirection(mouvementsFermetures, direction.id),
    );
    const isActive = Object.values(directionKpis).some((value) => value > 0);

    return {
      id: direction.id,
      nom_fr: direction.nom_fr,
      nom: direction.nom_fr,
      statut: status,
      score: calculateCrechesScore(directionKpis, regionalKpis, isActive && status !== "NON_COMMENCE"),
      rang_regional: 99,
      metric_primary: directionKpis.enfantsPrisesEnCharge,
      metric_secondary: directionKpis.demandesLicencesTraitees,
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
    comparison: {
      directions: directionsData.map((direction) => ({ id: direction.id, name: direction.nom_fr || `Direction ${direction.id}`, status: direction.statut, primary: direction.metric_primary, secondary: direction.metric_secondary, rank: direction.rang_regional < 99 ? direction.rang_regional : null, score: direction.score })),
      primary: { key: "enfants_pris_en_charge", label: "Enfants pris en charge", regionalAverage: directionsData.length ? kpis.enfantsPrisesEnCharge / directionsData.length : null },
      secondary: { key: "demandes_licences_traitees", label: "Demandes de licences traitées", regionalAverage: directionsData.length ? kpis.demandesLicencesTraitees / directionsData.length : null },
      score: { label: "Score Crèches", methodology: "Pondération existante : enfants pris en charge 25 %, licences traitées 20 %, délai moyen 15 %, cadres 15 %, labels 12,5 %, fermetures 12,5 % (délai et fermetures inversés). Score relatif à la région, borné 0–100." },
    },
  };
}
