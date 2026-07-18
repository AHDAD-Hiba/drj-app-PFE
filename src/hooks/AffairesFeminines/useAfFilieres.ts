import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface AfFiliere {
  id: string;
  secteur_id: string;
  nom_fr: string;
  nom_ar: string;
}

export function useAfFilieres() {
  const [items, setItems] = useState<AfFiliere[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const fetchFilieres = async () => {
      try {
        const { data, error } = await supabase.from('af_filieres').select('*').order('nom_ar');
        if (error) throw error;
        if (!cancelled) setItems(data || []);
      } catch (err) {
        console.error('Erreur fetch filieres:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchFilieres();
    return () => { cancelled = true; };
  }, []);

  return { items, loading };
}