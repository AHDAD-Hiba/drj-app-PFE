import { useEntityEntries, BaseEntry } from '@/hooks/common/useEntityEntries';

export interface ActiviteEntry extends BaseEntry {
  type_activite: 'permanente' | 'rayonnante';
  nombre_associations: number;
  nombre_clubs: number;
  nombre_conventions: number;
  activites_educatives: number;
  activites_culturelles: number;
  activites_sportives: number;
  renforcement_capacites: number;
}

const buildPayload = (entry: ActiviteEntry, rId: string) => ({
  ...(entry.id ? { id: entry.id } : {}),
  rapport_id: rId,
  type_activite: entry.type_activite,
  nombre_associations: Number(entry.nombre_associations) || 0,
  nombre_clubs: Number(entry.nombre_clubs) || 0,
  nombre_conventions: Number(entry.nombre_conventions) || 0,
  activites_educatives: Number(entry.activites_educatives) || 0,
  activites_culturelles: Number(entry.activites_culturelles) || 0,
  activites_sportives: Number(entry.activites_sportives) || 0,
  renforcement_capacites: Number(entry.renforcement_capacites) || 0,
});

const mapRowToEntry = (row: any, local_id: string): ActiviteEntry => ({
  local_id,
  id: row.id,
  type_activite: row.type_activite,
  nombre_associations: Number(row.nombre_associations) || 0,
  nombre_clubs: Number(row.nombre_clubs) || 0,
  nombre_conventions: Number(row.nombre_conventions) || 0,
  activites_educatives: Number(row.activites_educatives) || 0,
  activites_culturelles: Number(row.activites_culturelles) || 0,
  activites_sportives: Number(row.activites_sportives) || 0,
  renforcement_capacites: Number(row.renforcement_capacites) || 0,
});

export function useActivitesEntries(rapportId: string | null , options?: { enabled?: boolean }) {
  return useEntityEntries<ActiviteEntry>({
    rapportId,
    tableName: 'activites',
    buildPayload,
    mapRowToEntry,
    buildConflictTarget: () => 'rapport_id,type_activite',
    enabled: options?.enabled ?? true,
  });
}