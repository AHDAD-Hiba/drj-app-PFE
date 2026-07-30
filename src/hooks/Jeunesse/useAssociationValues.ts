import { useEntityEntries, BaseEntry } from '@/hooks/common/useEntityEntries';

export interface AssociationValue extends BaseEntry {
  categorie_association_id: string;
  nombre_associations: number;
}

const buildPayload = (entry: AssociationValue, rapportId: string) => ({
  ...(entry.id ? { id: entry.id } : {}),
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

export function useAssociationValues(rapportId: string | null) {
  return useEntityEntries<AssociationValue>({
    rapportId,
    tableName: 'valeurs_associations',
    buildPayload,
    mapRowToEntry,
    buildConflictTarget: (entry) =>
      entry.id ? 'id' : 'rapport_id,categorie_association_id',
    // 🛡️ S'assure que la catégorie est définie avant la sauvegarde
    validateBeforeSave: (entry) => Boolean(entry.categorie_association_id),
  });
}