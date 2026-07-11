import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Domaine {
  id: string;
  code: string; // ex: 'jeunesse', 'femme'
  nom_fr: string;
  nom_ar: string;
}

export const useDomaines = () => {
  const [domaines, setDomaines] = useState<Domaine[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDomaines = async () => {
      const { data, error } = await supabase
        .from('domaines')
        .select('id, code, nom_fr, nom_ar');

      if (!error && data) {
        setDomaines(data);
      }
      setLoading(false);
    };

    fetchDomaines();
  }, []);

  return { domaines, loading };
};