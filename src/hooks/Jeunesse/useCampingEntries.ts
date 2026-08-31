import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface CampEntry {
  local_id: string;
  participant_id?: string;
  programme_id: string;
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

export function useCampingEntries(rapportId: string | null, options?: { enabled?: boolean }) {
  const enabled = options?.enabled ?? true;
  const [items, setItems] = useState<CampEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const itemsRef = useRef<CampEntry[]>([]);
  
  const saveTimersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const savingEntriesRef = useRef<Set<string>>(new Set());
  const pendingSaveRef = useRef<Set<string>>(new Set());

  const updateItems = useCallback((newItemsOrUpdater: React.SetStateAction<CampEntry[]>) => {
    setItems((prev) => {
      const next = typeof newItemsOrUpdater === 'function' ? newItemsOrUpdater(prev) : newItemsOrUpdater;
      itemsRef.current = next;
      return next;
    });
  }, []);

  const updateLocal = useCallback(
    (local_id: string, patch: Partial<CampEntry>) => {
      updateItems(prev =>
        prev.map(item =>
          item.local_id === local_id ? { ...item, ...patch } : item
        )
      );
    },
    [updateItems]
  );

  const reload = useCallback(async (): Promise<CampEntry[]> => {
    if (!rapportId) {
      updateItems([]);
      return [];
    }

    setLoading(true);

    try {
      const [partRes, encRes] = await Promise.all([
        supabase.from('participants').select('*').eq('rapport_id', rapportId),
        supabase.from('encadrements').select('*').eq('rapport_id', rapportId),
      ]);

      if (partRes.error) console.error('[useCampingEntries] participants error:', partRes.error);
      if (encRes.error) console.error('[useCampingEntries] encadrements error:', encRes.error);

      const participants = partRes.data ?? [];
      const encadrements = encRes.data ?? [];

      const programmesSet = new Set([
        ...participants.map((p) => p.programme_id),
        ...encadrements.map((e) => e.programme_id),
      ].filter(Boolean) as string[]);

      const localIdById = new Map(
        itemsRef.current.map((item) => [item.programme_id, item.local_id])
      );
      const encLocalIdById = new Map(
        itemsRef.current.flatMap((item) =>
          item.encadrements
            .filter((enc) => Boolean(enc.id))
            .map((enc) => [enc.id as string, enc.local_id] as const),
        ),
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
            local_id: encLocalIdById.get(e.id) ?? crypto.randomUUID(),
            id: e.id,
            niveau_formation_id: e.niveau_formation_id ?? '',
            autre_niveau_formation: e.autre_niveau_formation ?? '',
            nombre_femmes: e.nombre_femmes ?? 0,
            nombre_hommes: e.nombre_hommes ?? 0,
          })),
        };
      });

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
        const unsavedLocalItems = prev.filter(
          (item) => !item.participant_id && !normalizedByLocalId.has(item.local_id),
        );
        return [...merged, ...unsavedLocalItems];
      });
      return normalized;
    } finally {
      setLoading(false);
    }
  }, [rapportId, updateItems]);

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
        if (!cancelled) await reload();
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
 
    return () => { cancelled = true; };
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

      if (!updatedEntry.programme_id) {
        savingEntriesRef.current.delete(local_id);
        return true;
      }

      try {
        // 1. Sauvegarde Participants
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

        const { data: partData, error: partError } = await supabase
          .from('participants')
          .upsert(partPayload, { onConflict: updatedEntry.participant_id ? 'id' : 'rapport_id,programme_id' })
          .select('id')
          .single();
          
        if (partError) throw partError;
        const partId = partData.id;

        // 2. Sauvegarde Encadrements (Tableau)
        const updatedEncadrements: CampEntry['encadrements'] = [...updatedEntry.encadrements];

        for (const enc of updatedEntry.encadrements) {
          if (!enc.niveau_formation_id) continue;

          const encPayload = {
            ...(enc.id ? { id: enc.id } : {}),
            rapport_id: rapportId,
            programme_id: updatedEntry.programme_id,
            niveau_formation_id: enc.niveau_formation_id,
            autre_niveau_formation: enc.autre_niveau_formation || null,
            nombre_femmes: enc.nombre_femmes,
            nombre_hommes: enc.nombre_hommes,
          };

          const { data: encData, error: encError } = await supabase
            .from('encadrements')
            .upsert(encPayload, {
              onConflict: enc.id ? 'id' : 'undefined',
            })
            .select('id')
            .single();

          if (encError) throw encError;

          const idx = updatedEncadrements.findIndex(x => x.local_id === enc.local_id);
          if (idx !== -1) {
            updatedEncadrements[idx] = { ...enc, id: encData.id };
          }
        }

        // 3. Mise à jour de l'état avec les vrais IDs serveur
        updateItems(prev =>
          prev.map(item =>
            item.local_id === local_id
              ? {
                  ...item,
                  participant_id: partId,
                  encadrements: item.encadrements.map((enc) => ({
                    ...enc,
                    id: updatedEncadrements.find((saved) => saved.local_id === enc.local_id)?.id ?? enc.id,
                  })),
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
        if (pendingSaveRef.current.has(local_id)) {
          pendingSaveRef.current.delete(local_id);
          setTimeout(() => { void saveEntry(local_id); }, 50);
        }
      }
    },
    [rapportId, updateItems]
  );

  const add = useCallback(
    async (entry: CampEntry): Promise<boolean> => {
      const local_id = entry.local_id || crypto.randomUUID();
      const optimisticItem = { ...entry, local_id };
      updateItems((prev) => [...prev, optimisticItem]);
      return true;
    },
    [updateItems]
  );

  const update = useCallback(
    async (local_id: string, patch: Partial<CampEntry>): Promise<boolean> => {
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

      updateItems((prev) => prev.filter((item) => item.local_id !== local_id));
      if (!rapportId) return true;

      try {
        if (existing.participant_id) {
          await supabase.from('participants').delete().eq('id', existing.participant_id);
        }
        for (const enc of existing.encadrements) {
          if (enc.id) {
            await supabase.from('encadrements').delete().eq('id', enc.id);
          }
        }
        return true;
      } catch (error) {
        console.error('[useCampingEntries] remove error:', error);
        return false;
      }
    },
    [rapportId, updateItems]
  );

const removeEncadrement = useCallback(
  async (campLocalId: string, encLocalId: string): Promise<boolean> => {
    let encTargetId: string | undefined;

    // 1. Mise à jour synchrone de l'état local ET récupération de l'ID BDD exact
    updateItems((prev) =>
      prev.map((item) => {
        if (item.local_id === campLocalId) {
          const target = item.encadrements.find((e) => e.local_id === encLocalId);
          encTargetId = target?.id; // 🎯 On capture l'ID BDD réel depuis le state frais !

          return {
            ...item,
            encadrements: item.encadrements.filter((e) => e.local_id !== encLocalId),
          };
        }
        return item;
      })
    );

    // 2. Si l'élément avait un ID en BDD, on le supprime immédiatement dans Supabase
    if (encTargetId) {
      try {
        const { error } = await supabase
          .from('encadrements')
          .delete()
          .eq('id', encTargetId);

        if (error) {
          console.error('[useCampingEntries] error deleting encadrement:', error);
          return false;
        }
      } catch (error) {
        console.error('[useCampingEntries] removeEncadrement exception:', error);
        return false;
      }
    }

    return true;
  },
  [updateItems]
);
// Pensez à l'inclure dans le return du Hook :
return { items, loading, reload, add, update, remove, removeEncadrement };
};