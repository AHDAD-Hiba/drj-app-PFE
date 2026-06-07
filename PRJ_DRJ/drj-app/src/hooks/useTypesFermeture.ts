import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

export interface TypeFermeture {
  id: string;
  nom: string;
  nom_ar?: string | null;
}

export function useTypesFermeture() {
  const [items, setItems] = useState<TypeFermeture[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);

    const { count, error: countError } = await supabase
      .from('types_fermeture')
      .select('*', { count: 'exact', head: true });


    try {
      const { data, error } = await supabase
        .from('types_fermeture')
        .select('*')
        .order('nom', { ascending: true });

      if (error) {
        console.error('[useTypesFermeture] load error:', error);
        setError(error.message ?? String(error));
        setItems([]);
        return;
      }

      const rows = (data as Database['public']['Tables']['types_fermeture']['Row'][] ) ?? [];
      setItems(rows.map((r) => ({ id: r.id, nom: r.nom })));
    } catch (err: any) {
      console.error('[useTypesFermeture] unexpected error:', err);
      setError(err?.message ?? String(err));
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (cancelled) return;
      await reload();
    })();
    return () => { cancelled = true; };
  }, [reload]);

  return { items, loading, error, reload } as const;
}
