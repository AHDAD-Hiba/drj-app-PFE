import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

export interface FestivalEntry {
  local_id: string;
  id?: string;
  name: string;
  participants_qualifies: number;
  provinces_participantes: number;
  rural: number;
  urbain: number;
  femmes: number;
  hommes: number;
}

type FestivalEntryDraft = Omit<FestivalEntry, 'local_id'> & { local_id?: string };

type DbFestivalRow = Database['public']['Tables']['festivals']['Row'];
type DbStatRow = Database['public']['Tables']['statistiques_festivals']['Row'];

type InternalFestivalEntry = FestivalEntry & { statistiques_id?: string };

type DbFestivalWithStats = DbFestivalRow & {
  statistiques_festivals?: DbStatRow[] | DbStatRow | null;
};

const toFestivalEntry = (
  festival: DbFestivalRow,
  stats: DbStatRow | null,
  local_id: string,
): InternalFestivalEntry => ({
  local_id,
  id: festival.id,
  name: festival.nom ?? '',
  statistiques_id: stats?.id,
  participants_qualifies: stats?.nbr_participants_qualifies ?? 0,
  provinces_participantes: stats?.nbr_provinces_participantes ?? 0,
  rural: stats?.nbr_rural ?? 0,
  urbain: stats?.nbr_urbain ?? 0,
  femmes: stats?.nombre_femmes ?? 0,
  hommes: stats?.nombre_hommes ?? 0,
});

const normalizeStats = (stats: DbStatRow[] | DbStatRow | null | undefined): DbStatRow | null => {
  if (!stats) return null;
  if (Array.isArray(stats)) {
    return stats[0] ?? null;
  }
  return stats;
};

export function useFestivalEntries(rapportId: string | null) {
  const [items, setItems] = useState<InternalFestivalEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const itemsRef = useRef<InternalFestivalEntry[]>([]);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);


  const updateLocal = useCallback(
  (local_id: string, patch: Partial<FestivalEntry>) => {
    setItems((prev) =>
      prev.map((item) =>
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
      const festivalPayload = {
        ...(existing.id ? { id: existing.id } : {}),
        rapport_id: rapportId,
        nom: updatedEntry.name.trim(),
      };

      const { data: festivalData, error: festivalError } = await supabase
        .from('festivals')
        .upsert(festivalPayload as any, { onConflict: existing.id ? 'id' : 'rapport_id,nom' })
        .select('id')
        .single();
      if (festivalError) throw festivalError;

      const statsFields = {
        ...(existing.statistiques_id ? { id: existing.statistiques_id } : {}),
        festival_id: festivalData.id,
        nbr_participants_qualifies: updatedEntry.participants_qualifies,
        nbr_provinces_participantes: updatedEntry.provinces_participantes,
        nbr_rural: updatedEntry.rural,
        nbr_urbain: updatedEntry.urbain,
        nombre_femmes: updatedEntry.femmes,
        nombre_hommes: updatedEntry.hommes,
      };
      const { data: statsData, error: statsError } = await supabase
        .from('statistiques_festivals')
        .upsert(statsFields as any, { onConflict: existing.statistiques_id ? 'id' : 'festival_id' })
        .select('id')
        .single();
      if (statsError) throw statsError;

      setItems((prev) => prev.map((item) =>
        item.local_id === local_id ? { ...item, id: festivalData.id, statistiques_id: statsData.id } : item,
      ));

      return true;
    } catch (error) {
      console.error('[useFestivalEntries] update unexpected error:', error);
      return false;
    } finally {
      savingEntriesRef.current.delete(local_id);
    }
},
[rapportId],
);

  const reload = useCallback(async (): Promise<InternalFestivalEntry[]> => {
    if (!rapportId) {
      setItems([]);
      return [];
    }

    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('festivals')
        .select('*, statistiques_festivals(*)')
        .eq('rapport_id', rapportId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('[useFestivalEntries] reload error:', error);
        setItems([]);
        return [];
      }

      const rows = (data ?? []) as DbFestivalWithStats[];
      const localIdById = new Map(
        itemsRef.current
          .filter((item): item is InternalFestivalEntry & { id: string } => Boolean(item.id))
          .map((item) => [item.id as string, item.local_id] as const),
      );

      const normalized = rows.map((row) =>
        toFestivalEntry(
          row,
          normalizeStats(row.statistiques_festivals),
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
    async (entry: FestivalEntryDraft): Promise<boolean> => {
      if (!rapportId) {
        return false;
      }

      const local_id = entry.local_id ?? crypto.randomUUID();
      const optimisticItem: InternalFestivalEntry = {
        local_id,
        id: undefined,
        name: entry.name ?? '',
        participants_qualifies: entry.participants_qualifies ?? 0,
        provinces_participantes: entry.provinces_participantes ?? 0,
        rural: entry.rural ?? 0,
        urbain: entry.urbain ?? 0,
        femmes: entry.femmes ?? 0,
        hommes: entry.hommes ?? 0,
      };

      setItems((prev) => [...prev, optimisticItem]);
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
    patch: Partial<FestivalEntry>,
  ): Promise<boolean> => {

    console.log('UPDATE PATCH', patch);
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
          .from('statistiques_festivals')
          .delete()
          .eq('festival_id', existing.id);

        if (statsDeleteError) {
          console.error('[useFestivalEntries] remove stats error:', statsDeleteError);
          setItems(previousItems);
          return false;
        }

        const { error: festivalDeleteError } = await supabase
          .from('festivals')
          .delete()
          .eq('id', existing.id);

        if (festivalDeleteError) {
          console.error('[useFestivalEntries] remove festival error:', festivalDeleteError);
          setItems(previousItems);
          return false;
        }

        return true;
      } catch (error) {
        console.error('[useFestivalEntries] remove unexpected error:', error);
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
