import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * PRIORITÉ 1: Élimine 12 doublons dans les wizard steps
 * 
 * Les 12 wizard steps (ProtectionEnfance, AffairesFeminines, etc.) 
 * font TOUS cette requête au montage:
 *   rapports.select('direction_id').eq('id', rapportId).single()
 * 
 * Solution: Cache partagé — une requête pour tous les steps
 */
export const useRapportDirection = (rapportId: string) => {
  return useQuery({
    queryKey: ['rapport-direction', rapportId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rapports')
        .select('direction_id')
        .eq('id', rapportId)
        .single();

      if (error) throw error;
      return data;
    },
    staleTime: 10 * 60 * 1000, // 10 min — rapport ne change pas de direction
    gcTime: 30 * 60 * 1000,    // 30 min garbage collect
    enabled: !!rapportId,      // Ne fetch que si rapportId existe
  });
};

/**
 * PRIORITÉ 2: Élimine doublons dashboard
 * 
 * Services dashboard (AffairesFeminines, ProtectionEnfance, etc.)
 * font tous:
 *   rapports.select("id, statut_rapport, commentaire_correction, trimestre")
 *           .eq("direction_id", directionId)
 *           .eq("annee", year)
 *           .order("trimestre", desc)
 */
export const useRapportsByDirectionYear = (directionId: string, year: number) => {
  return useQuery({
    queryKey: ['rapports', 'direction-year', directionId, year],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rapports')
        .select('id, statut_rapport, commentaire_correction, trimestre')
        .eq('direction_id', directionId)
        .eq('annee', year)
        .order('trimestre', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    staleTime: 5 * 60 * 1000,  // 5 min — statut peut changer pendant validation
    gcTime: 15 * 60 * 1000,
    enabled: !!directionId && !!year,
  });
};

/**
 * BONUS: Rapport complet par ID
 * Utile pour Saisie.tsx qui affiche tout un rapport
 */
export const useRapportById = (rapportId: string) => {
  return useQuery({
    queryKey: ['rapport', rapportId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rapports')
        .select('*')
        .eq('id', rapportId)
        .single();

      if (error) throw error;
      return data;
    },
    staleTime: 2 * 60 * 1000,  // 2 min — contenu du rapport change souvent
    gcTime: 10 * 60 * 1000,
    enabled: !!rapportId,
  });
};

/**
 * Rapports par année (pour RegionMapPage + Directions)
 * Élimine le doublon entre 2 fichiers
 */
export const useRapportsByYear = (year: number) => {
  return useQuery({
    queryKey: ['rapports', 'year', year],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rapports')
        .select('*')
        .eq('annee', year)
        .order('trimestre', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    enabled: !!year,
  });
};

/**
 * Rapports par période (année + trimestre)
 * Utilisé pour suivi régional/validation
 */
export const useRapportsByPeriod = (year: number, quarter: number) => {
  return useQuery({
    queryKey: ['rapports', 'period', year, quarter],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rapports')
        .select('*')
        .eq('annee', year)
        .eq('trimestre', `t${quarter}` as "t1" | "t2" | "t3" | "t4");

      if (error) throw error;
      return data || [];
    },
    staleTime: 2 * 60 * 1000,  // Raffraîchir plus souvent
    gcTime: 10 * 60 * 1000,
    enabled: !!year && !!quarter,
  });
};
