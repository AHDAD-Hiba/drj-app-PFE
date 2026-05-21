import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface EncadrementEntry {
  local_id: string;
  id?: string;
  niveau_formation_id: string;
  nombre_femmes: number;
  nombre_hommes: number;
}

export function useEncadrementEntries(rapportId: string | null) {
  const [items, setItems] = useState<EncadrementEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const itemsRef = useRef<EncadrementEntry[]>([]);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  // ====================
  // Reload Logic
  // ====================
  const reload = useCallback(async (): Promise<EncadrementEntry[]> => {
    if (!rapportId) {
      setItems([]);
      return [];
    }

    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('encadrements')
        .select('*')
        .eq('rapport_id', rapportId);

      if (error) {
        console.error('[useEncadrementEntries] error:', error);
        return [];
      }

      const normalized: EncadrementEntry[] = (data || []).map((e) => ({
        local_id: crypto.randomUUID(),
        id: e.id,
        niveau_formation_id: e.niveau_formation_id || '',
        nombre_femmes: e.nombre_femmes || 0,
        nombre_hommes: e.nombre_hommes || 0,
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
    async (entry: EncadrementEntry): Promise<boolean> => {
      const local_id = entry.local_id || crypto.randomUUID();
      const optimisticItem = { ...entry, local_id };
      setItems((prev) => [...prev, optimisticItem]);

      if (!rapportId) return true;
      return true;
    },
    [rapportId]
  );

  const update = useCallback(
    async (local_id: string, patch: Partial<EncadrementEntry>): Promise<boolean> => {
      const existing = itemsRef.current.find((item) => item.local_id === local_id);
      if (!existing) return false;

      const updatedEntry = { ...existing, ...patch };
      setItems((prev) =>
        prev.map((item) =>
          item.local_id === local_id ? updatedEntry : item
        )
      );

      if (!rapportId) return true;
      if (!updatedEntry.niveau_formation_id) return true;

      try {
        const payload = {
          rapport_id: rapportId,
          niveau_formation_id: updatedEntry.niveau_formation_id,
          nombre_femmes: updatedEntry.nombre_femmes,
          nombre_hommes: updatedEntry.nombre_hommes,
        };

        let encId = updatedEntry.id;
        if (encId) {
          await supabase
            .from('encadrements')
            .update(payload)
            .eq('id', encId);
        } else {
          const { data } = await supabase
            .from('encadrements')
            .insert(payload)
            .select('id')
            .single();
          if (data) encId = data.id;
        }

        setItems((prev) =>
          prev.map((item) =>
            item.local_id === local_id ? { ...updatedEntry, id: encId } : item
          )
        );
        return true;
      } catch (error) {
        console.error('[useEncadrementEntries] update error:', error);
        return false;
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
          await supabase.from('encadrements').delete().eq('id', existing.id);
        }
        return true;
      } catch (error) {
        console.error('[useEncadrementEntries] remove error:', error);
        return false;
      }
    },
    [rapportId]
  );

  return { items, loading, reload, add, update, remove };
}
