import { useEntityEntries, BaseEntry } from './useEntityEntries';

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

// Fonctions sorties du hook pour la stabilité
const buildPayload = (entry: AfSensibilisationEntry, rId: string) => ({
  ...(entry.id ? { id: entry.id } : {}),
  rapport_id: rId,
  type_activite_id: entry.type_activite_id || null,
  lieu: entry.lieu || null,
  sujet: entry.sujet || null,
  date_activite: entry.date_activite || null,
  partenaires: entry.partenaires || null,
  benef_urbain: entry.benef_urbain || 0,
  benef_rural: entry.benef_rural || 0,
  resultats_evaluation: entry.resultats_evaluation || null,
});

const mapRowToEntry = (row: any, local_id: string): AfSensibilisationEntry => ({
  local_id,
  id: row.id,
  type_activite_id: row.type_activite_id ?? '',
  lieu: row.lieu ?? '',
  sujet: row.sujet ?? '',
  date_activite: row.date_activite ?? '',
  partenaires: row.partenaires ?? '',
  benef_urbain: row.benef_urbain ?? 0,
  benef_rural: row.benef_rural ?? 0,
  resultats_evaluation: row.resultats_evaluation ?? '',
});

export function useAfSensibilisations(rapportId: string | null) {
  return useEntityEntries<AfSensibilisationEntry>({
    rapportId,
    tableName: 'af_activites_sensibilisation',
    buildPayload,
    mapRowToEntry,
  });
}