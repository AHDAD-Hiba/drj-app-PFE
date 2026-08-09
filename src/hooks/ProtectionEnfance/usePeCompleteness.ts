import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { computePeCompleteness } from '@/lib/peCompleteness'; // 👈 Import de la nouvelle fonction pure

export function usePeCompleteness(rapportId: string | null, refreshTrigger?: number) {
  const [globalPercentage, setGlobalPercentage] = useState<number>(0);

  const calculate = useCallback(async () => {
    if (!rapportId) {
      setGlobalPercentage(0);
      return;
    }

    try {
      // 1. Récupération des données depuis Supabase
      const [
        demographieRes,       // pe_statistiques_demographiques
        educationRes,         // pe_education
        ateliersRes,          // pe_ateliers_crees
        formationBenRes,      // pe_formation_beneficiaires
        activitesRes,         // pe_activites
        conseilRes,           // pe_conseil_enfant
        donsRes,              // pe_dons
        incidentsRes,         // pe_rapports_exceptionnels
        partenariatsRes,      // pe_partenariats
        formationPersoRes,    // pe_formation_personnel
        amenagementRes,       // pe_amenagement_equipement
        visitesRes,           // pe_visites_officielles
        rapportsJudicRes      // pe_rapports_judiciaires
      ] = await Promise.all([
        supabase.from('pe_statistiques_demographiques').select('*').eq('rapport_id', rapportId),
        supabase.from('pe_education').select('*').eq('rapport_id', rapportId),
        supabase.from('pe_ateliers_crees').select('*').eq('rapport_id', rapportId),
        supabase.from('pe_formation_beneficiaires').select('*').eq('rapport_id', rapportId),
        supabase.from('pe_activites').select('*').eq('rapport_id', rapportId),
        supabase.from('pe_conseil_enfant').select('*').eq('rapport_id', rapportId),
        supabase.from('pe_dons').select('*').eq('rapport_id', rapportId),
        supabase.from('pe_rapports_exceptionnels').select('*').eq('rapport_id', rapportId),
        supabase.from('pe_partenariats').select('*').eq('rapport_id', rapportId),
        supabase.from('pe_formation_personnel').select('*').eq('rapport_id', rapportId),
        supabase.from('pe_amenagement_equipement').select('*').eq('rapport_id', rapportId),
        supabase.from('pe_visites_officielles').select('*').eq('rapport_id', rapportId),
        supabase.from('pe_rapports_judiciaires').select('*').eq('rapport_id', rapportId),
      ]);

      // Séparation des données démographiques (Centres vs Liberté Surveillée)
      const demographieData = demographieRes.data || [];
      const demoCentres = demographieData.filter(d => d.type_prise_charge === 'centre_sauvegarde');
      const demoLS = demographieData.filter(d => d.type_prise_charge === 'liberte_surveillee');

      // 2. Injection des données dans la fonction pure
      const score = computePeCompleteness({
        demoCentres,
        demoLS,
        education: educationRes.data || [],
        ateliers: ateliersRes.data || [],
        formationBen: formationBenRes.data || [],
        activites: activitesRes.data || [],
        conseil: conseilRes.data || [],
        dons: donsRes.data || [],
        incidents: incidentsRes.data || [],
        partenariats: partenariatsRes.data || [],
        formationPerso: formationPersoRes.data || [],
        amenagement: amenagementRes.data || [],
        visites: visitesRes.data || [],
        rapportsJudic: rapportsJudicRes.data || []
      });

      // 3. Mise à jour de l'état
      setGlobalPercentage(score);

    } catch (err) {
      console.error('Erreur lors du calcul de complétude Protection Enfance:', err);
    }
  }, [rapportId]);

  useEffect(() => {
    void calculate();
  }, [calculate, refreshTrigger]);

  return globalPercentage;
}