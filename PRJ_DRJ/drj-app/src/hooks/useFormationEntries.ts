import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface FormationEntry {
  local_id: string;
  id?: string;
  centre: string;
  numero_session: number;
  beneficiaries_girls: number;
  beneficiaries_boys: number;
  trainers_girls: number;
  trainers_boys: number;
  statistiques_id?: string;
}

export function useFormationEntries(rapportId: string | null) {
  const [items, setItems] = useState<FormationEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const itemsRef = useRef<FormationEntry[]>([]);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  // ====================
  // Reload Logic
  // ====================
  const reload = useCallback(async (): Promise<FormationEntry[]> => {
    if (!rapportId) {
      setItems([]);
      return [];
    }

    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('formations')
        .select('*, statistiques_formation(*)')
        .eq('rapport_id', rapportId);

      if (error) {
        console.error('[useFormationEntries] error:', error);
        return [];
      }

      const normalized: FormationEntry[] = ((data as any[]) || []).map((f) => {
        const stats = Array.isArray(f.statistiques_formation) 
          ? f.statistiques_formation[0] 
          : f.statistiques_formation;
        return {
          local_id: crypto.randomUUID(),
          id: f.id,
          centre: f.centre || '',
          numero_session: f.numero_session || 0,
          beneficiaries_girls: stats?.nombre_beneficiaires_femmes || 0,
          beneficiaries_boys: stats?.nombre_beneficiaires_hommes || 0,
          trainers_girls: stats?.nombre_formateurs_femmes || 0,
          trainers_boys: stats?.nombre_formateurs_hommes || 0,
          statistiques_id: stats?.id,
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

    return () => {
      cancelled = true;
    };
  }, [rapportId, reload]);

  const updateLocal = useCallback(
    (local_id: string, patch: Partial<FormationEntry>) => {
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

        if (
          !updatedEntry.centre.trim() &&
          updatedEntry.numero_session <= 0 &&
          updatedEntry.beneficiaries_girls === 0 &&
          updatedEntry.beneficiaries_boys === 0 &&
          updatedEntry.trainers_girls === 0 &&
          updatedEntry.trainers_boys === 0
        ) {
          savingEntriesRef.current.delete(local_id);
          return true;
        }

        const duplicate = itemsRef.current.find(
          item =>
            item.local_id !== local_id &&
            item.centre.trim().toLowerCase() ===
              updatedEntry.centre.trim().toLowerCase() &&
            item.numero_session === updatedEntry.numero_session
        );

        if (duplicate) {
          console.warn('Duplicate formation');

          savingEntriesRef.current.delete(local_id);
          return false;
        }

        try {
          const payload: any = {
            ...(updatedEntry.id ? { id: updatedEntry.id } : {}),
            rapport_id: rapportId,
            centre: updatedEntry.centre,
            numero_session: updatedEntry.numero_session,
          };

          const { data: frmData, error: frmError } = await supabase
            .from('formations')
            .upsert(
              payload,
              {
                onConflict: updatedEntry.id
                  ? 'id'
                  : 'rapport_id,centre,numero_session',
              }
            )
            .select('id')
            .single();
          if (frmError) throw frmError;


          const statsPayload = {
            ...(updatedEntry.statistiques_id ? { id: updatedEntry.statistiques_id } : {}),
            formation_id: frmData.id,
            nombre_beneficiaires_femmes: updatedEntry.beneficiaries_girls,
            nombre_beneficiaires_hommes: updatedEntry.beneficiaries_boys,
            nombre_formateurs_femmes: updatedEntry.trainers_girls,
            nombre_formateurs_hommes: updatedEntry.trainers_boys,
          };

          const { data: statsData, error: statsError } = await supabase
            .from('statistiques_formation')
            .upsert(statsPayload, { onConflict: updatedEntry.statistiques_id ? 'id' : 'formation_id' })
            .select('id')
            .single();
          if (statsError) throw statsError;


          setItems((prev) =>
            prev.map((item) =>
              item.local_id === local_id 
                ? { ...updatedEntry, id: frmData.id, statistiques_id: statsData.id } 
                : item
            )
          );
          return true;
        } catch (error) {
          console.error('FULL ERROR', error);
          console.error('[useFormationEntries] update error:', error);
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
    async (entry: FormationEntry): Promise<boolean> => {
      const local_id = entry.local_id || crypto.randomUUID();
      const optimisticItem = { ...entry, local_id };
      setItems((prev) => [...prev, optimisticItem]);

      if (!rapportId) return true;
      return true;
    },
    [rapportId]
  );

  const update = useCallback(
    async (
      local_id: string,
      patch: Partial<FormationEntry>,
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
      if (!existing) return false;

      setItems((prev) => prev.filter((item) => item.local_id !== local_id));
      if (!rapportId) return true;

      try {
        if (existing.statistiques_id) {
          await supabase
            .from('statistiques_formation')
            .delete()
            .eq('id', existing.statistiques_id);
        }
        if (existing.id) {
          await supabase.from('formations').delete().eq('id', existing.id);
        }
        return true;
      } catch (error) {
        console.error('[useFormationEntries] remove error:', error);
        return false;
      }
    },
    [rapportId]
  );

  return { items, loading, reload, add, update, remove };
}
