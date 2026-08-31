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
  autre_partenaire?: string;
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
  if (!stats) return null;
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
  unite_duree: (activite.unite_duree as InsertionEntry['unite_duree']) ?? '',
  type_partenaire_id: activite.type_partenaire_id ?? '',
  autre_partenaire: activite.autre_partenaire ?? '',
  stats_id: stats?.id,
  femmes: stats?.femmes ?? 0,
  hommes: stats?.hommes ?? 0,
  rural: stats?.nbr_rural ?? 0,
  urbain: stats?.nbr_urbain ?? 0,
});

export function useInsertionEntries(rapportId: string | null, options?: { enabled?: boolean }) {
  const enabled = options?.enabled ?? true;
  const [items, setItems] = useState<InternalInsertionEntry[]>([]);
  const [loading, setLoading] = useState(false);

  const itemsRef = useRef<InternalInsertionEntry[]>([]);
  const saveTimersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const savingEntriesRef = useRef<Set<string>>(new Set());
  const pendingSaveRef = useRef<Set<string>>(new Set());

  // Helper pour garder itemsRef.current synchronisé immédiatement
  const updateItems = useCallback((newItemsOrUpdater: React.SetStateAction<InternalInsertionEntry[]>) => {
    setItems((prev) => {
      const next = typeof newItemsOrUpdater === 'function' ? newItemsOrUpdater(prev) : newItemsOrUpdater;
      itemsRef.current = next;
      return next;
    });
  }, []);

  const updateLocal = useCallback(
    (local_id: string, patch: Partial<InsertionEntry>) => {
      updateItems((prev) =>
        prev.map((item) => (item.local_id === local_id ? { ...item, ...patch } : item))
      );
    },
    [updateItems]
  );

  const saveEntry = useCallback(
    async (local_id: string): Promise<boolean> => {
      if (savingEntriesRef.current.has(local_id)) {
        pendingSaveRef.current.add(local_id);
        return true;
      }

      savingEntriesRef.current.add(local_id);
      const existing = itemsRef.current.find((item) => item.local_id === local_id);

      if (!existing || !rapportId) {
        savingEntriesRef.current.delete(local_id);
        return false;
      }

      const updatedEntry = existing;
      const sujetClean = updatedEntry.sujet?.trim() ?? '';

      // 🛡️ SÉCURITÉ : Ne pas tenter d'upsert si le sujet est vide
      if (!sujetClean) {
        savingEntriesRef.current.delete(local_id);
        return true;
      }

      try {
        const activitePayload = {
          ...(existing.id ? { id: existing.id } : {}),
          rapport_id: rapportId,
          sujet: sujetClean,
          duree_valeur: Number(updatedEntry.duree_valeur) || 0,
          unite_duree: updatedEntry.unite_duree === '' ? null : updatedEntry.unite_duree,
          type_partenaire_id: updatedEntry.type_partenaire_id || null,
          autre_partenaire: updatedEntry.autre_partenaire || null,
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
          femmes: Number(updatedEntry.femmes) || 0,
          hommes: Number(updatedEntry.hommes) || 0,
          nbr_rural: Number(updatedEntry.rural) || 0,
          nbr_urbain: Number(updatedEntry.urbain) || 0,
        };

        const { data: statsData, error: statsError } = await supabase
          .from('stats_insertion')
          .upsert(statsPayload as any, { onConflict: existing.stats_id ? 'id' : 'activite_id' })
          .select('id')
          .single();

        if (statsError) throw statsError;

        updateItems((prev) =>
          prev.map((item) =>
            item.local_id === local_id
              ? { ...item, id: activiteData.id, stats_id: statsData.id }
              : item
          )
        );

        return true;
      } catch (error) {
        console.error('[useInsertionEntries] update error:', error);
        return false;
      } finally {
        savingEntriesRef.current.delete(local_id);
        if (pendingSaveRef.current.has(local_id)) {
          pendingSaveRef.current.delete(local_id);
          setTimeout(() => {
            void saveEntry(local_id);
          }, 50);
        }
      }
    },
    [rapportId, updateItems]
  );

  const reload = useCallback(async (): Promise<InternalInsertionEntry[]> => {
    if (!rapportId) {
      updateItems([]);
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
        return [];
      }

      const rows = (data ?? []) as DbActiviteWithStats[];
      const localIdById = new Map(
        itemsRef.current
          .filter((item): item is InternalInsertionEntry & { id: string } => Boolean(item.id))
          .map((item) => [item.id as string, item.local_id] as const)
      );

      const normalized = rows.map((row) =>
        toInsertionEntry(
          row,
          normalizeStats(row.stats_insertion),
          localIdById.get(row.id) ?? crypto.randomUUID()
        )
      );

      updateItems((prev) => {
        const normalizedByLocalId = new Map(normalized.map((item) => [item.local_id, item] as const));
        const merged = normalized.map((serverItem) => {
          const currentItem = prev.find((item) => item.local_id === serverItem.local_id);
          const hasPendingLocalChange =
            Boolean(saveTimersRef.current[serverItem.local_id]) ||
            savingEntriesRef.current.has(serverItem.local_id) ||
            pendingSaveRef.current.has(serverItem.local_id);

          return currentItem && hasPendingLocalChange ? currentItem : serverItem;
        });
        const unsavedLocalItems = prev.filter((item) => !item.id && !normalizedByLocalId.has(item.local_id));
        return [...merged, ...unsavedLocalItems];
      });
      return normalized;
    } catch (e) {
      console.error('[useInsertionEntries] unexpected reload error:', e);
      return [];
    } finally {
      setLoading(false);
    }
  }, [rapportId, updateItems]);

  useEffect(() => {
    let cancelled = false;
    
    // Si désactivé, vider les items et retourner
    if (!enabled) {
      updateItems([]);
      setLoading(false);
      return;
    }
    
    if (!rapportId) {
      updateItems([]);
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
 
    return () => { cancelled = true; };
  }, [rapportId, reload, updateItems, enabled]); 
  const add = useCallback(
    async (entry: Omit<InsertionEntry, 'local_id'> & { local_id?: string }): Promise<boolean> => {
      if (!rapportId) return false;

      const local_id = entry.local_id ?? crypto.randomUUID();
      const optimisticEntry: InternalInsertionEntry = {
        local_id,
        id: undefined,
        sujet: entry.sujet ?? '',
        duree_valeur: entry.duree_valeur ?? 0,
        unite_duree: entry.unite_duree ?? '',
        type_partenaire_id: entry.type_partenaire_id ?? '',
        autre_partenaire: entry.autre_partenaire ?? '',
        femmes: entry.femmes ?? 0,
        hommes: entry.hommes ?? 0,
        rural: entry.rural ?? 0,
        urbain: entry.urbain ?? 0,
      };

      updateItems((prev) => [...prev, optimisticEntry]);
      return true;
    },
    [rapportId, updateItems]
  );

  const update = useCallback(
    async (local_id: string, patch: Partial<InsertionEntry>): Promise<boolean> => {
      updateLocal(local_id, patch);

      if (saveTimersRef.current[local_id]) {
        clearTimeout(saveTimersRef.current[local_id]);
      }

      saveTimersRef.current[local_id] = setTimeout(() => {
        delete saveTimersRef.current[local_id];
        void saveEntry(local_id);
      }, 1200);

      return true;
    },
    [updateLocal, saveEntry]
  );

  const remove = useCallback(
    async (local_id: string): Promise<boolean> => {
      const existing = itemsRef.current.find((item) => item.local_id === local_id);
      if (!existing) return false;

      updateItems((prev) => prev.filter((item) => item.local_id !== local_id));

      if (!existing.id) return true;

      try {
        await supabase.from('stats_insertion').delete().eq('activite_id', existing.id);
        await supabase.from('activites_insertion').delete().eq('id', existing.id);
        return true;
      } catch (error) {
        console.error('[useInsertionEntries] remove error:', error);
        return false;
      }
    },
    [updateItems]
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