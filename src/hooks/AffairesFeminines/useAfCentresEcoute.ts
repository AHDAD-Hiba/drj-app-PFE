import { useEntityEntries, BaseEntry } from './useEntityEntries';

export interface AfCentreEcouteEntry extends BaseEntry {
  etablissement_id: string;
  type_soutien: string;
  nombre_seances: number;
  nombre_cas?: number; // Optionnel car pas dans le SQL d'origine
}

const buildPayload = (entry: AfCentreEcouteEntry, rId: string) => ({
  ...(entry.id ? { id: entry.id } : {}),
  rapport_id: rId,
  etablissement_id: entry.etablissement_id || null,
  type_soutien: entry.type_soutien || null,
  nombre_seances: entry.nombre_seances || 0,
  nombre_cas: entry.nombre_cas || 0, 
});

const mapRowToEntry = (row: any, local_id: string): AfCentreEcouteEntry => ({
  local_id,
  id: row.id,
  etablissement_id: row.etablissement_id ?? '',
  type_soutien: row.type_soutien ?? '',
  nombre_seances: row.nombre_seances ?? 0,
  nombre_cas: row.nombre_cas ?? 0,
});

export function useAfCentresEcoute(rapportId: string | null) {
  return useEntityEntries<AfCentreEcouteEntry>({
    rapportId,
    tableName: 'af_centres_ecoute',
    buildPayload,
    mapRowToEntry,
  });
}