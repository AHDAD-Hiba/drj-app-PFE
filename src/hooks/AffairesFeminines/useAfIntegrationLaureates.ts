import { useEntityEntries, BaseEntry } from '../common/useEntityEntries';

export interface AfIntegrationLaureateEntry extends BaseEntry {
  type_formation: string;
  nombre_laureates: number;
  nombre_integrees: number;
}

const buildPayload = (entry: AfIntegrationLaureateEntry, rId: string) => ({
  ...(entry.id ? { id: entry.id } : {}),
  rapport_id: rId,
  type_formation: entry.type_formation?.trim() || null,
  nombre_laureates: Number(entry.nombre_laureates) || 0,
  nombre_integrees: Number(entry.nombre_integrees) || 0,
});

const mapRowToEntry = (row: any, local_id: string): AfIntegrationLaureateEntry => ({
  local_id,
  id: row.id,
  type_formation: row.type_formation ?? '',
  nombre_laureates: row.nombre_laureates ?? 0,
  nombre_integrees: row.nombre_integrees ?? 0,
});

export function useAfIntegrationLaureates(rapportId: string | null, options?: { enabled?: boolean }) {
  return useEntityEntries<AfIntegrationLaureateEntry>({
    rapportId,
    tableName: 'af_integration_laureates',
    buildPayload,
    mapRowToEntry,
    enabled: options?.enabled ?? true,
    // 🛡️ Sauvegarde si le type de formation est rempli
    validateBeforeSave: (entry) => Boolean(entry.type_formation?.trim()),
  });
}