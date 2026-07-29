import { useEntityEntries, BaseEntry } from '../common/useEntityEntries';

// ============================================================================
// 1. ANALYSES APPROFONDIES (cr_analyses_ponctuelles)
// ============================================================================
export interface CrAnalysesPonctuellesEntry extends BaseEntry {
  sujet: string;
  nombre_beneficiaires: number;
  explications?: string;
  observations?: string;
}

const buildAnalysePayload = (entry: CrAnalysesPonctuellesEntry, rId: string) => ({
  ...(entry.id ? { id: entry.id } : {}),
  rapport_id: rId,
  sujet: entry.sujet || '',
  nombre_beneficiaires: Number(entry.nombre_beneficiaires) || 0,
  explications: entry.explications || '',
  observations: entry.observations || '',
});

const mapAnalyseRow = (row: any, local_id: string): CrAnalysesPonctuellesEntry => ({
  local_id,
  id: row.id,
  sujet: row.sujet || '',
  nombre_beneficiaires: Number(row.nombre_beneficiaires) || 0,
  explications: row.explications || '',
  observations: row.observations || '',
});

export function useCrAnalysesPonctuelles(rapportId: string | null) {
  return useEntityEntries<CrAnalysesPonctuellesEntry>({
    rapportId,
    tableName: 'cr_analyses_ponctuelles',
    buildPayload: buildAnalysePayload,
    mapRowToEntry: mapAnalyseRow,
  });
}

// ============================================================================
// 2. SONDAGES ET ÉTUDES (cr_sondages_etudes)
// ============================================================================
export interface CrSondagesEtudesEntry extends BaseEntry {
  type_sondage: string;
  nombre_participants: number;
  resultats?: string;
  observations?: string;
}

const buildSondagePayload = (entry: CrSondagesEtudesEntry, rId: string) => ({
  ...(entry.id ? { id: entry.id } : {}),
  rapport_id: rId,
  type_sondage: entry.type_sondage || '',
  nombre_participants: Number(entry.nombre_participants) || 0,
  resultats: entry.resultats || '',
  observations: entry.observations || '',
});

const mapSondageRow = (row: any, local_id: string): CrSondagesEtudesEntry => ({
  local_id,
  id: row.id,
  type_sondage: row.type_sondage || '',
  nombre_participants: Number(row.nombre_participants) || 0,
  resultats: row.resultats || '',
  observations: row.observations || '',
});

export function useCrSondagesEtudes(rapportId: string | null) {
  return useEntityEntries<CrSondagesEtudesEntry>({
    rapportId,
    tableName: 'cr_sondages_etudes',
    buildPayload: buildSondagePayload,
    mapRowToEntry: mapSondageRow,
  });
}