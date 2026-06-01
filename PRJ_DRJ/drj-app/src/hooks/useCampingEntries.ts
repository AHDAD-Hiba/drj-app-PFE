import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

export interface CampEntry {
  local_id: string;
  participant_id?: string;
  programme_id: string; // Fait office de "Type de camp"
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
  nombre_femmes: number;
  nombre_hommes: number;
}[];
}

export function useCampingEntries(rapportId: string | null) {
  const [items, setItems] = useState<CampEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
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
    async (local_id: string, patch: Partial<CampEntry>): Promise<boolean> => {
      const existing = itemsRef.current.find((item) => item.local_id === local_id);
      if (!existing) return false;

      const updatedEntry = { ...existing, ...patch };
      setItems((prev) => prev.map((item) => item.local_id === local_id ? updatedEntry : item));

      // If rapportId is missing, stop after the optimistic local update.
      if (!rapportId) return true;

      // Si le type de camp n'est pas encore choisi, on ne sauvegarde pas encore en base
      if (!updatedEntry.programme_id) return true;

      setIsSaving(true);
      try {
        // 1. Gérer Participants
        const partPayload = {
          ...(updatedEntry.participant_id ? { id: updatedEntry.participant_id } : {}),
          rapport_id: rapportId,
          programme_id: updatedEntry.programme_id,
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
        for (const enc of updatedEntry.encadrements) {
          const encPayload = {
            ...(enc.id ? { id: enc.id } : {}),
            rapport_id: rapportId,
            programme_id: updatedEntry.programme_id,
            niveau_formation_id: enc.niveau_formation_id || null,
            nombre_femmes: enc.nombre_femmes,
            nombre_hommes: enc.nombre_hommes,
          };

          const { data: encData, error: encError } = await supabase.from('encadrements').upsert(encPayload, { onConflict: enc.id ? 'id' : 'rapport_id,programme_id,niveau_formation_id' }).select('id').single();
          if (encError) throw encError;
          enc.id = encData.id;
        }
        // Mettre à jour l'état avec les nouveaux IDs
        setItems((prev) =>
          prev.map((item) =>
            item.local_id === local_id
              ? {
                  ...updatedEntry,
                  participant_id: partId,
                }
              : item
          )
        );
        return true;
      } catch (error) {
        console.error('[useCampingEntries] update error:', error);
        return false;
      } finally {
        setIsSaving(false);
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

  return { items, loading, isSaving, reload, add, update, remove };
}