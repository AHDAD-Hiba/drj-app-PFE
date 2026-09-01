import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface AfSecteur {
  id: string;
  nom_fr: string;
  nom_ar: string;
}

export function useAfSecteurs() {
  const {
    data: items = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["ref_af_secteurs"],
    queryFn: async () => {
      const { data, error: err } = await supabase.from("af_secteurs").select("*").order("nom_ar");

      if (err) throw err;
      return (data as AfSecteur[]) || [];
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
