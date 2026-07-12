import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface CategorieAssociation {
  id: string;
  nom: string;
  nom_ar?: string;
}

export function useCategoriesAssociations() {
  const [items, setItems] = useState<CategorieAssociation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from('categories_associations')
        .select('id, nom, nom_ar');
      
      if (err) {
        setError(err.message);
        return;
      }
      
      setItems((data as CategorieAssociation[]) || []);
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
