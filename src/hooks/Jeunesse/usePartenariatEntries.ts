import { useEntityEntries, BaseEntry } from '@/hooks/common/useEntityEntries';

export interface PartenariatEntry extends BaseEntry {
  type_partenaire_id: string;
  autre_partenaire?: string;
  nombre_conventions: number;
}

const buildPayload = (entry: PartenariatEntry, rId: string) => ({
  ...(entry.id ? { id: entry.id } : {}),
  rapport_id: rId,
  type_partenaire_id: entry.type_partenaire_id || null,
  autre_partenaire: entry.autre_partenaire || null,
  nombre_conventions: Number(entry.nombre_conventions) || 0,
});

const mapRowToEntry = (row: any, local_id: string): PartenariatEntry => ({
  local_id,
  id: row.id,
  type_partenaire_id: row.type_partenaire_id ?? '',
  autre_partenaire: row.autre_partenaire ?? '',
  nombre_conventions: Number(row.nombre_conventions) || 0,
});

export function usePartenariatEntries(rapportId: string | null) {
  return useEntityEntries<PartenariatEntry>({
    rapportId,
    tableName: 'partenariats',
    buildPayload,
    mapRowToEntry,
    buildConflictTarget: (entry) =>
      entry.id ? 'id' : 'rapport_id,type_partenaire_id,autre_partenaire',
    // 🛡️ N'enregistre pas en BDD si aucun type de partenaire n'est sélectionné
    validateBeforeSave: (entry) => Boolean(entry.type_partenaire_id),
  });
}