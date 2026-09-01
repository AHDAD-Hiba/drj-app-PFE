import { supabase } from "@/integrations/supabase/client";
import { useCallback, useEffect, useRef, useState } from "react";

export interface FormationEntry {
  local_id: string;
  id?: string;
  centre: string;
  type_filtre?: string;
  numero_session: number;
  beneficiaries_girls: number;
  beneficiaries_boys: number;
  trainers_girls: number;
  trainers_boys: number;
  statistiques_id?: string;
}

export function useFormationEntries(rapportId: string | null, options?: { enabled?: boolean }) {
  const enabled = options?.enabled ?? true;
  const [items, setItems] = useState<FormationEntry[]>([]);
  const [loading, setLoading] = useState(false);

  const itemsRef = useRef<FormationEntry[]>([]);
  const saveTimersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const savingEntriesRef = useRef<Set<string>>(new Set());
  const pendingSaveRef = useRef<Set<string>>(new Set());

  // Mise à jour synchrone de itemsRef
  const updateItems = useCallback((newItemsOrUpdater: React.SetStateAction<FormationEntry[]>) => {
    setItems((prev) => {
      const next =
        typeof newItemsOrUpdater === "function" ? newItemsOrUpdater(prev) : newItemsOrUpdater;
      itemsRef.current = next;
      return next;
    });
  }, []);

  // ====================
  // Reload Logic
  // ====================
  const reload = useCallback(async (): Promise<FormationEntry[]> => {
    if (!rapportId) {
      updateItems([]);
      return [];
    }

    setLoading(true);

    try {
      const { data, error } = await supabase
        .from("formations")
        .select("*, statistiques_formation(*)")
        .eq("rapport_id", rapportId);

      if (error) {
        console.error("[useFormationEntries] reload error:", error);
        return [];
      }

      const localIdById = new Map(
        itemsRef.current
          .filter((item): item is FormationEntry & { id: string } => Boolean(item.id))
          .map((item) => [item.id as string, item.local_id] as const),
      );

      const normalized: FormationEntry[] = ((data as any[]) || []).map((f) => {
        const stats = Array.isArray(f.statistiques_formation)
          ? f.statistiques_formation[0]
          : f.statistiques_formation;
        return {
          local_id: localIdById.get(f.id) ?? crypto.randomUUID(),
          id: f.id,
          centre: f.centre ?? "",
          numero_session: f.numero_session ?? 1,
          beneficiaries_girls: stats?.nombre_beneficiaires_femmes ?? 0,
          beneficiaries_boys: stats?.nombre_beneficiaires_hommes ?? 0,
          trainers_girls: stats?.nombre_formateurs_femmes ?? 0,
          trainers_boys: stats?.nombre_formateurs_hommes ?? 0,
          statistiques_id: stats?.id,
        };
      });

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
    } catch (err) {
      console.error("[useFormationEntries] unexpected reload error:", err);
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
      const centreClean = updatedEntry.centre?.trim() ?? "";

      // N'envoie pas à Supabase si le nom du centre est vide
      if (!centreClean) {
        savingEntriesRef.current.delete(local_id);
        return true;
      }

      try {
        const payload: any = {
          rapport_id: rapportId,
          centre: centreClean,
          numero_session: Number(updatedEntry.numero_session) || 1,
        };

        // Si l'entrée a un ID, on l'ajoute au payload pour l'upsert
        if (updatedEntry.id) {
          payload.id = updatedEntry.id;
        }

        // 1. Upsert formation
        const { data: frmData, error: frmError } = await supabase
          .from("formations")
          .upsert(payload, {
            onConflict: "rapport_id,centre,numero_session",
          })
          .select("id")
          .single();

        if (frmError) throw frmError;
        const formationId = frmData.id;

        // 2. Upsert statistiques_formation
        const statsPayload: any = {
          formation_id: formationId,
          nombre_beneficiaires_femmes: Number(updatedEntry.beneficiaries_girls) || 0,
          nombre_beneficiaires_hommes: Number(updatedEntry.beneficiaries_boys) || 0,
          nombre_formateurs_femmes: Number(updatedEntry.trainers_girls) || 0,
          nombre_formateurs_hommes: Number(updatedEntry.trainers_boys) || 0,
        };

        if (updatedEntry.statistiques_id) {
          statsPayload.id = updatedEntry.statistiques_id;
        }

        const { data: statsData, error: statsError } = await supabase
          .from("statistiques_formation")
          .upsert(statsPayload, {
            onConflict: "formation_id",
          })
          .select("id")
          .single();

        if (statsError) throw statsError;

        // 3. Update State
        updateItems((prev) =>
          prev.map((item) =>
            item.local_id === local_id
              ? { ...item, id: formationId, statistiques_id: statsData.id }
              : item,
          ),
        );

        return true;
      } catch (error) {
        console.error("[useFormationEntries] save error:", error);
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

  // ====================
  // CRUD Operations
  // ====================
  const add = useCallback(
    async (entry: FormationEntry): Promise<boolean> => {
      const local_id = entry.local_id || crypto.randomUUID();
      const optimisticItem = { ...entry, local_id };
      updateItems((prev) => [...prev, optimisticItem]);
      return true;
    },
    [updateItems],
  );

  const update = useCallback(
    async (local_id: string, patch: Partial<FormationEntry>): Promise<boolean> => {
      updateItems((prev) =>
        prev.map((item) => (item.local_id === local_id ? { ...item, ...patch } : item)),
      );

      if (saveTimersRef.current[local_id]) {
        clearTimeout(saveTimersRef.current[local_id]);
      }

      saveTimersRef.current[local_id] = setTimeout(() => {
        delete saveTimersRef.current[local_id];
        void saveEntry(local_id);
      }, 1200);

      return true;
    },
    [updateItems, saveEntry],
  );

  const remove = useCallback(
    async (local_id: string): Promise<boolean> => {
      const existing = itemsRef.current.find((item) => item.local_id === local_id);
      if (!existing) return false;

      updateItems((prev) => prev.filter((item) => item.local_id !== local_id));

      if (rapportId) {
        try {
          if (existing.statistiques_id) {
            await supabase
              .from("statistiques_formation")
              .delete()
              .eq("id", existing.statistiques_id);
          }
          if (existing.id) {
            await supabase.from("formations").delete().eq("id", existing.id);
          }
        } catch (error) {
          console.error("[useFormationEntries] remove error:", error);
          return false;
        }
      }
      return true;
    },
    [rapportId, updateItems],
  );

  return { items, loading, reload, add, update, remove };
}
