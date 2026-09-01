import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import type { PrefDomainBenchmarkRow } from "@/components/dashboard/PrefDomainBenchmarkTable";
import type { DashboardData } from "@/services/prefDomainDashboardTypes";
import {
  averageDirectionalKpis,
  filterByRapportIds,
  loadRegionalDirectionIds,
  loadRegionalReportsForDirectionIds,
  uniqueIds,
} from "@/services/prefDomainRegionalBenchmark";

// --- Service dédié au domaine "Infrastructures, Budget et Gouvernance" ---
// Suit exactement le même contrat que PrefDomainDashboardDataService.ts
// (Jeunesse) mais reste totalement indépendant : aucune dépendance croisée,
// aucune table métier autre que les 5 tables infra_* (+ la table système
// "rapports" et la vue système "v_dashboard_pref_section1", déjà utilisées
// par le service Jeunesse pour le statut/la progression du formulaire).
//
// Toute l'agrégation (sommes, taux, regroupements) est faite ICI. Les
// builders (section2/InfrastructureKpiConfig.tsx,
// section6/InfrastructureSection6Blocks.tsx) et les composants Section3/4
// ne font que de la présentation à partir des données déjà calculées.

type InfraDepensesRow = Database["public"]["Tables"]["infra_depenses"]["Row"];
type InfraEauElectriciteRow = Database["public"]["Tables"]["infra_eau_electricite"]["Row"];
type InfraProjetsBtpRow = Database["public"]["Tables"]["infra_projets_btp"]["Row"];
type InfraProjetsPartenariatRow = Database["public"]["Tables"]["infra_projets_partenariat"]["Row"];
type InfraProjetsEnSouffranceRow =
  Database["public"]["Tables"]["infra_projets_en_souffrance"]["Row"];

// --- Types exposés (consommés par les builders Section2 / Section6 et par les Sections 3/4) ---

export interface InfrastructureKpisRaw {
  /** Σ crédits payés / Σ crédits ouverts (%) */
  budgetExecutionRate: number;
  /** Σ crédits engagés / Σ crédits ouverts (%) */
  budgetEngagementRate: number;
  /** Nombre total de lignes infra_projets_btp (construction + aménagement) */
  totalProjetsBtp: number;
  /** Nombre total de lignes infra_projets_partenariat */
  totalProjetsPartenariat: number;
  /** Nombre total de lignes infra_projets_en_souffrance */
  totalProjetsEnSouffrance: number;
  /** Σ arriérés Eau + Σ arriérés Électricité (DH) */
  totalArrieres: number;
}

/** Carte 1 de Section3 : Budget Fonctionnement vs Investissement (Stacked Bar) */
export interface InfrastructureBudgetStageDatum {
  /** clé stable ("fonctionnement" | "investissement"), traduite par le composant */
  category: string;
  paye: number;
  /** reste à payer = max(ouverts - payés, 0) */
  reste: number;
}

/** Cartes 2 et 3 de Section3 : Donut (état des projets) / Horizontal Bar (nature) */
export interface InfrastructureDonutDatum {
  /** clé stable, traduite par le composant */
  name: string;
  value: number;
}

export interface InfrastructureSection3Data {
  budget: InfrastructureBudgetStageDatum[];
  etatProjets: InfrastructureDonutDatum[];
  natureProjets: InfrastructureDonutDatum[];
}

export interface InfrastructureEvolutionBudgetDatum {
  name: string; // "T1" .. "T4"
  Ouverts: number | null;
  Payes: number | null;
}

export interface InfrastructureEvolutionArrieresDatum {
  name: string;
  Eau: number | null;
  Electricite: number | null;
}

export interface InfrastructureEvolutionProjetsDatum {
  name: string;
  BTP: number | null;
  Partenariat: number | null;
}

export interface InfrastructureEvolutionData {
  budget: InfrastructureEvolutionBudgetDatum[];
  arrieres: InfrastructureEvolutionArrieresDatum[];
  projets: InfrastructureEvolutionProjetsDatum[];
}

/** Données détaillées consommées par section6/InfrastructureSection6Blocks.tsx */
export interface InfrastructureSection6Data {
  depenses: {
    fonctionnement: { ouverts: number; engages: number; payes: number };
    investissement: { ouverts: number; engages: number; payes: number };
    total: { ouverts: number; engages: number; payes: number };
  };
  eauElectricite: {
    consommationEau: number;
    consommationElectricite: number;
    arrieresEau: number;
    arrieresElectricite: number;
  };
  partenariat: {
    total: number;
    /** moyenne de taux_avancement (%) sur les lignes renseignées */
    avancementMoyen: number;
    parPhase: { phase: string; count: number }[];
  };
  btp: {
    total: number;
    construction: number;
    amenagement: number;
    coutTotal: number;
    montantPayeTotal: number;
    /** Σ montant_paye / Σ cout_projet (%) */
    tauxPaiement: number;
    /** moyenne de taux_avancement_travaux (%) sur les lignes renseignées */
    avancementMoyen: number;
  };
  enSouffrance: {
    total: number;
    causes: { cause: string; count: number }[];
  };
}

export type InfrastructureDashboardData = DashboardData<
  InfrastructureKpisRaw,
  InfrastructureSection3Data,
  InfrastructureEvolutionData,
  InfrastructureSection6Data
>;

// --- Helpers d'agrégation (privés) ---

const sumBy = <T>(rows: T[], selector: (row: T) => number | null | undefined): number =>
  rows.reduce((acc, row) => acc + (selector(row) || 0), 0);

const average = (values: number[]): number =>
  values.length === 0 ? 0 : values.reduce((acc, v) => acc + v, 0) / values.length;

const ratioPct = (numerator: number, denominator: number): number =>
  denominator > 0 ? (numerator / denominator) * 100 : 0;

const TRIMESTRE_LABELS: Record<string, "T1" | "T2" | "T3" | "T4"> = {
  t1: "T1",
  t2: "T2",
  t3: "T3",
  t4: "T4",
};

const emptyEvolutionBudget = (): InfrastructureEvolutionBudgetDatum[] =>
  (["T1", "T2", "T3", "T4"] as const).map((name) => ({ name, Ouverts: null, Payes: null }));

const emptyEvolutionArrieres = (): InfrastructureEvolutionArrieresDatum[] =>
  (["T1", "T2", "T3", "T4"] as const).map((name) => ({ name, Eau: null, Electricite: null }));

const emptyEvolutionProjets = (): InfrastructureEvolutionProjetsDatum[] =>
  (["T1", "T2", "T3", "T4"] as const).map((name) => ({ name, BTP: null, Partenariat: null }));

// --- Requêtes par section (privées) ---

/**
 * Statut / progression / dernière mise à jour — strictement scopés au
 * domaine Infrastructure via domaine_id (jamais le rapport complet).
 * Même vue et même contrat que le service Jeunesse.
 */
const loadStatus = async (rapportId: string, domaineId?: string) => {
  const baseQuery = supabase
    .from("suivi_remplissage")
    .select("id, rapport_id, domaine_id, statut, progression_pourcentage, updated_at")
    .eq("rapport_id", rapportId);
  const query = domaineId ? baseQuery.eq("domaine_id", domaineId) : baseQuery;

  const { data } = await query.order("updated_at", { ascending: false }).limit(1).maybeSingle();
  return data;
};

/** Tous les rapports (un par trimestre) de la direction pour l'année donnée. */
const loadRapports = async (directionId: string, year: number) => {
  const { data } = await supabase
    .from("rapports")
    .select("id, statut_rapport, commentaire_correction, trimestre, updated_at")
    .eq("direction_id", directionId)
    .eq("annee", year)
    .order("trimestre", { ascending: false });
  return data || [];
};

const loadInfraDepenses = async (rapportIds: string[]) => {
  const { data } = await supabase.from("infra_depenses").select("*").in("rapport_id", rapportIds);
  return (data || []) as InfraDepensesRow[];
};

const loadInfraEauElectricite = async (rapportIds: string[]) => {
  const { data } = await supabase
    .from("infra_eau_electricite")
    .select("*")
    .in("rapport_id", rapportIds);
  return (data || []) as InfraEauElectriciteRow[];
};

const loadInfraProjetsBtp = async (rapportIds: string[]) => {
  const { data } = await supabase
    .from("infra_projets_btp")
    .select("*")
    .in("rapport_id", rapportIds);
  return (data || []) as InfraProjetsBtpRow[];
};

const loadInfraProjetsPartenariat = async (rapportIds: string[]) => {
  const { data } = await supabase
    .from("infra_projets_partenariat")
    .select("*")
    .in("rapport_id", rapportIds);
  return (data || []) as InfraProjetsPartenariatRow[];
};

const loadInfraProjetsEnSouffrance = async (rapportIds: string[]) => {
  const { data } = await supabase
    .from("infra_projets_en_souffrance")
    .select("*")
    .in("rapport_id", rapportIds);
  return (data || []) as InfraProjetsEnSouffranceRow[];
};

// --- Transformations (privées) ---

const buildKpis = (
  depenses: InfraDepensesRow[],
  eauElectricite: InfraEauElectriciteRow[],
  btp: InfraProjetsBtpRow[],
  partenariat: InfraProjetsPartenariatRow[],
  enSouffrance: InfraProjetsEnSouffranceRow[],
): InfrastructureKpisRaw => {
  const ouvertsTotal = sumBy(depenses, (d) => d.credits_ouverts);
  const engagesTotal = sumBy(depenses, (d) => d.credits_engages);
  const payesTotal = sumBy(depenses, (d) => d.credits_payes);

  return {
    budgetExecutionRate: ratioPct(payesTotal, ouvertsTotal),
    budgetEngagementRate: ratioPct(engagesTotal, ouvertsTotal),
    totalProjetsBtp: btp.length,
    totalProjetsPartenariat: partenariat.length,
    totalProjetsEnSouffrance: enSouffrance.length,
    totalArrieres:
      sumBy(eauElectricite, (e) => e.arrieres_eau) +
      sumBy(eauElectricite, (e) => e.arrieres_electricite),
  };
};

const buildSection3 = (
  depenses: InfraDepensesRow[],
  btp: InfraProjetsBtpRow[],
  partenariat: InfraProjetsPartenariatRow[],
): InfrastructureSection3Data => {
  // Carte 1 : Budget Fonctionnement vs Investissement (Payé / Reste à payer)
  const buildStage = (
    type: "fonctionnement" | "investissement",
  ): InfrastructureBudgetStageDatum => {
    const rows = depenses.filter((d) => d.type_depense === type);
    const ouverts = sumBy(rows, (d) => d.credits_ouverts);
    const paye = sumBy(rows, (d) => d.credits_payes);
    return { category: type, paye, reste: Math.max(ouverts - paye, 0) };
  };

  // Carte 2 : État des projets (regroupement des phases de infra_projets_partenariat)
  // "attente_foncier" est rattaché à "Études" (phase préparatoire, avant travaux),
  // "attente_livraison" est rattaché à "Livraison".
  let etudes = 0;
  let travaux = 0;
  let livraison = 0;
  let acheve = 0;
  partenariat.forEach((p) => {
    switch (p.phase_projet) {
      case "etudes":
      case "attente_foncier":
        etudes += 1;
        break;
      case "travaux":
        travaux += 1;
        break;
      case "attente_livraison":
        livraison += 1;
        break;
      case "acheve":
        acheve += 1;
        break;
      default:
        break;
    }
  });

  // Carte 3 : Nature des projets (Construction vs Aménagement) — infra_projets_btp
  const construction = btp.filter((b) => b.type_projet === "construction").length;
  const amenagement = btp.filter((b) => b.type_projet === "amenagement").length;

  return {
    budget: [buildStage("fonctionnement"), buildStage("investissement")],
    etatProjets: [
      { name: "etudes", value: etudes },
      { name: "travaux", value: travaux },
      { name: "livraison", value: livraison },
      { name: "acheve", value: acheve },
    ],
    natureProjets: [
      { name: "construction", value: construction },
      { name: "amenagement", value: amenagement },
    ],
  };
};

const buildEvolution = (
  rapportTrimestreById: Map<string, string | null>,
  depenses: InfraDepensesRow[],
  eauElectricite: InfraEauElectriciteRow[],
  btp: InfraProjetsBtpRow[],
  partenariat: InfraProjetsPartenariatRow[],
): InfrastructureEvolutionData => {
  const budget = emptyEvolutionBudget();
  const arrieres = emptyEvolutionArrieres();
  const projets = emptyEvolutionProjets();

  const trimestreLabelForRapport = (rapportId: string | null): "T1" | "T2" | "T3" | "T4" | null => {
    if (!rapportId) return null;
    const trimestre = rapportTrimestreById.get(rapportId);
    if (!trimestre) return null;
    return TRIMESTRE_LABELS[trimestre] ?? null;
  };

  const budgetByQuarter = new Map<string, { ouverts: number; payes: number }>();
  depenses.forEach((d) => {
    const label = trimestreLabelForRapport(d.rapport_id);
    if (!label) return;
    const acc = budgetByQuarter.get(label) || { ouverts: 0, payes: 0 };
    acc.ouverts += d.credits_ouverts || 0;
    acc.payes += d.credits_payes || 0;
    budgetByQuarter.set(label, acc);
  });
  budget.forEach((row) => {
    const acc = budgetByQuarter.get(row.name);
    if (acc) {
      row.Ouverts = acc.ouverts;
      row.Payes = acc.payes;
    }
  });

  const arrieresByQuarter = new Map<string, { eau: number; elec: number }>();
  eauElectricite.forEach((e) => {
    const label = trimestreLabelForRapport(e.rapport_id);
    if (!label) return;
    const acc = arrieresByQuarter.get(label) || { eau: 0, elec: 0 };
    acc.eau += e.arrieres_eau || 0;
    acc.elec += e.arrieres_electricite || 0;
    arrieresByQuarter.set(label, acc);
  });
  arrieres.forEach((row) => {
    const acc = arrieresByQuarter.get(row.name);
    if (acc) {
      row.Eau = acc.eau;
      row.Electricite = acc.elec;
    }
  });

  const projetsByQuarter = new Map<string, { btp: number; partenariat: number }>();
  btp.forEach((b) => {
    const label = trimestreLabelForRapport(b.rapport_id);
    if (!label) return;
    const acc = projetsByQuarter.get(label) || { btp: 0, partenariat: 0 };
    acc.btp += 1;
    projetsByQuarter.set(label, acc);
  });
  partenariat.forEach((p) => {
    const label = trimestreLabelForRapport(p.rapport_id);
    if (!label) return;
    const acc = projetsByQuarter.get(label) || { btp: 0, partenariat: 0 };
    acc.partenariat += 1;
    projetsByQuarter.set(label, acc);
  });
  projets.forEach((row) => {
    const acc = projetsByQuarter.get(row.name);
    if (acc) {
      row.BTP = acc.btp;
      row.Partenariat = acc.partenariat;
    }
  });

  return { budget, arrieres, projets };
};

const buildBenchmark = (
  kpis: InfrastructureKpisRaw,
  depensesPayesTotal: number,
  regionalAverages: Partial<Record<keyof InfrastructureKpisRaw, number>> = {},
  regionalBudgetPaidAverage = 0,
): PrefDomainBenchmarkRow[] => {
  const regional = (key: keyof InfrastructureKpisRaw, fallback = 0) =>
    Number.isFinite(regionalAverages[key]) ? (regionalAverages[key] as number) : fallback;

  return [
    {
      kpi: "Taux exécution budgétaire",
      monScore: kpis.budgetExecutionRate,
      moyenneReg: regional("budgetExecutionRate", 0),
      isPercentage: true,
    },
    {
      kpi: "Budget payé (DH)",
      monScore: depensesPayesTotal,
      moyenneReg: regionalBudgetPaidAverage,
      isPercentage: false,
    },
    {
      kpi: "Nombre projets BTP",
      monScore: kpis.totalProjetsBtp,
      moyenneReg: regional("totalProjetsBtp", 0),
      isPercentage: false,
    },
    {
      kpi: "Nombre projets partenariat",
      monScore: kpis.totalProjetsPartenariat,
      moyenneReg: regional("totalProjetsPartenariat", 0),
      isPercentage: false,
    },
    {
      kpi: "Nombre projets bloqués",
      monScore: kpis.totalProjetsEnSouffrance,
      moyenneReg: regional("totalProjetsEnSouffrance", 0),
      isPercentage: false,
    },
    {
      kpi: "Montant des arriérés",
      monScore: kpis.totalArrieres,
      moyenneReg: regional("totalArrieres", 0),
      isPercentage: false,
    },
  ];
};

const buildDetailed = (
  depenses: InfraDepensesRow[],
  eauElectricite: InfraEauElectriciteRow[],
  btp: InfraProjetsBtpRow[],
  partenariat: InfraProjetsPartenariatRow[],
  enSouffrance: InfraProjetsEnSouffranceRow[],
): InfrastructureSection6Data => {
  const stage = (type: "fonctionnement" | "investissement") => {
    const rows = depenses.filter((d) => d.type_depense === type);
    return {
      ouverts: sumBy(rows, (d) => d.credits_ouverts),
      engages: sumBy(rows, (d) => d.credits_engages),
      payes: sumBy(rows, (d) => d.credits_payes),
    };
  };
  const fonctionnement = stage("fonctionnement");
  const investissement = stage("investissement");

  const phaseCounts = new Map<string, number>();
  partenariat.forEach((p) => {
    const phase = p.phase_projet || "non_defini";
    phaseCounts.set(phase, (phaseCounts.get(phase) || 0) + 1);
  });

  const construction = btp.filter((b) => b.type_projet === "construction");
  const amenagement = btp.filter((b) => b.type_projet === "amenagement");
  const coutTotal = sumBy(btp, (b) => b.cout_projet);
  const montantPayeTotal = sumBy(btp, (b) => b.montant_paye);

  const causeCounts = new Map<string, number>();
  enSouffrance.forEach((p) => {
    const cause = p.causes_blocage?.trim() || "non_precise";
    causeCounts.set(cause, (causeCounts.get(cause) || 0) + 1);
  });

  return {
    depenses: {
      fonctionnement,
      investissement,
      total: {
        ouverts: fonctionnement.ouverts + investissement.ouverts,
        engages: fonctionnement.engages + investissement.engages,
        payes: fonctionnement.payes + investissement.payes,
      },
    },
    eauElectricite: {
      consommationEau: sumBy(eauElectricite, (e) => e.consommation_eau),
      consommationElectricite: sumBy(eauElectricite, (e) => e.consommation_electricite),
      arrieresEau: sumBy(eauElectricite, (e) => e.arrieres_eau),
      arrieresElectricite: sumBy(eauElectricite, (e) => e.arrieres_electricite),
    },
    partenariat: {
      total: partenariat.length,
      avancementMoyen: average(
        partenariat
          .map((p) => p.taux_avancement)
          .filter((v): v is number => v !== null && v !== undefined),
      ),
      parPhase: Array.from(phaseCounts.entries()).map(([phase, count]) => ({ phase, count })),
    },
    btp: {
      total: btp.length,
      construction: construction.length,
      amenagement: amenagement.length,
      coutTotal,
      montantPayeTotal,
      tauxPaiement: ratioPct(montantPayeTotal, coutTotal),
      avancementMoyen: average(
        btp
          .map((b) => b.taux_avancement_travaux)
          .filter((v): v is number => v !== null && v !== undefined),
      ),
    },
    enSouffrance: {
      total: enSouffrance.length,
      causes: Array.from(causeCounts.entries()).map(([cause, count]) => ({ cause, count })),
    },
  };
};

// --- Fonction unique exposée ---

export const loadInfrastructureDashboard = async (
  directionId: string,
  year: number,
  domaineId?: string,
): Promise<InfrastructureDashboardData> => {
  const emptyKpis: InfrastructureKpisRaw = {
    budgetExecutionRate: 0,
    budgetEngagementRate: 0,
    totalProjetsBtp: 0,
    totalProjetsPartenariat: 0,
    totalProjetsEnSouffrance: 0,
    totalArrieres: 0,
  };
  const regionalDirectionIdsPromise = loadRegionalDirectionIds(directionId);

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
      section3: { budget: [], etatProjets: [], natureProjets: [] },
      evolution: {
        budget: emptyEvolutionBudget(),
        arrieres: emptyEvolutionArrieres(),
        projets: emptyEvolutionProjets(),
      },
      benchmark: buildBenchmark(emptyKpis, 0),
      detailed: buildDetailed([], [], [], [], []),
    };
  }

  const rapportIds = rapports.map((r) => r.id);
  const localRapportIdSet = new Set(rapportIds);
  const rapportTrimestreById = new Map<string, string | null>(
    rapports.map((r) => [r.id, r.trimestre]),
  );
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
  const [status, depensesAll, eauElectriciteAll, btpAll, partenariatAll, enSouffranceAll] =
    await Promise.all([
      loadStatus(latestRapport.id, domaineId),
      loadInfraDepenses(fetchIds),
      loadInfraEauElectricite(fetchIds),
      loadInfraProjetsBtp(fetchIds),
      loadInfraProjetsPartenariat(fetchIds),
      loadInfraProjetsEnSouffrance(fetchIds),
    ]);
  const depenses = filterByRapportIds(depensesAll, localRapportIdSet);
  const eauElectricite = filterByRapportIds(eauElectriciteAll, localRapportIdSet);
  const btp = filterByRapportIds(btpAll, localRapportIdSet);
  const partenariat = filterByRapportIds(partenariatAll, localRapportIdSet);
  const enSouffrance = filterByRapportIds(enSouffranceAll, localRapportIdSet);
  const regionalDepenses = depensesAll;
  const regionalEauElectricite = eauElectriciteAll;
  const regionalBtp = btpAll;
  const regionalPartenariat = partenariatAll;
  const regionalEnSouffrance = enSouffranceAll;

  const regionalAverage = averageDirectionalKpis(
    regionalDirectionIds
      .map((regionalDirectionId) => {
        const ids = regionalRapportIdsByDirection.get(regionalDirectionId);
        if (!ids || ids.size === 0) return null;
        return buildKpis(
          regionalDepenses.filter((row) => row.rapport_id && ids.has(row.rapport_id)),
          regionalEauElectricite.filter((row) => row.rapport_id && ids.has(row.rapport_id)),
          regionalBtp.filter((row) => row.rapport_id && ids.has(row.rapport_id)),
          regionalPartenariat.filter((row) => row.rapport_id && ids.has(row.rapport_id)),
          regionalEnSouffrance.filter((row) => row.rapport_id && ids.has(row.rapport_id)),
        );
      })
      .filter((value): value is InfrastructureKpisRaw => value !== null),
  ) as Partial<Record<keyof InfrastructureKpisRaw, number>>;

  const regionalBudgetPaidAverage =
    averageDirectionalKpis(
      regionalDirectionIds
        .map((regionalDirectionId) => {
          const ids = regionalRapportIdsByDirection.get(regionalDirectionId);
          if (!ids || ids.size === 0) return null;
          return {
            budgetPaid: sumBy(
              regionalDepenses.filter((row) => row.rapport_id && ids.has(row.rapport_id)),
              (row) => row.credits_payes,
            ),
          };
        })
        .filter((value): value is { budgetPaid: number } => value !== null),
    ).budgetPaid ?? 0;

  const kpis = buildKpis(depenses, eauElectricite, btp, partenariat, enSouffrance);
  // زدنا هاد الجوج سطورا باش نحددو الحالة والنسبة بحال في Jeunesse
  const workflowStatus =
    status?.statut ||
    (latestRapport.statut_rapport === "VALIDE"
      ? "TERMINE"
      : latestRapport.statut_rapport === "NON_COMMENCE"
        ? "NON_COMMENCE"
        : "EN_COURS");
  const progressPct =
    status?.progression_pourcentage ??
    (workflowStatus === "TERMINE" ? 100 : workflowStatus === "EN_COURS" ? 50 : 0);

  return {
    status: {
      workflowStatus,
      progressPct,
      lastUpdated: status?.updated_at ?? latestRapport.updated_at,
      correctionComment: latestRapport.commentaire_correction ?? null,
      reportStatus: latestRapport.statut_rapport,
    },
    kpis,
    section3: buildSection3(depenses, btp, partenariat),
    evolution: buildEvolution(rapportTrimestreById, depenses, eauElectricite, btp, partenariat),
    benchmark: buildBenchmark(
      kpis,
      sumBy(depenses, (d) => d.credits_payes),
      regionalAverage,
      regionalBudgetPaidAverage,
    ),
    detailed: buildDetailed(depenses, eauElectricite, btp, partenariat, enSouffrance),
  };
};
