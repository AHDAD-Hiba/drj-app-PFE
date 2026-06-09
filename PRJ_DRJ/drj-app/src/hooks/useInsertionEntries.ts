import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

export interface InsertionEntry {
  local_id: string;
  id?: string;
  sujet: string;
  duree_valeur: number;
  unite_duree: 'heure' | 'jour' | 'semaine' | 'mois' | '';
  type_partenaire_id: string;
  femmes: number;
  hommes: number;
  rural: number;
  urbain: number;
}

type DbActiviteRow = Database['public']['Tables']['activites_insertion']['Row'];
type DbStatsRow = Database['public']['Tables']['stats_insertion']['Row'];
type DbActiviteWithStats = DbActiviteRow & {
  stats_insertion?: DbStatsRow[] | DbStatsRow | null;
};

type InternalInsertionEntry = InsertionEntry & {
  stats_id?: string;
};

const normalizeStats = (stats: DbStatsRow[] | DbStatsRow | null | undefined): DbStatsRow | null => {
  if (!stats) {
    return null;
  }
  if (Array.isArray(stats)) {
    return stats[0] ?? null;
  }
  return stats;
};

const toInsertionEntry = (
  activite: DbActiviteRow,
  stats: DbStatsRow | null,
  local_id: string,
): InternalInsertionEntry => ({
  local_id,
  id: activite.id,
  sujet: activite.sujet ?? '',
  duree_valeur: activite.duree_valeur ?? 0,
  unite_duree: activite.unite_duree ?? '',
  type_partenaire_id: activite.type_partenaire_id ?? '',
  stats_id: stats?.id,
  femmes: stats?.femmes ?? 0,
  hommes: stats?.hommes ?? 0,
  rural: stats?.nbr_rural ?? 0,
  urbain: stats?.nbr_urbain ?? 0,
});

export function useInsertionEntries(rapportId: string | null) {
  const [items, setItems] = useState<InternalInsertionEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const itemsRef = useRef<InternalInsertionEntry[]>([]);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  const updateLocal = useCallback(
  (local_id: string, patch: Partial<InsertionEntry>) => {
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

const existing = itemsRef.current.find((item) => item.local_id === local_id);
      if (!existing) {
        return false;
      }

      const updatedEntry = existing;
      try { 
        const activitePayload = {
          ...(existing.id ? { id: existing.id } : {}),
          rapport_id: rapportId,
          sujet: updatedEntry.sujet,
          duree_valeur: updatedEntry.duree_valeur,
          unite_duree: updatedEntry.unite_duree === '' ? null : updatedEntry.unite_duree,
          type_partenaire_id: updatedEntry.type_partenaire_id || null,
        };

        const { data: activiteData, error: activiteError } = await supabase
          .from('activites_insertion')
          .upsert(activitePayload as any)
          .select('id')
          .single();
        if (activiteError) throw activiteError;

        const statsPayload = {
          ...(existing.stats_id ? { id: existing.stats_id } : {}),
          activite_id: activiteData.id,
          femmes: updatedEntry.femmes,
          hommes: updatedEntry.hommes,
          nbr_rural: updatedEntry.rural,
          nbr_urbain: updatedEntry.urbain,
        };

        const { data: statsData, error: statsError } = await supabase
          .from('stats_insertion')
          .upsert(statsPayload as any, { onConflict: existing.stats_id ? 'id' : 'activite_id' })
          .select('id')
          .single();
        if (statsError) throw statsError;

        setItems((prev) => prev.map((item) =>
          item.local_id === local_id ? { ...item, id: activiteData.id, stats_id: statsData.id } : item
        ));

        return true;
      } catch (error) {
        console.error('[useInsertionEntries] update unexpected error:', error);
        return false;
      } finally {
        savingEntriesRef.current.delete(local_id);
      }
  },
    [rapportId],
  );
  
  const reload = useCallback(async (): Promise<InternalInsertionEntry[]> => {
    if (!rapportId) {
      setItems([]);
      return [];
    }

    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('activites_insertion')
        .select('*, stats_insertion(*)')
        .eq('rapport_id', rapportId)
        .order('id', { ascending: true });

      if (error) {
        console.error('[useInsertionEntries] reload error:', error);
        setItems([]);
        return [];
      }

      const rows = (data ?? []) as DbActiviteWithStats[];
      const localIdById = new Map(
        itemsRef.current
          .filter((item): item is InternalInsertionEntry & { id: string } => Boolean(item.id))
          .map((item) => [item.id as string, item.local_id] as const),
      );

      const normalized = rows.map((row) =>
        toInsertionEntry(
          row,
          normalizeStats(row.stats_insertion),
          localIdById.get(row.id) ?? crypto.randomUUID(),
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
        if (!cancelled) await reload();
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [rapportId, reload]);

  const add = useCallback(
    async (entry: Omit<InsertionEntry, 'local_id'> & { local_id?: string }): Promise<boolean> => {
      if (!rapportId) {
        return false;
      }

      const local_id = entry.local_id ?? crypto.randomUUID();
      const optimisticEntry: InternalInsertionEntry = {
        local_id,
        id: undefined,
        sujet: entry.sujet ?? '',
        duree_valeur: entry.duree_valeur ?? 0,
        unite_duree: entry.unite_duree ?? '',
        type_partenaire_id: entry.type_partenaire_id ?? '',
        femmes: entry.femmes ?? 0,
        hommes: entry.hommes ?? 0,
        rural: entry.rural ?? 0,
        urbain: entry.urbain ?? 0,
      };

      setItems((prev) => [...prev, optimisticEntry]);
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
    patch: Partial<InsertionEntry>,
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
        const { error: statsDeleteError } = await supabase
          .from('stats_insertion')
          .delete()
          .eq('activite_id', existing.id);

        if (statsDeleteError) {
          console.error('[useInsertionEntries] remove stats error:', statsDeleteError);
          setItems(previousItems);
          return false;
        }

        const { error: activiteDeleteError } = await supabase
          .from('activites_insertion')
          .delete()
          .eq('id', existing.id);

        if (activiteDeleteError) {
          console.error('[useInsertionEntries] remove activite error:', activiteDeleteError);
          setItems(previousItems);
          return false;
        }

        return true;
      } catch (error) {
        console.error('[useInsertionEntries] remove unexpected error:', error);
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
