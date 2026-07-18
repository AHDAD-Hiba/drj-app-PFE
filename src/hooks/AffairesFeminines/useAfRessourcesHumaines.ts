import { useEntityEntries, BaseEntry } from './useEntityEntries';

export interface AfRessourceHumaineEntry extends BaseEntry {
  etablissement_id: string;
  type_rh: string; // 'disponible' ou 'besoin'
  profile: string;
  mission: string;
  nombre: number;
  observations: string;
}


const buildPayload = (entry: AfRessourceHumaineEntry, rId: string) => ({
  ...(entry.id ? { id: entry.id } : {}),
  rapport_id: rId,
  etablissement_id: entry.etablissement_id || null,
  type_rh: entry.type_rh || null,
  profile: entry.profile || null,
  mission: entry.mission || null,
  nombre: entry.nombre || 0,
  observations: entry.observations || null,
});

const mapRowToEntry = (row: any, local_id: string): AfRessourceHumaineEntry => ({
  local_id,
  id: row.id,
  etablissement_id: row.etablissement_id ?? '',
  type_rh: row.type_rh ?? '',
  profile: row.profile ?? '',
  mission: row.mission ?? '',
  nombre: row.nombre ?? 0,
  observations: row.observations ?? '',
});

export function useAfRessourcesHumaines(rapportId: string | null) {
  return useEntityEntries<AfRessourceHumaineEntry>({
    rapportId,
    tableName: 'af_ressources_humaines',
    buildPayload,
    mapRowToEntry,
  });
}