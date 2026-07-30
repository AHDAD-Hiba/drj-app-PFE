import { useEntityEntries, BaseEntry } from '../common/useEntityEntries';

export interface AfAgrEntry extends BaseEntry {
  etablissement_id: string;
  nombre_beneficiaires: number;
  partenaires: string;
}

const buildPayload = (entry: AfAgrEntry, rId: string) => ({
  ...(entry.id ? { id: entry.id } : {}),
  rapport_id: rId,
  etablissement_id: entry.etablissement_id || null,
  nombre_beneficiaires: Number(entry.nombre_beneficiaires) || 0,
  partenaires: entry.partenaires?.trim() || null,
});

const mapRowToEntry = (row: any, local_id: string): AfAgrEntry => ({
  local_id,
  id: row.id,
  etablissement_id: row.etablissement_id ?? '',
  nombre_beneficiaires: row.nombre_beneficiaires ?? 0,
  partenaires: row.partenaires ?? '',
});

export function useAfAgrs(rapportId: string | null) {
  return useEntityEntries<AfAgrEntry>({
    rapportId,
    tableName: 'af_activites_generatrices_revenus',
    buildPayload,
    mapRowToEntry,
    // 🛡️ Sauvegarde si un établissement ou partenaire est saisi
    validateBeforeSave: (entry) => Boolean(entry.etablissement_id || entry.partenaires?.trim()),
  });
}