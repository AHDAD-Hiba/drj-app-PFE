import { computeCompleteness, countCompleted, hasText } from "@/lib/formSchema";

export interface InfraCompletenessData {
  depenses: any[];
  eauElec: any[];
  partenariats: any[];
  btp: any[];
  souffrance: any[];
}

// Helpers locaux
const hasValue = (val: any): boolean => val !== undefined && val !== null && val !== "";

const hasArray = (val: any): boolean => Array.isArray(val) && val.length > 0;

export function computeInfraCompleteness(data: InfraCompletenessData): number {
  const { depenses = [], eauElec = [], partenariats = [], btp = [], souffrance = [] } = data;

  const stepCompletions = [
    // --- ÉTAPE 1 : Dépenses de Fonctionnement et Investissement ---
    countCompleted([
      depenses.length > 0, // Vérifie si au moins une ligne existe
      depenses.some((d) => hasText(d.type_depense)),
      depenses.some((d) => hasText(d.projet_budgetaire)),
      depenses.some((d) => hasValue(d.credits_ouverts)),
      depenses.some((d) => hasValue(d.credits_engages)),
      depenses.some((d) => hasValue(d.credits_payes)),
    ]),

    // --- ÉTAPE 2 : Consommation Eau & Électricité ---
    countCompleted([
      eauElec.length > 0,
      eauElec.some((e) => hasText(e.etablissement_id)),
      eauElec.some((e) => hasValue(e.arrieres_eau)),
      eauElec.some((e) => hasValue(e.arrieres_electricite)),
      eauElec.some((e) => hasValue(e.consommation_eau)),
      eauElec.some((e) => hasValue(e.consommation_electricite)),
    ]),

    // --- ÉTAPE 3 : Projets de Partenariats ---
    countCompleted([
      partenariats.length > 0,
      partenariats.some((p) => hasText(p.sujet_convention)),
      partenariats.some((p) => hasText(p.sujet_projet)),
      partenariats.some((p) => hasArray(p.types_etablissements)), // Validation du tableau
      partenariats.some((p) => hasText(p.maitre_ouvrage_delegue)),
      partenariats.some((p) => hasText(p.phase_projet)),
      partenariats.some((p) => hasValue(p.taux_avancement)),
    ]),

    // --- ÉTAPE 4 : Projets BTP & Aménagement ---
    countCompleted([
      btp.length > 0,
      btp.some((b) => hasText(b.type_projet)),
      btp.some((b) => hasText(b.etablissement_id)),
      btp.some((b) => hasValue(b.cout_projet)),
      btp.some((b) => hasValue(b.montant_paye)),
      btp.some((b) => hasValue(b.taux_avancement_travaux)),
    ]),

    // --- ÉTAPE 5 : Projets en Souffrance ---
    countCompleted([
      souffrance.length > 0,
      souffrance.some((s) => hasText(s.etablissement_id)),
      souffrance.some((s) => hasText(s.causes_blocage)),
      souffrance.some((s) => hasText(s.solutions_proposees)),
    ]),
  ];

  return computeCompleteness(stepCompletions);
}
