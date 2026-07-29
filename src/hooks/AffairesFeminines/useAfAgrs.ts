import { useEntityEntries, BaseEntry } from '../common/useEntityEntries';

export interface AfAgrEntry extends BaseEntry {
  etablissement_id: string;
  nombre_beneficiaires: number;
  partenaires: string;
  observations: string;
}

const buildPayload = (entry: AfAgrEntry, rId: string) => ({
  ...(entry.id ? { id: entry.id } : {}),
  rapport_id: rId,
  etablissement_id: entry.etablissement_id || null,
  nombre_beneficiaires: entry.nombre_beneficiaires || 0,
  partenaires: entry.partenaires || null,
  observations: entry.observations || null,
});

const mapRowToEntry = (row: any, local_id: string): AfAgrEntry => ({
  local_id,
  id: row.id,
  etablissement_id: row.etablissement_id ?? '',
  nombre_beneficiaires: row.nombre_beneficiaires ?? 0,
  partenaires: row.partenaires ?? '',
  observations: row.observations ?? '',
});

export function useAfAgrs(rapportId: string | null) {
  return useEntityEntries<AfAgrEntry>({
    rapportId,
    tableName: 'af_activites_generatrices_revenus',
    buildPayload,
    mapRowToEntry,
  });
}