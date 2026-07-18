import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface AfTypeActivite {
  id: string;
  nom_fr: string;
  nom_ar: string;
}

export function useAfTypesActivite() {
  const [items, setItems] = useState<AfTypeActivite[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const fetchTypes = async () => {
      try {
        const { data, error } = await supabase.from('af_types_activite').select('*').order('nom_ar');
        if (error) throw error;
        if (!cancelled) setItems(data || []);
      } catch (err) {
        console.error('Erreur fetch types activite:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchTypes();
    return () => { cancelled = true; };
  }, []);

  return { items, loading };
}