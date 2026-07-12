import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Programme {
  id: string;
  nom: string;
  nom_ar?: string;
}

export function useProgrammesCamping() {
  const [items, setItems] = useState<Programme[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from('programmes_camping')
        .select('id, nom, nom_ar');
      
      if (err) {
        setError(err.message);
        return;
      }
      
      setItems((data as Programme[]) || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    reload();
  }, []);

  return { items, loading, error, reload };
}
