import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Programme {
  id: string;
  nom: string;
  nom_ar?: string;
}

export function useProgrammesCamping() {
  const { data: items = [], isLoading, error, refetch } = useQuery({
    queryKey: ['ref_programmes_camping'],
    queryFn: async () => {
      const { data, error: err } = await supabase
        .from('programmes_camping')
        .select('id, nom, nom_ar');

      if (err) throw err;
      return (data as Programme[]) || [];
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