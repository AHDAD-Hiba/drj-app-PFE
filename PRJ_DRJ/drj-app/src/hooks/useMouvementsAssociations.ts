import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface MouvementAssociation {
  local_id: string;
  id?: string;
  nom_association: string;
  type_mouvement: 'entrante' | 'sortante';
  date_mouvement: string;
}

export function useMouvementsAssociations(rapportId: string | null) {
  const [items, setItems] = useState<MouvementAssociation[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const itemsRef = useRef<MouvementAssociation[]>([]);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  // ====================
  // Reload Logic
  // ====================
  const reload = useCallback(async (): Promise<MouvementAssociation[]> => {
    if (!rapportId) {
      setItems([]);
      return [];
    }

    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('mouvements_associations')
        .select('*')
        .eq('rapport_id', rapportId);

      if (error) {
        console.error('[useMouvementsAssociations] error:', error);
        return [];
      }

      const normalized: MouvementAssociation[] = (data || []).map((m) => ({
        local_id: crypto.randomUUID(),
        id: m.id,
        nom_association: m.nom_association || '',
        type_mouvement: m.type_mouvement || 'entrante',
        date_mouvement: m.date_mouvement || '',
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
  // CRUD Operations
  // ====================
  const add = useCallback(
    async (entry: MouvementAssociation): Promise<boolean> => {
      const local_id = entry.local_id || crypto.randomUUID();
      const optimisticItem = { ...entry, local_id };
      setItems((prev) => [...prev, optimisticItem]);

      if (!rapportId) return true;
      return true;
    },
    [rapportId]
  );

  const update = useCallback(
    async (
      local_id: string,
      patch: Partial<MouvementAssociation>
    ): Promise<boolean> => {
      const existing = itemsRef.current.find((item) => item.local_id === local_id);
      if (!existing) return false;

      const updatedEntry = { ...existing, ...patch };
      setItems((prev) =>
        prev.map((item) =>
          item.local_id === local_id ? updatedEntry : item
        )
      );

      if (!rapportId) return true;
      setIsSaving(true);

      try {
        const payload = {
          ...(updatedEntry.id ? { id: updatedEntry.id } : {}),
          rapport_id: rapportId,
          nom_association: updatedEntry.nom_association,
          type_mouvement: updatedEntry.type_mouvement,
          date_mouvement: updatedEntry.date_mouvement,
        };

        const { data, error } = await supabase
          .from('mouvements_associations')
          .upsert(payload, { onConflict: updatedEntry.id ? 'id' : 'rapport_id,nom_association,type_mouvement' })
          .select('id')
          .single();
        if (error) throw error;

        setItems((prev) =>
          prev.map((item) =>
            item.local_id === local_id ? { ...updatedEntry, id: data.id } : item
          )
        );
        return true;
      } catch (error) {
        console.error('[useMouvementsAssociations] update error:', error);
        return false;
      } finally {
        setIsSaving(false);
      }
    },
    [rapportId]
  );

  const remove = useCallback(
    async (local_id: string): Promise<boolean> => {
      const existing = itemsRef.current.find((item) => item.local_id === local_id);
      if (!existing) return false;

      setItems((prev) => prev.filter((item) => item.local_id !== local_id));
      if (!rapportId) return true;

      try {
        if (existing.id) {
          await supabase
            .from('mouvements_associations')
            .delete()
            .eq('id', existing.id);
        }
        return true;
      } catch (error) {
        console.error('[useMouvementsAssociations] remove error:', error);
        return false;
      }
    },
    [rapportId]
  );

  return { items, loading, isSaving, reload, add, update, remove };
}
