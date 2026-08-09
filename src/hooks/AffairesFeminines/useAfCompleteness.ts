import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { computeAfCompleteness } from '@/lib/afCompleteness';

export function useAfCompleteness(rapportId: string | null, refreshTrigger?: number) {
  const [globalPercentage, setGlobalPercentage] = useState<number>(0);

  const calculate = useCallback(async () => {
    if (!rapportId) {
      setGlobalPercentage(0);
      return;
    }

    try {
      // 1. Récupération des données depuis Supabase
      const [
        clubsRes, ofpptRes, laureatesRes, agrRes,
        sensiRes, portesRes, ecouteRes, rhRes, cadresRes,
        reseauRes, partenariatsRes
      ] = await Promise.all([
        supabase.from('af_inscriptions_clubs').select('*').eq('rapport_id', rapportId),
        supabase.from('af_inscriptions_ofppt').select('*').eq('rapport_id', rapportId),
        supabase.from('af_integration_laureates').select('*').eq('rapport_id', rapportId),
        supabase.from('af_activites_generatrices_revenus').select('*').eq('rapport_id', rapportId),
        supabase.from('af_activites_sensibilisation').select('*').eq('rapport_id', rapportId),
        supabase.from('af_portes_ouvertes').select('*').eq('rapport_id', rapportId),
        supabase.from('af_centres_ecoute').select('*').eq('rapport_id', rapportId),
        supabase.from('af_ressources_humaines').select('*').eq('rapport_id', rapportId),
        supabase.from('af_formation_cadres').select('*').eq('rapport_id', rapportId),
        supabase.from('af_mise_a_jour_reseau').select('*').eq('rapport_id', rapportId),
        supabase.from('af_suivi_partenariats').select('*').eq('rapport_id', rapportId),
      ]);

      // 2. Injection des données dans la fonction pure
      const score = computeAfCompleteness({
        clubs: clubsRes.data || [],
        ofppt: ofpptRes.data || [],
        laureates: laureatesRes.data || [],
        agr: agrRes.data || [],
        sensi: sensiRes.data || [],
        portes: portesRes.data || [],
        ecoute: ecouteRes.data || [],
        rh: rhRes.data || [],
        cadres: cadresRes.data || [],
        reseau: reseauRes.data || [],
        partenariats: partenariatsRes.data || []
      });

      // 3. Mise à jour de l'état
      setGlobalPercentage(score);

    } catch (err) {
      console.error('Erreur lors du calcul de complétude AF:', err);
    }
  }, [rapportId]);

  useEffect(() => {
    void calculate();
  }, [calculate, refreshTrigger]);

  return globalPercentage;
}