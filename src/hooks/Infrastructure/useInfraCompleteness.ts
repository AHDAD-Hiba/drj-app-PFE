import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { computeInfraCompleteness } from '@/lib/infraCompleteness';

export function useInfraCompleteness(rapportId: string | null, refreshTrigger?: number) {
  const [globalPercentage, setGlobalPercentage] = useState<number>(0);

  const calculate = useCallback(async () => {
    if (!rapportId) {
      setGlobalPercentage(0);
      return;
    }

    try {
      // 1. Récupération des données depuis Supabase
      const [
        depensesRes,
        eauElecRes,
        partenariatsRes,
        btpRes,
        souffranceRes
      ] = await Promise.all([
        supabase.from('infra_depenses').select('*').eq('rapport_id', rapportId),
        supabase.from('infra_eau_electricite').select('*').eq('rapport_id', rapportId),
        supabase.from('infra_projets_partenariat').select('*').eq('rapport_id', rapportId),
        supabase.from('infra_projets_btp').select('*').eq('rapport_id', rapportId),
        supabase.from('infra_projets_en_souffrance').select('*').eq('rapport_id', rapportId),
      ]);

      // 2. Injection dans la fonction pure
      const score = computeInfraCompleteness({
        depenses: depensesRes.data || [],
        eauElec: eauElecRes.data || [],
        partenariats: partenariatsRes.data || [],
        btp: btpRes.data || [],
        souffrance: souffranceRes.data || []
      });

      // 3. Mise à jour du state
      setGlobalPercentage(score);

    } catch (err) {
      console.error('Erreur lors du calcul de complétude Infra:', err);
    }
  }, [rapportId]);

  useEffect(() => {
    void calculate();
  }, [calculate, refreshTrigger]);

  return globalPercentage;
}