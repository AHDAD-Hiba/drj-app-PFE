import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface NiveauFormation {
  id: string;
  nom: string;
  nom_ar?: string;
}

export function useNiveauxFormation() {
  const { data: items = [], isLoading, error, refetch } = useQuery({
    queryKey: ['ref_niveaux_formation'],
    queryFn: async () => {
      const { data, error: err } = await supabase
        .from('niveaux_formation')
        .select('id, nom, nom_ar');

      if (err) throw err;
      return (data as NiveauFormation[]) || [];
    },
    staleTime: Infinity,
    gcTime: 1000 * 60 * 60 * 24,
    refetchOnWindowFocus: false,
  });

  return {
    items,
    loading: isLoading,
    error: error ? (error as Error).message : null,
    reload: refetch,
  };
}