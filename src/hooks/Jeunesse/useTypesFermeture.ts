import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface TypeFermeture {
  id: string;
  nom: string;
  nom_ar?: string | null;
}

export function useTypesFermeture() {
  const { data: items = [], isLoading, error, refetch } = useQuery({
    queryKey: ['ref_types_fermeture'],
    queryFn: async () => {
      const { data, error: err } = await supabase
        .from('types_fermeture')
        .select('id, nom, nom_ar')
        .order('nom', { ascending: true });

      if (err) throw err;
      return (data as TypeFermeture[]) || [];
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