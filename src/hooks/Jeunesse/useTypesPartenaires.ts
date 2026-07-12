import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

export interface TypePartenaire {
  id: string;
  nom: string;
  nom_ar?: string | null;
}

export function useTypesPartenaires() {
  const [items, setItems] = useState<TypePartenaire[]>([]);
  const [loading, setLoading] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('types_partenaires')
        .select('id, nom, nom_ar')
        .order('nom', { ascending: true });

      if (error) {
        console.error('[useTypesPartenaires] load error:', error);
        setItems([]);
        return;
      }

      setItems((data ?? []) as TypePartenaire[]);
    } catch (err) {
      console.error('[useTypesPartenaires] unexpected error:', err);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return {
    items,
    loading,
    reload,
  };
}
