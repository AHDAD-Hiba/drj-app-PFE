import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

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

type FestivalEntryDraft = Omit<FestivalEntry, "local_id"> & { local_id?: string };

type DbFestivalRow = Database["public"]["Tables"]["festivals"]["Row"];
type DbStatRow = Database["public"]["Tables"]["statistiques_festivals"]["Row"];

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
  name: festival.nom ?? "",
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

export function useFestivalEntries(rapportId: string | null, options?: { enabled?: boolean }) {
  const enabled = options?.enabled ?? true;
  const [items, setItems] = useState<InternalFestivalEntry[]>([]);
  const [loading, setLoading] = useState(false);

  const itemsRef = useRef<InternalFestivalEntry[]>([]);
  const saveTimersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const savingEntriesRef = useRef<Set<string>>(new Set());
  const pendingSaveRef = useRef<Set<string>>(new Set());

  // Mise à jour synchrone de itemsRef
  const updateItems = useCallback(
    (newItemsOrUpdater: React.SetStateAction<InternalFestivalEntry[]>) => {
      setItems((prev) => {
        const next =
          typeof newItemsOrUpdater === "function" ? newItemsOrUpdater(prev) : newItemsOrUpdater;
        itemsRef.current = next;
        return next;
      });
    },
    [],
  );

  const updateLocal = useCallback(
    (local_id: string, patch: Partial<FestivalEntry>) => {
      updateItems((prev) =>
        prev.map((item) => (item.local_id === local_id ? { ...item, ...patch } : item)),
      );
    },
    [updateItems],
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
      const nomClean = updatedEntry.name?.trim() ?? "";

      // 🛡️ NE PAS ENVOYER EN BDD SI LE NOM EST VIDE
      if (!nomClean) {
        savingEntriesRef.current.delete(local_id);
        return true;
      }

      try {
        const festivalPayload = {
          ...(existing.id ? { id: existing.id } : {}),
          rapport_id: rapportId,
          nom: nomClean,
        };

        const { data: festivalData, error: festivalError } = await supabase
          .from("festivals")
          .upsert(festivalPayload as any, { onConflict: existing.id ? "id" : "rapport_id,nom" })
          .select("id")
          .single();

        if (festivalError) throw festivalError;

        const statsFields = {
          ...(existing.statistiques_id ? { id: existing.statistiques_id } : {}),
          festival_id: festivalData.id,
          nbr_participants_qualifies: Number(updatedEntry.participants_qualifies) || 0,
          nbr_provinces_participantes: Number(updatedEntry.provinces_participantes) || 0,
          nbr_rural: Number(updatedEntry.rural) || 0,
          nbr_urbain: Number(updatedEntry.urbain) || 0,
          nombre_femmes: Number(updatedEntry.femmes) || 0,
          nombre_hommes: Number(updatedEntry.hommes) || 0,
        };

        const { data: statsData, error: statsError } = await supabase
          .from("statistiques_festivals")
          .upsert(statsFields as any, {
            onConflict: existing.statistiques_id ? "id" : "festival_id",
          })
          .select("id")
          .single();

        if (statsError) throw statsError;

        updateItems((prev) =>
          prev.map((item) =>
            item.local_id === local_id
              ? { ...item, id: festivalData.id, statistiques_id: statsData.id }
              : item,
          ),
        );

        return true;
      } catch (error) {
        console.error("[useFestivalEntries] update error:", error);
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
    [rapportId, updateItems],
  );

  const reload = useCallback(async (): Promise<InternalFestivalEntry[]> => {
    if (!rapportId) {
      updateItems([]);
      return [];
    }

    setLoading(true);

    try {
      const { data, error } = await supabase
        .from("festivals")
        .select("*, statistiques_festivals(*)")
        .eq("rapport_id", rapportId)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("[useFestivalEntries] reload error:", error);
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

      updateItems((prev) => {
        const normalizedByLocalId = new Map(
          normalized.map((item) => [item.local_id, item] as const),
        );
        const merged = normalized.map((serverItem) => {
          const currentItem = prev.find((item) => item.local_id === serverItem.local_id);
          const hasPendingLocalChange =
            Boolean(saveTimersRef.current[serverItem.local_id]) ||
            savingEntriesRef.current.has(serverItem.local_id) ||
            pendingSaveRef.current.has(serverItem.local_id);

          return currentItem && hasPendingLocalChange ? currentItem : serverItem;
        });
        const unsavedLocalItems = prev.filter(
          (item) => !item.id && !normalizedByLocalId.has(item.local_id),
        );
        return [...merged, ...unsavedLocalItems];
      });
      return normalized;
    } catch (e) {
      console.error("[useFestivalEntries] unexpected reload error:", e);
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

    return () => {
      cancelled = true;
    };
  }, [rapportId, reload, updateItems, enabled]);

  const add = useCallback(
    async (entry: FestivalEntryDraft): Promise<boolean> => {
      if (!rapportId) return false;

      const local_id = entry.local_id ?? crypto.randomUUID();
      const optimisticItem: InternalFestivalEntry = {
        local_id,
        id: undefined,
        name: entry.name ?? "",
        participants_qualifies: entry.participants_qualifies ?? 0,
        provinces_participantes: entry.provinces_participantes ?? 0,
        rural: entry.rural ?? 0,
        urbain: entry.urbain ?? 0,
        femmes: entry.femmes ?? 0,
        hommes: entry.hommes ?? 0,
      };

      updateItems((prev) => [...prev, optimisticItem]);
      return true;
    },
    [rapportId, updateItems],
  );

  const update = useCallback(
    async (local_id: string, patch: Partial<FestivalEntry>): Promise<boolean> => {
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
    [updateLocal, saveEntry],
  );

  const remove = useCallback(
    async (local_id: string): Promise<boolean> => {
      const existing = itemsRef.current.find((item) => item.local_id === local_id);
      if (!existing) return false;

      updateItems((prev) => prev.filter((item) => item.local_id !== local_id));

      if (!existing.id) return true;

      try {
        await supabase.from("statistiques_festivals").delete().eq("festival_id", existing.id);

        await supabase.from("festivals").delete().eq("id", existing.id);

        return true;
      } catch (error) {
        console.error("[useFestivalEntries] remove error:", error);
        return false;
      }
    },
    [updateItems],
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
