import { useEntityEntries, BaseEntry } from '../common/useEntityEntries';

export interface AfFormationCadreEntry extends BaseEntry {
  nombre_cadres: number;
  domaine_formation: string;
  duree_valeur: number;
  unite_duree: string; // 'heure', 'jour', 'semaine', 'mois'
  observations: string;
}

const buildPayload = (entry: AfFormationCadreEntry, rId: string) => ({
  ...(entry.id ? { id: entry.id } : {}),
  rapport_id: rId,
  nombre_cadres: Number(entry.nombre_cadres) || 0,
  domaine_formation: entry.domaine_formation?.trim() || null,
  duree_valeur: Number(entry.duree_valeur) || 0,
  unite_duree: entry.unite_duree || null,
  observations: entry.observations?.trim() || null,
});

const mapRowToEntry = (row: any, local_id: string): AfFormationCadreEntry => ({
  local_id,
  id: row.id,
  nombre_cadres: Number(row.nombre_cadres) ?? 0,
  domaine_formation: row.domaine_formation ?? '',
  duree_valeur: Number(row.duree_valeur) ?? 0,
  unite_duree: row.unite_duree ?? '',
  observations: row.observations ?? '',
});

export function useAfFormationCadres(rapportId: string | null, options?: { enabled?: boolean }) {
  return useEntityEntries<AfFormationCadreEntry>({
    rapportId,
    tableName: 'af_formation_cadres',
    buildPayload,
    mapRowToEntry,
    enabled: options?.enabled ?? true,
    // 🛡️ Valide si un domaine de formation ou un nombre de cadres est saisi
    validateBeforeSave: (entry) => Boolean(entry.domaine_formation?.trim() || entry.nombre_cadres > 0),
  });
}