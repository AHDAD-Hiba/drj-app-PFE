import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import type { PrefDomainBenchmarkRow } from "@/components/dashboard/PrefDomainBenchmarkTable";

// --- Service dédié au domaine "Protection de l'Enfance" (PE) ---
// Suit exactement le même contrat que les services Infrastructure / Affaires
// Féminines : aucune dépendance croisée, aucune autre table métier que les
// tables pe_* (+ les tables/vues système "rapports", "v_dashboard_pref_section1",
// "ref_domaines_activite", "ref_types_incident" déjà utilisées ailleurs dans
// le projet).
//
// TÂCHE 1 & 2 : Sections 1 à 4 (statut, KPIs, visualisations Section3/Section4).
// TÂCHE 3 : Section 5 (benchmark) et Section 6 (détail accordéon).
//
// Toute l'agrégation (sommes, moyennes, regroupements) est faite ICI. Le
// builder KPI (section2/ProtectionEnfanceKpiConfig.tsx), les composants
// Section3/Section4 et le builder Section6 (section6/ProtectionEnfanceSection6Blocks.tsx)
// ne font que de la présentation à partir des données déjà calculées.

type PeStatistiquesDemographiquesRow =
  Database["public"]["Tables"]["pe_statistiques_demographiques"]["Row"];
type PeEducationRow = Database["public"]["Tables"]["pe_education"]["Row"];
type PeFormationBeneficiairesRow =
  Database["public"]["Tables"]["pe_formation_beneficiaires"]["Row"];
type PeAteliersCreesRow = Database["public"]["Tables"]["pe_ateliers_crees"]["Row"];
type PeLiberteSurveilleeRow = Database["public"]["Tables"]["pe_liberte_surveillee"]["Row"];
type PeActivitesRow = Database["public"]["Tables"]["pe_activites"]["Row"];
type PeConseilEnfantRow = Database["public"]["Tables"]["pe_conseil_enfant"]["Row"];
type PePartenariatsRow = Database["public"]["Tables"]["pe_partenariats"]["Row"];
type PeFormationPersonnelRow = Database["public"]["Tables"]["pe_formation_personnel"]["Row"];
type PeVisitesOfficiellesRow = Database["public"]["Tables"]["pe_visites_officielles"]["Row"];
type PeDonsRow = Database["public"]["Tables"]["pe_dons"]["Row"];
type PeAmenagementEquipementRow =
  Database["public"]["Tables"]["pe_amenagement_equipement"]["Row"];
type PeRapportsExceptionnelsRow =
  Database["public"]["Tables"]["pe_rapports_exceptionnels"]["Row"];
type PeRapportsJudiciairesRow = Database["public"]["Tables"]["pe_rapports_judiciaires"]["Row"];
type RefDomainesActiviteRow = Database["public"]["Tables"]["ref_domaines_activite"]["Row"];
type RefTypesIncidentRow = Database["public"]["Tables"]["ref_types_incident"]["Row"];

// --- Types exposés (consommés par le builder Section2, Sections 3/4 et le builder Section6) ---

export interface ProtectionEnfanceKpisRaw {
  /** KPI 1 — Σ (garcons + filles) — pe_statistiques_demographiques */
  totalBeneficiairesPriseEnCharge: number;
  /** KPI 2 — moyenne de taux_preparation_integration (lignes renseignées uniquement) */
  tauxPreparationIntegrationMoyen: number;
  /** KPI 3 — Σ (beneficiaires_formel + beneficiaires_non_formel + beneficiaires_soutien) — pe_education */
  totalBeneficiairesEducationFormation: number;
  /** KPI 4 — Σ (integres_scolaire + integres_formation_pro + integres_stage + integres_associations) — pe_liberte_surveillee */
  totalIntegrationsLiberteSurveillee: number;
  /** KPI 5 — Σ nombre_cas — pe_rapports_exceptionnels */
  totalIncidentsSignales: number;
  /** KPI 6 — Σ migrants_non_accompagnes — pe_statistiques_demographiques */
  totalMigrantsNonAccompagnes: number;
}

/** Visualisation 1 de Section3 : Centre de sauvegarde vs Liberté surveillée */
export interface ProtectionEnfancePriseChargeDatum {
  /** clé stable de l'enum pe_type_prise_charge_enum, traduite par le composant */
  name: "centre_sauvegarde" | "liberte_surveillee";
  value: number;
}

/** Visualisation 2 de Section3 : Incidents par type (ref_types_incident) */
export interface ProtectionEnfanceIncidentTypeDatum {
  id: string;
  /** libellé déjà résolu (fr/ar selon lang) depuis ref_types_incident */
  name: string;
  value: number;
}

/** Visualisation 3 de Section3 : Bénéficiaires par domaine d'activité (ref_domaines_activite) */
export interface ProtectionEnfanceActiviteDomaineDatum {
  id: string;
  /** libellé déjà résolu (fr/ar selon lang) depuis ref_domaines_activite */
  name: string;
  value: number;
}

export interface ProtectionEnfanceSection3Data {
  priseEnCharge: ProtectionEnfancePriseChargeDatum[];
  incidentsParType: ProtectionEnfanceIncidentTypeDatum[];
  beneficiairesParDomaine: ProtectionEnfanceActiviteDomaineDatum[];
}

/** Visualisation 4 de Section4 : évolution garçons/filles par trimestre */
export interface ProtectionEnfanceEvolutionGenreDatum {
  name: "T1" | "T2" | "T3" | "T4";
  Garcons: number | null;
  Filles: number | null;
}

/** Visualisation 5 de Section4 : évolution des incidents signalés par trimestre */
export interface ProtectionEnfanceEvolutionIncidentsDatum {
  name: "T1" | "T2" | "T3" | "T4";
  Incidents: number | null;
}

export interface ProtectionEnfanceEvolutionData {
  genre: ProtectionEnfanceEvolutionGenreDatum[];
  incidents: ProtectionEnfanceEvolutionIncidentsDatum[];
}

/** Données détaillées consommées par section6/ProtectionEnfanceSection6Blocks.tsx */
export interface ProtectionEnfanceSection6Data {
  priseEnCharge: {
    totalGarcons: number;
    totalFilles: number;
    total: number;
    migrantsNonAccompagnes: number;
    changementMesure: number;
  };
  educationFormation: {
    education: { formel: number; nonFormel: number; soutien: number; total: number };
    formation: { intra: number; extra: number; initiation: number; total: number };
  };
  ateliersActivites: {
    ateliers: { nom: string; nombre: number }[];
    activitesParDomaine: { domaine: string; nombreBeneficiaires: number }[];
  };
  liberteSurveillee: {
    scolaire: number;
    formationPro: number;
    stage: number;
    associations: number;
    total: number;
  };
  conseilEnfant: {
    totalSessions: number;
  };
  partenariats: {
    conventions: number;
    projetsExecutes: number;
    partenaires: string[];
    sujets: string[];
  };
  formationPersonnel: {
    sessions: number;
    beneficiaires: number;
    parCible: { cible: string; count: number; beneficiaires: number }[];
  };
  visitesDons: {
    visites: { entite: string; date: string | null; type: string | null; nombreVisiteurs: number }[];
    totalVisiteurs: number;
    dons: { donateur: string; nature: string; beneficiaires: number }[];
    totalDons: number;
  };
  amenagementEquipement: {
    rehabilites: number;
    equipes: number;
    total: number;
  };
  incidentsRapports: {
    incidentsParType: { id: string; name: string; count: number }[];
    totalIncidents: number;
    rapportsJudiciaires: number;
  };
}

export interface ProtectionEnfanceDashboardData {
  status: {
    workflowStatus: string;
    progressPct: number;
    lastUpdated: string | null;
    correctionComment: string | null;
    reportStatus?: string;
  };
  kpis: ProtectionEnfanceKpisRaw;
  section3: ProtectionEnfanceSection3Data;
  evolution: ProtectionEnfanceEvolutionData;
  benchmark: PrefDomainBenchmarkRow[];
  detailed: ProtectionEnfanceSection6Data;
}

// --- Helpers d'agrégation (privés) ---

const sumBy = <T,>(rows: T[], selector: (row: T) => number | null | undefined): number =>
  rows.reduce((acc, row) => acc + (selector(row) || 0), 0);

const average = (values: number[]): number =>
  values.length === 0 ? 0 : values.reduce((acc, v) => acc + v, 0) / values.length;

const TRIMESTRE_LABELS: Record<string, "T1" | "T2" | "T3" | "T4"> = {
  t1: "T1",
  t2: "T2",
  t3: "T3",
  t4: "T4",
};

const emptyEvolutionGenre = (): ProtectionEnfanceEvolutionGenreDatum[] =>
  (["T1", "T2", "T3", "T4"] as const).map((name) => ({ name, Garcons: null, Filles: null }));

const emptyEvolutionIncidents = (): ProtectionEnfanceEvolutionIncidentsDatum[] =>
  (["T1", "T2", "T3", "T4"] as const).map((name) => ({ name, Incidents: null }));

const emptyDetailed = (): ProtectionEnfanceSection6Data => ({
  priseEnCharge: {
    totalGarcons: 0,
    totalFilles: 0,
    total: 0,
    migrantsNonAccompagnes: 0,
    changementMesure: 0,
  },
  educationFormation: {
    education: { formel: 0, nonFormel: 0, soutien: 0, total: 0 },
    formation: { intra: 0, extra: 0, initiation: 0, total: 0 },
  },
  ateliersActivites: { ateliers: [], activitesParDomaine: [] },
  liberteSurveillee: { scolaire: 0, formationPro: 0, stage: 0, associations: 0, total: 0 },
  conseilEnfant: { totalSessions: 0 },
  partenariats: { conventions: 0, projetsExecutes: 0, partenaires: [], sujets: [] },
  formationPersonnel: { sessions: 0, beneficiaires: 0, parCible: [] },
  visitesDons: { visites: [], totalVisiteurs: 0, dons: [], totalDons: 0 },
  amenagementEquipement: { rehabilites: 0, equipes: 0, total: 0 },
  incidentsRapports: {
    incidentsParType: [],
    totalIncidents: 0,
    rapportsJudiciaires: 0,
  },
});

// --- Requêtes par section (privées) ---

/**
 * Statut / progression / dernière mise à jour — strictement scopés au
 * domaine Protection de l'Enfance via domaine_id (même vue et même contrat
 * que les services Jeunesse / Infrastructure / Affaires Féminines).
 */
const loadStatus = async (directionId: string, year: number, domaineId?: string) => {
  const { data } = await supabase
    .from("v_dashboard_pref_section1")
    .select("*")
    .eq("direction_id", directionId)
    .eq("annee", year)
    .eq("domaine_id", domaineId)
    .order("trimestre", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data;
};

/** Tous les rapports (un par trimestre) de la direction pour l'année donnée. */
const loadRapports = async (directionId: string, year: number) => {
  const { data } = await supabase
    .from("rapports")
    .select("id, statut_rapport, commentaire_correction, trimestre")
    .eq("direction_id", directionId)
    .eq("annee", year)
    .order("trimestre", { ascending: false });
  return data || [];
};

const loadPeStatistiquesDemographiques = async (rapportIds: string[]) => {
  const { data } = await supabase
    .from("pe_statistiques_demographiques")
    .select("*")
    .in("rapport_id", rapportIds);
  return (data || []) as PeStatistiquesDemographiquesRow[];
};

const loadPeEducation = async (rapportIds: string[]) => {
  const { data } = await supabase.from("pe_education").select("*").in("rapport_id", rapportIds);
  return (data || []) as PeEducationRow[];
};

const loadPeFormationBeneficiaires = async (rapportIds: string[]) => {
  const { data } = await supabase
    .from("pe_formation_beneficiaires")
    .select("*")
    .in("rapport_id", rapportIds);
  return (data || []) as PeFormationBeneficiairesRow[];
};

const loadPeAteliersCrees = async (rapportIds: string[]) => {
  const { data } = await supabase
    .from("pe_ateliers_crees")
    .select("*")
    .in("rapport_id", rapportIds);
  return (data || []) as PeAteliersCreesRow[];
};

const loadPeLiberteSurveillee = async (rapportIds: string[]) => {
  const { data } = await supabase
    .from("pe_liberte_surveillee")
    .select("*")
    .in("rapport_id", rapportIds);
  return (data || []) as PeLiberteSurveilleeRow[];
};

const loadPeActivites = async (rapportIds: string[]) => {
  const { data } = await supabase.from("pe_activites").select("*").in("rapport_id", rapportIds);
  return (data || []) as PeActivitesRow[];
};

const loadPeConseilEnfant = async (rapportIds: string[]) => {
  const { data } = await supabase
    .from("pe_conseil_enfant")
    .select("*")
    .in("rapport_id", rapportIds);
  return (data || []) as PeConseilEnfantRow[];
};

const loadPePartenariats = async (rapportIds: string[]) => {
  const { data } = await supabase
    .from("pe_partenariats")
    .select("*")
    .in("rapport_id", rapportIds);
  return (data || []) as PePartenariatsRow[];
};

const loadPeFormationPersonnel = async (rapportIds: string[]) => {
  const { data } = await supabase
    .from("pe_formation_personnel")
    .select("*")
    .in("rapport_id", rapportIds);
  return (data || []) as PeFormationPersonnelRow[];
};

const loadPeVisitesOfficielles = async (rapportIds: string[]) => {
  const { data } = await supabase
    .from("pe_visites_officielles")
    .select("*")
    .in("rapport_id", rapportIds);
  return (data || []) as PeVisitesOfficiellesRow[];
};

const loadPeDons = async (rapportIds: string[]) => {
  const { data } = await supabase.from("pe_dons").select("*").in("rapport_id", rapportIds);
  return (data || []) as PeDonsRow[];
};

const loadPeAmenagementEquipement = async (rapportIds: string[]) => {
  const { data } = await supabase
    .from("pe_amenagement_equipement")
    .select("*")
    .in("rapport_id", rapportIds);
  return (data || []) as PeAmenagementEquipementRow[];
};

const loadPeRapportsExceptionnels = async (rapportIds: string[]) => {
  const { data } = await supabase
    .from("pe_rapports_exceptionnels")
    .select("*")
    .in("rapport_id", rapportIds);
  return (data || []) as PeRapportsExceptionnelsRow[];
};

const loadPeRapportsJudiciaires = async (rapportIds: string[]) => {
  const { data } = await supabase
    .from("pe_rapports_judiciaires")
    .select("*")
    .in("rapport_id", rapportIds);
  return (data || []) as PeRapportsJudiciairesRow[];
};

/** Table de référence (globale, non filtrée par rapport) des types d'incident. */
const loadRefTypesIncident = async () => {
  const { data } = await supabase.from("ref_types_incident").select("*");
  return (data || []) as RefTypesIncidentRow[];
};

/** Table de référence (globale, non filtrée par rapport) des domaines d'activité. */
const loadRefDomainesActivite = async () => {
  const { data } = await supabase.from("ref_domaines_activite").select("*");
  return (data || []) as RefDomainesActiviteRow[];
};

// --- Transformations (privées) ---

const buildKpis = (
  stats: PeStatistiquesDemographiquesRow[],
  education: PeEducationRow[],
  liberteSurveillee: PeLiberteSurveilleeRow[],
  rapportsExceptionnels: PeRapportsExceptionnelsRow[],
): ProtectionEnfanceKpisRaw => {
  const tauxRenseignes = stats
    .map((s) => s.taux_preparation_integration)
    .filter((v): v is number => v !== null && v !== undefined);

  return {
    totalBeneficiairesPriseEnCharge: sumBy(stats, (s) => (s.garcons || 0) + (s.filles || 0)),
    // Pattern repris de InfrastructureDataService (avancementMoyen) et
    // AffairesFemininesDataService : un champ "taux_*" déjà stocké par ligne
    // se moyenne, il ne se somme jamais.
    tauxPreparationIntegrationMoyen: average(tauxRenseignes),
    totalBeneficiairesEducationFormation: sumBy(
      education,
      (e) => (e.beneficiaires_formel || 0) + (e.beneficiaires_non_formel || 0) + (e.beneficiaires_soutien || 0),
    ),
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

const buildSection3 = (
  stats: PeStatistiquesDemographiquesRow[],
  rapportsExceptionnels: PeRapportsExceptionnelsRow[],
  typesIncident: RefTypesIncidentRow[],
  activites: PeActivitesRow[],
  domainesActivite: RefDomainesActiviteRow[],
  lang: string,
): ProtectionEnfanceSection3Data => {
  // --- Visualisation 1 : Centre de sauvegarde vs Liberté surveillée ---
  const priseEnChargeMap = new Map<"centre_sauvegarde" | "liberte_surveillee", number>([
    ["centre_sauvegarde", 0],
    ["liberte_surveillee", 0],
  ]);
  stats.forEach((s) => {
    const total = (s.garcons || 0) + (s.filles || 0);
    priseEnChargeMap.set(s.type_prise_charge, (priseEnChargeMap.get(s.type_prise_charge) || 0) + total);
  });
  const priseEnCharge: ProtectionEnfancePriseChargeDatum[] = [
    { name: "centre_sauvegarde", value: priseEnChargeMap.get("centre_sauvegarde") || 0 },
    { name: "liberte_surveillee", value: priseEnChargeMap.get("liberte_surveillee") || 0 },
  ];

  // --- Visualisation 2 : Incidents par type (jointure ref_types_incident) ---
  const typeIncidentById = new Map(typesIncident.map((ti) => [ti.id, ti]));
  const incidentsByType = new Map<string, number>();
  rapportsExceptionnels.forEach((r) => {
    if (!r.type_incident_id) return;
    incidentsByType.set(r.type_incident_id, (incidentsByType.get(r.type_incident_id) || 0) + (r.nombre_cas || 0));
  });
  const incidentsParType: ProtectionEnfanceIncidentTypeDatum[] = Array.from(incidentsByType.entries())
    .map(([id, value]) => {
      const ref = typeIncidentById.get(id);
      const name = ref ? (lang === "ar" ? ref.libelle_ar : ref.libelle_fr || ref.libelle_ar) : id;
      return { id, name, value };
    })
    .sort((a, b) => b.value - a.value);

  // --- Visualisation 3 : Bénéficiaires par domaine d'activité (jointure ref_domaines_activite) ---
  const domaineActiviteById = new Map(domainesActivite.map((d) => [d.id, d]));
  const beneficiairesByDomaine = new Map<string, number>();
  activites.forEach((a) => {
    if (!a.domaine_id) return;
    beneficiairesByDomaine.set(
      a.domaine_id,
      (beneficiairesByDomaine.get(a.domaine_id) || 0) + (a.nombre_beneficiaires || 0),
    );
  });
  const beneficiairesParDomaine: ProtectionEnfanceActiviteDomaineDatum[] = Array.from(
    beneficiairesByDomaine.entries(),
  )
    .map(([id, value]) => {
      const ref = domaineActiviteById.get(id);
      const name = ref ? (lang === "ar" ? ref.libelle_ar : ref.libelle_fr || ref.libelle_ar) : id;
      return { id, name, value };
    })
    .sort((a, b) => b.value - a.value);

  return { priseEnCharge, incidentsParType, beneficiairesParDomaine };
};

const buildEvolution = (
  rapportTrimestreById: Map<string, string | null>,
  stats: PeStatistiquesDemographiquesRow[],
  rapportsExceptionnels: PeRapportsExceptionnelsRow[],
): ProtectionEnfanceEvolutionData => {
  const genre = emptyEvolutionGenre();
  const incidents = emptyEvolutionIncidents();

  const trimestreLabelForRapport = (rapportId: string | null): "T1" | "T2" | "T3" | "T4" | null => {
    if (!rapportId) return null;
    const trimestre = rapportTrimestreById.get(rapportId);
    if (!trimestre) return null;
    return TRIMESTRE_LABELS[trimestre] ?? null;
  };

  // --- Visualisation 4 : garçons vs filles par trimestre ---
  const genreByQuarter = new Map<string, { garcons: number; filles: number }>();
  stats.forEach((s) => {
    const label = trimestreLabelForRapport(s.rapport_id);
    if (!label) return;
    const acc = genreByQuarter.get(label) || { garcons: 0, filles: 0 };
    acc.garcons += s.garcons || 0;
    acc.filles += s.filles || 0;
    genreByQuarter.set(label, acc);
  });
  genre.forEach((row) => {
    const acc = genreByQuarter.get(row.name);
    if (acc) {
      row.Garcons = acc.garcons;
      row.Filles = acc.filles;
    }
  });

  // --- Visualisation 5 : incidents signalés par trimestre ---
  const incidentsByQuarter = new Map<string, number>();
  rapportsExceptionnels.forEach((r) => {
    const label = trimestreLabelForRapport(r.rapport_id);
    if (!label) return;
    incidentsByQuarter.set(label, (incidentsByQuarter.get(label) || 0) + (r.nombre_cas || 0));
  });
  incidents.forEach((row) => {
    const acc = incidentsByQuarter.get(row.name);
    if (acc !== undefined) {
      row.Incidents = acc;
    }
  });

  return { genre, incidents };
};

const buildBenchmark = (kpis: ProtectionEnfanceKpisRaw): PrefDomainBenchmarkRow[] => {
  // Aucune vue régionale n'existe encore pour le domaine Protection de
  // l'Enfance (même situation que les domaines Infrastructure et Affaires
  // Féminines) : la moyenne régionale est donc à 0 en attendant qu'une vue
  // dédiée soit créée côté base de données. Les scores de la préfecture,
  // eux, sont réels.
  //
  // ⚠️ IMPORTANT : on N'utilise PAS `moyenneRegUnavailable` pour PE afin
  // d'afficher une valeur numérique 0 (et non « Indisponible »), exactement
  // comme les autres domaines existants.
  return [
    {
      kpi: "Bénéficiaires en prise en charge",
      monScore: kpis.totalBeneficiairesPriseEnCharge,
      moyenneReg: 0,
      isPercentage: false,
    },
    {
      kpi: "Taux de préparation à l'intégration",
      monScore: kpis.tauxPreparationIntegrationMoyen,
      moyenneReg: 0,
      isPercentage: true,
    },
    {
      kpi: "Bénéficiaires Éducation & Formation",
      monScore: kpis.totalBeneficiairesEducationFormation,
      moyenneReg: 0,
      isPercentage: false,
    },
    {
      kpi: "Intégrations en Liberté Surveillée",
      monScore: kpis.totalIntegrationsLiberteSurveillee,
      moyenneReg: 0,
      isPercentage: false,
    },
    {
      kpi: "Incidents exceptionnels signalés",
      monScore: kpis.totalIncidentsSignales,
      moyenneReg: 0,
      isPercentage: false,
    },
    {
      kpi: "Mineurs migrants non accompagnés",
      monScore: kpis.totalMigrantsNonAccompagnes,
      moyenneReg: 0,
      isPercentage: false,
    },
  ];
};

const buildDetailed = (
  stats: PeStatistiquesDemographiquesRow[],
  education: PeEducationRow[],
  formationBeneficiaires: PeFormationBeneficiairesRow[],
  ateliersCrees: PeAteliersCreesRow[],
  liberteSurveillee: PeLiberteSurveilleeRow[],
  activites: PeActivitesRow[],
  conseilEnfant: PeConseilEnfantRow[],
  partenariats: PePartenariatsRow[],
  formationPersonnel: PeFormationPersonnelRow[],
  visitesOfficielles: PeVisitesOfficiellesRow[],
  dons: PeDonsRow[],
  amenagementEquipement: PeAmenagementEquipementRow[],
  rapportsExceptionnels: PeRapportsExceptionnelsRow[],
  rapportsJudiciaires: PeRapportsJudiciairesRow[],
  domainesActivite: RefDomainesActiviteRow[],
  typesIncident: RefTypesIncidentRow[],
  lang: string,
): ProtectionEnfanceSection6Data => {
  const totalGarcons = sumBy(stats, (s) => s.garcons);
  const totalFilles = sumBy(stats, (s) => s.filles);

  // --- Ateliers ---
  const ateliers = ateliersCrees
    .map((a) => ({ nom: a.nom_atelier, nombre: a.nombre || 0 }))
    .sort((a, b) => b.nombre - a.nombre);

  // --- Activités par domaine ---
  const domaineById = new Map(domainesActivite.map((d) => [d.id, d]));
  const activitesByDomaineMap = new Map<string, number>();
  activites.forEach((a) => {
    activitesByDomaineMap.set(
      a.domaine_id,
      (activitesByDomaineMap.get(a.domaine_id) || 0) + (a.nombre_beneficiaires || 0),
    );
  });
  const activitesParDomaine = Array.from(activitesByDomaineMap.entries())
    .map(([id, nombreBeneficiaires]) => {
      const ref = domaineById.get(id);
      const domaine = ref ? (lang === "ar" ? ref.libelle_ar : ref.libelle_fr || ref.libelle_ar) : id;
      return { domaine, nombreBeneficiaires };
    })
    .sort((a, b) => b.nombreBeneficiaires - a.nombreBeneficiaires);

  // --- Partenariats ---
  const partenaires = Array.from(
    new Set(partenariats.map((p) => p.partenaires).filter((s) => !!s && s.trim().length > 0)),
  );
  const sujets = Array.from(
    new Set(partenariats.map((p) => p.sujet).filter((s) => !!s && s.trim().length > 0)),
  );

  // --- Formation du personnel par cible ---
  const persoByCibleMap = new Map<string, { count: number; beneficiaires: number }>();
  formationPersonnel.forEach((f) => {
    const acc = persoByCibleMap.get(f.cible) || { count: 0, beneficiaires: 0 };
    acc.count += 1;
    acc.beneficiaires += f.nombre_beneficiaires || 0;
    persoByCibleMap.set(f.cible, acc);
  });
  const formationPersonnelParCible = Array.from(persoByCibleMap.entries()).map(
    ([cible, { count, beneficiaires }]) => ({ cible, count, beneficiaires }),
  );

  // --- Visites officielles ---
  const visites = visitesOfficielles.map((v) => ({
    entite: v.entite_visiteuse,
    date: v.date_visite ?? null,
    type: v.type_visite ?? null,
    nombreVisiteurs: v.nombre_visiteurs || 0,
  }));

  // --- Dons ---
  const donsList = dons.map((d) => ({
    donateur: d.donateur,
    nature: d.nature_don ?? "",
    beneficiaires: d.beneficiaires || 0,
  }));

  // --- Incidents par type ---
  const typeIncidentById = new Map(typesIncident.map((ti) => [ti.id, ti]));
  const incidentsByType = new Map<string, number>();
  rapportsExceptionnels.forEach((r) => {
    if (!r.type_incident_id) return;
    incidentsByType.set(r.type_incident_id, (incidentsByType.get(r.type_incident_id) || 0) + (r.nombre_cas || 0));
  });
  const incidentsParType = Array.from(incidentsByType.entries())
    .map(([id, count]) => {
      const ref = typeIncidentById.get(id);
      const name = ref ? (lang === "ar" ? ref.libelle_ar : ref.libelle_fr || ref.libelle_ar) : id;
      return { id, name, count };
    })
    .sort((a, b) => b.count - a.count);

  const educationFormel = sumBy(education, (e) => e.beneficiaires_formel);
  const educationNonFormel = sumBy(education, (e) => e.beneficiaires_non_formel);
  const educationSoutien = sumBy(education, (e) => e.beneficiaires_soutien);

  return {
    priseEnCharge: {
      totalGarcons,
      totalFilles,
      total: totalGarcons + totalFilles,
      migrantsNonAccompagnes: sumBy(stats, (s) => s.migrants_non_accompagnes),
      changementMesure: sumBy(stats, (s) => s.changement_mesure),
    },
    educationFormation: {
      education: {
        formel: educationFormel,
        nonFormel: educationNonFormel,
        soutien: educationSoutien,
        total: educationFormel + educationNonFormel + educationSoutien,
      },
      formation: {
        intra: sumBy(formationBeneficiaires, (f) => f.beneficiaires_intra),
        extra: sumBy(formationBeneficiaires, (f) => f.beneficiaires_extra),
        initiation: sumBy(formationBeneficiaires, (f) => f.beneficiaires_initiation),
        total:
          sumBy(formationBeneficiaires, (f) => f.beneficiaires_intra) +
          sumBy(formationBeneficiaires, (f) => f.beneficiaires_extra) +
          sumBy(formationBeneficiaires, (f) => f.beneficiaires_initiation),
      },
    },
    ateliersActivites: { ateliers, activitesParDomaine },
    liberteSurveillee: {
      scolaire: sumBy(liberteSurveillee, (l) => l.integres_scolaire),
      formationPro: sumBy(liberteSurveillee, (l) => l.integres_formation_pro),
      stage: sumBy(liberteSurveillee, (l) => l.integres_stage),
      associations: sumBy(liberteSurveillee, (l) => l.integres_associations),
      total:
        sumBy(liberteSurveillee, (l) => l.integres_scolaire) +
        sumBy(liberteSurveillee, (l) => l.integres_formation_pro) +
        sumBy(liberteSurveillee, (l) => l.integres_stage) +
        sumBy(liberteSurveillee, (l) => l.integres_associations),
    },
    conseilEnfant: { totalSessions: conseilEnfant.length },
    partenariats: {
      conventions: sumBy(partenariats, (p) => p.nombre_conventions),
      projetsExecutes: sumBy(partenariats, (p) => p.nombre_projets_executes),
      partenaires,
      sujets,
    },
    formationPersonnel: {
      sessions: sumBy(formationPersonnel, (f) => f.nombre_sessions),
      beneficiaires: sumBy(formationPersonnel, (f) => f.nombre_beneficiaires),
      parCible: formationPersonnelParCible,
    },
    visitesDons: {
      visites,
      totalVisiteurs: sumBy(visitesOfficielles, (v) => v.nombre_visiteurs),
      dons: donsList,
      totalDons: dons.length,
    },
    amenagementEquipement: {
      rehabilites: amenagementEquipement.filter((a) => a.a_ete_rehabilite).length,
      equipes: amenagementEquipement.filter((a) => a.a_ete_equipe).length,
      total: amenagementEquipement.length,
    },
    incidentsRapports: {
      incidentsParType,
      totalIncidents: sumBy(rapportsExceptionnels, (r) => r.nombre_cas),
      rapportsJudiciaires: sumBy(rapportsJudiciaires, (r) => r.nombre_rapports),
    },
  };
};

// --- Fonction unique exposée ---

export const loadProtectionEnfanceDashboard = async (
  directionId: string,
  year: number,
  domaineId?: string,
  lang = "fr",
): Promise<ProtectionEnfanceDashboardData> => {
  const emptyKpis: ProtectionEnfanceKpisRaw = {
    totalBeneficiairesPriseEnCharge: 0,
    tauxPreparationIntegrationMoyen: 0,
    totalBeneficiairesEducationFormation: 0,
    totalIntegrationsLiberteSurveillee: 0,
    totalIncidentsSignales: 0,
    totalMigrantsNonAccompagnes: 0,
  };

  // 1. Chercher si au moins un rapport existe pour cette année et cette direction
  const rapports = await loadRapports(directionId, year);

  // 2. Si AUCUN rapport n'est trouvé, on retourne un tableau de bord vide (rempli de zéros)
  if (rapports.length === 0) {
    return {
      status: {
        workflowStatus: "NON_COMMENCE",
        progressPct: 0,
        lastUpdated: null,
        correctionComment: null,
      },
      kpis: emptyKpis,
      section3: { priseEnCharge: [], incidentsParType: [], beneficiairesParDomaine: [] },
      evolution: { genre: emptyEvolutionGenre(), incidents: emptyEvolutionIncidents() },
      benchmark: buildBenchmark(emptyKpis),
      detailed: emptyDetailed(),
    };
  }

  const rapportIds = rapports.map((r) => r.id);
  const rapportTrimestreById = new Map<string, string | null>(rapports.map((r) => [r.id, r.trimestre]));
  const latestRapport = rapports[0]; // déjà trié par trimestre décroissant

  // 3. Charger le statut (scopé au domaine PE) + toutes les tables pe_* + les
  //    tables de référence, en parallèle.
  const [
    status,
    stats,
    education,
    formationBeneficiaires,
    ateliersCrees,
    liberteSurveillee,
    activites,
    conseilEnfant,
    partenariats,
    formationPersonnel,
    visitesOfficielles,
    dons,
    amenagementEquipement,
    rapportsExceptionnels,
    rapportsJudiciaires,
    typesIncident,
    domainesActivite,
  ] = await Promise.all([
    loadStatus(directionId, year, domaineId),
    loadPeStatistiquesDemographiques(rapportIds),
    loadPeEducation(rapportIds),
    loadPeFormationBeneficiaires(rapportIds),
    loadPeAteliersCrees(rapportIds),
    loadPeLiberteSurveillee(rapportIds),
    loadPeActivites(rapportIds),
    loadPeConseilEnfant(rapportIds),
    loadPePartenariats(rapportIds),
    loadPeFormationPersonnel(rapportIds),
    loadPeVisitesOfficielles(rapportIds),
    loadPeDons(rapportIds),
    loadPeAmenagementEquipement(rapportIds),
    loadPeRapportsExceptionnels(rapportIds),
    loadPeRapportsJudiciaires(rapportIds),
    loadRefTypesIncident(),
    loadRefDomainesActivite(),
  ]);

  const kpis = buildKpis(stats, education, liberteSurveillee, rapportsExceptionnels);

  return {
    status: {
      workflowStatus: status?.statut || "NON_COMMENCE",
      progressPct: status?.progression_pourcentage || 0,
      lastUpdated: status?.derniere_mise_a_jour ?? null,
      correctionComment: latestRapport.commentaire_correction ?? null,
      reportStatus: latestRapport.statut_rapport,
    },
    kpis,
    section3: buildSection3(stats, rapportsExceptionnels, typesIncident, activites, domainesActivite, lang),
    evolution: buildEvolution(rapportTrimestreById, stats, rapportsExceptionnels),
    benchmark: buildBenchmark(kpis),
    detailed: buildDetailed(
      stats,
      education,
      formationBeneficiaires,
      ateliersCrees,
      liberteSurveillee,
      activites,
      conseilEnfant,
      partenariats,
      formationPersonnel,
      visitesOfficielles,
      dons,
      amenagementEquipement,
      rapportsExceptionnels,
      rapportsJudiciaires,
      domainesActivite,
      typesIncident,
      lang,
    ),
  };
};
