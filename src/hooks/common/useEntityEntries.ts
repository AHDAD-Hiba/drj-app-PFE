import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type BaseEntry = {
  local_id: string;
  id?: string;
};

export type DeleteMode = 'hard' | 'soft';

export interface UseEntityEntriesOptions<TEntry extends BaseEntry> {
  rapportId: string | null;
  tableName: string;
  deleteMode?: DeleteMode;
  buildPayload: (entry: TEntry, rapportId: string) => any;
  buildConflictTarget?: (entry: TEntry) => string;
  mapRowToEntry: (row: any, localId: string) => TEntry;
  onSaveSuccess?: (entry: TEntry, savedRow: any) => Partial<TEntry>;
  softDelete?: (id: string) => Promise<void>;
}

export function useEntityEntries<TEntry extends BaseEntry>({
  rapportId,
  tableName,
  deleteMode = 'hard',
  buildPayload,
  buildConflictTarget,
  mapRowToEntry,
  onSaveSuccess,
  softDelete,
}: UseEntityEntriesOptions<TEntry>) {
  const [items, setItems] = useState<TEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const itemsRef = useRef<TEntry[]>([]);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  const updateLocal = useCallback((local_id: string, patch: Partial<TEntry>) => {
    setItems(prev =>
      prev.map(item =>
        item.local_id === local_id ? { ...item, ...patch } : item
      )
    );
  }, []);

  const saveTimersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const savingEntriesRef = useRef<Set<string>>(new Set());

  const reload = useCallback(async (): Promise<TEntry[]> => {
    if (!rapportId) {
      setItems([]);
      return [];
    }

    setLoading(true);

    try {
      // 🛠️ FIX : On force "as any" pour que Supabase accepte n'importe quelle table
      const query = supabase.from(tableName as any).select('*');
      
      const { data, error } = await query
        .eq('rapport_id', rapportId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error(`[useEntityEntries] reload error for ${tableName}:`, error);
        setItems([]);
        return [];
      }

      const normalized = (data ?? []).map((row: any) =>
        mapRowToEntry(row, crypto.randomUUID())
      );

      setItems(normalized);
      return normalized;
    } finally {
      setLoading(false);
    }
  }, [rapportId, tableName, mapRowToEntry]);

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
        if (!cancelled) {
          await reload();
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [rapportId, reload]);

  const saveEntry = useCallback(async (local_id: string): Promise<boolean> => {
    if (savingEntriesRef.current.has(local_id)) {
      return true;
    }

    savingEntriesRef.current.add(local_id);

    try {
      const existing = itemsRef.current.find(item => item.local_id === local_id);
      if (!existing || !rapportId) {
        return true;
      }

      const payload = buildPayload(existing, rapportId);

      // 🛠️ FIX : On force "as any" pour le nom de table et le payload
      const query = supabase.from(tableName as any);
      const { data, error } = await query
        .upsert(payload as any, {
          onConflict: buildConflictTarget?.(existing) ?? 'id',
        })
        .select('id')
        .single();

      if (error) throw error;

      const nextEntry: TEntry = {
        ...existing,
        ...(onSaveSuccess ? onSaveSuccess(existing, data) : { id: (data as any).id }),
      } as TEntry;

      setItems(prev =>
        prev.map(item =>
          item.local_id === local_id ? nextEntry : item
        )
      );

      return true;
    } catch (err) {
      console.error(`[useEntityEntries] save failed for ${tableName}:`, err);
      return false;
    } finally {
      savingEntriesRef.current.delete(local_id);
    }
  }, [rapportId, tableName, buildPayload, buildConflictTarget, onSaveSuccess]);

  const add = useCallback(async (entry: TEntry): Promise<boolean> => {
    const local_id = entry.local_id || crypto.randomUUID();
    const optimisticEntry = { ...entry, local_id };
    setItems(prev => [...prev, optimisticEntry]);
    return true;
  }, []);

  const update = useCallback(async (
    local_id: string,
    patch: Partial<TEntry>,
  ): Promise<boolean> => {
    updateLocal(local_id, patch);

    if (saveTimersRef.current[local_id]) {
      clearTimeout(saveTimersRef.current[local_id]);
    }

    saveTimersRef.current[local_id] = setTimeout(() => {
      delete saveTimersRef.current[local_id];
      void saveEntry(local_id);
    }, 1500);

    return true;
  }, [updateLocal, saveEntry]);

  const remove = useCallback(async (local_id: string): Promise<boolean> => {
    const existing = itemsRef.current.find(item => item.local_id === local_id);
    if (!existing) return false;

    const previousItems = itemsRef.current;
    setItems(prev => prev.filter(item => item.local_id !== local_id));

    if (!existing.id) {
      return true;
    }

    try {
      if (deleteMode === 'soft' && softDelete) {
        await softDelete(existing.id);
      } else {
        // 🛠️ FIX : Force "as any" ici aussi
        const query = supabase.from(tableName as any);
        await query.delete().eq('id', existing.id);
      }

      return true;
    } catch (err) {
      console.error(`[useEntityEntries] remove failed for ${tableName}:`, err);
      setItems(previousItems);
      return false;
    }
  }, [deleteMode, softDelete, tableName]);

  return {
    items,
    loading,
    reload,
    add,
    update,
    remove,
  };
}