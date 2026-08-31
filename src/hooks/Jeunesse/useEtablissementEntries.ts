import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

export interface FacilityEntry {
  local_id: string;
  id?: string;
  name: string;
  project_status: string;
  other_status: string;
  closure_status: string;
  autre_precision: string;
}

interface InternalFacilityEntry extends FacilityEntry {
  suivi_projet_id?: string;
  fermeture_id?: string;
}

const toPublicEntry = (entry: InternalFacilityEntry): FacilityEntry => ({
  local_id: entry.local_id,
  id: entry.id,
  name: entry.name ?? '',
  project_status: entry.project_status ?? '',
  other_status: entry.other_status ?? '',
  closure_status: entry.closure_status ?? '',
  autre_precision: entry.autre_precision ?? '',
});

const normalizeClosureStatus = (typeFermetureId: string | null | undefined) =>
  typeFermetureId ?? '';

const mapProjectStatusToSuiviStatus = (
  status: string | null | undefined,
): Database['public']['Enums']['statut_projet_enum'] | null => {
  if (status === 'nouvel') return 'nouvel';
  if (status === 'en_cours') return 'en_cours';
  if (status === 'ferme') return 'ferme';
  return null;
};

export function useEtablissementEntries(
  rapportId: string | null,
  directionId: string | null,
  options?: { enabled?: boolean }
) {
  const enabled = options?.enabled ?? true;
  const [items, setItems] = useState<InternalFacilityEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const itemsRef = useRef<InternalFacilityEntry[]>([]);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  const updateLocal = useCallback((local_id: string, patch: Partial<FacilityEntry>) => {
    setItems((prev) =>
      prev.map((item) =>
        item.local_id === local_id ? { ...item, ...patch } : item
      )
    );
  }, []);

  const savingEntriesRef = useRef<Set<string>>(new Set());
  const pendingSaveRef = useRef<Set<string>>(new Set());
  const saveTimersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const saveEntry = useCallback(
    async (local_id: string): Promise<boolean> => {
      if (savingEntriesRef.current.has(local_id)) {
        pendingSaveRef.current.add(local_id);
        return true;
      }

      savingEntriesRef.current.add(local_id);

      const existing = itemsRef.current.find((item) => item.local_id === local_id);

      if (!existing || !rapportId || !directionId) {
        savingEntriesRef.current.delete(local_id);
        return false;
      }

      // 🛡️ SÉCURITÉ : Ne pas tenter de créer en BDD un établissement sans nom
      const nomClean = existing.name?.trim();
      if (!nomClean) {
        savingEntriesRef.current.delete(local_id);
        return true; 
      }

      try {
        // 1. Upsert Etablissement
        const etabPayload = {
          ...(existing.id ? { id: existing.id } : {}),
          direction_id: directionId,
          nom: nomClean,
          type_etablissement: 'maison_jeunes',
          est_actif: true,
        };

        const { data: etabData, error: etabError } = await supabase
          .from('etablissements')
          .upsert(etabPayload as any, { onConflict: existing.id ? 'id' : 'direction_id,nom' })
          .select('id')
          .single();

        if (etabError) throw etabError;
        const etablissementId = etabData.id;

        // 2. Upsert Suivi Projet
        let suiviDataId = existing.suivi_projet_id;
        const mappedStatus = mapProjectStatusToSuiviStatus(existing.project_status);
        
        if (mappedStatus) {
          const suiviPayload = {
            ...(existing.suivi_projet_id ? { id: existing.suivi_projet_id } : {}),
            rapport_id: rapportId,
            etablissement_id: etablissementId,
            statut: mappedStatus,
          };

          const { data: sData, error: suiviError } = await supabase
            .from('suivi_projets')
            .upsert(suiviPayload as any, { onConflict: existing.suivi_projet_id ? 'id' : 'rapport_id,etablissement_id' })
            .select('id')
            .single();

          if (suiviError) throw suiviError;
          if (sData) suiviDataId = sData.id;
        }

        // 3. Fermetures (Gestion sécurisée du champ autre_precision)
        const nextClosureStatus = existing.closure_status || existing.other_status;
        const hasExistingFermeture = Boolean(existing.fermeture_id);
        const shouldHaveFermeture = existing.project_status === 'ferme' && Boolean(nextClosureStatus);

        let newFermetureId = existing.fermeture_id;

        if (hasExistingFermeture && !shouldHaveFermeture) {
          await supabase.from('fermetures').delete().eq('id', existing.fermeture_id);
          newFermetureId = undefined;
        } else if (shouldHaveFermeture) {
          const fermeturePayload = {
            ...(existing.fermeture_id ? { id: existing.fermeture_id } : {}),
            rapport_id: rapportId,
            etablissement_id: etablissementId,
            type_fermeture_id: nextClosureStatus,
            autre_precision: existing.autre_precision ? existing.autre_precision.trim() : null,
          };

          const { data: fData, error: fError } = await supabase
            .from('fermetures')
            .upsert(fermeturePayload as any, { onConflict: existing.fermeture_id ? 'id' : 'rapport_id,etablissement_id' })
            .select('id')
            .single();

          if (!fError && fData) newFermetureId = fData.id;
        }

        // 🛡️ MISES À JOUR LOCALES SANS ÉCRASER LES SAISIES
        setItems((prev) =>
          prev.map((item) =>
            item.local_id === local_id
              ? {
                  ...item,
                  id: etablissementId,
                  suivi_projet_id: suiviDataId,
                  fermeture_id: newFermetureId,
                }
              : item
          )
        );

        return true;
      } catch (error) {
        console.error('[useEtablissementEntries] saveEntry error:', error);
        return false;
      } finally {
        savingEntriesRef.current.delete(local_id);
        if (pendingSaveRef.current.has(local_id)) {
          pendingSaveRef.current.delete(local_id);
          setTimeout(() => { void saveEntry(local_id); }, 50);
        }
      }
    },
    [rapportId, directionId]
  );

  const reload = useCallback(async (): Promise<FacilityEntry[]> => {
    if (!rapportId || !directionId) {
      setItems([]);
      return [];
    }

    setLoading(true);

    try {
      const { data: etabsData, error: etabsError } = await supabase
        .from('etablissements')
        .select('*')
        .eq('direction_id', directionId)
        .eq('est_actif', true)
        .eq('type_etablissement', 'maison_jeunes')
        .order('nom', { ascending: true });

      if (etabsError) throw etabsError;

      const etablissementsRows = etabsData ?? [];
      const etablissementIds = etablissementsRows.map((e) => e.id);

      let historiqueSuivi: any[] = [];
      let historiqueFermetures: any[] = [];

      if (etablissementIds.length > 0) {
        const [{ data: sData }, { data: fData }] = await Promise.all([
          supabase.from('suivi_projets').select('*').in('etablissement_id', etablissementIds),
          supabase.from('fermetures').select('*').in('etablissement_id', etablissementIds),
        ]);
        historiqueSuivi = sData ?? [];
        historiqueFermetures = fData ?? [];
      }

      const localIdByEtabId = new Map(
        itemsRef.current
          .filter((it): it is InternalFacilityEntry & { id: string } => typeof it.id === 'string')
          .map((it) => [it.id, it.local_id] as const)
      );

      const normalizedItems: InternalFacilityEntry[] = etablissementsRows.map((etab) => {
        const suiviActuel = historiqueSuivi.find((s) => s.etablissement_id === etab.id && s.rapport_id === rapportId);
        const dernierSuivi = historiqueSuivi.find((s) => s.etablissement_id === etab.id);
        const suiviAffiche = suiviActuel ?? dernierSuivi;

        // 🛡️ RECHERCHE ROBUSTE : Priorité à la fermeture de ce rapport, sinon la plus récente
        const fermetureRapport = historiqueFermetures.find(
          (f) => f.etablissement_id === etab.id && f.rapport_id === rapportId
        );
        const fermetureDerniere = historiqueFermetures.find(
          (f) => f.etablissement_id === etab.id
        );
        const fermetureAssociee = fermetureRapport ?? fermetureDerniere;

        const statutAffiche = suiviActuel?.statut ?? dernierSuivi?.statut ?? 'operationnel';
        const causeAffiche = statutAffiche === 'ferme' ? fermetureAssociee?.type_fermeture_id ?? '' : '';

        const local_id = localIdByEtabId.get(etab.id) ?? crypto.randomUUID();

        return {
          local_id,
          id: etab.id,
          name: etab.nom ?? '',
          project_status: statutAffiche,
          other_status: normalizeClosureStatus(causeAffiche),
          closure_status: normalizeClosureStatus(causeAffiche),
          autre_precision: fermetureAssociee?.autre_precision ?? '',
          suivi_projet_id: suiviActuel?.id,
          fermeture_id: fermetureAssociee?.id,
        };
      });

      setItems((prev) => {
        const merged = normalizedItems.map((serverItem) => {
          const currentItem = prev.find((item) => item.local_id === serverItem.local_id);
          const hasPendingLocalChange =
            Boolean(saveTimersRef.current[serverItem.local_id]) ||
            savingEntriesRef.current.has(serverItem.local_id) ||
            pendingSaveRef.current.has(serverItem.local_id);

          return currentItem && hasPendingLocalChange ? currentItem : serverItem;
        });

        const unsavedLocalItems = prev.filter((item) => !item.id && !merged.some((m) => m.local_id === item.local_id));
        return [...merged, ...unsavedLocalItems];
      });

      return normalizedItems.map(toPublicEntry);
    } catch (e) {
      console.error('[useEtablissementEntries] reload error:', e);
      return [];
    } finally {
      setLoading(false);
    }
  }, [directionId, rapportId]);

useEffect(() => {
    let cancelled = false;
    
    // Si désactivé, vider les items et retourner
    if (!enabled) {
      setItems([]);
      setLoading(false);
      return;
    }
    
    if (!rapportId || !directionId) {
      setItems([]);
      setLoading(false);
      return;
    }
 
    (async () => {
      if (!cancelled) await reload();
    })();
 
    return () => { cancelled = true; };
  }, [directionId, rapportId, reload, enabled]);

  const add = useCallback(
    async (entry: FacilityEntry): Promise<boolean> => {
      if (!rapportId || !directionId) return false;

      const localId = entry.local_id || crypto.randomUUID();
      const optimisticEntry: InternalFacilityEntry = {
        ...entry,
        local_id: localId,
        id: undefined,
        suivi_projet_id: undefined,
        fermeture_id: undefined,
        name: entry.name ?? '',
        autre_precision: entry.autre_precision ?? '',
      };

      setItems((prev) => [...prev, optimisticEntry]);
      return true;
    },
    [directionId, rapportId]
  );

  const update = useCallback(
    async (local_id: string, patch: Partial<FacilityEntry>): Promise<boolean> => {
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
    [updateLocal, saveEntry]
  );

  const remove = useCallback(
    async (local_id: string): Promise<boolean> => {
      const existing = itemsRef.current.find((item) => item.local_id === local_id);
      if (!existing) return false;

      setItems((prev) => prev.filter((item) => item.local_id !== local_id));

      if (existing.id) {
        try {
          await supabase.from('etablissements').update({ est_actif: false }).eq('id', existing.id);
        } catch (error) {
          console.error('[useEtablissementEntries] remove error:', error);
        }
      }
      return true;
    },
    []
  );

  const publicItems = useMemo(() => items.map(toPublicEntry), [items]);

  return {
    items: publicItems,
    loading,
    reload,
    add,
    update,
    remove,
  };
}