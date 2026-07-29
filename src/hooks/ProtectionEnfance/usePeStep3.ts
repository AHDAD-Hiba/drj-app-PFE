import { useEntityEntries, BaseEntry } from '../common/useEntityEntries';

// ============================================================================
// 1. PARTENARIATS (pe_partenariats)
// ============================================================================
export interface PePartenariatEntry extends BaseEntry {
  etablissement_id: string | null;
  type_partenariat: 'insertion_pro' | 'protection_enfance';
  nombre_conventions: number;
  sujet: string;
  partenaires: string;
  nombre_projets_executes: number;
  activites_realisees?: string;
  observations?: string;
}

const buildPartenariatPayload = (entry: PePartenariatEntry, rId: string) => ({
  ...(entry.id ? { id: entry.id } : {}),
  rapport_id: rId,
  etablissement_id: entry.etablissement_id || null,
  type_partenariat: entry.type_partenariat || 'insertion_pro',
  nombre_conventions: Number(entry.nombre_conventions) || 1,
  sujet: entry.sujet || '',
  partenaires: entry.partenaires || '',
  nombre_projets_executes: Number(entry.nombre_projets_executes) || 0,
  activites_realisees: entry.activites_realisees || '',
  observations: entry.observations || '',
});

const mapPartenariatRow = (row: any, local_id: string): PePartenariatEntry => ({
  local_id,
  id: row.id,
  etablissement_id: row.etablissement_id || null,
  type_partenariat: row.type_partenariat,
  nombre_conventions: Number(row.nombre_conventions) || 1,
  sujet: row.sujet || '',
  partenaires: row.partenaires || '',
  nombre_projets_executes: Number(row.nombre_projets_executes) || 0,
  activites_realisees: row.activites_realisees || '',
  observations: row.observations || '',
});

export function usePePartenariats(rapportId: string | null) {
  return useEntityEntries<PePartenariatEntry>({
    rapportId,
    tableName: 'pe_partenariats',
    buildPayload: buildPartenariatPayload,
    mapRowToEntry: mapPartenariatRow,
  });
}

// ============================================================================
// 2. FORMATION DU PERSONNEL (pe_formation_personnel)
// ============================================================================
export interface PeFormationEntry extends BaseEntry {
  etablissement_id: string | null;
  cible: 'cadres_centres' | 'delegues_ls' | 'admin_pedago_reinsertion';
  theme_formation: string;
  nombre_sessions: number;
  nombre_beneficiaires: number;
  partenaires?: string;
}

const buildFormationPayload = (entry: PeFormationEntry, rId: string) => ({
  ...(entry.id ? { id: entry.id } : {}),
  rapport_id: rId,
  etablissement_id: entry.etablissement_id || null,
  cible: entry.cible,
  theme_formation: entry.theme_formation || '',
  nombre_sessions: Number(entry.nombre_sessions) || 1,
  nombre_beneficiaires: Number(entry.nombre_beneficiaires) || 0,
  partenaires: entry.partenaires || '',
});

const mapFormationRow = (row: any, local_id: string): PeFormationEntry => ({
  local_id,
  id: row.id,
  etablissement_id: row.etablissement_id || null,
  cible: row.cible,
  theme_formation: row.theme_formation || '',
  nombre_sessions: Number(row.nombre_sessions) || 1,
  nombre_beneficiaires: Number(row.nombre_beneficiaires) || 0,
  partenaires: row.partenaires || '',
});

export function usePeFormations(rapportId: string | null) {
  return useEntityEntries<PeFormationEntry>({
    rapportId,
    tableName: 'pe_formation_personnel',
    buildPayload: buildFormationPayload,
    mapRowToEntry: mapFormationRow,
  });
}

// ============================================================================
// 3. AMÉNAGEMENT ET ÉQUIPEMENT (pe_amenagement_equipement)
// ============================================================================
export interface PeAmenagementEntry extends BaseEntry {
  etablissement_id: string;
  a_ete_rehabilite: boolean;
  a_ete_equipe: boolean;
  observations?: string;
}

const buildAmenagementPayload = (entry: PeAmenagementEntry, rId: string) => ({
  ...(entry.id ? { id: entry.id } : {}),
  rapport_id: rId,
  etablissement_id: entry.etablissement_id,
  a_ete_rehabilite: Boolean(entry.a_ete_rehabilite),
  a_ete_equipe: Boolean(entry.a_ete_equipe),
  observations: entry.observations || '',
});

const mapAmenagementRow = (row: any, local_id: string): PeAmenagementEntry => ({
  local_id,
  id: row.id,
  etablissement_id: row.etablissement_id,
  a_ete_rehabilite: Boolean(row.a_ete_rehabilite),
  a_ete_equipe: Boolean(row.a_ete_equipe),
  observations: row.observations || '',
});

export function usePeAmenagements(rapportId: string | null) {
  return useEntityEntries<PeAmenagementEntry>({
    rapportId,
    tableName: 'pe_amenagement_equipement',
    buildPayload: buildAmenagementPayload,
    mapRowToEntry: mapAmenagementRow,
  });
}

// ============================================================================
// 4. VISITES OFFICIELLES (pe_visites_officielles)
// ============================================================================
export interface PeVisiteEntry extends BaseEntry {
  etablissement_id: string;
  entite_visiteuse: string;
  date_visite: string; // YYYY-MM-DD
  type_visite?: string;
  objectifs?: string;
  nombre_visiteurs: number;
  observations?: string;
}

const buildVisitePayload = (entry: PeVisiteEntry, rId: string) => ({
  ...(entry.id ? { id: entry.id } : {}),
  rapport_id: rId,
  etablissement_id: entry.etablissement_id,
  entite_visiteuse: entry.entite_visiteuse || '',
  date_visite: entry.date_visite || new Date().toISOString().split('T')[0],
  type_visite: entry.type_visite || '',
  objectifs: entry.objectifs || '',
  nombre_visiteurs: Number(entry.nombre_visiteurs) || 1,
  observations: entry.observations || '',
});

const mapVisiteRow = (row: any, local_id: string): PeVisiteEntry => ({
  local_id,
  id: row.id,
  etablissement_id: row.etablissement_id,
  entite_visiteuse: row.entite_visiteuse || '',
  date_visite: row.date_visite ? row.date_visite.split('T')[0] : '',
  type_visite: row.type_visite || '',
  objectifs: row.objectifs || '',
  nombre_visiteurs: Number(row.nombre_visiteurs) || 1,
  observations: row.observations || '',
});

export function usePeVisites(rapportId: string | null) {
  return useEntityEntries<PeVisiteEntry>({
    rapportId,
    tableName: 'pe_visites_officielles',
    buildPayload: buildVisitePayload,
    mapRowToEntry: mapVisiteRow,
  });
}