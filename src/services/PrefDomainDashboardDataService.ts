import { supabase } from "@/integrations/supabase/client";

// --- Service dédié à PrefDomainDashboard ---
// Aucune dépendance vers DirectionDetail (ni composants, ni types partagés).
// Seule la fonction loadDashboard() est exposée ; tout le reste est privé à ce module.

// --- Requêtes par section (privées) ---

const loadSection1 = async (directionId: string, year: number, domaineId?: string) => {
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

const loadSection2 = async (directionId: string, year: number) => {
  const { data } = await supabase
    .from("v_dashboard_pref_section2_annuel")
    .select("*")
    .eq("direction_id", directionId)
    .eq("annee", year)
    .maybeSingle();
  return data;
};

const loadSection3 = async (directionId: string, year: number) => {
  const { data } = await supabase
    .from("v_dashboard_pref_section3_annuel")
    .select("*")
    .eq("direction_id", directionId)
    .eq("annee", year);
  return data;
};

const loadSection4 = async (directionId: string, year: number) => {
  const { data } = await supabase
    .from("v_dashboard_pref_section4")
    .select("*")
    .eq("direction_id", directionId)
    .eq("annee", year);
  return data;
};

const loadSection5 = async (directionId: string, year: number) => {
  const { data } = await supabase
    .from("v_dashboard_pref_section5_annuel")
    .select("*")
    .eq("direction_id", directionId)
    .eq("annee", year)
    .maybeSingle();
  return data;
};

const loadSection6 = async (directionId: string, year: number) => {
  const { data } = await supabase
    .from("v_dashboard_pref_section6_annuel")
    .select("*")
    .eq("direction_id", directionId)
    .eq("annee", year)
    .maybeSingle();
  return data;
};

// --- Fonctions de transformation (privées) ---

const formatEvolutionData = (dataArray: any[]) => {
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

const formatBenchmarkData = (data: any) => {
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

const mapSection6Data = (data: any) => {
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

// --- Fonction unique exposée ---

export const loadDashboard = async (
  directionId: string,
  year: number,
  domaineId?: string
) => {
  // 1. Chercher si au moins un rapport existe pour cette année et cette direction
  const { data: rapport } = await supabase
    .from("rapports")
    .select("id, statut_rapport, commentaire_correction")
    .eq("direction_id", directionId)
    .eq("annee", year)
    .limit(1)
    .maybeSingle();

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
      repartition: [],
      evolution: formatEvolutionData([]),
      benchmark: formatBenchmarkData(null),
      detailed: mapSection6Data(null),
    };
  }

  // 3. Si des rapports existent pour l'année, on charge les vues YTD (Year-To-Date)
  const [section1, section2, section3, section4, section5, section6] = await Promise.all([
    loadSection1(directionId, year, domaineId),
    loadSection2(directionId, year),
    loadSection3(directionId, year),
    loadSection4(directionId, year),
    loadSection5(directionId, year),
    loadSection6(directionId, year),
  ]);

  // 4. On retourne les vraies données
  return {
    status: {
      workflowStatus: section1?.statut || "NON_COMMENCE",
      progressPct: section1?.progression_pourcentage || 0,
      lastUpdated: section1?.derniere_mise_a_jour,
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
    repartition: section3 || [],
    evolution: formatEvolutionData(section4),
    benchmark: formatBenchmarkData(section5),
    detailed: mapSection6Data(section6),
  };
};
