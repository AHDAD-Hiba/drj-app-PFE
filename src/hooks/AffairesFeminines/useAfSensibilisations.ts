import { useEntityEntries, BaseEntry } from "../common/useEntityEntries";

export interface AfSensibilisationEntry extends BaseEntry {
  type_activite_id: string;
  lieu: string;
  sujet: string;
  date_activite: string;
  partenaires: string;
  benef_urbain: number;
  benef_rural: number;
  resultats_evaluation: string;
}

const buildPayload = (entry: AfSensibilisationEntry, rId: string) => ({
  ...(entry.id ? { id: entry.id } : {}),
  rapport_id: rId,
  type_activite_id: entry.type_activite_id || null,
  lieu: entry.lieu?.trim() || null,
  sujet: entry.sujet?.trim() || null,
  date_activite: entry.date_activite || null,
  partenaires: entry.partenaires?.trim() || null,
  benef_urbain: Number(entry.benef_urbain) || 0,
  benef_rural: Number(entry.benef_rural) || 0,
  resultats_evaluation: entry.resultats_evaluation?.trim() || null,
});

const mapRowToEntry = (row: any, local_id: string): AfSensibilisationEntry => ({
  local_id,
  id: row.id,
  type_activite_id: row.type_activite_id ?? "",
  lieu: row.lieu ?? "",
  sujet: row.sujet ?? "",
  date_activite: row.date_activite ?? "",
  partenaires: row.partenaires ?? "",
  benef_urbain: row.benef_urbain ?? 0,
  benef_rural: row.benef_rural ?? 0,
  resultats_evaluation: row.resultats_evaluation ?? "",
});

export function useAfSensibilisations(rapportId: string | null, options?: { enabled?: boolean }) {
  return useEntityEntries<AfSensibilisationEntry>({
    rapportId,
    tableName: "af_activites_sensibilisation",
    buildPayload,
    mapRowToEntry,
    enabled: options?.enabled ?? true,
    // 🛡️ Valide si un sujet, lieu ou type d'activité est spécifié
    validateBeforeSave: (entry) =>
      Boolean(entry.sujet?.trim() || entry.lieu?.trim() || entry.type_activite_id),
  });
}
