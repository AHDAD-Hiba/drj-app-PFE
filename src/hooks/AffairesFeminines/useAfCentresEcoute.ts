import { useEntityEntries, BaseEntry } from "../common/useEntityEntries";

export interface AfCentreEcouteEntry extends BaseEntry {
  etablissement_id: string;
  type_soutien: string;
  nombre_seances: number;
  nombre_cas?: number;
}

const buildPayload = (entry: AfCentreEcouteEntry, rId: string) => ({
  ...(entry.id ? { id: entry.id } : {}),
  rapport_id: rId,
  etablissement_id: entry.etablissement_id || null,
  type_soutien: entry.type_soutien?.trim() || null,
  nombre_seances: Number(entry.nombre_seances) || 0,
  nombre_cas: Number(entry.nombre_cas) || 0,
});

const mapRowToEntry = (row: any, local_id: string): AfCentreEcouteEntry => ({
  local_id,
  id: row.id,
  etablissement_id: row.etablissement_id ?? "",
  type_soutien: row.type_soutien ?? "",
  nombre_seances: Number(row.nombre_seances) ?? 0,
  nombre_cas: Number(row.nombre_cas) ?? 0,
});

export function useAfCentresEcoute(rapportId: string | null, options?: { enabled?: boolean }) {
  return useEntityEntries<AfCentreEcouteEntry>({
    rapportId,
    tableName: "af_centres_ecoute",
    buildPayload,
    mapRowToEntry,
    enabled: options?.enabled ?? true,
    // 🛡️ Garde-fou : Ne déclenche l'upsert BDD que si un établissement ou un type de soutien est sélectionné
    validateBeforeSave: (entry) => Boolean(entry.etablissement_id || entry.type_soutien?.trim()),
  });
}
