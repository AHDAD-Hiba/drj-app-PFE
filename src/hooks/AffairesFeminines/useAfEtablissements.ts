import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Etablissement {
  id: string;
  nom: string;
  type_etablissement: 'maison_jeunes' | 'club_feminin' | 'ofppt' | null;
  est_actif: boolean | null;
  direction_id: string | null;
}

export function useAfEtablissements() {
  const [items, setItems] = useState<Etablissement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const fetchEtablissements = async () => {
      try {
        // On ne récupère que les établissements actifs
        const { data, error } = await supabase
          .from('etablissements')
          .select('*')
          .eq('est_actif', true)
          .order('nom');
          
        if (error) throw error;
        if (!cancelled) setItems(data || []);
      } catch (err) {
        console.error('Erreur fetch etablissements:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchEtablissements();
    return () => { cancelled = true; };
  }, []);

  return { items, loading };
}