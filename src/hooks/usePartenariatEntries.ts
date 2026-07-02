import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

export interface PartenariatEntry {
  local_id: string;
  id?: string;
  type_partenaire_id: string;
  autre_partenaire?: string;
  nombre_conventions: number;
}

type DbPartenariatRow = Database['public']['Tables']['partenariats']['Row'];

const toPartenariatEntry = (
  row: DbPartenariatRow,
  local_id: string,
): PartenariatEntry => ({
  local_id,
  id: row.id,
  type_partenaire_id: row.type_partenaire_id ?? '',
  autre_partenaire: row.autre_partenaire ?? '',
  nombre_conventions: row.nombre_conventions ?? 0,
});

export function usePartenariatEntries(rapportId: string | null) {
  const [items, setItems] = useState<PartenariatEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const itemsRef = useRef<PartenariatEntry[]>([]);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  const updateLocal = useCallback(
    (local_id: string, patch: Partial<PartenariatEntry>) => {
      setItems(prev =>
        prev.map(item =>
          item.local_id === local_id
            ? { ...item, ...patch }
            : item
        )
      );
    },
    [],
  );
  
  const savingEntriesRef = useRef<Set<string>>(new Set());
  
  const saveEntry = useCallback(
  async (local_id: string): Promise<boolean> => {
    if (savingEntriesRef.current.has(local_id)) {
      return true;
    }

    savingEntriesRef.current.add(local_id);

    const existing = itemsRef.current.find(
      item => item.local_id === local_id,
    );

     if (!existing) {
      savingEntriesRef.current.delete(local_id);
      return false;
    }

    const previousItems = itemsRef.current;

    try {
      const { data, error } = await supabase
        .from('partenariats')
        .upsert(
          {
            ...(existing.id ? { id: existing.id } : {}),
            rapport_id: rapportId,
            type_partenaire_id:
              existing.type_partenaire_id || null,
            autre_partenaire:
              existing.autre_partenaire || null,
            nombre_conventions:
              existing.nombre_conventions,
          } as any,
          {
            onConflict: existing.id
              ? 'id'
              : 'rapport_id,type_partenaire_id,autre_partenaire',
          },
        )
        .select()
        .single();

      if (error || !data) {
        throw error;
      }

      setItems(prev =>
        prev.map(item =>
          item.local_id === local_id
            ? toPartenariatEntry(data, local_id)
            : item,
        ),
      );

      return true;
    } catch (err) {
      console.error(
        '[usePartenariatEntries] saveEntry error:',
        err,
      );

      setItems(previousItems);

      return false;
    } finally {
      savingEntriesRef.current.delete(local_id);
    }
  },
  [rapportId],
);

  const reload = useCallback(async (): Promise<PartenariatEntry[]> => {
    if (!rapportId) {
      setItems([]);
      return [];
    }

    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('partenariats')
        .select('*')
        .eq('rapport_id', rapportId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('[usePartenariatEntries] reload error:', error);
        setItems([]);
        return [];
      }

      const rows = (data ?? []) as DbPartenariatRow[];
      const localIdByDbId = new Map(
        itemsRef.current
          .filter((item): item is PartenariatEntry & { id: string } => Boolean(item.id))
          .map((item) => [item.id as string, item.local_id] as const),
      );

      const normalized = rows.map((row) =>
        toPartenariatEntry(
          row,
          localIdByDbId.get(row.id) ?? crypto.randomUUID(),
        ),
      );

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

const add = useCallback(
  async (entry: PartenariatEntry): Promise<boolean> => {
    if (!rapportId) return false;

    const local_id = entry.local_id || crypto.randomUUID();

    const optimisticItem: PartenariatEntry = {
      ...entry,
      local_id,
      id: undefined,
      autre_partenaire: '',
    };

    setItems(prev => [...prev, optimisticItem]);

    return true;
  },
  [rapportId],
);

  const saveTimersRef = useRef<
  Record<string, ReturnType<typeof setTimeout>>
>({});

  const update = useCallback(
    async (
      local_id: string,
      patch: Partial<PartenariatEntry>,
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
    [updateLocal, saveEntry],
  );
  const remove = useCallback(
    async (local_id: string): Promise<boolean> => {
      const existing = itemsRef.current.find((item) => item.local_id === local_id);
      if (!existing) {
        return false;
      }

      const previousItems = itemsRef.current;
      setItems((prev) => prev.filter((item) => item.local_id !== local_id));

      if (!existing.id) {
        return true;
      }

      try {
        const { error } = await supabase
          .from('partenariats')
          .delete()
          .eq('id', existing.id);

        if (error) {
          console.error('[usePartenariatEntries] remove error:', error);
          setItems(previousItems);
          return false;
        }

        return true;
      } catch (err) {
        console.error('[usePartenariatEntries] remove unexpected error:', err);
        setItems(previousItems);
        return false;
      }
    },
    [],
  );

  return {
    items,
    loading,
    reload,
    add,
    update,
    remove,
  };
}
