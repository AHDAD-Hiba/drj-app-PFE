import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface TypePartenaire {
  id: string;
  nom: string;
  nom_ar?: string | null;
}

export function useTypesPartenaires() {
  const {
    data: items = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["ref_types_partenaires"],
    queryFn: async () => {
      const { data, error: err } = await supabase
        .from("types_partenaires")
        .select("id, nom, nom_ar")
        .order("nom", { ascending: true });

      if (err) throw err;
      return (data as TypePartenaire[]) || [];
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
