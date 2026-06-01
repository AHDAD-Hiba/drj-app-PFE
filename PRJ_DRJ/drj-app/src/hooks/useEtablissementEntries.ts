import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

export interface FacilityEntry {
  local_id: string;
  id?: string;
  name: string;
  project_status: string;
  other_status: string;
  closure_status: string;
}

interface InternalFacilityEntry extends FacilityEntry {
  suivi_projet_id?: string;
  fermeture_id?: string;
}

const toPublicEntry = (entry: InternalFacilityEntry): FacilityEntry => ({
  local_id: entry.local_id,
  id: entry.id,
  name: entry.name,
  project_status: entry.project_status,
  other_status: entry.other_status,
  closure_status: entry.closure_status,
});

const normalizeProjectStatus = (
  status: Database['public']['Enums']['statut_projet_enum'] | null | undefined,
) => status ?? '';

const normalizeClosureStatus = (typeFermetureId: string | null | undefined) =>
  typeFermetureId ?? '';


// ====================
// Mapping Helpers
// ====================

const mapProjectStatusToSuiviStatus = (
  status: string | null | undefined,
): Database['public']['Enums']['statut_projet_enum'] | null => {
    if (status === 'nouvellement') return 'nouvel';
    if (status === 'en_cours') return 'en_cours';
    if (status === 'ferme') return 'ferme';
    return null;
};

export function useEtablissementEntries(
  rapportId: string | null,
  directionId: string | null,
) {
  const [items, setItems] = useState<InternalFacilityEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const itemsRef = useRef<InternalFacilityEntry[]>([]);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);


  // ====================
// Reload Logic
// ====================

  const reload = useCallback(async (): Promise<FacilityEntry[]> => {
    if (!rapportId || !directionId) {
      setItems([]);
      return [];
    }

    setLoading(true);

    try {
      const { data: suiviData, error: suiviError } = await supabase
        .from('suivi_projets')
        .select('*')
        .eq('rapport_id', rapportId)
        .order('created_at', { ascending: true });

      if (suiviError) {
        console.error('[useEtablissementEntries] reload suivi_projets error:', suiviError);
        setItems([]);
        return [];
      }

      const suiviRows = (suiviData ?? []) as Database['public']['Tables']['suivi_projets']['Row'][];

      // ====================
// CRUD Operations
// ====================

      const etablissementIds = Array.from(
        new Set(suiviRows.map((row) => row.etablissement_id).filter(Boolean) as string[]),
      );

      if (etablissementIds.length === 0) {
        setItems([]);
        return [];
      }

      const { data: etablissementsData, error: etabsError } = await supabase
        .from('etablissements')
        .select('*')
        .in('id', etablissementIds);

      if (etabsError) {
        console.error('[useEtablissementEntries] reload etablissements error:', etabsError);
        setItems([]);
        return [];
      }

      const { data: fermeturesData, error: fermeturesError } = await supabase
        .from('fermetures')
        .select('*')
        .eq('rapport_id', rapportId)
        .in('etablissement_id', etablissementIds);

      if (fermeturesError) {
        console.error('[useEtablissementEntries] reload fermetures error:', fermeturesError);
        setItems([]);
        return [];
      }

      const etabById = new Map(
        (etablissementsData ?? []).map((row) => [row.id, row] as const),
      );
      const fermetureByEtablissementId = new Map(
        ((fermeturesData ?? []) as Database['public']['Tables']['fermetures']['Row'][])
          .filter((item) => item.etablissement_id)
          .map((item) => [item.etablissement_id as string, item] as const),
      );
      const localIdByEtablissementId = new Map(
        itemsRef.current
          .filter((it): it is InternalFacilityEntry & { id: string } => typeof it.id === 'string')
          .map((it) => [it.id, it.local_id] as const),
      );

      const normalizedItemsNullable = suiviRows
        .map((suivi) => {
          if (!suivi.etablissement_id) return null;
          const etab = etabById.get(suivi.etablissement_id);
          if (!etab) return null;

          const fermeture = fermetureByEtablissementId.get(suivi.etablissement_id);
          const local_id =
            localIdByEtablissementId.get(etab.id) ?? crypto.randomUUID();

          return {
            local_id,
            id: etab.id,
            name: etab.nom,
            project_status: normalizeProjectStatus(suivi.statut),
            other_status: normalizeClosureStatus(fermeture?.type_fermeture_id),
            closure_status: normalizeClosureStatus(fermeture?.type_fermeture_id),
            suivi_projet_id: suivi.id,
            fermeture_id: fermeture?.id ?? undefined,
          };
        });

      const normalizedItems = normalizedItemsNullable.filter(Boolean) as InternalFacilityEntry[];

      setItems(normalizedItems);
      return normalizedItems.map(toPublicEntry);
    } finally {
      setLoading(false);
    }
  }, [directionId, rapportId]);

  useEffect(() => {
    let cancelled = false;
    if (!rapportId || !directionId) {
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
  }, [directionId, rapportId, reload]);

  const add = useCallback(
    async (entry: FacilityEntry): Promise<boolean> => {
      if (!rapportId || !directionId) {
        return false;
      }

      const localId = entry.local_id || crypto.randomUUID();
      const optimisticEntry: InternalFacilityEntry = {
        ...entry,
        local_id: localId,
        id: undefined,
        suivi_projet_id: undefined,
        fermeture_id: undefined,
      };

      setItems((prev) => [...prev, optimisticEntry]);
      return true;
    },
    [directionId, rapportId, reload],
  );

  const update = useCallback(
    async (local_id: string, patch: Partial<FacilityEntry>): Promise<boolean> => {
      const existing = items.find((item) => item.local_id === local_id);
      if (!existing) return false;

      const prevItems = items;

      // Optimistic update locally
      const updatedEntry: InternalFacilityEntry = { ...existing, ...patch };
      setItems((prev) => prev.map((item) => item.local_id === local_id ? updatedEntry : item));

      setIsSaving(true);
      try {
        const etabPayload = {
          ...(existing.id ? { id: existing.id } : {}),
          rapport_id: rapportId,
          direction_id: directionId,
          nom: updatedEntry.name,
        };
        
        const { data: etabData, error: etabError } = await supabase
          .from('etablissements')
          .upsert(etabPayload as any, { onConflict: existing.id ? 'id' : 'rapport_id,nom' })
          .select('id')
          .single();
        if (etabError) throw etabError;
        const etablissementId = etabData.id;

        const suiviPayload = {
          ...(existing.suivi_projet_id ? { id: existing.suivi_projet_id } : {}),
          rapport_id: rapportId,
          etablissement_id: etablissementId,
          statut: mapProjectStatusToSuiviStatus(updatedEntry.project_status),
        };

        const { data: suiviData, error: suiviError } = await supabase
          .from('suivi_projets')
          .upsert(suiviPayload as any, { onConflict: existing.suivi_projet_id ? 'id' : 'rapport_id,etablissement_id' })
          .select('id')
          .single();
        if (suiviError) throw suiviError;

        // Handle fermetures: create/update/delete as needed
        const nextClosureStatus =
          patch.closure_status !== undefined ? patch.closure_status :
          patch.other_status !== undefined ? patch.other_status :
          existing.closure_status || existing.other_status;

        const hasExistingFermeture = Boolean(existing.fermeture_id);
        const shouldHaveFermeture = updatedEntry.project_status === 'ferme' && Boolean(nextClosureStatus);

        if (hasExistingFermeture && !shouldHaveFermeture) {
          const { error: deleteError } = await supabase
            .from('fermetures')
            .delete()
            .eq('id', existing.fermeture_id);
          if (deleteError) throw deleteError;
          updatedEntry.fermeture_id = undefined;
        }

        if (shouldHaveFermeture) {
          const fermeturePayload = {
            ...(existing.fermeture_id ? { id: existing.fermeture_id } : {}),
            rapport_id: rapportId,
            etablissement_id: etablissementId,
            type_fermeture_id: nextClosureStatus,
          };
          const { data: fermetureData, error: fermetureError } = await supabase
            .from('fermetures')
            .upsert(fermeturePayload as any, { onConflict: existing.fermeture_id ? 'id' : 'rapport_id,etablissement_id' })
            .select('id')
            .single();
          if (fermetureError) throw fermetureError;
          updatedEntry.fermeture_id = fermetureData.id;
        }

        // Commit optimistic result (already applied). Ensure fermeture_id/suivi id present
        setItems((prev) => prev.map((item) => item.local_id === local_id ? { ...item, ...updatedEntry, id: etablissementId, suivi_projet_id: suiviData.id } : item));
        return true;
      } catch (error) {
        console.error('[useEtablissementEntries] update unexpected error:', error);
        // revert optimistic
        setItems(prevItems);
        return false;
      } finally {
        setIsSaving(false);
      }
    },
    [items, rapportId],
  );

  const remove = useCallback(
    async (local_id: string): Promise<boolean> => {
      const existing = items.find((item) => item.local_id === local_id);
      if (!existing) {
        return false;
      }

      if (!existing.id) {
        setItems((prev) => prev.filter((item) => item.local_id !== local_id));
        return true;
      }

      try {
        if (existing.fermeture_id) {
          const { error: fermetureError } = await supabase
            .from('fermetures')
            .delete()
            .eq('id', existing.fermeture_id);

          if (fermetureError) {
            console.error('[useEtablissementEntries] delete fermetures error:', fermetureError);
            return false;
          }
        }

        if (existing.suivi_projet_id) {
          const { error: suiviError } = await supabase
            .from('suivi_projets')
            .delete()
            .eq('id', existing.suivi_projet_id);

          if (suiviError) {
            console.error('[useEtablissementEntries] delete suivi_projets error:', suiviError);
            return false;
          }
        }

        const { error: etabError } = await supabase
          .from('etablissements')
          .delete()
          .eq('id', existing.id);

        if (etabError) {
          console.error('[useEtablissementEntries] delete etablissements error:', etabError);
          return false;
        }

        setItems((prev) => prev.filter((item) => item.local_id !== local_id));
        return true;
      } catch (error) {
        console.error('[useEtablissementEntries] remove unexpected error:', error);
        return false;
      }
    },
    [items],
  );

  return {
    items: items.map(toPublicEntry),
    loading,
    isSaving,
    reload,
    add,
    update,
    remove,
  };
}
