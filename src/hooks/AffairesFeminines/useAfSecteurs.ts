import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface AfSecteur {
  id: string;
  nom_fr: string;
  nom_ar: string;
}

export function useAfSecteurs() {
  const [items, setItems] = useState<AfSecteur[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const fetchSecteurs = async () => {
      try {
        const { data, error } = await supabase.from('af_secteurs').select('*').order('nom_ar');
        if (error) throw error;
        if (!cancelled) setItems(data || []);
      } catch (err) {
        console.error('Erreur fetch secteurs:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchSecteurs();
    return () => { cancelled = true; };
  }, []);

  return { items, loading };
}