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
  // Reload Logic (Auto-chargement du parc immobilier provincial)
  // ====================

  const updateLocal = useCallback(
  (local_id: string, patch: Partial<FacilityEntry>) => {
    setItems((prev) =>
      prev.map((item) =>
        item.local_id === local_id
          ? { ...item, ...patch }
          : item,
      ),
    );
  },
  [],
);

  const savingEntriesRef = useRef<Set<string>>(new Set());

  const saveEntry = useCallback(
    async (local_id: string): Promise<boolean> => {

      if (savingEntriesRef.current.has(local_id)) {
      console.log('SAVE SKIPPED (already saving)', local_id);
      return true;
    }

      savingEntriesRef.current.add(local_id);

      const existing = itemsRef.current.find(
        (item) => item.local_id === local_id,
      );
      console.log('SAVE START', {
        local_id,
        existingId: existing?.id,
        timestamp: Date.now(),
      });

      if (!existing) return false;

      const updatedEntry = existing;

      setIsSaving(true);

      try {
        const etabPayload = {
            ...(existing.id ? { id: existing.id } : {}),
            direction_id: directionId,
            nom: updatedEntry.name.trim(),
            est_actif: true, // Sécurité : s'assurer qu'il est actif lors d'une modif
          };

          const { data: etabData, error: etabError } = await supabase
            .from('etablissements')
            .upsert(etabPayload as any, { onConflict: existing.id ? 'id' : 'direction_id,nom' })
            .select('id')
            .single();
          
          if (etabError) throw etabError;
          const etablissementId = etabData.id;

          console.log('ETAB CREATED', {
            local_id,
            etablissementId,
            existingIdBeforeSave: existing.id,
            name: updatedEntry.name,
          });

          // 2. Upsert Suivi Projet (Donnée de Rapport)
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
          setItems(prev =>
            prev.map(item =>
              item.local_id === local_id
                ? {
                    ...item,
                    id: etablissementId,
                    suivi_projet_id: suiviData.id,
                  }
                : item
            )
          );

          // 3. Handle Fermetures
          const nextClosureStatus =
            updatedEntry.closure_status ||
            updatedEntry.other_status;
            
          const hasExistingFermeture = Boolean(existing.fermeture_id);
          const shouldHaveFermeture =
            updatedEntry.project_status === 'ferme' && Boolean(nextClosureStatus);

          if (hasExistingFermeture && !shouldHaveFermeture) {
            const { error: deleteError } = await supabase
              .from('fermetures')
              .delete()
              .eq('id', existing.fermeture_id);

            if (deleteError) throw deleteError;

            setItems(prev =>
              prev.map(item =>
                item.local_id === local_id
                  ? {
                      ...item,
                      fermeture_id: undefined,
                    }
                  : item
              )
            );
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
            setItems(prev =>
              prev.map(item =>
                item.local_id === local_id
                  ? {
                      ...item,
                      id: etablissementId,
                      suivi_projet_id: suiviData.id,
                      fermeture_id: fermetureData?.id,
                    }
                  : item
              )
            );
          }
        
        return true;
      } catch (error) {
        console.error(error);
        return false;
      } finally {
        savingEntriesRef.current.delete(local_id);
        setIsSaving(false);
      }
    },
    [rapportId, directionId],
  );

  const reload = useCallback(async (): Promise<FacilityEntry[]> => {
    if (!rapportId || !directionId) {
      setItems([]);
      return [];
    }

    setLoading(true);

    try {
      // 1. Charger tous les bâtiments ACTIFS de la Direction
      const { data: etabsData, error: etabsError } = await supabase
        .from('etablissements')
        .select('*')
        .eq('direction_id', directionId)
        .eq('est_actif', true) // Filtre Soft Delete
        .order('nom', { ascending: true });

      if (etabsError) {
        console.error('[useEtablissementEntries] reload etablissements error:', etabsError);
        setItems([]);
        return [];
      }

      const etablissementsRows = etabsData ?? [];

      if (etablissementsRows.length === 0) {
        setItems([]);
        return [];
      }

      const etablissementIds = etablissementsRows.map((e) => e.id);

      // 2. Charger les statuts pour ce rapport précis
      const { data: suiviData, error: suiviError } = await supabase
        .from('suivi_projets')
        .select('*')
        .eq('rapport_id', rapportId)
        .in('etablissement_id', etablissementIds);

      if (suiviError) {
        console.error('[useEtablissementEntries] reload suivi_projets error:', suiviError);
        setItems([]);
        return [];
      }

      // 3. Charger les fermetures pour ce rapport précis
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

      // Mapping pour croiser les données
      const suiviByEtabId = new Map(
        (suiviData ?? []).map((row) => [row.etablissement_id, row] as const),
      );
      const fermetureByEtabId = new Map(
        ((fermeturesData ?? []) as Database['public']['Tables']['fermetures']['Row'][])
          .filter((item) => item.etablissement_id)
          .map((item) => [item.etablissement_id as string, item] as const),
      );
      const localIdByEtabId = new Map(
        itemsRef.current
          .filter((it): it is InternalFacilityEntry & { id: string } => typeof it.id === 'string')
          .map((it) => [it.id, it.local_id] as const),
      );

      // 4. Construction de la liste finale basée sur le référentiel d'infrastructures
      const normalizedItems = etablissementsRows.map((etab) => {
        const suivi = suiviByEtabId.get(etab.id);
        const fermeture = fermetureByEtabId.get(etab.id);
        const local_id = localIdByEtabId.get(etab.id) ?? crypto.randomUUID();

        return {
          local_id,
          id: etab.id,
          name: etab.nom,
          project_status: normalizeProjectStatus(suivi?.statut),
          other_status: normalizeClosureStatus(fermeture?.type_fermeture_id),
          closure_status: normalizeClosureStatus(fermeture?.type_fermeture_id),
          suivi_projet_id: suivi?.id,
          fermeture_id: fermeture?.id,
        };
      });

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

  // ====================
  // CRUD Operations
  // ====================

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
    [directionId, rapportId],
  );

  const saveTimersRef = useRef<
  Record<string, ReturnType<typeof setTimeout>>
>({});


const update = useCallback(
  async (
    local_id: string,
    patch: Partial<FacilityEntry>,
  ): Promise<boolean> => {

    console.log('UPDATE CALLED');

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

      // S'il n'est pas encore en base de données, on le retire juste de l'interface
      if (!existing.id) {
        setItems((prev) => prev.filter((item) => item.local_id !== local_id));
        return true;
      }

      try {
        setIsSaving(true);
        
        // SOFT DELETE : Archivage de l'établissement
        const { error: etabError } = await supabase
          .from('etablissements')
          .update({ est_actif: false })
          .eq('id', existing.id);

        if (etabError) {
          console.error('[useEtablissementEntries] soft delete error:', etabError);
          return false;
        }

        setItems((prev) => prev.filter((item) => item.local_id !== local_id));
        return true;
      } catch (error) {
        console.error('[useEtablissementEntries] remove unexpected error:', error);
        return false;
      } finally {
        setIsSaving(false);
      }
    },
    [],
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