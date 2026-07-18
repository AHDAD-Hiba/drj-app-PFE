import { useEntityEntries, BaseEntry } from './useEntityEntries';

export interface AfFormationCadreEntry extends BaseEntry {
  nombre_cadres: number;
  domaine_formation: string;
  duree_valeur: number;
  unite_duree: string; // 'heures', 'jours', 'mois'
  observations: string;
}

const buildPayload = (entry: AfFormationCadreEntry, rId: string) => ({
  ...(entry.id ? { id: entry.id } : {}),
  rapport_id: rId,
  nombre_cadres: entry.nombre_cadres || 0,
  domaine_formation: entry.domaine_formation || null,
  duree_valeur: entry.duree_valeur || 0,
  unite_duree: entry.unite_duree || null,
  observations: entry.observations || null,
});

const mapRowToEntry = (row: any, local_id: string): AfFormationCadreEntry => ({
  local_id,
  id: row.id,
  nombre_cadres: row.nombre_cadres ?? 0,
  domaine_formation: row.domaine_formation ?? '',
  duree_valeur: row.duree_valeur ?? 0,
  unite_duree: row.unite_duree ?? '',
  observations: row.observations ?? '',
});

export function useAfFormationCadres(rapportId: string | null) {
  return useEntityEntries<AfFormationCadreEntry>({
    rapportId,
    tableName: 'af_formation_cadres',
    buildPayload,
    mapRowToEntry,
  });
}