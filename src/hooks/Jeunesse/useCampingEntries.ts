import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface CampEntry {
  local_id: string;
  participant_id?: string;
  programme_id: string; // Fait office de "Type de camp"
  autre_programme?: string;
  girls: number;
  boys: number;
  rural: number;
  urban: number;
  immigrant_children: number;
  special_needs: number;
  encadrements: {
  local_id: string;
  id?: string;
  niveau_formation_id: string;
  autre_niveau_formation?: string;
  nombre_femmes: number;
  nombre_hommes: number;
}[];
}

export function useCampingEntries(rapportId: string | null) {
  const [items, setItems] = useState<CampEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const itemsRef = useRef<CampEntry[]>([]);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  // ====================
  // Reload Logic
  // ====================
  const reload = useCallback(async (): Promise<CampEntry[]> => {
    if (!rapportId) {
      setItems([]);
      return [];
    }

    setLoading(true);

    try {
      // On récupère les données des deux tables
      const [partRes, encRes] = await Promise.all([
        supabase.from('participants').select('*').eq('rapport_id', rapportId),
        supabase.from('encadrements').select('*').eq('rapport_id', rapportId),
      ]);

      if (partRes.error) console.error('[useCampingEntries] participants error:', partRes.error);
      if (encRes.error) console.error('[useCampingEntries] encadrements error:', encRes.error);

      const participants = partRes.data ?? [];
      const encadrements = encRes.data ?? [];

      // On groupe par programme_id (Type de camp)
      const programmesSet = new Set([
        ...participants.map((p) => p.programme_id),
        ...encadrements.map((e) => e.programme_id),
      ].filter(Boolean) as string[]);

      const localIdById = new Map(
        itemsRef.current.map((item) => [item.programme_id, item.local_id])
      );

      const normalized: CampEntry[] = Array.from(programmesSet).map((progId) => {
        const p = participants.find((x) => x.programme_id === progId);
        const encs = encadrements.filter((x) => x.programme_id === progId);
        return {
          local_id: localIdById.get(progId) ?? crypto.randomUUID(),
          participant_id: p?.id,
          programme_id: progId,
          autre_programme: p?.autre_programme ?? '',
          girls: p?.femmes ?? 0,
          boys: p?.hommes ?? 0,
          rural: p?.milieu_rural ?? 0,
          urban: p?.milieu_urbain ?? 0,
          immigrant_children: p?.enfants_marocains_etranger ?? 0,
          special_needs: p?.besoins_specifiques ?? 0,

          encadrements: encs.map((e) => ({
          local_id: crypto.randomUUID(),
          id: e.id,
          niveau_formation_id: e.niveau_formation_id ?? '',
          autre_niveau_formation: e.autre_niveau_formation ?? '',
          nombre_femmes: e.nombre_femmes ?? 0,
          nombre_hommes: e.nombre_hommes ?? 0,
        })),
        };
      });

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

    return () => { cancelled = true; };
  }, [rapportId, reload]);

  const updateLocal = useCallback(
  (local_id: string, patch: Partial<CampEntry>) => {
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

  const saveTimersRef = useRef<
  Record<string, ReturnType<typeof setTimeout>>
>({});

  const savingEntriesRef = useRef<Set<string>>(new Set());

  const saveEntry = useCallback(
    async (local_id: string): Promise<boolean> => {

      if (savingEntriesRef.current.has(local_id)) {
        return true;
      }

      savingEntriesRef.current.add(local_id);
      
      const existing = itemsRef.current.find((item) => item.local_id === local_id);
        if (!existing) {
          savingEntriesRef.current.delete(local_id);
          return false;
        }
      const updatedEntry = existing;
        // If rapportId is missing, stop after the optimistic local update.
        if (!rapportId) {
          savingEntriesRef.current.delete(local_id);
          return true;
        }

        // Si le type de camp n'est pas encore choisi, on ne sauvegarde pas encore en base
        if (!updatedEntry.programme_id) {
          savingEntriesRef.current.delete(local_id);
          return true;
        }

        const duplicate = itemsRef.current.find(
          item =>
            item.local_id !== local_id &&
            item.programme_id === updatedEntry.programme_id
        );
        if (duplicate) {
          console.warn('Duplicate camp entry');
          savingEntriesRef.current.delete(local_id);
          return false;
        }

        try {
          // 1. Gérer Participants
          const partPayload = {
            ...(updatedEntry.participant_id ? { id: updatedEntry.participant_id } : {}),
            rapport_id: rapportId,
            programme_id: updatedEntry.programme_id,
            autre_programme: updatedEntry.autre_programme || null,
            femmes: updatedEntry.girls,
            hommes: updatedEntry.boys,
            milieu_rural: updatedEntry.rural,
            milieu_urbain: updatedEntry.urban,
            besoins_specifiques: updatedEntry.special_needs,
            enfants_marocains_etranger: updatedEntry.immigrant_children,
          };

          const { data: partData, error: partError } = await supabase.from('participants').upsert(partPayload, { onConflict: updatedEntry.participant_id ? 'id' : 'rapport_id,programme_id' }).select('id').single();
          if (partError) throw partError;
          const partId = partData.id;

          // 2. Sauvegarder encadrements
          const updatedEncadrements: CampEntry['encadrements'] = [
            ...updatedEntry.encadrements,
          ];

          for (const enc of updatedEntry.encadrements) {

            if (!enc.niveau_formation_id) {
              continue;
            }

            const encPayload = {
              ...(enc.id ? { id: enc.id } : {}),
              rapport_id: rapportId,
              programme_id: updatedEntry.programme_id,
              niveau_formation_id: enc.niveau_formation_id,
               autre_niveau_formation:enc.autre_niveau_formation || null,
              nombre_femmes: enc.nombre_femmes,
              nombre_hommes: enc.nombre_hommes,
            };

            const { data: encData, error: encError } =
              await supabase
                .from('encadrements')
                .upsert(
                  encPayload,
                  {
                    onConflict:
                      enc.id
                        ? 'id'
                        : 'rapport_id,programme_id,niveau_formation_id',
                  },
                )
                .select('id')
                .single();

            if (encError) throw encError;

            const idx = updatedEncadrements.findIndex(
              x => x.local_id === enc.local_id
            );

            if (idx !== -1) {
              updatedEncadrements[idx] = {
                ...enc,
                id: encData.id,
              };
            }
          }
          // Mettre à jour l'état avec les nouveaux IDs
          setItems(prev =>
            prev.map(item =>
              item.local_id === local_id
                ? {
                    ...updatedEntry,
                    participant_id: partId,
                    encadrements: updatedEncadrements,
                  }
                : item
            )
          );
          return true;
        } catch (error) {
          console.error('[useCampingEntries] update error:', error);
          return false;
        } finally {
          savingEntriesRef.current.delete(local_id);
        }
      },
    [rapportId]
  );
  // ====================
  // CRUD Operations
  // ====================
  const add = useCallback(
    async (entry: CampEntry): Promise<boolean> => {
      const local_id = entry.local_id || crypto.randomUUID();
      const optimisticItem = { ...entry, local_id };
      setItems((prev) => [...prev, optimisticItem]);

      // Database persistence happens only when rapportId exists.
      if (!rapportId) return true;

      return true;
    },
    [rapportId]
  );

  const update = useCallback(
    async (
      local_id: string,
      patch: Partial<CampEntry>,
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
      if (saveTimersRef.current[local_id]) {
        clearTimeout(saveTimersRef.current[local_id]);
        delete saveTimersRef.current[local_id];
      }
      const existing = itemsRef.current.find((item) => item.local_id === local_id);
      if (!existing) return false;

      setItems((prev) => prev.filter((item) => item.local_id !== local_id));
      if (!rapportId) return true;

      try {
        if (existing.participant_id) {
          await supabase.from('participants').delete().eq('id', existing.participant_id);
        }
        for (const enc of existing.encadrements) {
          if (enc.id) {
            await supabase
              .from('encadrements')
              .delete()
              .eq('id', enc.id);
          }
        }
        return true;
      } catch (error) {
        console.error('[useCampingEntries] remove error:', error);
        return false;
      }
    },
    [rapportId]
  );

  return { items, loading, reload, add, update, remove };
}