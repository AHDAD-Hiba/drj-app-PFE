import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Domaine {
  id: string;
  code: string;
  nom_fr: string;
  nom_ar: string;
}

export const useDomaines = () => {
  const {
    data: domaines = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["ref_domaines"],
    queryFn: async () => {
      const { data, error: err } = await supabase
        .from("domaines")
        .select("id, code, nom_fr, nom_ar")
        .order("code", { ascending: true });

      if (err) throw err;
      return (data as Domaine[]) || [];
    },
    staleTime: Infinity, // Garde en mémoire RAM indéfiniment
    gcTime: 1000 * 60 * 60 * 24, // Rétention de 24h
    refetchOnWindowFocus: false,
  });

  return {
    domaines,
    items: domaines,
    loading: isLoading,
    error: error ? (error as Error).message : null,
    reload: refetch,
  };
};
