import { computeCompleteness, countCompleted, hasText } from "@/lib/formSchema";

export interface AfCompletenessData {
  clubs: any[];
  ofppt: any[];
  laureates: any[];
  agr: any[];
  sensi: any[];
  portes: any[];
  ecoute: any[];
  rh: any[];
  cadres: any[];
  reseau: any[];
  partenariats: any[];
}

// Helper local pour accepter le "0" comme valeur valide (contrairement à hasPositiveNumber)
const hasValue = (val: any): boolean => val !== undefined && val !== null && val !== "";

export function computeAfCompleteness(data: AfCompletenessData): number {
  const {
    clubs = [],
    ofppt = [],
    laureates = [],
    agr = [],
    sensi = [],
    portes = [],
    ecoute = [],
    rh = [],
    cadres = [],
    reseau = [],
    partenariats = [],
  } = data;

  const stepCompletions = [
    // --- ÉTAPE 1 : Formation (Clubs & OFPPT) ---
    countCompleted([
      clubs.length > 0 || ofppt.length > 0, // Présence d'au moins une donnée
      clubs.some((c) => hasText(c.etablissement_id)) ||
        ofppt.some((o) => hasText(o.etablissement_id)),
      clubs.some((c) => hasText(c.filiere_id)) || ofppt.some((o) => hasText(o.filiere_id)),
      clubs.some((c) => hasText(c.type_formation)) ||
        ofppt.some((o) => hasText(o.niveau_formation)),
      clubs.some((c) => hasValue(c.inscrites_annee_1) || hasValue(c.inscrites_annee_2)) ||
        ofppt.some((o) => hasValue(o.inscrites_annee_1) || hasValue(o.inscrites_annee_2)),
    ]),

    // --- ÉTAPE 2 : Insertion & AGR ---
    countCompleted([
      laureates.length > 0 || agr.length > 0,
      laureates.some((l) => hasText(l.type_formation)) ||
        agr.some((a) => hasText(a.etablissement_id)),
      laureates.some((l) => hasValue(l.nombre_laureates) || hasValue(l.nombre_integrees)) ||
        agr.some((a) => hasValue(a.nombre_beneficiaires)),
      agr.some((a) => hasText(a.partenaires)), // Optionnel si on a que des lauréates, mais exigé si AGR
    ]),

    // --- ÉTAPE 3 : Sensibilisation & Portes Ouvertes ---
    countCompleted([
      sensi.length > 0 || portes.length > 0,
      sensi.some((s) => hasText(s.type_activite_id)) ||
        portes.some((p) => hasText(p.type_activite_id)),
      sensi.some((s) => hasText(s.sujet)) || portes.some((p) => hasText(p.contenu_activite)),
      sensi.some((s) => hasText(s.partenaires)) || portes.some((p) => hasText(p.partenaires)),
      sensi.some((s) => hasValue(s.benef_urbain) || hasValue(s.benef_rural)) ||
        portes.some((p) => hasValue(p.nombre_beneficiaires)),
    ]),

    // --- ÉTAPE 4 : Centres d'écoute ---
    countCompleted([
      ecoute.length > 0,
      ecoute.some((e) => hasText(e.etablissement_id)),
      ecoute.some((e) => hasText(e.type_soutien)),
      ecoute.some((e) => hasValue(e.nombre_seances)),
    ]),

    // --- ÉTAPE 5 : RH & Formations ---
    countCompleted([
      rh.length > 0 || cadres.length > 0,
      rh.some((r) => hasText(r.etablissement_id)) ||
        cadres.some((c) => hasText(c.domaine_formation)),
      rh.some((r) => hasText(r.type_rh)) || cadres.some((c) => hasValue(c.duree_valeur)),
      rh.some((r) => hasValue(r.nombre)) || cadres.some((c) => hasValue(c.nombre_cadres)),
    ]),

    // --- ÉTAPE 6 : Réseau ---
    countCompleted([reseau.length > 0, reseau.some((r) => hasText(r.type_mise_a_jour))]),

    // --- ÉTAPE 7 : Partenariats ---
    countCompleted([
      partenariats.length > 0,
      partenariats.some((p) => hasText(p.partenaires)),
      partenariats.some((p) => hasText(p.sujet_partenariat)),
      partenariats.some((p) => hasText(p.evaluation)),
      partenariats.some((p) => hasText(p.obstacles)),
      partenariats.some((p) => hasText(p.solutions_proposees)),
    ]),
  ];

  // Le moteur calcule le total de tous les points (sur 30 points logiques au lieu d'une moyenne de 7 étapes)
  return computeCompleteness(stepCompletions);
}
