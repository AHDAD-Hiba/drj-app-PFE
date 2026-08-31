import { useCallback } from 'react';
import { useEntityEntries, BaseEntry } from '@/hooks/common/useEntityEntries';

export interface AssociationValue extends BaseEntry {
  categorie_association_id: string;
  nombre_associations: number;
}

const buildPayload = (entry: AssociationValue, rapportId: string) => ({
  rapport_id: rapportId,
  categorie_association_id: entry.categorie_association_id,
  nombre_associations: Number(entry.nombre_associations) || 0,
});

const mapRowToEntry = (row: any, localId: string): AssociationValue => ({
  local_id: localId,
  id: row.id,
  categorie_association_id: row.categorie_association_id,
  nombre_associations: Number(row.nombre_associations) || 0,
});

export function useAssociationValues(rapportId: string | null , options?: { enabled?: boolean }) {
  const entity = useEntityEntries<AssociationValue>({
    rapportId,
    tableName: 'valeurs_associations',
    buildPayload,
    mapRowToEntry,
    buildConflictTarget: () => 'rapport_id,categorie_association_id',
    validateBeforeSave: (entry) =>
      Boolean(entry.categorie_association_id) && Number(entry.nombre_associations) > 0,
    enabled: options?.enabled ?? true,
  });

  const setValue = useCallback(
    async (categorieId: string, count: number) => {
      const safeCount = Math.max(0, Number(count) || 0);

      const existing = entity.items.find(
        (item) => item.categorie_association_id === categorieId
      );

      if (safeCount > 0) {
        if (existing) {
          // 🎯 CAS 1 : L'entrée existe -> Mise à jour standard qui déclenche l'autosave
          return entity.update(existing.local_id, { nombre_associations: safeCount });
        } else {
          // 🎯 CAS 2 : L'entrée n'existe pas -> On crée avec `add` PUIS on force l'autosave via `update`
          const newLocalId = crypto.randomUUID();
          
          await entity.add({
            local_id: newLocalId,
            categorie_association_id: categorieId,
            nombre_associations: safeCount,
          });

          // 🛡️ DÉCLENCHEMENT FORCÉ DE L'AUTOSAVE :
          // Comme `add` ne démarre pas de timer, on fait immédiatement un `update` sur le `newLocalId`
          // ce qui active le timer d'autosave de `useEntityEntries` pour cette nouvelle ligne !
          return entity.update(newLocalId, { nombre_associations: safeCount });
        }
      } else {
        // 🎯 CAS 3 : Remis à 0 -> Suppression de la ligne
        if (existing) {
          return entity.remove(existing.local_id);
        }
      }
      return true;
    },
    [entity]
  );

  return {
    ...entity,
    setValue,
  };
}