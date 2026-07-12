import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface MouvementAssociation {
  local_id: string;
  id?: string;
  nom_association: string;
  type_mouvement: 'entrante' | 'sortante';
  date_mouvement: string;
  beneficiaires: number | string;
}

export function useMouvementsAssociations(rapportId: string | null) {
  const [items, setItems] = useState<MouvementAssociation[]>([]);
  const [loading, setLoading] = useState(false);
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
        beneficiaires: m.beneficiaires ?? '',
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

  const updateLocal = useCallback(
    (
      local_id: string,
      patch: Partial<MouvementAssociation>
    ) => {
      setItems(prev =>
        prev.map(item =>
          item.local_id === local_id
            ? { ...item, ...patch }
            : item
        )
      );
    },
    []
  );

  const saveTimersRef = useRef<
    Record<string, ReturnType<typeof setTimeout>>
  >({});

  const savingEntriesRef = useRef<Set<string>>(new Set());

  const saveEntry = useCallback(
    async (local_id: string): Promise<boolean> => {

      if (savingEntriesRef.current.has(local_id)) {
        return true;
      }

      savingEntriesRef.current.add(local_id);

      const entry = itemsRef.current.find(
          x => x.local_id === local_id
        );

      if (!entry) {
        return true;
      }

      if (!rapportId) {
        return true;
      }

      // skip empty rows
      if (!entry.nom_association.trim()) {
        return true;
      }
      

      try {
        const payload = {
          ...(entry.id ? { id: entry.id } : {}),
          rapport_id: rapportId,
          nom_association: entry.nom_association,
          type_mouvement: entry.type_mouvement,
          date_mouvement: entry.date_mouvement,
          beneficiaires: entry.beneficiaires === '' ? null : Number(entry.beneficiaires),
        };

        const { data, error } = await supabase
          .from('mouvements_associations')
          .upsert(
            payload,
            {
              onConflict: 'id',
            }
          )
          .select('id')
          .single();

        if (error) throw error;

        setItems(prev =>
          prev.map(item =>
            item.local_id === local_id
              ? {
                  ...item,
                  id: data.id,
                }
              : item
          )
        );

        return true;

      } catch (error) {

        console.error(
          '[useMouvementsAssociations] save error:',
          error
        );

        return false;

      } finally {

        savingEntriesRef.current.delete(local_id);

      }
    },
    [rapportId]
  );

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

      updateLocal(local_id, patch);

      if (saveTimersRef.current[local_id]) {
        clearTimeout(
          saveTimersRef.current[local_id]
        );
      }

      saveTimersRef.current[local_id] =
        setTimeout(() => {

          delete saveTimersRef.current[local_id];

          void saveEntry(local_id);

        }, 1500);

      return true;
    },
    [updateLocal, saveEntry]
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

  return { items, loading, reload, add, update, remove };
}
