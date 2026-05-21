import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface AssociationValue {
  local_id: string;
  id?: string;
  categorie_association_id: string;
  nombre_associations: number;
}

interface AssociationValueRow {
  id: string;
  rapport_id: string;
  categorie_association_id: string;
  nombre_associations: number;
}

export function useAssociationValues(rapportId: string | null) {
  const [items, setItems] = useState<AssociationValue[]>([]);
  const [loading, setLoading] = useState(false);
  const itemsRef = useRef<AssociationValue[]>([]);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  // ====================
  // Reload Logic
  // ====================
  const reload = useCallback(async (): Promise<AssociationValue[]> => {
    if (!rapportId) {
      setItems([]);
      return [];
    }

    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('valeurs_associations')
        .select('*')
        .eq('rapport_id', rapportId);

      if (error) {
        console.error('[useAssociationValues] error:', error);
        return [];
      }

      const normalized: AssociationValue[] = (data as AssociationValueRow[] || []).map((v) => ({
        local_id: crypto.randomUUID(),
        id: v.id,
        categorie_association_id: v.categorie_association_id,
        nombre_associations: v.nombre_associations || 0,
      }));

      setItems(normalized);
      return normalized;
    } finally {
      setLoading(false);
    }
  }, [rapportId]);

  useEffect(() => {
    let cancelled = false;
    if (!rapportId) {
      setItems([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    (async () => {
      try {
        if (!cancelled) await reload();
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [rapportId, reload]);

  // ====================
  // Update Logic
  // ====================
  const update = useCallback(
    async (
      local_id: string,
      patch: Partial<AssociationValue>
    ): Promise<boolean> => {
      let existing = itemsRef.current.find((item) => item.local_id === local_id);
      
      // Si l'item n'existe pas et local_id est temporaire, créer un nouvel item
      if (!existing && local_id.startsWith('temp-')) {
        const newItem: AssociationValue = {
          local_id,
          categorie_association_id: patch.categorie_association_id || '',
          nombre_associations: patch.nombre_associations || 0,
        };
        setItems((prev) => [...prev, newItem]);
        existing = newItem;
      }
      
      if (!existing) return false;

      const updatedEntry = { ...existing, ...patch };
      
      // Si la valeur devient 0, supprimer de la base ou simplement oublier localement
      if (updatedEntry.nombre_associations === 0) {
        // Si on a un ID, supprimer de la base
        if (updatedEntry.id && rapportId) {
          try {
            await supabase
              .from('valeurs_associations')
              .delete()
              .eq('id', updatedEntry.id);
            
            setItems((prev) =>
              prev.filter((item) => item.local_id !== local_id)
            );
            return true;
          } catch (error) {
            console.error('[useAssociationValues] delete error:', error);
            return false;
          }
        } else {
          // Pas d'ID en base, juste le supprimer localement
          setItems((prev) =>
            prev.filter((item) => item.local_id !== local_id)
          );
          return true;
        }
      }

      // Sinon, mettre à jour localement
      setItems((prev) =>
        prev.map((item) =>
          item.local_id === local_id ? updatedEntry : item
        )
      );

      if (!rapportId) return true;

      try {
        const payload = {
          rapport_id: rapportId,
          categorie_association_id: updatedEntry.categorie_association_id,
          nombre_associations: updatedEntry.nombre_associations,
        };

        const { data, error } = await supabase
          .from('valeurs_associations')
          .upsert(payload, {
            onConflict: 'rapport_id,categorie_association_id',
          })
          .select('id')
          .single();

        if (error) throw error;

        const valId = data.id;

        setItems((prev) =>
          prev.map((item) =>
            item.local_id === local_id ? { ...updatedEntry, id: valId } : item
          )
        );
        return true;
      } catch (error) {
        console.error('[useAssociationValues] update error:', error);
        return false;
      }
    },
    [rapportId]
  );

  return { items, loading, reload, update };
}
