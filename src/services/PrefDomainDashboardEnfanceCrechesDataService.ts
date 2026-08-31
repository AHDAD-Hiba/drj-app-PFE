import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import type { PrefDomainBenchmarkRow } from "@/components/dashboard/PrefDomainBenchmarkTable";
import type { DashboardData } from "@/services/prefDomainDashboardTypes";
import { averageDirectionalKpis, filterByRapportIds, loadRegionalDirectionIds, loadRegionalReportsForDirectionIds, uniqueIds } from "@/services/prefDomainRegionalBenchmark";

type CrStatistiquesEnfantsRow = Database["public"]["Tables"]["cr_statistiques_enfants"]["Row"];
type CrTraitementLicencesRow = Database["public"]["Tables"]["cr_traitement_licences"]["Row"];
type CrCadresAssermentesRow = Database["public"]["Tables"]["cr_cadres_assermentes"]["Row"];
type CrLabelQualiteRow = Database["public"]["Tables"]["cr_label_qualite"]["Row"];
type CrMouvementsFermeturesRow = Database["public"]["Tables"]["cr_mouvements_fermetures"]["Row"];
type CrDemandesLicencesRow = Database["public"]["Tables"]["cr_demandes_licences"]["Row"];
type RefCrTypesDemandeRow = Database["public"]["Tables"]["ref_cr_types_demande"]["Row"];
type RefCrStatutsDemandeRow = Database["public"]["Tables"]["ref_cr_statuts_demande"]["Row"];
type CrActivitesEnfantsRow = Database["public"]["Tables"]["cr_activites_enfants"]["Row"];
type CrStatsInfrastructuresRow = Database["public"]["Tables"]["cr_stats_infrastructures"]["Row"];
type CrControleCrechesRow = Database["public"]["Tables"]["cr_controle_creches"]["Row"];
type CrFormationsCadresRow = Database["public"]["Tables"]["cr_formations_cadres"]["Row"];
type CrPartenariatsConventionsRow = Database["public"]["Tables"]["cr_partenariats_conventions"]["Row"];
type CrAnalysesPonctuellesRow = Database["public"]["Tables"]["cr_analyses_ponctuelles"]["Row"];
type CrSondagesEtudesRow = Database["public"]["Tables"]["cr_sondages_etudes"]["Row"];
type DirCrechesPriveesRow = Database["public"]["Tables"]["dir_creches_privees"]["Row"];
type RefCrStatutsCadreRow = Database["public"]["Tables"]["ref_cr_statuts_cadre"]["Row"];

export interface EnfanceCrechesKpisRaw {
  enfantsPrisesEnCharge: number;
  demandesLicencesTraitees: number;
  delaiMoyenTraitementJours: number;
  cadresAssermentes: number;
  crechesLabelliseesQualite: number;
  fermeturesCrechesSignalees: number;
}

export interface EnfanceCrechesDemandesDatum {
  id: string;
  name: string;
  value: number;
}

export interface EnfanceCrechesSection3Data {
  demandesParType: EnfanceCrechesDemandesDatum[];
  demandesParStatut: EnfanceCrechesDemandesDatum[];
  enfantsParZone: {
    name: string;
    Garcons: number;
    Filles: number;
  }[];
}

export interface EnfanceCrechesEvolutionDatum {
  name: "T1" | "T2" | "T3" | "T4";
  Garcons: number | null;
  Filles: number | null;
}

export interface EnfanceCrechesEvolutionMouvementsDatum {
  name: "T1" | "T2" | "T3" | "T4";
  Fermetures: number | null;
  Reouvertures: number | null;
}

export interface EnfanceCrechesEvolutionData {
  enfants: EnfanceCrechesEvolutionDatum[];
  mouvements: EnfanceCrechesEvolutionMouvementsDatum[];
}

export interface EnfanceCrechesSection6Data {
  licences: {
    demandesParType: EnfanceCrechesDemandesDatum[];
    demandesParStatut: EnfanceCrechesDemandesDatum[];
    traitement: {
      demandesTraitees: number;
      delaiMoyen: number;
    };
  };
  enfants: {
    total: number;
    urbain: number;
    rural: number;
    activites: { nom: string; garcons: number; filles: number; urbain: number; rural: number }[];
  };
  infrastructureQualite: {
    crechesCreees: number;
    crechesEquipees: number;
    crechesQualifiees: number;
    labelsObtenus: number;
    controles: { nom: string; resultat: string | null }[];
  };
  mouvements: {
    totalFermetures: number;
    totalReouvertures: number;
    details: { type: string; nombre: number; raisons: string }[];
  };
  cadres: {
    totalCadres: number;
    formations: { domaine: string; nombreCadres: number; duree: string | null }[];
    statuts: { statut: string; count: number }[];
  };
  partenariats: {
    conventions: { partenaire: string; nombre: number; objectif: string | null }[];
    analyses: { sujet: string; beneficiaires: number }[];
    sondages: { type: string; participants: number; resultats: string | null }[];
  };
}

export type EnfanceCrechesDashboardData = DashboardData<
  EnfanceCrechesKpisRaw,
  EnfanceCrechesSection3Data,
  EnfanceCrechesEvolutionData,
  EnfanceCrechesSection6Data
>;

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

const emptyEvolutionEnfants = (): EnfanceCrechesEvolutionDatum[] =>
  (["T1", "T2", "T3", "T4"] as const).map((name) => ({ name, Garcons: null, Filles: null }));

const emptyEvolutionMouvements = (): EnfanceCrechesEvolutionMouvementsDatum[] =>
  (["T1", "T2", "T3", "T4"] as const).map((name) => ({ name, Fermetures: null, Reouvertures: null }));

const emptyDetailed = (): EnfanceCrechesSection6Data => ({
  licences: {
    demandesParType: [],
    demandesParStatut: [],
    traitement: { demandesTraitees: 0, delaiMoyen: 0 },
  },
  enfants: { total: 0, urbain: 0, rural: 0, activites: [] },
  infrastructureQualite: { crechesCreees: 0, crechesEquipees: 0, crechesQualifiees: 0, labelsObtenus: 0, controles: [] },
  mouvements: { totalFermetures: 0, totalReouvertures: 0, details: [] },
  cadres: { totalCadres: 0, formations: [], statuts: [] },
  partenariats: { conventions: [], analyses: [], sondages: [] },
});

const loadStatus = async (rapportId: string, domaineId?: string) => {
  const baseQuery = supabase
    .from("suivi_remplissage")
    .select("id, rapport_id, domaine_id, statut, progression_pourcentage, updated_at")
    .eq("rapport_id", rapportId);
  const query = domaineId ? baseQuery.eq("domaine_id", domaineId) : baseQuery;

  const { data } = await query.order("updated_at", { ascending: false }).limit(1).maybeSingle();
  return data;
};

const loadRapports = async (directionId: string, year: number) => {
  const { data } = await supabase
    .from("rapports")
    .select("id, statut_rapport, commentaire_correction, trimestre,updated_at")
    .eq("direction_id", directionId)
    .eq("annee", year)
    .order("trimestre", { ascending: false });
  return data || [];
};

const loadStatistics = async (rapportIds: string[]) => {
  const { data } = await supabase.from("cr_statistiques_enfants").select("*").in("rapport_id", rapportIds);
  return (data || []) as CrStatistiquesEnfantsRow[];
};

const loadTraitementLicences = async (rapportIds: string[]) => {
  const { data } = await supabase.from("cr_traitement_licences").select("*").in("rapport_id", rapportIds);
  return (data || []) as CrTraitementLicencesRow[];
};

const loadDemandesLicences = async (rapportIds: string[]) => {
  const { data } = await supabase.from("cr_demandes_licences").select("*").in("rapport_id", rapportIds);
  return (data || []) as CrDemandesLicencesRow[];
};

const loadCadresAssermentes = async (rapportIds: string[]) => {
  const { data } = await supabase.from("cr_cadres_assermentes").select("*").in("rapport_id", rapportIds);
  return (data || []) as CrCadresAssermentesRow[];
};

const loadLabelQualite = async (rapportIds: string[]) => {
  const { data } = await supabase.from("cr_label_qualite").select("*").in("rapport_id", rapportIds);
  return (data || []) as CrLabelQualiteRow[];
};

const loadMouvementsFermetures = async (rapportIds: string[]) => {
  const { data } = await supabase.from("cr_mouvements_fermetures").select("*").in("rapport_id", rapportIds);
  return (data || []) as CrMouvementsFermeturesRow[];
};

const loadActivitesEnfants = async (rapportIds: string[]) => {
  const { data } = await supabase.from("cr_activites_enfants").select("*").in("rapport_id", rapportIds);
  return (data || []) as CrActivitesEnfantsRow[];
};

const loadStatsInfrastructures = async (rapportIds: string[]) => {
  const { data } = await supabase.from("cr_stats_infrastructures").select("*").in("rapport_id", rapportIds);
  return (data || []) as CrStatsInfrastructuresRow[];
};

const loadControleCreches = async (rapportIds: string[]) => {
  const { data } = await supabase.from("cr_controle_creches").select("*").in("rapport_id", rapportIds);
  return (data || []) as CrControleCrechesRow[];
};

const loadFormationsCadres = async (rapportIds: string[]) => {
  const { data } = await supabase.from("cr_formations_cadres").select("*").in("rapport_id", rapportIds);
  return (data || []) as CrFormationsCadresRow[];
};

const loadPartenariatsConventions = async (rapportIds: string[]) => {
  const { data } = await supabase.from("cr_partenariats_conventions").select("*").in("rapport_id", rapportIds);
  return (data || []) as CrPartenariatsConventionsRow[];
};

const loadAnalysesPonctuelles = async (rapportIds: string[]) => {
  const { data } = await supabase.from("cr_analyses_ponctuelles").select("*").in("rapport_id", rapportIds);
  return (data || []) as CrAnalysesPonctuellesRow[];
};

const loadSondagesEtudes = async (rapportIds: string[]) => {
  const { data } = await supabase.from("cr_sondages_etudes").select("*").in("rapport_id", rapportIds);
  return (data || []) as CrSondagesEtudesRow[];
};

const loadCrechesPrivees = async () => {
  const { data } = await supabase.from("dir_creches_privees").select("*");
  return (data || []) as DirCrechesPriveesRow[];
};

const loadRefTypesDemande = async () => {
  const { data } = await supabase.from("ref_cr_types_demande").select("*");
  return (data || []) as RefCrTypesDemandeRow[];
};

const loadRefStatutsDemande = async () => {
  const { data } = await supabase.from("ref_cr_statuts_demande").select("*");
  return (data || []) as RefCrStatutsDemandeRow[];
};

const loadRefStatutsCadre = async () => {
  const { data } = await supabase.from("ref_cr_statuts_cadre").select("*");
  return (data || []) as RefCrStatutsCadreRow[];
};

const buildKpis = (
  stats: CrStatistiquesEnfantsRow[],
  traitementLicences: CrTraitementLicencesRow[],
  cadresAssermentes: CrCadresAssermentesRow[],
  labelQualite: CrLabelQualiteRow[],
  mouvementsFermetures: CrMouvementsFermeturesRow[],
): EnfanceCrechesKpisRaw => ({
  enfantsPrisesEnCharge: sumBy(stats, (s) => (s.garcons || 0) + (s.filles || 0)),
  demandesLicencesTraitees: sumBy(traitementLicences, (row) => row.nombre_demandes_traitees),
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

const buildSection3 = (
  demandesLicences: CrDemandesLicencesRow[],
  typesDemande: RefCrTypesDemandeRow[],
  statutsDemande: RefCrStatutsDemandeRow[],
  stats: CrStatistiquesEnfantsRow[],
  lang: string,
): EnfanceCrechesSection3Data => {
  const typeById = new Map(typesDemande.map((item) => [item.id, item]));
  const statutById = new Map(statutsDemande.map((item) => [item.id, item]));

  const demandesParType = Array.from(
    demandesLicences.reduce<Map<string, number>>((acc, row) => {
      const key = row.type_demande_id || "unknown";
      acc.set(key, (acc.get(key) || 0) + (row.nombre_demandes || 0));
      return acc;
    }, new Map()),
  )
    .map(([id, value]) => {
      const ref = typeById.get(id);
      const name = ref ? (lang === "ar" ? ref.libelle_ar || ref.libelle_fr : ref.libelle_fr || ref.libelle_ar) : id;
      return { id, name, value };
    })
    .sort((a, b) => b.value - a.value);

  const demandesParStatut = Array.from(
    demandesLicences.reduce<Map<string, number>>((acc, row) => {
      const key = row.statut_demande_id || "unknown";
      acc.set(key, (acc.get(key) || 0) + (row.nombre_demandes || 0));
      return acc;
    }, new Map()),
  )
    .map(([id, value]) => {
      const ref = statutById.get(id);
      const name = ref ? (lang === "ar" ? ref.libelle_ar || ref.libelle_fr : ref.libelle_fr || ref.libelle_ar) : id;
      return { id, name, value };
    })
    .sort((a, b) => b.value - a.value);

  const enfantsParZone = [
    {
      name: "Urbain",
      Garcons: sumBy(stats, (row) => row.urbain ? row.garcons || 0 : 0),
      Filles: sumBy(stats, (row) => row.urbain ? row.filles || 0 : 0),
    },
    {
      name: "Rural",
      Garcons: sumBy(stats, (row) => row.rural ? row.garcons || 0 : 0),
      Filles: sumBy(stats, (row) => row.rural ? row.filles || 0 : 0),
    },
  ];

  return { demandesParType, demandesParStatut, enfantsParZone };
};

const buildEvolution = (
  rapportTrimestreById: Map<string, string | null>,
  stats: CrStatistiquesEnfantsRow[],
  mouvements: CrMouvementsFermeturesRow[],
): EnfanceCrechesEvolutionData => {
  const enfants = emptyEvolutionEnfants();
  const mouvementsData = emptyEvolutionMouvements();

  const trimestreLabelForRapport = (rapportId: string | null): "T1" | "T2" | "T3" | "T4" | null => {
    if (!rapportId) return null;
    const trimestre = rapportTrimestreById.get(rapportId);
    if (!trimestre) return null;
    return TRIMESTRE_LABELS[trimestre] ?? null;
  };

  const enfantsByQuarter = new Map<string, { garcons: number; filles: number }>();
  stats.forEach((row) => {
    const label = trimestreLabelForRapport(row.rapport_id);
    if (!label) return;
    const acc = enfantsByQuarter.get(label) || { garcons: 0, filles: 0 };
    acc.garcons += row.garcons || 0;
    acc.filles += row.filles || 0;
    enfantsByQuarter.set(label, acc);
  });
  enfants.forEach((row) => {
    const acc = enfantsByQuarter.get(row.name);
    if (acc) {
      row.Garcons = acc.garcons;
      row.Filles = acc.filles;
    }
  });

  const mouvementsByQuarter = new Map<string, { fermetures: number; reouvertures: number }>();
  mouvements.forEach((row) => {
    const label = trimestreLabelForRapport(row.rapport_id);
    if (!label) return;
    const acc = mouvementsByQuarter.get(label) || { fermetures: 0, reouvertures: 0 };
    if (row.type_mouvement === "fermeture") acc.fermetures += row.nombre_creches || 0;
    if (row.type_mouvement === "reouverture") acc.reouvertures += row.nombre_creches || 0;
    mouvementsByQuarter.set(label, acc);
  });
  mouvementsData.forEach((row) => {
    const acc = mouvementsByQuarter.get(row.name);
    if (acc) {
      row.Fermetures = acc.fermetures;
      row.Reouvertures = acc.reouvertures;
    }
  });

  return { enfants, mouvements: mouvementsData };
};

const buildBenchmark = (
  kpis: EnfanceCrechesKpisRaw,
  regionalAverages: Partial<Record<keyof EnfanceCrechesKpisRaw, number>> = {},
): PrefDomainBenchmarkRow[] => {
  const regional = (key: keyof EnfanceCrechesKpisRaw, fallback = 0) =>
    Number.isFinite(regionalAverages[key]) ? (regionalAverages[key] as number) : fallback;

  return [
    { kpi: "Enfants pris en charge", monScore: kpis.enfantsPrisesEnCharge, moyenneReg: regional("enfantsPrisesEnCharge", 0), isPercentage: false },
    { kpi: "Demandes de licences traitées", monScore: kpis.demandesLicencesTraitees, moyenneReg: regional("demandesLicencesTraitees", 0), isPercentage: false },
    { kpi: "Délai moyen de traitement (jours)", monScore: kpis.delaiMoyenTraitementJours, moyenneReg: regional("delaiMoyenTraitementJours", 0), isPercentage: true },
    { kpi: "Cadres assermentés", monScore: kpis.cadresAssermentes, moyenneReg: regional("cadresAssermentes", 0), isPercentage: false },
    { kpi: "Crèches labellisées qualité (obtenues)", monScore: kpis.crechesLabelliseesQualite, moyenneReg: regional("crechesLabelliseesQualite", 0), isPercentage: false },
    { kpi: "Fermetures de crèches signalées", monScore: kpis.fermeturesCrechesSignalees, moyenneReg: regional("fermeturesCrechesSignalees", 0), isPercentage: false },
  ];
};

const buildDetailed = (
  demandesLicences: CrDemandesLicencesRow[],
  traitementsLicences: CrTraitementLicencesRow[],
  stats: CrStatistiquesEnfantsRow[],
  activitesEnfants: CrActivitesEnfantsRow[],
  statsInfrastructures: CrStatsInfrastructuresRow[],
  labelQualite: CrLabelQualiteRow[],
  controles: CrControleCrechesRow[],
  mouvements: CrMouvementsFermeturesRow[],
  cadres: CrCadresAssermentesRow[],
  formations: CrFormationsCadresRow[],
  partenariats: CrPartenariatsConventionsRow[],
  analyses: CrAnalysesPonctuellesRow[],
  sondages: CrSondagesEtudesRow[],
  crechesPrivees: DirCrechesPriveesRow[],
  statutsCadre: RefCrStatutsCadreRow[],
  typesDemande: RefCrTypesDemandeRow[],
  statutsDemande: RefCrStatutsDemandeRow[],
  lang: string,
): EnfanceCrechesSection6Data => {
  const typeById = new Map(typesDemande.map((item) => [item.id, item]));
  const statutById = new Map(statutsDemande.map((item) => [item.id, item]));
  const statutsCadreById = new Map(statutsCadre.map((item) => [item.id, item]));
  const crecheById = new Map(crechesPrivees.map((item) => [item.id, item]));

  const demandesParType = Array.from(
    demandesLicences.reduce<Map<string, number>>((acc, row) => {
      const key = row.type_demande_id || "unknown";
      acc.set(key, (acc.get(key) || 0) + (row.nombre_demandes || 0));
      return acc;
    }, new Map()),
  )
    .map(([id, value]) => ({
      id,
      name: lang === "ar"
        ? typeById.get(id)?.libelle_ar || typeById.get(id)?.libelle_fr || id
        : typeById.get(id)?.libelle_fr || typeById.get(id)?.libelle_ar || id,
      value,
    }))
    .sort((a, b) => b.value - a.value);

  const demandesParStatut = Array.from(
    demandesLicences.reduce<Map<string, number>>((acc, row) => {
      const key = row.statut_demande_id || "unknown";
      acc.set(key, (acc.get(key) || 0) + (row.nombre_demandes || 0));
      return acc;
    }, new Map()),
  )
    .map(([id, value]) => ({
      id,
      name: lang === "ar"
        ? statutById.get(id)?.libelle_ar || statutById.get(id)?.libelle_fr || id
        : statutById.get(id)?.libelle_fr || statutById.get(id)?.libelle_ar || id,
      value,
    }))
    .sort((a, b) => b.value - a.value);

  const totalEnfants = sumBy(stats, (row) => (row.garcons || 0) + (row.filles || 0));
  const urbain = sumBy(stats, (row) => row.urbain ? (row.garcons || 0) + (row.filles || 0) : 0);
  const rural = sumBy(stats, (row) => row.rural ? (row.garcons || 0) + (row.filles || 0) : 0);
  const activites = activitesEnfants.map((row) => ({
    nom: row.nom_activite,
    garcons: row.garcons || 0,
    filles: row.filles || 0,
    urbain: row.urbain || 0,
    rural: row.rural || 0,
  }));

  const infrastructure = statsInfrastructures[0] || null;
  const labelsObtenus = labelQualite.filter((row) => row.statut_label === "obtenue").length;
  const controlesData = controles.map((row) => {
    const creche = crecheById.get(row.creche_privee_id);
    return { nom: creche?.nom_creche || "Crèche", resultat: row.resultats_controle || null };
  });

  const detailsMouvements = mouvements.map((row) => ({
    type: row.type_mouvement || "",
    nombre: row.nombre_creches || 0,
    raisons: row.raisons || "",
  }));

  const formationsData = formations.map((row) => ({
    domaine: row.domaine_formation,
    nombreCadres: row.nombre_cadres || 0,
    duree: row.duree_valeur ? `${row.duree_valeur} ${row.duree_unite || ""}`.trim() : null,
  }));

  const statutsCadreData = Array.from(
    cadres.reduce<Map<string, number>>((acc, row) => {
      const key = row.statut_cadre_id || "unknown";
      acc.set(key, (acc.get(key) || 0) + (row.nombre_cadres || 0));
      return acc;
    }, new Map()),
  ).map(([id, count]) => ({ statut: statutsCadreById.get(id)?.libelle_fr || statutsCadreById.get(id)?.libelle_ar || id, count }));

  return {
    licences: {
      demandesParType,
      demandesParStatut,
      traitement: {
        demandesTraitees: sumBy(traitementsLicences, (row) => row.nombre_demandes_traitees),
        delaiMoyen: average(traitementsLicences.map((row) => row.delai_moyen_traitement_jours).filter((v): v is number => v !== null && v !== undefined)),
      },
    },
    enfants: { total: totalEnfants, urbain, rural, activites },
    infrastructureQualite: {
      crechesCreees: infrastructure?.nombre_creches_creees || 0,
      crechesEquipees: infrastructure?.nombre_creches_equipees || 0,
      crechesQualifiees: infrastructure?.nombre_creches_qualifiees || 0,
      labelsObtenus,
      controles: controlesData,
    },
    mouvements: {
      totalFermetures: sumBy(mouvements.filter((row) => row.type_mouvement === "fermeture"), (row) => row.nombre_creches),
      totalReouvertures: sumBy(mouvements.filter((row) => row.type_mouvement === "reouverture"), (row) => row.nombre_creches),
      details: detailsMouvements,
    },
    cadres: { totalCadres: sumBy(cadres, (row) => row.nombre_cadres), formations: formationsData, statuts: statutsCadreData },
    partenariats: {
      conventions: partenariats.map((row) => ({ partenaire: row.partenaire, nombre: row.nombre_conventions || 0, objectif: row.objectif || null })),
      analyses: analyses.map((row) => ({ sujet: row.sujet, beneficiaires: row.nombre_beneficiaires || 0 })),
      sondages: sondages.map((row) => ({ type: row.type_sondage, participants: row.nombre_participants || 0, resultats: row.resultats || null })),
    },
  };
};

export const loadEnfanceCrechesDashboard = async (
  directionId: string,
  year: number,
  domaineId?: string,
  lang = "fr",
): Promise<EnfanceCrechesDashboardData> => {
  const emptyKpis: EnfanceCrechesKpisRaw = {
    enfantsPrisesEnCharge: 0,
    demandesLicencesTraitees: 0,
    delaiMoyenTraitementJours: 0,
    cadresAssermentes: 0,
    crechesLabelliseesQualite: 0,
    fermeturesCrechesSignalees: 0,
  };

  const regionalDirectionIdsPromise = loadRegionalDirectionIds(directionId);

  const rapports = await loadRapports(directionId, year);
  if (rapports.length === 0) {
    return {
      status: {
        workflowStatus: "NON_COMMENCE",
        progressPct: 0,
        lastUpdated: null,
        correctionComment: null,
      },
      kpis: emptyKpis,
      section3: { demandesParType: [], demandesParStatut: [], enfantsParZone: [] },
      evolution: { enfants: emptyEvolutionEnfants(), mouvements: emptyEvolutionMouvements() },
      benchmark: buildBenchmark(emptyKpis),
      detailed: emptyDetailed(),
    };
  }

  const rapportIds = rapports.map((row) => row.id);
  const localRapportIdSet = new Set(rapportIds);
  const rapportTrimestreById = new Map<string, string | null>(rapports.map((row) => [row.id, row.trimestre]));
  const latestRapport = rapports[0];

  const regionalDirectionIds = await regionalDirectionIdsPromise;
  const regionalRapports = await loadRegionalReportsForDirectionIds(regionalDirectionIds, year);
  const regionalRapportIds = regionalRapports.map((row) => row.id);
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
    statsAll,
    traitementLicencesAll,
    demandesLicences,
    cadresAssermentesAll,
    labelQualiteAll,
    mouvementsFermeturesAll,
    activitesEnfants,
    statsInfrastructures,
    controles,
    formations,
    partenariats,
    analyses,
    sondages,
    crechesPrivees,
    typesDemande,
    statutsDemande,
    statutsCadre,
  ] = await Promise.all([
    loadStatus(latestRapport.id, domaineId),
    loadStatistics(fetchIds),
    loadTraitementLicences(fetchIds),
    loadDemandesLicences(rapportIds),
    loadCadresAssermentes(fetchIds),
    loadLabelQualite(fetchIds),
    loadMouvementsFermetures(fetchIds),
    loadActivitesEnfants(rapportIds),
    loadStatsInfrastructures(rapportIds),
    loadControleCreches(rapportIds),
    loadFormationsCadres(rapportIds),
    loadPartenariatsConventions(rapportIds),
    loadAnalysesPonctuelles(rapportIds),
    loadSondagesEtudes(rapportIds),
    loadCrechesPrivees(),
    loadRefTypesDemande(),
    loadRefStatutsDemande(),
    loadRefStatutsCadre(),
  ]);
  const stats = filterByRapportIds(statsAll, localRapportIdSet);
  const traitementLicences = filterByRapportIds(traitementLicencesAll, localRapportIdSet);
  const cadresAssermentes = filterByRapportIds(cadresAssermentesAll, localRapportIdSet);
  const labelQualite = filterByRapportIds(labelQualiteAll, localRapportIdSet);
  const mouvementsFermetures = filterByRapportIds(mouvementsFermeturesAll, localRapportIdSet);
  const regionalStats = statsAll;
  const regionalTraitementLicences = traitementLicencesAll;
  const regionalCadresAssermentes = cadresAssermentesAll;
  const regionalLabelQualite = labelQualiteAll;
  const regionalMouvementsFermetures = mouvementsFermeturesAll;

  const regionalAverage = averageDirectionalKpis(
    regionalDirectionIds
      .map((regionalDirectionId) => {
        const ids = regionalRapportIdsByDirection.get(regionalDirectionId);
        if (!ids || ids.size === 0) return null;
        return buildKpis(
          regionalStats.filter((row) => row.rapport_id && ids.has(row.rapport_id)),
          regionalTraitementLicences.filter((row) => row.rapport_id && ids.has(row.rapport_id)),
          regionalCadresAssermentes.filter((row) => row.rapport_id && ids.has(row.rapport_id)),
          regionalLabelQualite.filter((row) => row.rapport_id && ids.has(row.rapport_id)),
          regionalMouvementsFermetures.filter((row) => row.rapport_id && ids.has(row.rapport_id)),
        );
      })
      .filter((value): value is EnfanceCrechesKpisRaw => value !== null),
  ) as Partial<Record<keyof EnfanceCrechesKpisRaw, number>>;

  const kpis = buildKpis(stats, traitementLicences, cadresAssermentes, labelQualite, mouvementsFermetures);

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
    section3: buildSection3(demandesLicences, typesDemande, statutsDemande, stats, lang),
    evolution: buildEvolution(rapportTrimestreById, stats, mouvementsFermetures),
    benchmark: buildBenchmark(kpis, regionalAverage),
    detailed: buildDetailed(
      demandesLicences,
      traitementLicences,
      stats,
      activitesEnfants,
      statsInfrastructures,
      labelQualite,
      controles,
      mouvementsFermetures,
      cadresAssermentes,
      formations,
      partenariats,
      analyses,
      sondages,
      crechesPrivees,
      statutsCadre,
      typesDemande,
      statutsDemande,
      lang,
    ),
  };
};