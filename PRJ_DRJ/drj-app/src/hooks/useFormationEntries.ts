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
    async (local_id: string, patch: Partial<FormationEntry>): Promise<boolean> => {
      const existing = itemsRef.current.find((item) => item.local_id === local_id);
      if (!existing) return false;

      const updatedEntry = { ...existing, ...patch };
      setItems((prev) =>
        prev.map((item) =>
          item.local_id === local_id ? updatedEntry : item
        )
      );

      if (!rapportId) return true;

      try {
        // Only persist centre and numero_session to Supabase
        const payload: any = {
          rapport_id: rapportId,
          centre: updatedEntry.centre,
          numero_session: updatedEntry.numero_session,
        };

        let frmId = updatedEntry.id;
        if (frmId) {
          await supabase
            .from('formations')
            .update(payload)
            .eq('id', frmId);
        } else {
          const { data } = await supabase
            .from('formations')
            .insert(payload)
            .select('id')
            .single();
          if (data) frmId = data.id;
        }

        // Insert/update statistiques_formation
        const statsPayload = {
          formation_id: frmId,
          nombre_beneficiaires_femmes: updatedEntry.beneficiaries_girls,
          nombre_beneficiaires_hommes: updatedEntry.beneficiaries_boys,
          nombre_formateurs_femmes: updatedEntry.trainers_girls,
          nombre_formateurs_hommes: updatedEntry.trainers_boys,
        };

        let statsId = updatedEntry.statistiques_id;
        if (statsId) {
          await supabase
            .from('statistiques_formation')
            .update(statsPayload)
            .eq('id', statsId);
        } else {
          const { data: statsData } = await supabase
            .from('statistiques_formation')
            .insert(statsPayload)
            .select('id')
            .single();
          if (statsData) statsId = statsData.id;
        }

        setItems((prev) =>
          prev.map((item) =>
            item.local_id === local_id 
              ? { ...updatedEntry, id: frmId, statistiques_id: statsId } 
              : item
          )
        );
        return true;
      } catch (error) {
        console.error('[useFormationEntries] update error:', error);
        return false;
      }
    },
    [rapportId]
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
