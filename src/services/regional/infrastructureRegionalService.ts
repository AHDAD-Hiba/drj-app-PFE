import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import type { RegionalDashboardData, RegionalStatus } from "./types";

type InfraDepensesRow = Database["public"]["Tables"]["infra_depenses"]["Row"];
type InfraEauElectriciteRow = Database["public"]["Tables"]["infra_eau_electricite"]["Row"];
type InfraProjetsBtpRow = Database["public"]["Tables"]["infra_projets_btp"]["Row"];
type InfraProjetsPartenariatRow = Database["public"]["Tables"]["infra_projets_partenariat"]["Row"];
type InfraProjetsEnSouffranceRow = Database["public"]["Tables"]["infra_projets_en_souffrance"]["Row"];
type RapportRow = Pick<Database["public"]["Tables"]["rapports"]["Row"], "id" | "direction_id" | "statut_rapport" | "trimestre">;
type EtablissementRow = Pick<Database["public"]["Tables"]["etablissements"]["Row"], "id" | "nom" | "direction_id">;

export interface InfrastructureRegionalData {
  financial: {
    credits_ouverts: number;
    credits_engages: number;
    credits_payes: number;
    taux_engagement: number;
    taux_paiement: number;
    fonctionnement: { credits_ouverts: number; credits_engages: number; credits_payes: number };
    investissement: { credits_ouverts: number; credits_engages: number; credits_payes: number };
  };
  projects: {
    btp: {
      total: number;
      construction: number;
      amenagement: number;
      cout_total: number;
      montant_paye: number;
      taux_paiement: number;
      avancement_moyen: number;
    };
    partenariat: {
      total: number;
      avancement_moyen: number;
      par_phase: { phase_projet: string; total: number }[];
      par_types_etablissements: { type_etablissement: string; total: number }[];
    };
  };
  utilities: {
    arrieres_eau: number;
    arrieres_electricite: number;
    consommation_eau: number;
    consommation_electricite: number;
  };
  blockedProjects: {
    total: number;
    projets: {
      id: string;
      etablissement_id: string | null;
      etablissement: string | null;
      causes_blocage: string | null;
      solutions_proposees: string | null;
      observations: string | null;
    }[];
  };
  evolution: {
    financier: {
      trimestre: string;
      credits_engages: number | null;
      credits_payes: number | null;
    }[];
    projets: {
      trimestre: string;
      projets_btp: number | null;
      projets_partenariat: number | null;
    }[];
  };
}

export type InfrastructureRegionalKpis = InfrastructureRegionalData["financial"];
export type InfrastructureRegionalSection3 = InfrastructureRegionalData["projects"];
export type InfrastructureRegionalEvolution = InfrastructureRegionalData["evolution"];
export type InfrastructureRegionalDetailed = Pick<InfrastructureRegionalData, "utilities" | "blockedProjects">;
export type InfrastructureRegionalDashboardData = RegionalDashboardData<
  InfrastructureRegionalKpis,
  InfrastructureRegionalSection3,
  InfrastructureRegionalEvolution,
  InfrastructureRegionalDetailed
>;

interface InfrastructureDirectionData {
  id: string;
  nom_fr: string | null;
  statut: RegionalStatus;
  score: number;
  rang_regional: number;
  metric_primary: number;
  metric_secondary: number;
}

const sumBy = <T,>(rows: T[], selector: (row: T) => number | null | undefined) =>
  rows.reduce((total, row) => {
    const value = selector(row);
    return total + (typeof value === "number" && Number.isFinite(value) ? value : 0);
  }, 0);

const average = (values: (number | null)[]) => {
  const definedValues = values.filter((value): value is number => value !== null);
  return definedValues.length === 0
    ? 0
    : definedValues.reduce((total, value) => total + value, 0) / definedValues.length;
};

const ratioPct = (numerator: number, denominator: number) =>
  denominator > 0 ? (numerator / denominator) * 100 : 0;

interface InfrastructureScoreKpis {
  taux_execution_budgetaire: number;
  budget_paye: number;
  projets_btp: number;
  projets_partenariat: number;
  projets_bloques: number;
  arrieres: number;
}

/**
 * Aucune pondération Infrastructure officielle n'existe dans le repository.
 * Proposition : 25% à l'exécution budgétaire, indicateur principal de
 * réalisation ; 20% au budget payé, qui mesure le résultat financier concret ;
 * 15% aux projets BTP et 15% aux partenariats, qui couvrent les deux volumes
 * d'activité projet du benchmark ; 12,5% aux projets bloqués et 12,5% aux
 * arriérés, risques négatifs distincts qui doivent chacun peser sans dominer.
 */
const INFRASTRUCTURE_SCORE_WEIGHTS = {
  taux_execution_budgetaire: 25,
  budget_paye: 20,
  projets_btp: 15,
  projets_partenariat: 15,
  projets_bloques: 12.5,
  arrieres: 12.5,
} as const;

const clampScore = (score: number) =>
  Number.isFinite(score) ? Math.max(0, Math.min(100, score)) : 0;

const positiveKpiScore = (directionValue: number, regionalValue: number) =>
  regionalValue > 0 ? (directionValue / regionalValue) * 100 : 0;

const negativeKpiScore = (directionValue: number, regionalValue: number) =>
  regionalValue > 0 ? (directionValue > 0 ? (regionalValue / directionValue) * 100 : 100) : 100;

const calculateInfrastructureScore = (
  directionKpis: InfrastructureScoreKpis,
  regionalKpis: InfrastructureScoreKpis,
  isActive: boolean,
) => {
  if (!isActive) return 0;

  const scores = [
    positiveKpiScore(directionKpis.taux_execution_budgetaire, regionalKpis.taux_execution_budgetaire) *
      (INFRASTRUCTURE_SCORE_WEIGHTS.taux_execution_budgetaire / 100),
    positiveKpiScore(directionKpis.budget_paye, regionalKpis.budget_paye) *
      (INFRASTRUCTURE_SCORE_WEIGHTS.budget_paye / 100),
    positiveKpiScore(directionKpis.projets_btp, regionalKpis.projets_btp) *
      (INFRASTRUCTURE_SCORE_WEIGHTS.projets_btp / 100),
    positiveKpiScore(directionKpis.projets_partenariat, regionalKpis.projets_partenariat) *
      (INFRASTRUCTURE_SCORE_WEIGHTS.projets_partenariat / 100),
    negativeKpiScore(directionKpis.projets_bloques, regionalKpis.projets_bloques) *
      (INFRASTRUCTURE_SCORE_WEIGHTS.projets_bloques / 100),
    negativeKpiScore(directionKpis.arrieres, regionalKpis.arrieres) *
      (INFRASTRUCTURE_SCORE_WEIGHTS.arrieres / 100),
  ];

  return clampScore(scores.reduce((total, score) => total + score, 0));
};

const totalsForDepenses = (depenses: InfraDepensesRow[]) => ({
  credits_ouverts: sumBy(depenses, (row) => row.credits_ouverts),
  credits_engages: sumBy(depenses, (row) => row.credits_engages),
  credits_payes: sumBy(depenses, (row) => row.credits_payes),
});

const toRegionalStatus = (statut: RapportRow["statut_rapport"]): RegionalStatus => {
  if (statut === "VALIDE") return "TERMINE";
  if (statut === "NON_COMMENCE") return "NON_COMMENCE";
  return "EN_COURS";
};

const directionStatus = (rapports: RapportRow[]): RegionalStatus => {
  if (rapports.length === 0 || rapports.every((rapport) => rapport.statut_rapport === "NON_COMMENCE")) {
    return "NON_COMMENCE";
  }
  return rapports.every((rapport) => rapport.statut_rapport === "VALIDE") ? "TERMINE" : "EN_COURS";
};

const countBy = (values: (string | null)[], key: string) => {
  const totals = new Map<string, number>();
  values.forEach((value) => {
    const label = value || "non_defini";
    totals.set(label, (totals.get(label) || 0) + 1);
  });
  return Array.from(totals, ([value, total]) => ({ [key]: value, total }));
};

const TRIMESTRES = ["t1", "t2", "t3", "t4"] as const;

/**
 * Regroupe des lignes infra_* par trimestre en s'appuyant sur le rapport
 * parent (rapport_id -> rapports.trimestre), déjà chargé par
 * loadInfrastructureRegionalDashboard. Un trimestre reste `null` uniquement
 * si aucun rapport n'a été soumis pour ce trimestre (pas de donnée
 * fabriquée) ; s'il existe un rapport mais aucune ligne infra_*, la valeur
 * réelle est 0.
 */
const buildEvolutionFinanciere = (
  depenses: InfraDepensesRow[],
  trimestreByRapport: Map<string, string | null>,
  trimestresAvecRapport: Set<string>,
) =>
  TRIMESTRES.map((trimestre) => {
    if (!trimestresAvecRapport.has(trimestre)) {
      return { trimestre, credits_engages: null, credits_payes: null };
    }
    const rows = depenses.filter((row) => row.rapport_id && trimestreByRapport.get(row.rapport_id) === trimestre);
    return {
      trimestre,
      credits_engages: sumBy(rows, (row) => row.credits_engages),
      credits_payes: sumBy(rows, (row) => row.credits_payes),
    };
  });

const buildEvolutionProjets = (
  btp: InfraProjetsBtpRow[],
  partenariat: InfraProjetsPartenariatRow[],
  trimestreByRapport: Map<string, string | null>,
  trimestresAvecRapport: Set<string>,
) =>
  TRIMESTRES.map((trimestre) => {
    if (!trimestresAvecRapport.has(trimestre)) {
      return { trimestre, projets_btp: null, projets_partenariat: null };
    }
    const btpRows = btp.filter((row) => row.rapport_id && trimestreByRapport.get(row.rapport_id) === trimestre);
    const partenariatRows = partenariat.filter((row) => row.rapport_id && trimestreByRapport.get(row.rapport_id) === trimestre);
    return {
      trimestre,
      projets_btp: btpRows.length,
      projets_partenariat: partenariatRows.length,
    };
  });

const buildInfrastructureData = (
  depenses: InfraDepensesRow[],
  eauElectricite: InfraEauElectriciteRow[],
  btp: InfraProjetsBtpRow[],
  partenariat: InfraProjetsPartenariatRow[],
  enSouffrance: InfraProjetsEnSouffranceRow[],
  etablissementsById: Map<string, EtablissementRow>,
  rapports: RapportRow[],
): InfrastructureRegionalData => {
  const trimestreByRapport = new Map<string, string | null>(
    rapports.map((rapport) => [rapport.id, rapport.trimestre]),
  );
  const trimestresAvecRapport = new Set(
    rapports.map((rapport) => rapport.trimestre).filter((t): t is NonNullable<typeof t> => Boolean(t)),
  );
  const totalDepenses = totalsForDepenses(depenses);
  const fonctionnement = totalsForDepenses(depenses.filter((row) => row.type_depense === "fonctionnement"));
  const investissement = totalsForDepenses(depenses.filter((row) => row.type_depense === "investissement"));
  const coutTotal = sumBy(btp, (row) => row.cout_projet);
  const montantPaye = sumBy(btp, (row) => row.montant_paye);
  const typesEtablissements = partenariat.flatMap((row) => row.types_etablissements ?? []);

  return {
    financial: {
      ...totalDepenses,
      taux_engagement: ratioPct(totalDepenses.credits_engages, totalDepenses.credits_ouverts),
      taux_paiement: ratioPct(totalDepenses.credits_payes, totalDepenses.credits_engages),
      fonctionnement,
      investissement,
    },
    projects: {
      btp: {
        total: btp.length,
        construction: btp.filter((row) => row.type_projet === "construction").length,
        amenagement: btp.filter((row) => row.type_projet === "amenagement").length,
        cout_total: coutTotal,
        montant_paye: montantPaye,
        taux_paiement: ratioPct(montantPaye, coutTotal),
        avancement_moyen: average(btp.map((row) => row.taux_avancement_travaux)),
      },
      partenariat: {
        total: partenariat.length,
        avancement_moyen: average(partenariat.map((row) => row.taux_avancement)),
        par_phase: countBy(partenariat.map((row) => row.phase_projet), "phase_projet") as { phase_projet: string; total: number }[],
        par_types_etablissements: countBy(typesEtablissements, "type_etablissement") as { type_etablissement: string; total: number }[],
      },
    },
    utilities: {
      arrieres_eau: sumBy(eauElectricite, (row) => row.arrieres_eau),
      arrieres_electricite: sumBy(eauElectricite, (row) => row.arrieres_electricite),
      consommation_eau: sumBy(eauElectricite, (row) => row.consommation_eau),
      consommation_electricite: sumBy(eauElectricite, (row) => row.consommation_electricite),
    },
    blockedProjects: {
      total: enSouffrance.length,
      projets: enSouffrance.map((row) => ({
        id: row.id,
        etablissement_id: row.etablissement_id,
        etablissement: row.etablissement_id ? etablissementsById.get(row.etablissement_id)?.nom ?? null : null,
        causes_blocage: row.causes_blocage,
        solutions_proposees: row.solutions_proposees,
        observations: row.observations,
      })),
    },
    evolution: {
      financier: buildEvolutionFinanciere(depenses, trimestreByRapport, trimestresAvecRapport),
      projets: buildEvolutionProjets(btp, partenariat, trimestreByRapport, trimestresAvecRapport),
    },
  };
};

/**
 * Charge les données annuelles Infrastructure à partir du chemin réel
 * infra_* -> rapports -> directions.
 * Score : INFRASTRUCTURE_SCORE_WEIGHTS (voir comparison.score).
 */
export async function loadInfrastructureRegionalDashboard(
  year: number,
): Promise<InfrastructureRegionalDashboardData> {
  const [directionsResult, rapportsResult] = await Promise.all([
    supabase.from("directions").select("id, nom_fr, nom_ar"),
    supabase.from("rapports").select("id, direction_id, statut_rapport, trimestre").eq("annee", year),
  ]);

  const directions = directionsResult.data ?? [];
  const rapports = (rapportsResult.data ?? []) as RapportRow[];
  const rapportIds = rapports.map((rapport) => rapport.id);

  const [depensesResult, eauElectriciteResult, btpResult, partenariatResult, enSouffranceResult] = rapportIds.length
    ? await Promise.all([
        supabase.from("infra_depenses").select("*").in("rapport_id", rapportIds),
        supabase.from("infra_eau_electricite").select("*").in("rapport_id", rapportIds),
        supabase.from("infra_projets_btp").select("*").in("rapport_id", rapportIds),
        supabase.from("infra_projets_partenariat").select("*").in("rapport_id", rapportIds),
        supabase.from("infra_projets_en_souffrance").select("*").in("rapport_id", rapportIds),
      ])
    : [{ data: [] }, { data: [] }, { data: [] }, { data: [] }, { data: [] }];

  const depenses = (depensesResult.data ?? []) as InfraDepensesRow[];
  const eauElectricite = (eauElectriciteResult.data ?? []) as InfraEauElectriciteRow[];
  const btp = (btpResult.data ?? []) as InfraProjetsBtpRow[];
  const partenariat = (partenariatResult.data ?? []) as InfraProjetsPartenariatRow[];
  const enSouffrance = (enSouffranceResult.data ?? []) as InfraProjetsEnSouffranceRow[];
  const etablissementIds = Array.from(new Set([
    ...eauElectricite,
    ...btp,
    ...partenariat,
    ...enSouffrance,
  ].map((row) => row.etablissement_id).filter((id): id is string => Boolean(id))));
  const etablissementsResult = etablissementIds.length
    ? await supabase.from("etablissements").select("id, nom, direction_id").in("id", etablissementIds)
    : { data: [] };
  const etablissementsById = new Map(
    ((etablissementsResult.data ?? []) as EtablissementRow[]).map((etablissement) => [etablissement.id, etablissement]),
  );

  const rapportsByDirection = new Map<string, RapportRow[]>();
  rapports.forEach((rapport) => {
    if (!rapport.direction_id) return;
    const directionRapports = rapportsByDirection.get(rapport.direction_id) ?? [];
    directionRapports.push(rapport);
    rapportsByDirection.set(rapport.direction_id, directionRapports);
  });
  const rapportIdsByDirection = new Map(
    Array.from(rapportsByDirection, ([directionId, directionRapports]) => [directionId, new Set(directionRapports.map((rapport) => rapport.id))]),
  );
  const rowsForDirection = <T extends { rapport_id: string | null }>(rows: T[], directionId: string) => {
    const ids = rapportIdsByDirection.get(directionId);
    return ids ? rows.filter((row) => row.rapport_id && ids.has(row.rapport_id)) : [];
  };

  const directionKpis = (directionId: string): InfrastructureScoreKpis => {
    const directionDepenses = rowsForDirection(depenses, directionId);
    const directionEauElectricite = rowsForDirection(eauElectricite, directionId);
    const directionBtp = rowsForDirection(btp, directionId);
    const directionPartenariat = rowsForDirection(partenariat, directionId);
    const directionEnSouffrance = rowsForDirection(enSouffrance, directionId);
    const totals = totalsForDepenses(directionDepenses);

    return {
      taux_execution_budgetaire: ratioPct(totals.credits_payes, totals.credits_ouverts),
      budget_paye: totals.credits_payes,
      projets_btp: directionBtp.length,
      projets_partenariat: directionPartenariat.length,
      projets_bloques: directionEnSouffrance.length,
      arrieres:
        sumBy(directionEauElectricite, (row) => row.arrieres_eau) +
        sumBy(directionEauElectricite, (row) => row.arrieres_electricite),
    };
  };

  const regionalKpis: InfrastructureScoreKpis = {
    taux_execution_budgetaire: ratioPct(
      sumBy(depenses, (row) => row.credits_payes),
      sumBy(depenses, (row) => row.credits_ouverts),
    ),
    budget_paye: sumBy(depenses, (row) => row.credits_payes),
    projets_btp: btp.length,
    projets_partenariat: partenariat.length,
    projets_bloques: enSouffrance.length,
    arrieres:
      sumBy(eauElectricite, (row) => row.arrieres_eau) +
      sumBy(eauElectricite, (row) => row.arrieres_electricite),
  };

  const hasInfrastructureData =
    depenses.length > 0 ||
    eauElectricite.length > 0 ||
    btp.length > 0 ||
    partenariat.length > 0 ||
    enSouffrance.length > 0;

  const directionsData: InfrastructureDirectionData[] = directions.map((direction) => {
    const directionDepenses = rowsForDirection(depenses, direction.id);
    const directionBtp = rowsForDirection(btp, direction.id);
    const directionPartenariat = rowsForDirection(partenariat, direction.id);
    const totals = totalsForDepenses(directionDepenses);
    const directionReports = rapportsByDirection.get(direction.id) ?? [];
    const status = directionStatus(directionReports);
    const isActive = totals.credits_payes > 0 || directionBtp.length > 0 || directionPartenariat.length > 0;
    const score = hasInfrastructureData
      ? calculateInfrastructureScore(directionKpis(direction.id), regionalKpis, isActive && status !== "NON_COMMENCE")
      : 0;

    return {
      id: direction.id,
      nom_fr: direction.nom_fr,
      nom: direction.nom_fr,
      statut: status,
      score,
      rang_regional: 99,
      metric_primary: ratioPct(totals.credits_payes, totals.credits_ouverts),
      metric_secondary: directionBtp.length + directionPartenariat.length,
    };
  });

  if (hasInfrastructureData) {
    directionsData.sort((left, right) => right.score - left.score);
    let rankableIndex = 0;
    directionsData.forEach((direction, index) => {
      if (direction.score <= 0 || direction.statut === "NON_COMMENCE") return;
      rankableIndex += 1;
      direction.rang_regional = index > 0 && direction.score === directionsData[index - 1].score
        ? directionsData[index - 1].rang_regional
        : rankableIndex;
    });
  }

  const regionalData = buildInfrastructureData(depenses, eauElectricite, btp, partenariat, enSouffrance, etablissementsById, rapports);
  const completedDirections = directionsData.filter((direction) => direction.statut === "TERMINE").length;
  const inProgressDirections = directionsData.filter((direction) => direction.statut === "EN_COURS").length;

  return {
    status: {
      hasData: hasInfrastructureData,
      submittedReports: rapports.length,
      completedDirections,
      inProgressDirections,
      notStartedDirections: directionsData.length - completedDirections - inProgressDirections,
    },
    kpis: regionalData.financial,
    section3: regionalData.projects,
    evolution: regionalData.evolution,
    detailed: { utilities: regionalData.utilities, blockedProjects: regionalData.blockedProjects },
    comparison: {
      directions: directionsData.map((direction) => ({
        id: direction.id,
        name: direction.nom_fr || `Direction ${direction.id}`,
        status: direction.statut,
        primary: direction.metric_primary,
        secondary: direction.metric_secondary,
        rank: direction.rang_regional < 99 ? direction.rang_regional : null,
        score: direction.score,
      })),
      primary: { key: "taux_execution_budgetaire", label: "Taux d'exécution budgétaire", regionalAverage: regionalKpis.taux_execution_budgetaire },
      secondary: { key: "nombre_projets", label: "Nombre de projets", regionalAverage: directionsData.length ? (regionalKpis.projets_btp + regionalKpis.projets_partenariat) / directionsData.length : null },
      score: { label: "Score Infrastructure", methodology: "Pondération existante : exécution budgétaire 25 %, budget payé 20 %, projets BTP 15 %, partenariats 15 %, projets bloqués 12,5 %, arriérés 12,5 % (indicateurs négatifs inversés). Score relatif à la région, borné 0–100." },
    },
  };
}
