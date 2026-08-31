import { useEntityEntries, BaseEntry } from '../common/useEntityEntries';

export interface AfPortesOuvertesEntry extends BaseEntry {
  etablissement_id: string;
  type_activite_id: string;
  contenu_activite: string;
  nombre_beneficiaires: number;
  partenaires: string;
  evaluation: string;
}

const buildPayload = (entry: AfPortesOuvertesEntry, rId: string) => ({
  ...(entry.id ? { id: entry.id } : {}),
  rapport_id: rId,
  etablissement_id: entry.etablissement_id || null,
  type_activite_id: entry.type_activite_id || null,
  contenu_activite: entry.contenu_activite?.trim() || null,
  nombre_beneficiaires: Number(entry.nombre_beneficiaires) || 0,
  partenaires: entry.partenaires?.trim() || null,
  evaluation: entry.evaluation?.trim() || null,
});

const mapRowToEntry = (row: any, local_id: string): AfPortesOuvertesEntry => ({
  local_id,
  id: row.id,
  etablissement_id: row.etablissement_id ?? '',
  type_activite_id: row.type_activite_id ?? '',
  contenu_activite: row.contenu_activite ?? '',
  nombre_beneficiaires: row.nombre_beneficiaires ?? 0,
  partenaires: row.partenaires ?? '',
  evaluation: row.evaluation ?? '',
});

export function useAfPortesOuvertes(rapportId: string | null, options?: { enabled?: boolean }) {
  return useEntityEntries<AfPortesOuvertesEntry>({
    rapportId,
    tableName: 'af_portes_ouvertes',
    buildPayload,
    mapRowToEntry,
    enabled: options?.enabled ?? true,
    // 🛡️ Valide si un établissement ou du contenu est spécifié
    validateBeforeSave: (entry) => Boolean(entry.etablissement_id || entry.contenu_activite?.trim()),
  });
}