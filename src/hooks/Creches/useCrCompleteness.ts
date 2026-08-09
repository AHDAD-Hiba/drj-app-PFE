import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { computeCrCompleteness } from '@/lib/crCompleteness';

export function useCrCompleteness(rapportId: string | null, refreshTrigger?: number) {
  const [globalPercentage, setGlobalPercentage] = useState<number>(0);

  const calculate = useCallback(async () => {
    if (!rapportId) {
      setGlobalPercentage(0);
      return;
    }

    try {
      // 1. Récupération des données depuis Supabase
      const [
        demandesRes, traitementRes,
        statsInfraRes, mouvementsRes, partenariatsRes, controleRes, cadresRes, labelRes,
        statsEnfantsRes, activitesRes, formationsRes,
        analysesRes, sondagesRes
      ] = await Promise.all([
        supabase.from('cr_demandes_licences').select('*').eq('rapport_id', rapportId),
        supabase.from('cr_traitement_licences').select('*').eq('rapport_id', rapportId),
        supabase.from('cr_stats_infrastructures').select('*').eq('rapport_id', rapportId),
        supabase.from('cr_mouvements_fermetures').select('*').eq('rapport_id', rapportId),
        supabase.from('cr_partenariats_conventions').select('*').eq('rapport_id', rapportId),
        supabase.from('cr_controle_creches').select('*').eq('rapport_id', rapportId),
        supabase.from('cr_cadres_assermentes').select('*').eq('rapport_id', rapportId),
        supabase.from('cr_label_qualite').select('*').eq('rapport_id', rapportId),
        supabase.from('cr_statistiques_enfants').select('*').eq('rapport_id', rapportId),
        supabase.from('cr_activites_enfants').select('*').eq('rapport_id', rapportId),
        supabase.from('cr_formations_cadres').select('*').eq('rapport_id', rapportId),
        supabase.from('cr_analyses_ponctuelles').select('*').eq('rapport_id', rapportId),
        supabase.from('cr_sondages_etudes').select('*').eq('rapport_id', rapportId),
      ]);

      // 2. Injection des données dans la fonction pure
      const score = computeCrCompleteness({
        demandes: demandesRes.data || [],
        traitement: traitementRes.data || [],
        statsInfra: statsInfraRes.data || [],
        mouvements: mouvementsRes.data || [],
        partenariats: partenariatsRes.data || [],
        controle: controleRes.data || [],
        cadres: cadresRes.data || [],
        label: labelRes.data || [],
        statsEnfants: statsEnfantsRes.data || [],
        activites: activitesRes.data || [],
        formations: formationsRes.data || [],
        analyses: analysesRes.data || [],
        sondages: sondagesRes.data || []
      });

      // 3. Mise à jour de l'état
      setGlobalPercentage(score);

    } catch (err) {
      console.error('Erreur lors du calcul de complétude Crèches:', err);
    }
  }, [rapportId]);

  useEffect(() => {
    void calculate();
  }, [calculate, refreshTrigger]);

  return globalPercentage;
}