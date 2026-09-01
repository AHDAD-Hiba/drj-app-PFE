import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type BaseEntry = {
  local_id: string;
  id?: string;
};

export type DeleteMode = "hard" | "soft";

export interface UseEntityEntriesOptions<TEntry extends BaseEntry> {
  rapportId: string | null;
  tableName: string;
  enabled?: boolean;
  deleteMode?: DeleteMode;
  buildPayload: (entry: TEntry, rapportId: string) => any;
  buildConflictTarget?: (entry: TEntry) => string;
  mapRowToEntry: (row: any, localId: string) => TEntry;
  validateBeforeSave?: (entry: TEntry) => boolean;
  onSaveSuccess?: (entry: TEntry, savedRow: any) => Partial<TEntry>;
  softDelete?: (id: string) => Promise<void>;
}

export function useEntityEntries<TEntry extends BaseEntry>({
  rapportId,
  tableName,
  deleteMode = "hard",
  enabled = true,
  buildPayload,
  buildConflictTarget,
  mapRowToEntry,
  validateBeforeSave,
  onSaveSuccess,
  softDelete,
}: UseEntityEntriesOptions<TEntry>) {
  const [items, setItems] = useState<TEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const itemsRef = useRef<TEntry[]>([]);
  const mountedRef = useRef(true);

  const serverIdToLocalIdRef = useRef<Record<string, string>>({});

  // 🛠️ Marge de sécurité : Helper pour synchroniser items et itemsRef en même temps
  const updateItems = useCallback((newItemsOrUpdater: React.SetStateAction<TEntry[]>) => {
    setItems((prev) => {
      const next =
        typeof newItemsOrUpdater === "function" ? newItemsOrUpdater(prev) : newItemsOrUpdater;
      itemsRef.current = next;
      return next;
    });
  }, []);

  useEffect(
    () => () => {
      mountedRef.current = false;
      Object.values(saveTimersRef.current).forEach(clearTimeout);
      saveTimersRef.current = {};
    },
    [],
  );

  const updateLocal = useCallback(
    (local_id: string, patch: Partial<TEntry>) => {
      updateItems((prev) =>
        prev.map((item) => (item.local_id === local_id ? { ...item, ...patch } : item)),
      );
    },
    [updateItems],
  );

  const saveTimersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const savingEntriesRef = useRef<Set<string>>(new Set());
  const pendingSaveRef = useRef<Set<string>>(new Set());

  const reload = useCallback(async (): Promise<TEntry[]> => {
    if (!rapportId) {
      if (mountedRef.current) {
        updateItems([]);
      }
      return [];
    }

    setLoading(true);

    try {
      const query = supabase.from(tableName as any).select("*");

      const { data, error } = await query
        .eq("rapport_id", rapportId)
        .order("created_at", { ascending: true });

      if (error) {
        console.error(`[useEntityEntries] reload error for ${tableName}:`, error);
        if (mountedRef.current) {
          updateItems([]);
        }
        return [];
      }

      const normalized = (data ?? []).map((row: any) => {
        const serverId = row.id;
        let localId: string;

        if (serverId) {
          if (serverIdToLocalIdRef.current[serverId]) {
            localId = serverIdToLocalIdRef.current[serverId];
          } else {
            localId = crypto.randomUUID();
            serverIdToLocalIdRef.current[serverId] = localId;
          }
        } else {
          localId = crypto.randomUUID();
        }

        return mapRowToEntry(row, localId);
      });

      if (mountedRef.current) {
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
      }
      return normalized;
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [rapportId, tableName, mapRowToEntry, updateItems]);

  useEffect(() => {
    let cancelled = false;

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
  }, [rapportId, reload, updateItems, enabled]);

  const saveEntry = useCallback(
    async (local_id: string): Promise<boolean> => {
      if (savingEntriesRef.current.has(local_id) || !mountedRef.current) {
        if (mountedRef.current) {
          pendingSaveRef.current.add(local_id);
        }
        return true;
      }

      savingEntriesRef.current.add(local_id);

      try {
        const existing = itemsRef.current.find((item) => item.local_id === local_id);
        if (!existing || !rapportId) {
          return true;
        }

        // 🛡️ Garde-fou de validation locale optionnelle avant appel Supabase
        if (validateBeforeSave && !validateBeforeSave(existing)) {
          return true;
        }

        const payload = buildPayload(existing, rapportId);

        const query = supabase.from(tableName as any);
        const { data, error } = await query
          .upsert(payload as any, {
            onConflict: buildConflictTarget?.(existing) ?? "id",
          })
          .select("id")
          .single();

        if (error) throw error;

        if (!mountedRef.current) {
          return true;
        }

        const savedId = (data as any)?.id;

        if (savedId && local_id) {
          serverIdToLocalIdRef.current[savedId] = local_id;
        }

        const nextEntry: TEntry = {
          ...(itemsRef.current.find((item) => item.local_id === local_id) ?? existing),
          ...(onSaveSuccess ? onSaveSuccess(existing, data) : { id: savedId }),
        } as TEntry;

        updateItems((prev) => prev.map((item) => (item.local_id === local_id ? nextEntry : item)));

        return true;
      } catch (err) {
        console.error(`[useEntityEntries] save failed for ${tableName}:`, err);
        return false;
      } finally {
        savingEntriesRef.current.delete(local_id);

        if (pendingSaveRef.current.has(local_id) && mountedRef.current) {
          pendingSaveRef.current.delete(local_id);
          setTimeout(() => {
            void saveEntry(local_id);
          }, 50);
        }
      }
    },
    [
      rapportId,
      tableName,
      buildPayload,
      buildConflictTarget,
      onSaveSuccess,
      validateBeforeSave,
      updateItems,
    ],
  );

  const add = useCallback(
    async (entry: TEntry): Promise<boolean> => {
      const local_id = entry.local_id || crypto.randomUUID();
      const optimisticEntry = { ...entry, local_id };
      updateItems((prev) => [...prev, optimisticEntry]);
      return true;
    },
    [updateItems],
  );

  const saveNow = useCallback(
    async (local_id: string): Promise<boolean> => {
      if (saveTimersRef.current[local_id]) {
        clearTimeout(saveTimersRef.current[local_id]);
        delete saveTimersRef.current[local_id];
      }

      return saveEntry(local_id);
    },
    [saveEntry],
  );

  const update = useCallback(
    async (local_id: string, patch: Partial<TEntry>): Promise<boolean> => {
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

      const previousItems = itemsRef.current;
      updateItems((prev) => prev.filter((item) => item.local_id !== local_id));

      if (!existing.id) {
        return true;
      }

      try {
        if (deleteMode === "soft" && softDelete) {
          await softDelete(existing.id);
        } else {
          const query = supabase.from(tableName as any);
          await query.delete().eq("id", existing.id);
        }

        return true;
      } catch (err) {
        console.error(`[useEntityEntries] remove failed for ${tableName}:`, err);
        updateItems(previousItems);
        return false;
      }
    },
    [deleteMode, softDelete, tableName, updateItems],
  );

  return {
    items,
    enabled: enabled,
    loading,
    reload,
    add,
    update,
    saveNow,
    remove,
  };
}
