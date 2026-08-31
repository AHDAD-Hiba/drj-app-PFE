import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import type { DashboardData } from "@/services/prefDomainDashboardTypes";
import { loadRegionalDirectionIds } from "@/services/prefDomainRegionalBenchmark";

type RapportRow = Pick<Database["public"]["Tables"]["rapports"]["Row"], "id" | "direction_id" | "annee" | "trimestre" | "statut_rapport" | "commentaire_correction" | "updated_at">;
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
type EncadrementRow = Database["public"]["Tables"]["encadrements"]["Row"];
type MouvementAssociationRow = Database["public"]["Tables"]["mouvements_associations"]["Row"];
type FermetureRow = Database["public"]["Tables"]["fermetures"]["Row"];
type TypeFermetureRow = Database["public"]["Tables"]["types_fermeture"]["Row"];
type TypePartenaireRow = Database["public"]["Tables"]["types_partenaires"]["Row"];

type JeunesseSnapshot = {
  directionRapports: RapportRow[];
  activites: ActiviteRow[];
  participants: ParticipantRow[];
  encadrements: EncadrementRow[];
  formations: FormationRow[];
  formationStats: FormationStatsRow[];
  festivals: FestivalRow[];
  festivalStats: FestivalStatsRow[];
  insertions: InsertionRow[];
  insertionStats: InsertionStatsRow[];
  partenariats: PartenariatRow[];
  projets: SuiviProjetRow[];
  mouvements: MouvementAssociationRow[];
  fermetures: FermetureRow[];
  demographie: DemographieRow[];
  etablissements: EtablissementRow[];
  typePartenaires: TypePartenaireRow[];
  typeFermetures: TypeFermetureRow[];
};

const sum = (values: (number | null | undefined)[]) =>
  values.reduce((total, value) => total + (value ?? 0), 0);

type DynamicSupabaseTable = {
  select: (columns: string) => {
    in: (column: string, values: string[]) => Promise<{ data: unknown[] | null }>;
  };
};

const fromDynamicTable = supabase.from as unknown as (table: string) => DynamicSupabaseTable;

const loadRows = async <T>(table: string, rapportIds: string[]): Promise<T[]> => {
  if (rapportIds.length === 0) return [];
  const { data } = await fromDynamicTable(table).select("*").in("rapport_id", rapportIds);
  return (data ?? []) as T[];
};

const loadRowsByColumn = async <T>(table: string, column: string, ids: string[]): Promise<T[]> => {
  if (ids.length === 0) return [];
  const { data } = await fromDynamicTable(table).select("*").in(column, ids);
  return (data ?? []) as T[];
};

const emptySnapshot = (directionRapports: RapportRow[] = []): JeunesseSnapshot => ({
  directionRapports,
  activites: [],
  participants: [],
  encadrements: [],
  formations: [],
  formationStats: [],
  festivals: [],
  festivalStats: [],
  insertions: [],
  insertionStats: [],
  partenariats: [],
  projets: [],
  mouvements: [],
  fermetures: [],
  demographie: [],
  etablissements: [],
  typePartenaires: [],
  typeFermetures: [],
});

const loadJeunesseSnapshot = async (
  rapports: RapportRow[],
  directionIds: string[],
  year: number,
): Promise<JeunesseSnapshot> => {
  const rapportIds = rapports.map((rapport) => rapport.id);
  const uniqueDirectionIds = Array.from(new Set(directionIds.filter(Boolean)));
  if (rapportIds.length === 0) return emptySnapshot(rapports);

  const [
    activites,
    participants,
    formations,
    festivals,
    insertions,
    partenariats,
    projets,
    encadrements,
    mouvements,
    fermetures,
    typePartenaires,
    typeFermetures,
    demographie,
    etablissements,
  ] = await Promise.all([
    loadRows<ActiviteRow>("activites", rapportIds),
    loadRows<ParticipantRow>("participants", rapportIds),
    loadRows<FormationRow>("formations", rapportIds),
    loadRows<FestivalRow>("festivals", rapportIds),
    loadRows<InsertionRow>("activites_insertion", rapportIds),
    loadRows<PartenariatRow>("partenariats", rapportIds),
    loadRows<SuiviProjetRow>("suivi_projets", rapportIds),
    loadRows<EncadrementRow>("encadrements", rapportIds),
    loadRows<MouvementAssociationRow>("mouvements_associations", rapportIds),
    loadRows<FermetureRow>("fermetures", rapportIds),
    supabase.from("types_partenaires").select("*").then(({ data }) => (data ?? []) as TypePartenaireRow[]),
    supabase.from("types_fermeture").select("*").then(({ data }) => (data ?? []) as TypeFermetureRow[]),
    uniqueDirectionIds.length === 0
      ? Promise.resolve([])
      : supabase
          .from("demographie")
          .select("*")
          .in("direction_id", uniqueDirectionIds)
          .eq("annee", year)
          .then(({ data }) => (data ?? []) as DemographieRow[]),
    uniqueDirectionIds.length === 0
      ? Promise.resolve([])
      : supabase
          .from("etablissements")
          .select("*")
          .in("direction_id", uniqueDirectionIds)
          .eq("est_actif", true)
          .then(({ data }) => (data ?? []) as EtablissementRow[]),
  ]);
  const [formationStats, festivalStats, insertionStats] = await Promise.all([
    loadRowsByColumn<FormationStatsRow>("statistiques_formation", "formation_id", formations.map((row) => row.id)),
    loadRowsByColumn<FestivalStatsRow>("statistiques_festivals", "festival_id", festivals.map((row) => row.id)),
    loadRowsByColumn<InsertionStatsRow>("stats_insertion", "activite_id", insertions.map((row) => row.id)),
  ]);

  return {
    directionRapports: rapports,
    activites,
    participants,
    encadrements,
    formations,
    formationStats,
    festivals,
    festivalStats,
    insertions,
    insertionStats,
    partenariats,
    projets,
    mouvements,
    fermetures,
    demographie,
    etablissements,
    typePartenaires,
    typeFermetures,
  };
};

const scopeSnapshotToDirection = (snapshot: JeunesseSnapshot, directionId: string): JeunesseSnapshot => {
  const directionRapports = snapshot.directionRapports.filter((rapport) => rapport.direction_id === directionId);
  const rapportIds = new Set(directionRapports.map((rapport) => rapport.id));
  const formations = snapshot.formations.filter((row) => row.rapport_id && rapportIds.has(row.rapport_id));
  const formationIds = new Set(formations.map((row) => row.id));
  const festivals = snapshot.festivals.filter((row) => row.rapport_id && rapportIds.has(row.rapport_id));
  const festivalIds = new Set(festivals.map((row) => row.id));
  const insertions = snapshot.insertions.filter((row) => row.rapport_id && rapportIds.has(row.rapport_id));
  const insertionIds = new Set(insertions.map((row) => row.id));

  return {
    ...snapshot,
    directionRapports,
    activites: snapshot.activites.filter((row) => row.rapport_id && rapportIds.has(row.rapport_id)),
    participants: snapshot.participants.filter((row) => row.rapport_id && rapportIds.has(row.rapport_id)),
    encadrements: snapshot.encadrements.filter((row) => row.rapport_id && rapportIds.has(row.rapport_id)),
    formations,
    formationStats: snapshot.formationStats.filter((row) => row.formation_id && formationIds.has(row.formation_id)),
    festivals,
    festivalStats: snapshot.festivalStats.filter((row) => row.festival_id && festivalIds.has(row.festival_id)),
    insertions,
    insertionStats: snapshot.insertionStats.filter((row) => row.activite_id && insertionIds.has(row.activite_id)),
    partenariats: snapshot.partenariats.filter((row) => row.rapport_id && rapportIds.has(row.rapport_id)),
    projets: snapshot.projets.filter((row) => row.rapport_id && rapportIds.has(row.rapport_id)),
    mouvements: snapshot.mouvements.filter((row) => row.rapport_id && rapportIds.has(row.rapport_id)),
    fermetures: snapshot.fermetures.filter((row) => row.rapport_id && rapportIds.has(row.rapport_id)),
    demographie: snapshot.demographie.filter((row) => row.direction_id === directionId),
    etablissements: snapshot.etablissements.filter((row) => row.direction_id === directionId),
  };
};

const buildSection2FromSnapshot = (snapshot: JeunesseSnapshot) => {
  const {
    directionRapports,
    activites,
    participants,
    formationStats,
    festivalStats,
    insertionStats,
    partenariats,
    projets,
    demographie,
    etablissements,
  } = snapshot;

  const activiteTotal = activites.reduce((total, row) => total + sum([
    row.activites_culturelles,
    row.activites_educatives,
    row.activites_sportives,
    row.renforcement_capacites,
  ]), 0);
  const campingHommes = sum(participants.map((row) => row.hommes));
  const campingFemmes = sum(participants.map((row) => row.femmes));
  const formationHommes = sum(formationStats.map((row) => row.nombre_beneficiaires_hommes));
  const formationFemmes = sum(formationStats.map((row) => row.nombre_beneficiaires_femmes));
  const festivalHommes = sum(festivalStats.map((row) => row.nombre_hommes));
  const festivalFemmes = sum(festivalStats.map((row) => row.nombre_femmes));
  const insertionHommes = sum(insertionStats.map((row) => row.hommes));
  const insertionFemmes = sum(insertionStats.map((row) => row.femmes));
  const totalBeneficiaires = sum([
    campingHommes, campingFemmes, formationHommes, formationFemmes,
    festivalHommes, festivalFemmes, insertionHommes, insertionFemmes,
  ]);
  const femmes = sum([campingFemmes, formationFemmes, festivalFemmes, insertionFemmes]);
  const dernierStatut = new Map<string, SuiviProjetRow>();
  projets.forEach((projet) => {
    const rapport = directionRapports.find((item) => item.id === projet.rapport_id);
    const previous = dernierStatut.get(projet.etablissement_id ?? "");
    const previousRapport = previous ? directionRapports.find((item) => item.id === previous.rapport_id) : undefined;
    if (!previous || (rapport?.trimestre ?? "") > (previousRapport?.trimestre ?? "")) {
      if (projet.etablissement_id) dernierStatut.set(projet.etablissement_id, projet);
    }
  });
  const blockedIds = new Set(
    Array.from(dernierStatut.entries())
      .filter(([, projet]) => projet.statut === "en_cours" || projet.statut === "ferme")
      .map(([id]) => id),
  );
  const etablissementsActifs = etablissements
    .filter((etablissement) => etablissement.type_etablissement === "maison_jeunes" && !blockedIds.has(etablissement.id))
    .length;
  const demographieRow = demographie[0];

  return {
    total_activites: activiteTotal,
    total_beneficiaires: totalBeneficiaires,
    taux_feminisation: totalBeneficiaires > 0 ? (femmes * 100) / totalBeneficiaires : 0,
    taux_ruralite: sum(participants.map((row) => row.milieu_rural)) + sum(festivalStats.map((row) => row.nbr_rural)) + sum(insertionStats.map((row) => row.nbr_rural)),
    taux_couverture: demographieRow && demographieRow.population_jeune > 0 ? (totalBeneficiaires * 100) / demographieRow.population_jeune : 0,
    total_partenariats: sum(partenariats.map((row) => row.nombre_conventions)),
    etablissements_actifs: etablissementsActifs,
  };
};

// --- Service dédié à PrefDomainDashboard ---
// Aucune dépendance vers DirectionDetail (ni composants, ni types partagés).
// Seule la fonction loadDashboard() est exposée ; tout le reste est privé à ce module.

// --- Requêtes par section (privées) ---

const loadSection1FromTables = async (rapportId: string, domaineId?: string) => {
  const baseQuery = supabase
    .from("suivi_remplissage")
    .select("id, rapport_id, domaine_id, statut, progression_pourcentage, updated_at")
    .eq("rapport_id", rapportId);
  const query = domaineId ? baseQuery.eq("domaine_id", domaineId) : baseQuery;

  const { data } = await query.order("updated_at", { ascending: false }).limit(1).maybeSingle();
  return data;
};

const percentage = (value: number, total: number) =>
  total > 0 ? Number(((value * 100) / total).toFixed(2)) : 0;

const buildSection3FromSnapshot = (snapshot: JeunesseSnapshot) => {
  const { participants, formationStats, festivalStats, insertionStats } = snapshot;
  const programmes = [
    {
      name: "Camping",
      hommes: sum(participants.map((row) => row.hommes)),
      femmes: sum(participants.map((row) => row.femmes)),
      urbain: sum(participants.map((row) => row.milieu_urbain)),
      rural: sum(participants.map((row) => row.milieu_rural)),
    },
    {
      name: "Formation",
      hommes: sum(formationStats.map((row) => row.nombre_beneficiaires_hommes)),
      femmes: sum(formationStats.map((row) => row.nombre_beneficiaires_femmes)),
      urbain: 0,
      rural: 0,
    },
    {
      name: "Festivals",
      hommes: sum(festivalStats.map((row) => row.nombre_hommes)),
      femmes: sum(festivalStats.map((row) => row.nombre_femmes)),
      urbain: sum(festivalStats.map((row) => row.nbr_urbain)),
      rural: sum(festivalStats.map((row) => row.nbr_rural)),
    },
    {
      name: "Insertion",
      hommes: sum(insertionStats.map((row) => row.hommes)),
      femmes: sum(insertionStats.map((row) => row.femmes)),
      urbain: sum(insertionStats.map((row) => row.nbr_urbain)),
      rural: sum(insertionStats.map((row) => row.nbr_rural)),
    },
  ];
  return programmes.map(({ name, hommes, femmes, urbain, rural }) => {
    const total = hommes + femmes;
    const totalZone = urbain + rural;
    return {
      name,
      total,
      hommesPct: percentage(hommes, total),
      femmesPct: percentage(femmes, total),
      urbainPct: percentage(urbain, totalZone),
      ruralPct: percentage(rural, totalZone),
    };
  });
};

const buildSection4FromSnapshot = (snapshot: JeunesseSnapshot) => {
  const { directionRapports, participants, formations, formationStats, festivals, festivalStats, insertions, insertionStats } = snapshot;
  const quarterForReport = new Map(directionRapports.map((rapport) => [rapport.id, rapport.trimestre?.toUpperCase()]));
  const quarters = ["T1", "T2", "T3", "T4"];

  return quarters.map((name) => ({
    name,
    Camping: sum(participants.filter((row) => quarterForReport.get(row.rapport_id ?? "") === name).map((row) => (row.hommes ?? 0) + (row.femmes ?? 0))),
    Formation: sum(formationStats.filter((row) => quarterForReport.get(formations.find((formation) => formation.id === row.formation_id)?.rapport_id ?? "") === name).map((row) => (row.nombre_beneficiaires_hommes ?? 0) + (row.nombre_beneficiaires_femmes ?? 0))),
    Festivals: sum(festivalStats.filter((row) => quarterForReport.get(festivals.find((festival) => festival.id === row.festival_id)?.rapport_id ?? "") === name).map((row) => (row.nombre_hommes ?? 0) + (row.nombre_femmes ?? 0))),
    Insertion: sum(insertionStats.filter((row) => quarterForReport.get(insertions.find((insertion) => insertion.id === row.activite_id)?.rapport_id ?? "") === name).map((row) => (row.hommes ?? 0) + (row.femmes ?? 0))),
  }));
};

const loadRegionalJeunesseSnapshot = async (
  directionId: string,
  year: number,
  currentRapports: RapportRow[],
  regionalDirectionIds: string[],
) => {
  if (regionalDirectionIds.length === 0) {
    return {
      regionalDirections: [{ id: directionId }],
      regionalSnapshot: await loadJeunesseSnapshot(currentRapports, [directionId], year),
    };
  }

  const { data: regionalReports } = await supabase
    .from("rapports")
    .select("id, direction_id, annee, trimestre, statut_rapport, commentaire_correction, updated_at")
    .eq("annee", year)
    .in("direction_id", regionalDirectionIds);
  const regionalSnapshot = await loadJeunesseSnapshot((regionalReports ?? []) as RapportRow[], regionalDirectionIds, year);

  return { regionalDirections: regionalDirectionIds.map((id) => ({ id })), regionalSnapshot };
};

const buildSection5FromSnapshot = (
  currentKpis: ReturnType<typeof buildSection2FromSnapshot>,
  regionalDirections: { id: string }[],
  regionalSnapshot: JeunesseSnapshot,
) => {
  const regionalKpis = regionalDirections.map((regionalDirection) =>
    buildSection2FromSnapshot(scopeSnapshotToDirection(regionalSnapshot, regionalDirection.id)),
  );
  const averageKpi = (key: keyof typeof currentKpis) =>
    regionalKpis.length === 0 ? 0 : regionalKpis.reduce((total, kpis) => total + Number(kpis[key] ?? 0), 0) / regionalKpis.length;

  return [
    { kpi: "Total des Activités", monScore: currentKpis.total_activites, moyenneReg: averageKpi("total_activites"), isPercentage: false },
    { kpi: "Total Bénéficiaires", monScore: currentKpis.total_beneficiaires, moyenneReg: averageKpi("total_beneficiaires"), isPercentage: false },
    { kpi: "Taux de Couverture", monScore: currentKpis.taux_couverture, moyenneReg: averageKpi("taux_couverture"), isPercentage: true },
    { kpi: "Taux de Féminisation", monScore: currentKpis.taux_feminisation, moyenneReg: averageKpi("taux_feminisation"), isPercentage: true },
    { kpi: "Partenariats Actifs", monScore: currentKpis.total_partenariats, moyenneReg: averageKpi("total_partenariats"), isPercentage: false },
    { kpi: "Établ. Opérationnels", monScore: currentKpis.etablissements_actifs, moyenneReg: averageKpi("etablissements_actifs"), isPercentage: false },
  ];
};

const buildSection6FromSnapshot = (snapshot: JeunesseSnapshot) => {
  const {
    directionRapports,
    activites,
    participants,
    encadrements,
    formations,
    formationStats,
    festivals,
    festivalStats,
    insertions,
    insertionStats,
    partenariats,
    mouvements,
    projets,
    fermetures,
    typePartenaires,
    typeFermetures,
  } = snapshot;
  const totalStaff = sum(encadrements.map((row) => (row.nombre_hommes ?? 0) + (row.nombre_femmes ?? 0)));
  const totalCamping = sum(participants.map((row) => (row.hommes ?? 0) + (row.femmes ?? 0)));
  const typePartenaireById = new Map(typePartenaires.map((row) => [row.id, row.nom]));
  const conventionsByType = new Map<string, number>();
  partenariats.forEach((row) => {
    const type = typePartenaireById.get(row.type_partenaire_id ?? "") ?? "non_precise";
    conventionsByType.set(type, (conventionsByType.get(type) ?? 0) + (row.nombre_conventions ?? 0));
  });
  const latestProjectByEstablishment = new Map<string, SuiviProjetRow>();
  projets.forEach((project) => {
    if (!project.etablissement_id) return;
    const previous = latestProjectByEstablishment.get(project.etablissement_id);
    const currentReport = directionRapports.find((report) => report.id === project.rapport_id);
    const previousReport = previous ? directionRapports.find((report) => report.id === previous.rapport_id) : undefined;
    if (!previous || (currentReport?.trimestre ?? "") > (previousReport?.trimestre ?? "")) {
      latestProjectByEstablishment.set(project.etablissement_id, project);
    }
  });
  const latestClosureByEstablishment = new Map<string, FermetureRow>();
  fermetures.forEach((closure) => {
    if (!closure.etablissement_id) return;
    const previous = latestClosureByEstablishment.get(closure.etablissement_id);
    const currentReport = directionRapports.find((report) => report.id === closure.rapport_id);
    const previousReport = previous ? directionRapports.find((report) => report.id === previous.rapport_id) : undefined;
    if (!previous || (currentReport?.trimestre ?? "") > (previousReport?.trimestre ?? "")) {
      latestClosureByEstablishment.set(closure.etablissement_id, closure);
    }
  });
  const typeFermetureById = new Map(typeFermetures.map((row) => [row.id, row.nom]));
  const causes = new Map<string, number>();
  latestClosureByEstablishment.forEach((closure) => {
    const cause = typeFermetureById.get(closure.type_fermeture_id ?? "") ?? "non_precise";
    causes.set(cause, (causes.get(cause) ?? 0) + 1);
  });
  const mouvementTotals = (type: "entrante" | "sortante") => {
    const rows = mouvements.filter((row) => row.type_mouvement === type);
    return { count: rows.length, beneficiaires: sum(rows.map((row) => row.beneficiaires)) };
  };

  return {
    activites: {
      nombre_associations: sum(activites.map((row) => row.nombre_associations)),
      nombre_clubs: sum(activites.map((row) => row.nombre_clubs)),
      nombre_conventions: sum(activites.map((row) => row.nombre_conventions)),
      activites_sportives: sum(activites.map((row) => row.activites_sportives)),
      activites_culturelles: sum(activites.map((row) => row.activites_culturelles)),
      activites_educatives: sum(activites.map((row) => row.activites_educatives)),
      renforcement_capacites: sum(activites.map((row) => row.renforcement_capacites)),
    },
    associations: {
      entrants: mouvementTotals("entrante").count,
      sortants: mouvementTotals("sortante").count,
      benef_entrants: mouvementTotals("entrante").beneficiaires,
      benef_sortants: mouvementTotals("sortante").beneficiaires,
    },
    camping: {
      participants: {
        total: totalCamping,
        enfants_mre: sum(participants.map((row) => row.enfants_marocains_etranger)),
        besoins_specifiques: sum(participants.map((row) => row.besoins_specifiques)),
      },
      encadrement: {
        ratio: totalStaff === 0 || totalCamping === 0 ? "0:0" : `1:${Math.round(totalCamping / totalStaff)}`,
        total_staff: totalStaff,
        hommes: sum(encadrements.map((row) => row.nombre_hommes)),
        femmes: sum(encadrements.map((row) => row.nombre_femmes)),
      },
      formations: {
        total_sessions: formations.length,
        beneficiaires: sum(formationStats.map((row) => (row.nombre_beneficiaires_hommes ?? 0) + (row.nombre_beneficiaires_femmes ?? 0))),
      },
    },
    conventions: {
      total_conventions: sum(partenariats.map((row) => row.nombre_conventions)),
      total_partenaires: conventionsByType.size,
      repartition: Array.from(conventionsByType, ([type, count]) => ({ type, count })),
    },
    insertion: {
      total_activites: insertions.length,
      partenaires_actifs: new Set(insertions.map((row) => row.type_partenaire_id).filter(Boolean)).size,
      volume_horaire: `${sum(insertions.map((row) => row.duree_valeur))} Heures`,
      genre: { hommes: sum(insertionStats.map((row) => row.hommes)), femmes: sum(insertionStats.map((row) => row.femmes)) },
      milieu: { urbain: sum(insertionStats.map((row) => row.nbr_urbain)), rural: sum(insertionStats.map((row) => row.nbr_rural)) },
    },
    festivals: {
      total_evenements: festivals.length,
      total_provinces: sum(festivalStats.map((row) => row.nbr_provinces_participantes)),
      qualifies: sum(festivalStats.map((row) => row.nbr_participants_qualifies)),
      total_participants: sum(festivalStats.map((row) => (row.nombre_hommes ?? 0) + (row.nombre_femmes ?? 0))),
      genre: { hommes: sum(festivalStats.map((row) => row.nombre_hommes)), femmes: sum(festivalStats.map((row) => row.nombre_femmes)) },
      milieu: { urbain: sum(festivalStats.map((row) => row.nbr_urbain)), rural: sum(festivalStats.map((row) => row.nbr_rural)) },
    },
    etablissements: {
      total: 0,
      operationnels: 0,
      nouvellement_creees: Array.from(latestProjectByEstablishment.values()).filter((row) => row.statut === "nouvel").length,
      en_cours_realisation: Array.from(latestProjectByEstablishment.values()).filter((row) => row.statut === "en_cours").length,
      fermees: { total: latestClosureByEstablishment.size, causes: Array.from(causes, ([cause, count]) => ({ cause, count })) },
    },
  };
};

// --- Fonctions de transformation (privées) ---

export type JeunesseEvolutionDatum = {
  name: string;
  Camping?: number | null;
  Festivals?: number | null;
  Formation?: number | null;
  Insertion?: number | null;
};

const formatEvolutionData = (dataArray: JeunesseEvolutionDatum[]) => {
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

const formatBenchmarkData = (data: Record<string, number> | null) => {
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

type LegacySection6ViewData = Partial<Record<
  | "camp_staff_total"
  | "camp_benef_total"
  | "act_assocs"
  | "act_clubs"
  | "act_conventions"
  | "act_sport"
  | "act_cult"
  | "act_educ"
  | "act_renf"
  | "assoc_entrants"
  | "assoc_sortants"
  | "benef_entrants"
  | "benef_sortants"
  | "camp_mre"
  | "camp_besoins_spec"
  | "camp_staff_h"
  | "camp_staff_f"
  | "form_total_sessions"
  | "form_beneficiaires"
  | "conv_total_global"
  | "conv_types_distincts"
  | "ins_total_activites"
  | "ins_partenaires_actifs"
  | "ins_volume_h"
  | "ins_hommes"
  | "ins_femmes"
  | "ins_urbain"
  | "ins_rural"
  | "fest_total"
  | "fest_provinces"
  | "fest_qualifies"
  | "fest_hommes"
  | "fest_femmes"
  | "fest_urbain"
  | "fest_rural"
  | "etab_nouvel"
  | "etab_en_cours"
  | "etab_total_fermes",
  number
>> & {
  repartition_partenaires_json?: unknown[];
  causes_fermeture_json?: unknown[];
};

const mapSection6Data = (data: LegacySection6ViewData | null) => {
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
        beneficiaires: d.form_beneficiaires || 0,
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

// --- Contrat générique partagé (ÉTAPE 5) ---
// Types nommés requis pour que Jeunesse implémente le même contrat
// DashboardData<TKpis, TSection3, TEvolution, TDetailed> que les 4 autres
// domaines.
//
// ÉTAPE 7 : harmonisation architecturale — section3 et evolution étaient les
// deux seuls champs où Jeunesse divergeait des 4 autres domaines (tableau nu
// au lieu d'un objet à clés nommées). Les données, leur calcul et leur ordre
// sont strictement inchangés ; seule l'enveloppe est désormais un objet
// nommé (`repartitionProgrammes`, `trimestriel`), comme
// InfrastructureSection3Data / InfrastructureEvolutionData par exemple.

export type JeunesseKpis = {
  totalBeneficiaries: number;
  totalActivities: number;
  feminizationRate: number;
  coverageRate: number;
  activeEstablishments: number;
  activePartnerships: number;
};

export type JeunesseSection3Datum = ReturnType<typeof buildSection3FromSnapshot>[number];

export interface JeunesseSection3Data {
  // Seule visualisation de la Section 3 Jeunesse : volume, mixité H/F et
  // couverture urbain/rural par programme (Camping, Formation, Festivals,
  // Insertion). Anciennement exposée comme un tableau nu.
  repartitionProgrammes: JeunesseSection3Datum[];
}

export interface JeunesseEvolutionData {
  // Évolution trimestrielle (T1..T4) des bénéficiaires par programme.
  // Anciennement exposée comme un tableau nu.
  trimestriel: JeunesseEvolutionDatum[];
}

export type JeunesseDetailedData = ReturnType<typeof mapSection6Data>;

export type JeunesseDashboardData = DashboardData<
  JeunesseKpis,
  JeunesseSection3Data,
  JeunesseEvolutionData,
  JeunesseDetailedData
>;

// --- Fonction unique exposée ---

export const loadDashboard = async (
  directionId: string,
  year: number,
  domaineId?: string
): Promise<JeunesseDashboardData> => {
  const regionalDirectionIdsPromise = loadRegionalDirectionIds(directionId);

  // 1. Charger tous les rapports de l'année pour agréger les tables brutes.
  const { data: rapportsData } = await supabase
    .from("rapports")
    .select("id, direction_id, annee, trimestre, statut_rapport, commentaire_correction, updated_at")
    .eq("direction_id", directionId)
    .eq("annee", year)
    .order("trimestre", { ascending: false });
  const rapports = (rapportsData ?? []) as RapportRow[];
  const rapport = rapports[0];

  // 2. Si AUCUN rapport n'est trouvé, on retourne un tableau de bord vide (rempli de zéros)
  if (!rapport) {
    return {
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
      section3: { repartitionProgrammes: [] },
      evolution: { trimestriel: formatEvolutionData([]) },
      benchmark: formatBenchmarkData(null),
      detailed: mapSection6Data(null),
    };
  }

  // 3. Les données métier restent chargées par leurs sections dédiées.
  // Le statut de remplissage vient directement de suivi_remplissage.
  // `loadRegionalDirectionIds` a démarré en parallèle de `rapports` (étape 1).
  const [section1, regionalDirectionIds] = await Promise.all([
    loadSection1FromTables(rapport.id, domaineId),
    regionalDirectionIdsPromise,
  ]);
  const regionalData = await loadRegionalJeunesseSnapshot(directionId, year, rapports, regionalDirectionIds);
  const currentSnapshot = scopeSnapshotToDirection(regionalData.regionalSnapshot, directionId);
  const section2 = buildSection2FromSnapshot(currentSnapshot);
  const section3 = buildSection3FromSnapshot(currentSnapshot);
  const section4 = buildSection4FromSnapshot(currentSnapshot);
  const section5 = buildSection5FromSnapshot(section2, regionalData.regionalDirections, regionalData.regionalSnapshot);
  const section6 = buildSection6FromSnapshot(currentSnapshot);

  // 4. On retourne les vraies données
  const workflowStatus = section1?.statut || (rapport.statut_rapport === "VALIDE"
    ? "TERMINE"
    : rapport.statut_rapport === "NON_COMMENCE"
      ? "NON_COMMENCE"
      : "EN_COURS");
  const progressPct = section1?.progression_pourcentage ?? (workflowStatus === "TERMINE" ? 100 : workflowStatus === "EN_COURS" ? 50 : 0);

  return {
    status: {
      workflowStatus,
      progressPct,
      lastUpdated: section1?.updated_at ?? rapport.updated_at,
      correctionComment: rapport.commentaire_correction ?? null,
      reportStatus: rapport.statut_rapport,
    },
    kpis: {
      totalBeneficiaries: section2?.total_beneficiaires || 0,
      totalActivities: section2?.total_activites || 0,
      feminizationRate: section2?.taux_feminisation || 0,
      coverageRate: section2?.taux_couverture || 0,
      activeEstablishments: section2?.etablissements_actifs || 0,
      activePartnerships: section2?.total_partenariats || 0,
    },
    section3: { repartitionProgrammes: section3 || [] },
    evolution: { trimestriel: formatEvolutionData(section4) },
    benchmark: section5,
    detailed: section6,
  };
};
