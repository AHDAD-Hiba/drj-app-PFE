import { useEntityEntries, BaseEntry } from '../common/useEntityEntries';

// ============================================================================
// 1. STATISTIQUES & INTEGRATION (pe_statistiques_demographiques)
// ============================================================================
export interface PeStatsLSEntry extends BaseEntry {
  type_prise_charge: 'liberte_surveillee' | 'centre_sauvegarde'; // On autorise les deux pour le filtrage
  garcons: number;
  filles: number;
  migrants_non_accompagnes: number; // AJOUT DU CHAMP MIGRANTS
  ls_integres_enseignement: number;
  ls_integres_formation_pro: number;
  ls_integres_apprentissage: number;
  ls_integres_activites_durables: number;
}

const buildStatsLSPayload = (entry: PeStatsLSEntry, rId: string) => ({
  ...(entry.id ? { id: entry.id } : {}),
  rapport_id: rId,
  etablissement_id: null,
  type_prise_charge: 'liberte_surveillee', // À la sauvegarde, on force toujours LS
  garcons: Number(entry.garcons) || 0,
  filles: Number(entry.filles) || 0,
  migrants_non_accompagnes: Number(entry.migrants_non_accompagnes) || 0, // AJOUT DU CHAMP
  ls_integres_enseignement: Number(entry.ls_integres_enseignement) || 0,
  ls_integres_formation_pro: Number(entry.ls_integres_formation_pro) || 0,
  ls_integres_apprentissage: Number(entry.ls_integres_apprentissage) || 0,
  ls_integres_activites_durables: Number(entry.ls_integres_activites_durables) || 0,
});

const mapStatsLSRow = (row: any, local_id: string): PeStatsLSEntry => ({
  local_id,
  id: row.id,
  type_prise_charge: row.type_prise_charge, // CORRECTION: On garde la valeur de la BDD pour le filtrage
  garcons: Number(row.garcons) || 0,
  filles: Number(row.filles) || 0,
  migrants_non_accompagnes: Number(row.migrants_non_accompagnes) || 0, // AJOUT DU CHAMP
  ls_integres_enseignement: Number(row.ls_integres_enseignement) || 0,
  ls_integres_formation_pro: Number(row.ls_integres_formation_pro) || 0,
  ls_integres_apprentissage: Number(row.ls_integres_apprentissage) || 0,
  ls_integres_activites_durables: Number(row.ls_integres_activites_durables) || 0,
});

export function usePeStatistiquesLS(rapportId: string | null, options?: { enabled?: boolean }) {
  return useEntityEntries<PeStatsLSEntry>({
    rapportId,
    tableName: 'pe_statistiques_demographiques',
    buildPayload: buildStatsLSPayload,
    mapRowToEntry: mapStatsLSRow,
    enabled: options?.enabled ?? true,
  });
}

// ============================================================================
// 2. RAPPORTS JUDICIAIRES (pe_rapports_judiciaires)
// ============================================================================
export interface PeRapportJudiciaireEntry extends BaseEntry {
  nombre_rapports: number;
}

const buildRapportJudiciairePayload = (entry: PeRapportJudiciaireEntry, rId: string) => ({
  ...(entry.id ? { id: entry.id } : {}),
  rapport_id: rId,
  nombre_rapports: Number(entry.nombre_rapports) || 0,
});

const mapRapportJudiciaireRow = (row: any, local_id: string): PeRapportJudiciaireEntry => ({
  local_id,
  id: row.id,
  nombre_rapports: Number(row.nombre_rapports) || 0,
});

export function usePeRapportsJudiciaires(rapportId: string | null, options?: { enabled?: boolean }) {
  return useEntityEntries<PeRapportJudiciaireEntry>({
    rapportId,
    tableName: 'pe_rapports_judiciaires',
    buildPayload: buildRapportJudiciairePayload,
    mapRowToEntry: mapRapportJudiciaireRow,
    enabled: options?.enabled ?? true,
  });
}