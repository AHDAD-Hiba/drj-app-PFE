import { useEntityEntries, BaseEntry } from '../common/useEntityEntries';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/common/useAuth';

export interface AfMouvementEntry extends BaseEntry {
  etablissement_id: string | null;
  nom_etablissement: string;
  type_mise_a_jour: string;
  type_etablissement: string;
  statut_juridique: string;
  date_mouvement: string;
  raisons: string;
  suggestions: string;
  observations: string;
  is_new_entry?: boolean;
}

const buildPayload = (entry: AfMouvementEntry, rId: string) => ({
  ...(entry.id ? { id: entry.id } : {}),
  rapport_id: rId,
  etablissement_id: entry.etablissement_id ?? null,
  nom_etablissement: entry.nom_etablissement?.trim() || '',
  type_mise_a_jour: entry.type_mise_a_jour === 'sans_changement' ? null : (entry.type_mise_a_jour || 'nouvel'),
  type_etablissement: entry.type_etablissement || 'club_feminin',
  statut_juridique: entry.statut_juridique?.trim() || null,
  date_mouvement: entry.date_mouvement || null,
  raisons: entry.raisons?.trim() || null,
  suggestions: entry.suggestions?.trim() || null,
  observations: entry.observations?.trim() || null,
});

const mapRowToEntry = (row: any, local_id: string): AfMouvementEntry => ({
  local_id,
  id: row.id,
  etablissement_id: row.etablissement_id,
  nom_etablissement: row.nom_etablissement ?? '',
  type_mise_a_jour: row.type_mise_a_jour ?? 'sans_changement',
  type_etablissement: row.type_etablissement ?? 'club_feminin',
  statut_juridique: row.statut_juridique ?? '',
  date_mouvement: row.date_mouvement ?? '',
  raisons: row.raisons ?? '',
  suggestions: row.suggestions ?? '',
  observations: row.observations ?? '',
  is_new_entry: !row.etablissement_id,
});

export function useAfMiseAJourReseau(rapportId: string | null, options?: { enabled?: boolean }) {
  const { utilisateur } = useAuth();
  const directionId = utilisateur?.direction_id;

  const baseHook = useEntityEntries<AfMouvementEntry>({
    rapportId,
    tableName: 'af_mise_a_jour_reseau',
    buildPayload,
    mapRowToEntry,
    enabled: options?.enabled ?? true,
    // 🛡️ Garde-fou : Ne sauvegarde que si le nom de l'établissement ou une mise à jour est spécifiée
    validateBeforeSave: (entry) => Boolean(entry.nom_etablissement?.trim() || (entry.type_mise_a_jour && entry.type_mise_a_jour !== 'sans_changement')),
  });

  const syncEtablissement = async (patch: Partial<AfMouvementEntry>, currentItem?: AfMouvementEntry) => {
    const nomToSave = patch.nom_etablissement !== undefined ? patch.nom_etablissement : currentItem?.nom_etablissement;
    const typeToSave = patch.type_etablissement !== undefined ? patch.type_etablissement : currentItem?.type_etablissement;
    const etabId = patch.etablissement_id || currentItem?.etablissement_id;

    if (directionId && nomToSave && nomToSave.trim() !== '') {
      const { data, error } = await supabase
        .from('etablissements')
        .upsert(
          {
            ...(etabId ? { id: etabId } : {}),
            nom: nomToSave.trim(),
            type_etablissement: (typeToSave || 'club_feminin') as any,
            direction_id: directionId,
            est_actif: true
          },
          { onConflict: etabId ? 'id' : 'direction_id,nom' }
        )
        .select()
        .single();
        
      if (error) console.error("Erreur sync Etablissement:", error);
      if (data) return data.id;
    }
    return null;
  };

  const customAdd = async (entry: AfMouvementEntry) => {
    const finalEntry = { ...entry };
    const newEtabId = await syncEtablissement(entry);
    if (newEtabId) finalEntry.etablissement_id = newEtabId; 
    return baseHook.add(finalEntry);
  };

  const customUpdate = async (local_id: string, patch: Partial<AfMouvementEntry>) => {
    const finalPatch = { ...patch };
    const currentItem = baseHook.items.find(i => i.local_id === local_id);
    const newEtabId = await syncEtablissement(patch, currentItem);
    if (newEtabId) finalPatch.etablissement_id = newEtabId; 
    return baseHook.update(local_id, finalPatch);
  };

  return {
    ...baseHook,
    add: customAdd,
    update: customUpdate,
  };
}