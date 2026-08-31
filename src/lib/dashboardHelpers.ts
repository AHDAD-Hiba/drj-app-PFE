import type { BenchmarkRow } from "@/components/dashboard/BenchmarkTable";
import type { EvolutionRow } from "@/components/dashboard/types";

type DashboardRecord = object | null | undefined;
type DashboardValues = Record<string, unknown>;

export interface CountByType {
  type: string;
  count: number;
}

export interface CountByCause {
  cause: string;
  count: number;
}

const asValues = (data: DashboardRecord): DashboardValues => (data ?? {}) as DashboardValues;
const numberValue = (data: DashboardValues, key: string) => (data[key] as number) || 0;
const countByType = (value: unknown): CountByType[] => Array.isArray(value) ? value as CountByType[] : [];
const countByCause = (value: unknown): CountByCause[] => Array.isArray(value) ? value as CountByCause[] : [];

export const formatBenchmarkData = (data: DashboardRecord): BenchmarkRow[] => {
  const d = asValues(data);

  return [
    {
      kpi: "Total des Activités",
      monScore: numberValue(d, "pref_total_activites"),
      moyenneReg: numberValue(d, "reg_total_activites"),
      isPercentage: false,
    },
    {
      kpi: "Total Bénéficiaires",
      monScore: numberValue(d, "pref_total_beneficiaires"),
      moyenneReg: numberValue(d, "reg_total_beneficiaires"),
      isPercentage: false,
    },
    {
      kpi: "Taux de Couverture",
      monScore: numberValue(d, "pref_taux_couverture"),
      moyenneReg: numberValue(d, "reg_taux_couverture"),
      isPercentage: true,
    },
    {
      kpi: "Taux de Féminisation",
      monScore: numberValue(d, "pref_taux_feminisation"),
      moyenneReg: numberValue(d, "reg_taux_feminisation"),
      isPercentage: true,
    },
    {
      kpi: "Partenariats Actifs",
      monScore: numberValue(d, "pref_total_partenariats"),
      moyenneReg: numberValue(d, "reg_total_partenariats"),
      isPercentage: false,
    },
    {
      kpi: "Établ. Opérationnels",
      monScore: numberValue(d, "pref_etablissements_actifs"),
      moyenneReg: numberValue(d, "reg_etablissements_actifs"),
      isPercentage: false,
    },
  ];
};

export const mapSection6Data = (data: DashboardRecord) => {
  const d = asValues(data);
  const staffTotal = numberValue(d, "camp_staff_total");
  const benefTotal = numberValue(d, "camp_benef_total");
  const ratioCalcule = staffTotal === 0 || benefTotal === 0 ? "0:0" : `1:${Math.round(benefTotal / staffTotal)}`;

  return {
    activites: {
      nombre_associations: numberValue(d, "act_assocs"), nombre_clubs: numberValue(d, "act_clubs"), nombre_conventions: numberValue(d, "act_conventions"), activites_sportives: numberValue(d, "act_sport"), activites_culturelles: numberValue(d, "act_cult"), activites_educatives: numberValue(d, "act_educ"), renforcement_capacites: numberValue(d, "act_renf"),
    },
    camping: {
      participants: {
        total: benefTotal, enfants_mre: numberValue(d, "camp_mre"), besoins_specifiques: numberValue(d, "camp_besoins_spec"),
      },
      encadrement: {
        ratio: ratioCalcule,
        total_staff: staffTotal, hommes: numberValue(d, "camp_staff_h"), femmes: numberValue(d, "camp_staff_f"),
      },
      formations: { total_sessions: numberValue(d, "form_total_sessions"), beneficiaires: numberValue(d, "form_beneficiaires") },
    },
    associations: {
      entrants: numberValue(d, "assoc_entrants"), sortants: numberValue(d, "assoc_sortants"), benef_entrants: numberValue(d, "benef_entrants"), benef_sortants: numberValue(d, "benef_sortants"), ben_entrants: numberValue(d, "benef_entrants"), ben_sortants: numberValue(d, "benef_sortants"),
    },
    conventions: {
      total_conventions: numberValue(d, "conv_total_global"), total_partenaires: numberValue(d, "conv_types_distincts"), repartition: countByType(d.repartition_partenaires_json),
    },
    insertion: {
      total_activites: numberValue(d, "ins_total_activites"), partenaires_actifs: numberValue(d, "ins_partenaires_actifs"), volume_horaire: `${numberValue(d, "ins_volume_h")} Heures`, genre: { hommes: numberValue(d, "ins_hommes"), femmes: numberValue(d, "ins_femmes") }, milieu: { urbain: numberValue(d, "ins_urbain"), rural: numberValue(d, "ins_rural") },
    },
    festivals: {
      total_evenements: numberValue(d, "fest_total"), total_provinces: numberValue(d, "fest_provinces"), qualifies: numberValue(d, "fest_qualifies"), total_participants: numberValue(d, "fest_hommes") + numberValue(d, "fest_femmes"), genre: { hommes: numberValue(d, "fest_hommes"), femmes: numberValue(d, "fest_femmes") }, milieu: { urbain: numberValue(d, "fest_urbain"), rural: numberValue(d, "fest_rural") },
    },
    etablissements: {
      total: numberValue(d, "etab_nouvel") + numberValue(d, "etab_en_cours") + numberValue(d, "etab_total_fermes"),
      operationnels: 0,
      nouvellement_creees: numberValue(d, "etab_nouvel"), en_cours_realisation: numberValue(d, "etab_en_cours"),
      fermees: {
        total: numberValue(d, "etab_total_fermes"), causes: countByCause(d.causes_fermeture_json),
      },
    },
  };
};

export const formatEvolutionData = (data: EvolutionRow[]): EvolutionRow[] => {
  const skeleton: EvolutionRow[] = [
    { name: "T1", Camping: null, Festivals: null, Formation: null, Insertion: null },
    { name: "T2", Camping: null, Festivals: null, Formation: null, Insertion: null },
    { name: "T3", Camping: null, Festivals: null, Formation: null, Insertion: null },
    { name: "T4", Camping: null, Festivals: null, Formation: null, Insertion: null },
  ];

  return skeleton.map((quarter) => {
    const existing = data.find((item) => item.name === quarter.name);
    return existing ? { ...quarter, ...existing } : quarter;
  });
};