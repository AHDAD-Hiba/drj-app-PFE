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

      try {
        const { data: activite, error: activiteError } = await supabase
          .from('activites_insertion')
          .insert({
            sujet: optimisticEntry.sujet,
            duree_valeur: optimisticEntry.duree_valeur,
            unite_duree: optimisticEntry.unite_duree || null,
            rapport_id: rapportId,
            type_partenaire_id: optimisticEntry.type_partenaire_id || null,
          } as any)
          .select('id')
          .single();

        if (activiteError || !activite) {
          console.error('[useInsertionEntries] add activite error:', activiteError);
          setItems((prev) => prev.filter((item) => item.local_id !== local_id));
          return false;
        }

        const { data: stats, error: statsError } = await supabase
          .from('stats_insertion')
          .insert({
            activite_id: activite.id,
            femmes: optimisticEntry.femmes,
            hommes: optimisticEntry.hommes,
            nbr_rural: optimisticEntry.rural,
            nbr_urbain: optimisticEntry.urbain,
          } as any)
          .select('id')
          .single();

        if (statsError || !stats) {
          console.error('[useInsertionEntries] add stats error:', statsError);
          await supabase.from('activites_insertion').delete().eq('id', activite.id);
          setItems((prev) => prev.filter((item) => item.local_id !== local_id));
          return false;
        }

        setItems((prev) => prev.map((item) =>
          item.local_id === local_id
            ? { ...item, id: activite.id, stats_id: stats.id }
            : item,
        ));

        return true;
      } catch (error) {
        console.error('[useInsertionEntries] add unexpected error:', error);
        setItems((prev) => prev.filter((item) => item.local_id !== local_id));
        return false;
      }
    },
    [rapportId],
  );

  const update = useCallback(
    async (local_id: string, patch: Partial<InsertionEntry>): Promise<boolean> => {
      const existing = itemsRef.current.find((item) => item.local_id === local_id);
      if (!existing) {
        return false;
      }

      const previousItems = itemsRef.current;
      const updatedEntry: InternalInsertionEntry = {
        ...existing,
        ...patch,
      };

      setItems((prev) => prev.map((item) =>
        item.local_id === local_id ? updatedEntry : item,
      ));

      if (!existing.id) {
        return true;
      }

      try {
        const activitePayload: Partial<DbActiviteRow> = {};
        if (patch.sujet !== undefined) activitePayload.sujet = updatedEntry.sujet;
        if (patch.duree_valeur !== undefined) {
        activitePayload.duree_valeur =
            updatedEntry.duree_valeur;
        }

        if (patch.unite_duree !== undefined) {
            activitePayload.unite_duree =
            updatedEntry.unite_duree === ''
                ? null
                : updatedEntry.unite_duree;
        }
        if (patch.type_partenaire_id !== undefined) activitePayload.type_partenaire_id = updatedEntry.type_partenaire_id || null;

        if (Object.keys(activitePayload).length > 0) {
          const { error: activiteUpdateError } = await supabase
            .from('activites_insertion')
            .update(activitePayload as any)
            .eq('id', existing.id);

          if (activiteUpdateError) {
            console.error('[useInsertionEntries] update activite error:', activiteUpdateError);
            setItems(previousItems);
            return false;
          }
        }

        const statsPayload: Partial<DbStatsRow> = {};
        if (patch.femmes !== undefined) statsPayload.femmes = updatedEntry.femmes;
        if (patch.hommes !== undefined) statsPayload.hommes = updatedEntry.hommes;
        if (patch.rural !== undefined) statsPayload.nbr_rural = updatedEntry.rural;
        if (patch.urbain !== undefined) statsPayload.nbr_urbain = updatedEntry.urbain;

        if (Object.keys(statsPayload).length > 0) {
          if (existing.stats_id) {
            const { error: statsUpdateError } = await supabase
              .from('stats_insertion')
              .update(statsPayload as any)
              .eq('id', existing.stats_id);

            if (statsUpdateError) {
              console.error('[useInsertionEntries] update stats error:', statsUpdateError);
              setItems(previousItems);
              return false;
            }
          } else {
            const { data: stats, error: statsInsertError } = await supabase
              .from('stats_insertion')
              .insert({ activite_id: existing.id, ...statsPayload } as any)
              .select('id')
              .single();

            if (statsInsertError || !stats) {
              console.error('[useInsertionEntries] insert stats error:', statsInsertError);
              setItems(previousItems);
              return false;
            }

            setItems((prev) => prev.map((item) =>
              item.local_id === local_id ? { ...item, stats_id: stats.id } : item,
            ));
          }
        }

        return true;
      } catch (error) {
        console.error('[useInsertionEntries] update unexpected error:', error);
        setItems(previousItems);
        return false;
      }
    },
    [],
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
