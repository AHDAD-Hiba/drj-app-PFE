import { useEntityEntries, BaseEntry } from './useEntityEntries';

export interface AfIntegrationLaureateEntry extends BaseEntry {
  type_formation: string;
  nombre_laureates: number;
  nombre_integrees: number;
}

const buildPayload = (entry: AfIntegrationLaureateEntry, rId: string) => ({
  ...(entry.id ? { id: entry.id } : {}),
  rapport_id: rId,
  type_formation: entry.type_formation || null,
  nombre_laureates: entry.nombre_laureates || 0,
  nombre_integrees: entry.nombre_integrees || 0,
});

const mapRowToEntry = (row: any, local_id: string): AfIntegrationLaureateEntry => ({
  local_id,
  id: row.id,
  type_formation: row.type_formation ?? '',
  nombre_laureates: row.nombre_laureates ?? 0,
  nombre_integrees: row.nombre_integrees ?? 0,
});

export function useAfIntegrationLaureates(rapportId: string | null) {
  return useEntityEntries<AfIntegrationLaureateEntry>({
    rapportId,
    tableName: 'af_integration_laureates',
    buildPayload,
    mapRowToEntry,
  });
}