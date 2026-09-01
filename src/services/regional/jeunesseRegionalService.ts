import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import type { RegionalDashboardData, RegionalStatus } from "./types";

export interface JeunesseRegionalKpis {
  total_beneficiaires: number;
  total_activites: number;
  etablissements_actifs: number;
  total_partenariats: number;
  taux_feminisation: number;
  taux_couverture: number;
}

export interface JeunesseRegionalSection3 {
  domaine_educatif: number;
  domaine_culturel: number;
  domaine_sportif: number;
  domaine_capacite: number;
  femmes: number;
  hommes: number;
  rural: number;
  urbain: number;
}

export interface JeunesseRegionalEvolution {
  activites: { trimestre: string; total_activites: number | null }[];
  etablissements: {
    trimestre: string;
    fonctionnels: number | null;
    travaux: number | null;
    fermes: number | null;
  }[];
}

export type JeunesseRegionalDashboardData = RegionalDashboardData<
  JeunesseRegionalKpis,
  JeunesseRegionalSection3,
  JeunesseRegionalEvolution
>;

export const EMPTY_JEUNESSE_KPI: JeunesseRegionalKpis = {
  total_beneficiaires: 0,
  total_activites: 0,
  etablissements_actifs: 0,
  total_partenariats: 0,
  taux_feminisation: 0,
  taux_couverture: 0,
};

export const EMPTY_JEUNESSE_SECTION3: JeunesseRegionalSection3 = {
  domaine_educatif: 0,
  domaine_culturel: 0,
  domaine_sportif: 0,
  domaine_capacite: 0,
  femmes: 0,
  hommes: 0,
  rural: 0,
  urbain: 0,
};

export const EMPTY_JEUNESSE_TRIMESTRES = ["t1", "t2", "t3", "t4"] as const;

type JeunesseRapportRow = Pick<
  Database["public"]["Tables"]["rapports"]["Row"],
  "id" | "direction_id" | "annee" | "statut_rapport" | "trimestre"
>;

type ActiviteRow = Database["public"]["Tables"]["activites"]["Row"];
type ParticipantRow = Database["public"]["Tables"]["participants"]["Row"];
type FormationRow = Database["public"]["Tables"]["formations"]["Row"];
type FormationStatsRow = Database["public"]["Tables"]["statistiques_formation"]["Row"];
type FestivalRow = Database["public"]["Tables"]["festivals"]["Row"];
type FestivalStatsRow = Database["public"]["Tables"]["statistiques_festivals"]["Row"];
type InsertionRow = Database["public"]["Tables"]["activites_insertion"]["Row"];
type InsertionStatsRow = Database["public"]["Tables"]["stats_insertion"]["Row"];
type PartenariatRow = Database["public"]["Tables"]["partenariats"]["Row"];
type DemographieRow = Database["public"]["Tables"]["demographie"]["Row"];
type EtablissementRow = Database["public"]["Tables"]["etablissements"]["Row"];
type SuiviProjetRow = Database["public"]["Tables"]["suivi_projets"]["Row"];

const toRegionalStatus = (statut: JeunesseRapportRow["statut_rapport"]): RegionalStatus => {
  if (statut === "VALIDE") return "TERMINE";
  if (statut === "NON_COMMENCE") return "NON_COMMENCE";
  return "EN_COURS";
};

const JEUNESSE_SCORE_WEIGHTS = {
  total_activites: 20,
  total_beneficiaires: 20,
  taux_couverture: 15,
  taux_feminisation: 15,
  total_partenariats: 15,
  etablissements_actifs: 15,
} as const;

type JeunesseScoreKpis = {
  total_activites: number;
  total_beneficiaires: number;
  taux_couverture: number;
  taux_feminisation: number;
  total_partenariats: number;
  etablissements_actifs: number;
};

const clampScore = (score: number) =>
  Number.isFinite(score) ? Math.max(0, Math.min(100, score)) : 0;

const relativeScore = (directionValue: number, regionalValue: number) =>
  regionalValue > 0 ? (directionValue / regionalValue) * 100 : 0;

const calculateJeunesseScore = (
  directionKpis: JeunesseScoreKpis,
  regionalKpis: JeunesseScoreKpis,
  status: string,
) => {
  if (status === "NON_COMMENCE") return 0;

  const score = (Object.keys(JEUNESSE_SCORE_WEIGHTS) as Array<keyof JeunesseScoreKpis>).reduce(
    (total, kpi) =>
      total +
      relativeScore(directionKpis[kpi], regionalKpis[kpi]) * (JEUNESSE_SCORE_WEIGHTS[kpi] / 100),
    0,
  );

  return clampScore(score);
};

const sum = (values: (number | null | undefined)[]) =>
  values.reduce((total, value) => total + (value ?? 0), 0);

interface JeunesseDataset {
  activites: ActiviteRow[];
  participants: ParticipantRow[];
  formations: FormationRow[];
  formationStats: FormationStatsRow[];
  festivals: FestivalRow[];
  festivalStats: FestivalStatsRow[];
  insertions: InsertionRow[];
  insertionStats: InsertionStatsRow[];
  partenariats: PartenariatRow[];
  projets: SuiviProjetRow[];
  demographie: DemographieRow[];
  etablissements: EtablissementRow[];
}

const loadJeunesseDataset = async (
  rapportIds: string[],
  year: number,
): Promise<JeunesseDataset> => {
  const [demographieResult, etablissementsResult] = await Promise.all([
    supabase.from("demographie").select("*").eq("annee", year),
    supabase.from("etablissements").select("*").eq("est_actif", true),
  ]);
  if (rapportIds.length === 0) {
    return {
      activites: [],
      participants: [],
      formations: [],
      formationStats: [],
      festivals: [],
      festivalStats: [],
      insertions: [],
      insertionStats: [],
      partenariats: [],
      projets: [],
      demographie: demographieResult.data ?? [],
      etablissements: etablissementsResult.data ?? [],
    };
  }
  const [
    activitesResult,
    participantsResult,
    formationsResult,
    festivalsResult,
    insertionsResult,
    partenariatsResult,
    projetsResult,
  ] = await Promise.all([
    supabase.from("activites").select("*").in("rapport_id", rapportIds),
    supabase.from("participants").select("*").in("rapport_id", rapportIds),
    supabase.from("formations").select("*").in("rapport_id", rapportIds),
    supabase.from("festivals").select("*").in("rapport_id", rapportIds),
    supabase.from("activites_insertion").select("*").in("rapport_id", rapportIds),
    supabase.from("partenariats").select("*").in("rapport_id", rapportIds),
    supabase.from("suivi_projets").select("*").in("rapport_id", rapportIds),
  ]);
  const formations = formationsResult.data ?? [];
  const festivals = festivalsResult.data ?? [];
  const insertions = insertionsResult.data ?? [];
  const [formationStatsResult, festivalStatsResult, insertionStatsResult] = await Promise.all([
    formations.length
      ? supabase
          .from("statistiques_formation")
          .select("*")
          .in(
            "formation_id",
            formations.map((row) => row.id),
          )
      : Promise.resolve({ data: [] as FormationStatsRow[] }),
    festivals.length
      ? supabase
          .from("statistiques_festivals")
          .select("*")
          .in(
            "festival_id",
            festivals.map((row) => row.id),
          )
      : Promise.resolve({ data: [] as FestivalStatsRow[] }),
    insertions.length
      ? supabase
          .from("stats_insertion")
          .select("*")
          .in(
            "activite_id",
            insertions.map((row) => row.id),
          )
      : Promise.resolve({ data: [] as InsertionStatsRow[] }),
  ]);
  return {
    activites: activitesResult.data ?? [],
    participants: participantsResult.data ?? [],
    formations,
    formationStats: formationStatsResult.data ?? [],
    festivals,
    festivalStats: festivalStatsResult.data ?? [],
    insertions,
    insertionStats: insertionStatsResult.data ?? [],
    partenariats: partenariatsResult.data ?? [],
    projets: projetsResult.data ?? [],
    demographie: demographieResult.data ?? [],
    etablissements: etablissementsResult.data ?? [],
  };
};

const aggregateJeunesse = (
  rapports: JeunesseRapportRow[],
  dataset: JeunesseDataset,
  directionId?: string,
): JeunesseScoreKpis &
  JeunesseRegionalKpis & {
    section3: JeunesseRegionalSection3;
    activityEvolution: JeunesseRegionalEvolution["activites"];
    establishmentEvolution: JeunesseRegionalEvolution["etablissements"];
  } => {
  const scopedReports = directionId
    ? rapports.filter((rapport) => rapport.direction_id === directionId)
    : rapports;
  const reportIds = new Set(scopedReports.map((rapport) => rapport.id));
  const rowsForReports = <T extends { rapport_id: string | null }>(rows: T[]) =>
    rows.filter((row) => row.rapport_id !== null && reportIds.has(row.rapport_id));
  const activites = rowsForReports(dataset.activites);
  const participants = rowsForReports(dataset.participants);
  const formations = rowsForReports(dataset.formations);
  const festivals = rowsForReports(dataset.festivals);
  const insertions = rowsForReports(dataset.insertions);
  const partenariats = rowsForReports(dataset.partenariats);
  const projets = rowsForReports(dataset.projets);
  const formationIds = new Set(formations.map((row) => row.id));
  const festivalIds = new Set(festivals.map((row) => row.id));
  const insertionIds = new Set(insertions.map((row) => row.id));
  const formationStats = dataset.formationStats.filter(
    (row) => row.formation_id !== null && formationIds.has(row.formation_id),
  );
  const festivalStats = dataset.festivalStats.filter(
    (row) => row.festival_id !== null && festivalIds.has(row.festival_id),
  );
  const insertionStats = dataset.insertionStats.filter(
    (row) => row.activite_id !== null && insertionIds.has(row.activite_id),
  );
  const demographie = directionId
    ? dataset.demographie.filter((row) => row.direction_id === directionId)
    : dataset.demographie;
  const etablissements = directionId
    ? dataset.etablissements.filter((row) => row.direction_id === directionId)
    : dataset.etablissements;
  const totalActivites = activites.reduce(
    (total, row) =>
      total +
      sum([
        row.activites_culturelles,
        row.activites_educatives,
        row.activites_sportives,
        row.renforcement_capacites,
      ]),
    0,
  );
  const hommes =
    sum(participants.map((row) => row.hommes)) +
    sum(formationStats.map((row) => row.nombre_beneficiaires_hommes)) +
    sum(festivalStats.map((row) => row.nombre_hommes)) +
    sum(insertionStats.map((row) => row.hommes));
  const femmes =
    sum(participants.map((row) => row.femmes)) +
    sum(formationStats.map((row) => row.nombre_beneficiaires_femmes)) +
    sum(festivalStats.map((row) => row.nombre_femmes)) +
    sum(insertionStats.map((row) => row.femmes));
  const totalBeneficiaires = hommes + femmes;
  const totalZones =
    sum(participants.map((row) => (row.milieu_rural ?? 0) + (row.milieu_urbain ?? 0))) +
    sum(festivalStats.map((row) => (row.nbr_rural ?? 0) + (row.nbr_urbain ?? 0))) +
    sum(insertionStats.map((row) => (row.nbr_rural ?? 0) + (row.nbr_urbain ?? 0)));
  const regionalPopulation = sum(demographie.map((row) => row.population_jeune));
  const latestProjects = new Map<string, SuiviProjetRow>();
  projets.forEach((project) => {
    if (project.etablissement_id) latestProjects.set(project.etablissement_id, project);
  });
  const blocked = new Set(
    Array.from(latestProjects.entries())
      .filter(([, project]) => project.statut === "en_cours" || project.statut === "ferme")
      .map(([id]) => id),
  );
  const activeEstablishments = etablissements.filter(
    (row) => row.type_etablissement === "maison_jeunes" && !blocked.has(row.id),
  ).length;
  const kpis = {
    total_activites: totalActivites,
    total_beneficiaires: totalBeneficiaires,
    taux_couverture: regionalPopulation > 0 ? (totalBeneficiaires * 100) / regionalPopulation : 0,
    taux_feminisation: totalBeneficiaires > 0 ? (femmes * 100) / totalBeneficiaires : 0,
    total_partenariats: sum(partenariats.map((row) => row.nombre_conventions)),
    etablissements_actifs: activeEstablishments,
  };
  const section3 = {
    domaine_educatif: sum(activites.map((row) => row.activites_educatives)),
    domaine_culturel: sum(activites.map((row) => row.activites_culturelles)),
    domaine_sportif: sum(activites.map((row) => row.activites_sportives)),
    domaine_capacite: sum(activites.map((row) => row.renforcement_capacites)),
    femmes,
    hommes,
    rural:
      sum(participants.map((row) => row.milieu_rural)) +
      sum(festivalStats.map((row) => row.nbr_rural)) +
      sum(insertionStats.map((row) => row.nbr_rural)),
    urbain:
      sum(participants.map((row) => row.milieu_urbain)) +
      sum(festivalStats.map((row) => row.nbr_urbain)) +
      sum(insertionStats.map((row) => row.nbr_urbain)),
  };
  const quarter = (trimestre: string) =>
    scopedReports.filter((rapport) => rapport.trimestre?.toUpperCase() === trimestre);
  const activityEvolution = ["T1", "T2", "T3", "T4"].map((trimestre) => ({
    trimestre: trimestre.toLowerCase(),
    total_activites: quarter(trimestre).length ? totalActivites : null,
  }));
  const establishmentEvolution = ["T1", "T2", "T3", "T4"].map((trimestre) => ({
    trimestre: trimestre.toLowerCase(),
    fonctionnels: quarter(trimestre).length ? activeEstablishments : null,
    travaux: null,
    fermes: null,
  }));
  return { ...kpis, section3, activityEvolution, establishmentEvolution };
};

/**
 * Charge et prépare les données du dashboard régional pour le domaine JEUNESSE.
 *
 * Les KPI et visualisations sont agrégés localement depuis les tables métier
 * Jeunesse reliées aux rapports de l'année.
 */
export async function loadJeunesseRegionalDashboard(
  year: number,
): Promise<JeunesseRegionalDashboardData> {
  const [rapportsResult, dirs] = await Promise.all([
    supabase
      .from("rapports")
      .select("id, direction_id, annee, statut_rapport, trimestre")
      .eq("annee", year),
    supabase.from("directions").select("*"),
  ]);

  const rapports = (rapportsResult.data ?? []) as JeunesseRapportRow[];
  const dataset = await loadJeunesseDataset(
    rapports.map((rapport) => rapport.id),
    year,
  );
  const regionalAggregate = aggregateJeunesse(rapports, dataset);
  const directionAggregates = (dirs.data ?? []).map((direction) => ({
    direction,
    aggregate: aggregateJeunesse(rapports, dataset, direction.id),
  }));

  const dirsWithScores = directionAggregates.map(({ direction: pref, aggregate }) => {
    const directionRapports = rapports.filter((rapport) => rapport.direction_id === pref.id);
    const status: RegionalStatus =
      directionRapports.length === 0 ||
      directionRapports.every((rapport) => rapport.statut_rapport === "NON_COMMENCE")
        ? "NON_COMMENCE"
        : directionRapports.every((rapport) => rapport.statut_rapport === "VALIDE")
          ? "TERMINE"
          : "EN_COURS";

    return {
      ...pref,
      score: calculateJeunesseScore(aggregate, regionalAggregate, status),
      rang_regional: 99,
      pref_total_activites: aggregate.total_activites,
      pref_total_beneficiaires: aggregate.total_beneficiaires,
      statut: status,
    };
  });

  dirsWithScores.sort((left, right) => right.score - left.score);
  let rankableIndex = 0;
  dirsWithScores.forEach((direction, index) => {
    if (direction.score <= 0 || direction.statut === "NON_COMMENCE") return;
    rankableIndex += 1;
    direction.rang_regional =
      index > 0 && direction.score === dirsWithScores[index - 1].score
        ? dirsWithScores[index - 1].rang_regional
        : rankableIndex;
  });

  // --- KPI (section 2) ---
  const kpis: JeunesseRegionalKpis = {
    total_beneficiaires: regionalAggregate.total_beneficiaires,
    total_activites: regionalAggregate.total_activites,
    etablissements_actifs: regionalAggregate.etablissements_actifs,
    total_partenariats: regionalAggregate.total_partenariats,
    taux_feminisation: regionalAggregate.taux_feminisation,
    taux_couverture: regionalAggregate.taux_couverture,
  };

  // --- Structure & Inclusion Sociale (section 3) ---
  const section3 = regionalAggregate.section3;

  // --- Dynamique Régionale / Évolution trimestrielle (section 4) ---
  let activityEvolution: JeunesseRegionalEvolution["activites"];
  let establishmentEvolution: JeunesseRegionalEvolution["etablissements"];

  if (regionalAggregate.activityEvolution.length > 0) {
    // On crée un squelette vide pour forcer l'axe X à toujours afficher les 4 trimestres
    const trimestresVides = ["t1", "t2", "t3", "t4"];

    activityEvolution = trimestresVides.map((tLabel) => {
      // On cherche si la BDD a retourné ce trimestre (en ignorant la casse et les "Tt")
      const row = regionalAggregate.activityEvolution.find(
        (r) => r.trimestre === tLabel.toLowerCase(),
      );

      return {
        trimestre: tLabel, // "T1", "T2", etc. (Toujours propre)
        // On utilise null et non 0 pour que la ligne s'arrête au lieu de plonger
        total_activites: row ? row.total_activites : null,
      };
    });

    establishmentEvolution = trimestresVides.map((tLabel) => {
      const row = regionalAggregate.establishmentEvolution.find(
        (r) => r.trimestre === tLabel.toLowerCase(),
      );

      return {
        trimestre: tLabel,
        fonctionnels: row ? row.fonctionnels : null,
        travaux: row ? row.travaux : null,
        fermes: row ? row.fermes : null,
      };
    });
  } else {
    // Si aucune donnée, on affiche quand même l'axe X vide
    activityEvolution = EMPTY_JEUNESSE_TRIMESTRES.map((trimestre) => ({
      trimestre,
      total_activites: null,
    }));
    establishmentEvolution = EMPTY_JEUNESSE_TRIMESTRES.map((trimestre) => ({
      trimestre,
      fonctionnels: null,
      travaux: null,
      fermes: null,
    }));
  }

  const completedDirections = dirsWithScores.filter(
    (direction) => direction.statut === "TERMINE",
  ).length;
  const inProgressDirections = dirsWithScores.filter(
    (direction) => direction.statut === "EN_COURS",
  ).length;

  return {
    status: {
      hasData: rapports.length > 0,
      submittedReports: rapports.length,
      completedDirections,
      inProgressDirections,
      notStartedDirections: dirsWithScores.length - completedDirections - inProgressDirections,
    },
    kpis,
    section3,
    evolution: { activites: activityEvolution, etablissements: establishmentEvolution },
    comparison: {
      directions: dirsWithScores.map((direction) => ({
        id: String(direction.id),
        name: direction.nom_fr || `Direction ${direction.id}`,
        status: direction.statut,
        primary: direction.pref_total_activites || 0,
        secondary: direction.pref_total_beneficiaires || 0,
        rank: direction.rang_regional < 99 ? direction.rang_regional : null,
        score: direction.score,
      })),
      primary: {
        key: "total_activites",
        label: "Activités",
        regionalAverage: dirsWithScores.length
          ? kpis.total_activites / dirsWithScores.length
          : null,
      },
      secondary: {
        key: "total_beneficiaires",
        label: "Bénéficiaires",
        regionalAverage: dirsWithScores.length
          ? kpis.total_beneficiaires / dirsWithScores.length
          : null,
      },
      score: {
        label: "Score Jeunesse",
        methodology:
          "Pondération existante : activités 20 %, bénéficiaires 20 %, couverture 15 %, féminisation 15 %, partenariats 15 %, établissements actifs 15 %. Score relatif à l'agrégat régional, borné 0–100 ; NON_COMMENCE = 0.",
      },
    },
  };
}
