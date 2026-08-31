import {
  computeCompleteness,
  countCompleted,
  hasText,
} from '@/lib/formSchema';

export interface CrCompletenessData {
  demandes: any[];
  traitement: any[];
  statsInfra: any[];
  mouvements: any[];
  partenariats: any[];
  controle: any[];
  cadres: any[];
  label: any[];
  statsEnfants: any[];
  activites: any[];
  formations: any[];
  analyses: any[];
  sondages: any[];
}

// Helper local pour accepter le "0" comme valeur valide
const hasValue = (val: any): boolean => 
  val !== undefined && val !== null && val !== '';

export function computeCrCompleteness(data: CrCompletenessData): number {
  const { 
    demandes = [], traitement = [],
    statsInfra = [], mouvements = [], partenariats = [], controle = [], cadres = [], label = [],
    statsEnfants = [], activites = [], formations = [],
    analyses = [], sondages = []
  } = data;

  const stepCompletions = [
    // --- ÉTAPE 1 : Autorisations (تراخيص) ---
    countCompleted([
      demandes.length > 0 || traitement.length > 0, // Présence d'au moins une donnée
      demandes.some((d) => hasText(d.type_demande_id)),
      demandes.some((d) => hasText(d.statut_demande_id)),
      demandes.some((d) => hasValue(d.nombre_demandes)),
      traitement.some((t) => hasValue(t.nombre_demandes_traitees)),
      traitement.some((t) => hasValue(t.delai_moyen_traitement_jours)),
    ]),

    // --- ÉTAPE 2 : Infrastructures & Contrôle (البنية التحتية والمراقبة) ---
    countCompleted([
      statsInfra.length > 0 || mouvements.length > 0 || partenariats.length > 0 || controle.length > 0 || cadres.length > 0 || label.length > 0,
      statsInfra.some((s) => hasValue(s.nombre_creches_creees)),
      statsInfra.some((s) => hasValue(s.nombre_creches_qualifiees)),
      statsInfra.some((s) => hasValue(s.nombre_creches_equipees)),
      mouvements.some((m) => hasText(m.type_mouvement)),
      mouvements.some((m) => hasText(m.secteur)),
      mouvements.some((m) => hasValue(m.nombre_creches)),
      mouvements.some((m) => hasText(m.raisons)),
      partenariats.some((p) => hasText(p.partenaire)),
      partenariats.some((p) => hasValue(p.nombre_conventions)),
      controle.some((c) => hasText(c.creche_privee_id)),
      cadres.some((c) => hasText(c.statut_cadre_id)),
      cadres.some((c) => hasValue(c.nombre_cadres)),
      label.some((l) => hasText(l.statut_label)),
    ]),

    // --- ÉTAPE 3 : Bénéficiaires & Ressources Humaines (المستفيدين والموارد البشرية) ---
    countCompleted([
      statsEnfants.length > 0 || activites.length > 0 || formations.length > 0,
      statsEnfants.some((s) => hasValue(s.garcons)),
      statsEnfants.some((s) => hasValue(s.filles)),
      statsEnfants.some((s) => hasValue(s.urbain)),
      statsEnfants.some((s) => hasValue(s.rural)),
      activites.some((a) => hasText(a.nom_activite)),
      activites.some((a) => hasValue(a.garcons)),
      activites.some((a) => hasValue(a.filles)),
      activites.some((a) => hasValue(a.urbain)),
      activites.some((a) => hasValue(a.rural)),
      formations.some((f) => hasText(f.domaine_formation)),
      formations.some((f) => hasValue(f.nombre_cadres)),
      formations.some((f) => hasValue(f.duree_valeur)),
      formations.some((f) => hasText(f.duree_unite)),
    ]),

    // --- ÉTAPE 4 : Études & Analyses (دراسات وتحليلات) ---
    countCompleted([
      analyses.length > 0 || sondages.length > 0,
      analyses.some((a) => hasText(a.sujet)),
      analyses.some((a) => hasValue(a.nombre_beneficiaires)),
      sondages.some((s) => hasText(s.type_sondage)),
      sondages.some((s) => hasValue(s.nombre_participants)),
    ]),
  ];

  return computeCompleteness(stepCompletions);
}