import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import type { RegionalDashboardData, RegionalStatus } from "./types";

// --- Service régional Protection de l'Enfance (PE) ---
//
// Suit exactement le même pattern que femmeRegionalService.ts /
// infrastructureRegionalService.ts : agrégation régionale et par direction
// faite entièrement en TypeScript, à partir des tables métier brutes pe_*
// (aucune vue SQL régionale dédiée n'existe pour ce domaine).
//
// Relation exploitée, identique à Femme/Infrastructure :
//   pe_*.rapport_id -> rapports.id -> rapports.direction_id -> directions.id
//
// Structure validée avec l'utilisateur avant implémentation (aucune Section 6
// régionale — ces détails restent au niveau préfectoral) :
//   Section 2 — 6 KPI (formules reprises de PrefDomainDashboardProtectionEnfanceDataService.ts)
//   Section 3 — PieChart Éducation vs Formation (nouvelle lecture régionale
//     consolidée, absente du Préfectoral sous cette forme) + répartition des
//     incidents exceptionnels par type (consolidation régionale de la
//     Visualisation 2 déjà existante au Préfectoral)
//   Section 4 — 2 évolutions trimestrielles (garçons/filles, incidents)
//   Section 5 — Performance des Directions (générique, alimentée via
//     metric_primary/metric_secondary)
//   Section 6 — supprimée
//
// ⚠️ KPI 2 (taux de préparation à l'intégration) : `taux_preparation_integration`
// est une colonne stockée directement en pourcentage, sans numérateur/
// dénominateur exploitable dans le schéma. Le Préfectoral lui-même utilise
// déjà une moyenne simple des lignes renseignées (voir buildKpis ici) — il
// n'existe aucune formule de recalcul pondéré fiable. Ce point a été signalé
// et accepté comme limitation connue avant implémentation.
//
// KPI 4 (Intégrations en Liberté Surveillée) : source unique = pe_liberte_surveillee,
// jamais pe_statistiques_demographiques.ls_integres_* — décision métier déjà
// actée au niveau préfectoral (voir commentaire dans buildKpis).
//
type PeStatistiquesDemographiquesRow =
  Database["public"]["Tables"]["pe_statistiques_demographiques"]["Row"];
type PeEducationRow = Database["public"]["Tables"]["pe_education"]["Row"];
type PeFormationBeneficiairesRow =
  Database["public"]["Tables"]["pe_formation_beneficiaires"]["Row"];
type PeLiberteSurveilleeRow = Database["public"]["Tables"]["pe_liberte_surveillee"]["Row"];
type PeRapportsExceptionnelsRow =
  Database["public"]["Tables"]["pe_rapports_exceptionnels"]["Row"];
type RefTypesIncidentRow = Database["public"]["Tables"]["ref_types_incident"]["Row"];
type RapportRow = Pick<Database["public"]["Tables"]["rapports"]["Row"], "id" | "direction_id" | "statut_rapport" | "trimestre">;
type DirectionRow = Pick<Database["public"]["Tables"]["directions"]["Row"], "id" | "nom_fr" | "nom_ar">;

// --- Types exposés (consommés par ProtectionEnfanceRegionalSections.tsx) ---

export interface PeRegionalKpis {
  /** KPI 1 — Σ (garcons + filles) — pe_statistiques_demographiques */
  totalBeneficiairesPriseEnCharge: number;
  /** KPI 2 — moyenne de taux_preparation_integration (lignes renseignées uniquement, toutes directions) — ⚠️ voir en-tête du fichier */
  tauxPreparationIntegrationMoyen: number;
  /** KPI 3 — Σ (beneficiaires_formel + beneficiaires_non_formel + beneficiaires_soutien) — pe_education */
  totalBeneficiairesEducationFormation: number;
  /** KPI 4 — Σ (integres_scolaire + integres_formation_pro + integres_stage + integres_associations) — pe_liberte_surveillee (source unique) */
  totalIntegrationsLiberteSurveillee: number;
  /** KPI 5 — Σ nombre_cas — pe_rapports_exceptionnels */
  totalIncidentsSignales: number;
  /** KPI 6 — Σ migrants_non_accompagnes — pe_statistiques_demographiques */
  totalMigrantsNonAccompagnes: number;
}

/** Visualisation 1 de Section3 : Éducation vs Formation, consolidé région */
export interface PeEducationFormationDatum {
  name: "Éducation" | "Formation";
  value: number;
}

/** Visualisation 2 de Section3 : Incidents par type (ref_types_incident), consolidé région */
export interface PeIncidentTypeDatum {
  id: string;
  /** libellé déjà résolu (fr/ar selon lang) depuis ref_types_incident */
  name: string;
  value: number;
}

export interface PeSection3Data {
  educationFormation: PeEducationFormationDatum[];
  incidentsParType: PeIncidentTypeDatum[];
}

/** Évolution 1 de Section4 : garçons vs filles par trimestre */
export interface PeEvolutionGenreDatum {
  trimestre: string; // "t1".."t4"
  garcons: number | null;
  filles: number | null;
}

/** Évolution 2 de Section4 : incidents exceptionnels par trimestre */
export interface PeEvolutionIncidentsDatum {
  trimestre: string; // "t1".."t4"
  incidents: number | null;
}

export interface PeRegionalData {
  kpis: PeRegionalKpis;
  section3: PeSection3Data;
  evolution: {
    genre: PeEvolutionGenreDatum[];
    incidents: PeEvolutionIncidentsDatum[];
  };
}

export type PeRegionalDashboardData = RegionalDashboardData<
  PeRegionalKpis,
  PeSection3Data,
  PeRegionalData["evolution"]
>;

interface PeDirectionData {
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

const average = (values: number[]): number =>
  values.length === 0 ? 0 : values.reduce((acc, v) => acc + v, 0) / values.length;

const TRIMESTRES = ["t1", "t2", "t3", "t4"] as const;

const toRegionalStatus = (statut: RapportRow["statut_rapport"]): RegionalStatus => {
  if (statut === "VALIDE") return "TERMINE";
  if (statut === "NON_COMMENCE") return "NON_COMMENCE";
  return "EN_COURS";
};

/** Statut par direction — pattern directionStatus repris à l'identique de femmeRegionalService.ts. */
const directionStatus = (rapports: RapportRow[]): RegionalStatus => {
  if (rapports.length === 0 || rapports.every((rapport) => rapport.statut_rapport === "NON_COMMENCE")) {
    return "NON_COMMENCE";
  }
  return rapports.every((rapport) => rapport.statut_rapport === "VALIDE") ? "TERMINE" : "EN_COURS";
};

// --- Requêtes Supabase (privées) ---

const loadAllRows = async <T>(table: string, rapportIds: string[]): Promise<T[]> => {
  if (rapportIds.length === 0) return [];
  const { data, error } = await supabase.from(table as any).select("*").in("rapport_id", rapportIds);
  if (error) {
    // Pattern d'erreur identique à Femme/Infrastructure : on ne masque pas
    // l'erreur, mais on ne casse pas le dashboard régional pour autant — la
    // table est simplement considérée vide pour ce chargement.
    console.error(`[peRegionalService] Erreur lors du chargement de ${table} :`, error);
    return [];
  }
  return (data ?? []) as T[];
};

// --- Construction des KPI régionaux (6 KPI, mêmes formules que buildKpis préfectoral) ---

const buildKpis = (
  stats: PeStatistiquesDemographiquesRow[],
  education: PeEducationRow[],
  formationBeneficiaires: PeFormationBeneficiairesRow[],
  liberteSurveillee: PeLiberteSurveilleeRow[],
  rapportsExceptionnels: PeRapportsExceptionnelsRow[],
): PeRegionalKpis => {
  const tauxRenseignes = stats
    .map((s) => s.taux_preparation_integration)
    .filter((v): v is number => v !== null && v !== undefined);

  return {
    totalBeneficiairesPriseEnCharge: sumBy(stats, (s) => (s.garcons || 0) + (s.filles || 0)),
    // ⚠️ Moyenne simple des lignes renseignées, toutes directions confondues
    // — même limitation que le Préfectoral (pas de numérateur/dénominateur
    // exploitable pour un vrai taux pondéré). Point signalé et accepté avant
    // implémentation, voir en-tête du fichier.
    tauxPreparationIntegrationMoyen: average(tauxRenseignes),
    totalBeneficiairesEducationFormation:
      sumBy(education, (e) => (e.beneficiaires_formel || 0) + (e.beneficiaires_non_formel || 0) + (e.beneficiaires_soutien || 0)) +
      sumBy(formationBeneficiaires, (f) => (f.beneficiaires_intra || 0) + (f.beneficiaires_extra || 0) + (f.beneficiaires_initiation || 0)),
    // ⚠️ Source unique = pe_liberte_surveillee (PAS pe_statistiques_demographiques.ls_integres_*)
    totalIntegrationsLiberteSurveillee: sumBy(
      liberteSurveillee,
      (l) =>
        (l.integres_scolaire || 0) +
        (l.integres_formation_pro || 0) +
        (l.integres_stage || 0) +
        (l.integres_associations || 0),
    ),
    totalIncidentsSignales: sumBy(rapportsExceptionnels, (r) => r.nombre_cas),
    totalMigrantsNonAccompagnes: sumBy(stats, (s) => s.migrants_non_accompagnes),
  };
};

interface PeScoreKpis {
  totalBeneficiairesPriseEnCharge: number;
  tauxPreparationIntegrationMoyen: number;
  totalBeneficiairesEducationFormation: number;
  totalIntegrationsLiberteSurveillee: number;
  totalIncidentsSignales: number;
  totalMigrantsNonAccompagnes: number;
}

const PE_SCORE_WEIGHTS = {
  totalBeneficiairesPriseEnCharge: 25,
  tauxPreparationIntegrationMoyen: 20,
  totalBeneficiairesEducationFormation: 15,
  totalIntegrationsLiberteSurveillee: 15,
  totalIncidentsSignales: 12.5,
  totalMigrantsNonAccompagnes: 12.5,
} as const;

const clampScore = (score: number) =>
  Number.isFinite(score) ? Math.max(0, Math.min(100, score)) : 0;

const positiveKpiScore = (directionValue: number, regionalValue: number) =>
  regionalValue > 0 ? (directionValue / regionalValue) * 100 : 0;

const negativeKpiScore = (directionValue: number, regionalValue: number) =>
  regionalValue > 0 ? (directionValue > 0 ? (regionalValue / directionValue) * 100 : 100) : 100;

const calculatePeScore = (
  directionKpis: PeScoreKpis,
  regionalKpis: PeScoreKpis,
  isActive: boolean,
) => {
  if (!isActive) return 0;

  const positiveKpis: Array<keyof PeScoreKpis> = [
    "totalBeneficiairesPriseEnCharge",
    "tauxPreparationIntegrationMoyen",
    "totalBeneficiairesEducationFormation",
    "totalIntegrationsLiberteSurveillee",
  ];
  const negativeKpis: Array<keyof PeScoreKpis> = [
    "totalIncidentsSignales",
    "totalMigrantsNonAccompagnes",
  ];
  const score = positiveKpis.reduce(
    (total, kpi) => total + positiveKpiScore(directionKpis[kpi], regionalKpis[kpi]) * (PE_SCORE_WEIGHTS[kpi] / 100),
    0,
  ) + negativeKpis.reduce(
    (total, kpi) => total + negativeKpiScore(directionKpis[kpi], regionalKpis[kpi]) * (PE_SCORE_WEIGHTS[kpi] / 100),
    0,
  );

  return clampScore(score);
};

// --- Construction des KPI par direction ---

const kpisForRows = (
  stats: PeStatistiquesDemographiquesRow[],
  education: PeEducationRow[],
  formationBeneficiaires: PeFormationBeneficiairesRow[],
  liberteSurveillee: PeLiberteSurveilleeRow[],
  rapportsExceptionnels: PeRapportsExceptionnelsRow[],
) => {
  const totalBeneficiaires = sumBy(stats, (s) => (s.garcons || 0) + (s.filles || 0));
  const totalIncidents = sumBy(rapportsExceptionnels, (r) => r.nombre_cas);
  const tauxRenseignes = stats
    .map((s) => s.taux_preparation_integration)
    .filter((value): value is number => value !== null && value !== undefined);
  return {
    totalBeneficiaires,
    totalIncidents,
    scoreKpis: {
      totalBeneficiairesPriseEnCharge: totalBeneficiaires,
      tauxPreparationIntegrationMoyen: average(tauxRenseignes),
      totalBeneficiairesEducationFormation:
        sumBy(education, (e) => (e.beneficiaires_formel || 0) + (e.beneficiaires_non_formel || 0) + (e.beneficiaires_soutien || 0)) +
        sumBy(formationBeneficiaires, (f) => (f.beneficiaires_intra || 0) + (f.beneficiaires_extra || 0) + (f.beneficiaires_initiation || 0)),
      totalIntegrationsLiberteSurveillee: sumBy(
        liberteSurveillee,
        (l) => (l.integres_scolaire || 0) + (l.integres_formation_pro || 0) + (l.integres_stage || 0) + (l.integres_associations || 0),
      ),
      totalIncidentsSignales: totalIncidents,
      totalMigrantsNonAccompagnes: sumBy(stats, (s) => s.migrants_non_accompagnes),
    } satisfies PeScoreKpis,
  };
};

// --- Construction des visualisations Section 3 ---

const buildSection3 = (
  education: PeEducationRow[],
  formationBeneficiaires: PeFormationBeneficiairesRow[],
  rapportsExceptionnels: PeRapportsExceptionnelsRow[],
  typesIncident: RefTypesIncidentRow[],
  lang = "fr",
): PeSection3Data => {
  // --- Visualisation 1 : Éducation vs Formation, consolidé sur toutes les directions ---
  const totalEducation = sumBy(
    education,
    (e) => (e.beneficiaires_formel || 0) + (e.beneficiaires_non_formel || 0) + (e.beneficiaires_soutien || 0),
  );
  const totalFormation = sumBy(
    formationBeneficiaires,
    (f) => (f.beneficiaires_intra || 0) + (f.beneficiaires_extra || 0) + (f.beneficiaires_initiation || 0),
  );
  const educationFormation: PeEducationFormationDatum[] = [
    { name: "Éducation", value: totalEducation },
    { name: "Formation", value: totalFormation },
  ];

  // --- Visualisation 2 : Incidents par type (jointure ref_types_incident), consolidé sur toutes les directions ---
  const typeIncidentById = new Map(typesIncident.map((ti) => [ti.id, ti]));
  const incidentsByType = new Map<string, number>();
  rapportsExceptionnels.forEach((r) => {
    if (!r.type_incident_id) return;
    incidentsByType.set(r.type_incident_id, (incidentsByType.get(r.type_incident_id) || 0) + (r.nombre_cas || 0));
  });
  const incidentsParType: PeIncidentTypeDatum[] = Array.from(incidentsByType.entries())
    .map(([id, value]) => {
      const ref = typeIncidentById.get(id);
      const name = ref ? (lang === "ar" ? ref.libelle_ar || ref.libelle_fr : ref.libelle_fr || ref.libelle_ar) : id;
      return { id, name, value };
    })
    .sort((a, b) => b.value - a.value);

  return { educationFormation, incidentsParType };
};

// --- Construction des évolutions Section 4 ---
//
// Règle stricte (identique à femmeRegionalService.ts) : un trimestre reste
// `null` uniquement si aucun rapport n'a été soumis pour ce trimestre sur
// toute la région ; s'il existe au moins un rapport mais aucune ligne pe_*
// pour ce trimestre, la valeur réelle est 0.

const buildEvolution = (
  stats: PeStatistiquesDemographiquesRow[],
  rapportsExceptionnels: PeRapportsExceptionnelsRow[],
  trimestreByRapport: Map<string, string | null>,
  trimestresAvecRapport: Set<string>,
) => {
  const rowsForTrimestre = <T extends { rapport_id: string | null }>(rows: T[], trimestre: string) =>
    rows.filter((row) => row.rapport_id && trimestreByRapport.get(row.rapport_id) === trimestre);

  const genre: PeEvolutionGenreDatum[] = TRIMESTRES.map((trimestre) => {
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

  const incidents: PeEvolutionIncidentsDatum[] = TRIMESTRES.map((trimestre) => {
    if (!trimestresAvecRapport.has(trimestre)) {
      return { trimestre, incidents: null };
    }
    const rows = rowsForTrimestre(rapportsExceptionnels, trimestre);
    return {
      trimestre,
      incidents: sumBy(rows, (r) => r.nombre_cas),
    };
  });

  return { genre, incidents };
};

/**
 * Charge les données annuelles régionales Protection de l'Enfance (PE) à
 * partir du chemin réel pe_* -> rapports -> directions.
 * Pas de `detailed` régional. Score : PE_SCORE_WEIGHTS (voir comparison.score).
 */
export async function loadPeRegionalDashboard(year: number, lang = "fr"): Promise<PeRegionalDashboardData> {
  const [directionsResult, rapportsResult, typesIncidentResult] = await Promise.all([
    supabase.from("directions").select("id, nom_fr, nom_ar"),
    supabase.from("rapports").select("id, direction_id, statut_rapport, trimestre").eq("annee", year),
    supabase.from("ref_types_incident").select("*"),
  ]);

  const directions = (directionsResult.data ?? []) as DirectionRow[];
  const rapports = (rapportsResult.data ?? []) as RapportRow[];
  const typesIncident = (typesIncidentResult.data ?? []) as RefTypesIncidentRow[];
  const rapportIds = rapports.map((rapport) => rapport.id);

  const [stats, education, formationBeneficiaires, liberteSurveillee, rapportsExceptionnels] = await Promise.all([
    loadAllRows<PeStatistiquesDemographiquesRow>("pe_statistiques_demographiques", rapportIds),
    loadAllRows<PeEducationRow>("pe_education", rapportIds),
    loadAllRows<PeFormationBeneficiairesRow>("pe_formation_beneficiaires", rapportIds),
    loadAllRows<PeLiberteSurveilleeRow>("pe_liberte_surveillee", rapportIds),
    loadAllRows<PeRapportsExceptionnelsRow>("pe_rapports_exceptionnels", rapportIds),
  ]);

  // --- Regroupement par direction (pattern rapportsByDirection / rowsForDirection de Femme/Infrastructure) ---
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
  const kpis = buildKpis(stats, education, formationBeneficiaires, liberteSurveillee, rapportsExceptionnels);

  // --- Section 3 (2 visualisations) ---
  const section3 = buildSection3(education, formationBeneficiaires, rapportsExceptionnels, typesIncident, lang);

  // --- Section 4 (2 évolutions trimestrielles) ---
  const trimestreByRapport = new Map<string, string | null>(rapports.map((r) => [r.id, r.trimestre]));
  const trimestresAvecRapport = new Set(
    rapports.map((r) => r.trimestre).filter((t): t is NonNullable<typeof t> => Boolean(t)),
  );
  const evolution = buildEvolution(stats, rapportsExceptionnels, trimestreByRapport, trimestresAvecRapport);

  // --- Performance par direction : KPI, score et classement régional ---
  const directionsData: PeDirectionData[] = directions.map((direction) => {
    const directionReports = rapportsByDirection.get(direction.id) ?? [];
    const status = directionStatus(directionReports);
    const { totalBeneficiaires, totalIncidents, scoreKpis } = kpisForRows(
      rowsForDirection(stats, direction.id),
      rowsForDirection(education, direction.id),
      rowsForDirection(formationBeneficiaires, direction.id),
      rowsForDirection(liberteSurveillee, direction.id),
      rowsForDirection(rapportsExceptionnels, direction.id),
    );
    const isActive = Object.values(scoreKpis).some((value) => value > 0);

    return {
      id: direction.id,
      nom_fr: direction.nom_fr,
      nom: direction.nom_fr,
      statut: status,
      score: calculatePeScore(scoreKpis, kpis, isActive && status !== "NON_COMMENCE"),
      rang_regional: 99,
      metric_primary: totalBeneficiaires,
      metric_secondary: scoreKpis.totalIntegrationsLiberteSurveillee,
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
      primary: { key: "beneficiaires_prise_en_charge", label: "Bénéficiaires pris en charge", regionalAverage: directionsData.length ? kpis.totalBeneficiairesPriseEnCharge / directionsData.length : null },
      secondary: { key: "integrations_liberte_surveillee", label: "Intégrations en liberté surveillée", regionalAverage: directionsData.length ? kpis.totalIntegrationsLiberteSurveillee / directionsData.length : null },
      score: { label: "Score Protection de l'Enfance", methodology: "Pondération existante : prise en charge 25 %, préparation à l'intégration 20 %, éducation/formation 15 %, intégrations LS 15 %, incidents 12,5 %, migrants non accompagnés 12,5 % (indicateurs de risque inversés). Score relatif à la région, borné 0–100." },
    },
  };
}
