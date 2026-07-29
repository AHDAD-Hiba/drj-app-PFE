import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Etablissement {
  id: string;
  nom: string;
  type_etablissement: string | null; // Utiliser string permet de gérer dynamiquement n'importe quel nouvel type de la BDD
  est_actif: boolean | null;
  direction_id: string | null;
}

export function useAfEtablissements(directionId?: string | null) {
  const [items, setItems] = useState<Etablissement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!directionId) {
      setItems([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    const fetchEtablissements = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('etablissements')
          .select('*')
          .eq('est_actif', true)
          .eq('direction_id', directionId)
          .order('nom');
          
        if (error) throw error;
        if (!cancelled) setItems((data as Etablissement[]) || []);
      } catch (err) {
        console.error('Erreur fetch etablissements:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchEtablissements();
    return () => { cancelled = true; };
  }, [directionId]);

  // EXTRACTION DYNAMIQUE : Récupère les types uniques présents dans la BDD
  const typesDisponibles = useMemo(() => {
    const types = new Set(
      items
        .map((e) => e.type_etablissement)
        .filter((t): t is string => Boolean(t))
    );
    return Array.from(types);
  }, [items]);

  return { items, loading, typesDisponibles };
}