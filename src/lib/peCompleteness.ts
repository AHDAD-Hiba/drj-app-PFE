import { computeCompleteness, countCompleted, hasText } from "@/lib/formSchema";

export interface PeCompletenessData {
  demoCentres: any[];
  demoLS: any[];
  education: any[];
  ateliers: any[];
  formationBen: any[];
  activites: any[];
  conseil: any[];
  dons: any[];
  incidents: any[];
  partenariats: any[];
  formationPerso: any[];
  amenagement: any[];
  visites: any[];
  rapportsJudic: any[];
}

// Helper local pour accepter le "0" comme valeur valide
const hasValue = (val: any): boolean => val !== undefined && val !== null && val !== "";

export function computePeCompleteness(data: PeCompletenessData): number {
  const {
    demoCentres = [],
    demoLS = [],
    education = [],
    ateliers = [],
    formationBen = [],
    activites = [],
    conseil = [],
    dons = [],
    incidents = [],
    partenariats = [],
    formationPerso = [],
    amenagement = [],
    visites = [],
    rapportsJudic = [],
  } = data;

  const stepCompletions = [
    // --- ÉTAPE 1: Scolarisation & Formation (المراكز) ---
    countCompleted([
      demoCentres.length > 0 ||
        education.length > 0 ||
        ateliers.length > 0 ||
        formationBen.length > 0, // Au moins une donnée
      demoCentres.some((d) => hasValue(d.garcons)),
      demoCentres.some((d) => hasValue(d.filles)),
      education.some((e) => hasValue(e.beneficiaires_formel)),
      education.some((e) => hasValue(e.beneficiaires_non_formel)),
      ateliers.some((a) => hasText(a.nom_atelier)),
      ateliers.some((a) => hasValue(a.nombre)),
      formationBen.some((f) => hasValue(f.beneficiaires_intra)),
      formationBen.some((f) => hasValue(f.beneficiaires_extra)),
    ]),

    // --- ÉTAPE 2: Animation & Vie Quotidienne ---
    countCompleted([
      activites.length > 0 || conseil.length > 0 || dons.length > 0 || incidents.length > 0,
      activites.some((a) => hasText(a.domaine_id)),
      activites.some((a) => hasText(a.nom_activite)),
      activites.some((a) => hasValue(a.nombre_beneficiaires)),
      conseil.some((c) => hasText(c.nom_session)),
      conseil.some((c) => hasText(c.date_session)),
      dons.some((d) => hasText(d.donateur)),
      dons.some((d) => hasText(d.nature_don)),
      incidents.some((i) => hasText(i.type_incident_id)),
      incidents.some((i) => hasText(i.sujet_detaille)),
    ]),

    // --- ÉTAPE 3: Gestion & Encadrement RH ---
    countCompleted([
      partenariats.length > 0 ||
        formationPerso.length > 0 ||
        amenagement.length > 0 ||
        visites.length > 0,
      partenariats.some((p) => hasText(p.type_partenariat)),
      partenariats.some((p) => hasText(p.sujet)),
      partenariats.some((p) => hasText(p.partenaires)),
      formationPerso.some((f) => hasText(f.cible)),
      formationPerso.some((f) => hasText(f.theme_formation)),
      formationPerso.some((f) => hasValue(f.nombre_beneficiaires)),
      amenagement.some((a) => hasText(a.etablissement_id)),
      visites.some((v) => hasText(v.entite_visiteuse)),
      visites.some((v) => hasText(v.date_visite)),
    ]),

    // --- ÉTAPE 4: Liberté Surveillée ---
    countCompleted([
      demoLS.length > 0 || rapportsJudic.length > 0,
      demoLS.some((d) => hasValue(d.garcons)),
      demoLS.some((d) => hasValue(d.filles)),
      demoLS.some((d) => hasValue(d.ls_integres_enseignement)),
      demoLS.some((d) => hasValue(d.ls_integres_formation_pro)),
      demoLS.some((d) => hasValue(d.ls_integres_apprentissage)),
      demoLS.some((d) => hasValue(d.ls_integres_activites_durables)),
      rapportsJudic.some((r) => hasValue(r.nombre_rapports)),
    ]),
  ];

  return computeCompleteness(stepCompletions);
}
