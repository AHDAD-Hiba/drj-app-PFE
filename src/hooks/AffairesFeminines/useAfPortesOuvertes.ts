import { useEntityEntries, BaseEntry } from '../common/useEntityEntries';

export interface AfPortesOuvertesEntry extends BaseEntry {
  etablissement_id: string;
  type_activite_id: string;
  contenu_activite: string;
  nombre_beneficiaires: number;
  partenaires: string;
  evaluation: string;
}

// Fonctions sorties du hook pour la stabilité
const buildPayload = (entry: AfPortesOuvertesEntry, rId: string) => ({
  ...(entry.id ? { id: entry.id } : {}),
  rapport_id: rId,
  etablissement_id: entry.etablissement_id || null,
  type_activite_id: entry.type_activite_id || null,
  contenu_activite: entry.contenu_activite || null,
  nombre_beneficiaires: entry.nombre_beneficiaires || 0,
  partenaires: entry.partenaires || null,
  evaluation: entry.evaluation || null,
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

export function useAfPortesOuvertes(rapportId: string | null) {
  return useEntityEntries<AfPortesOuvertesEntry>({
    rapportId,
    tableName: 'af_portes_ouvertes',
    buildPayload,
    mapRowToEntry,
  });
}