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
  sujet: entry.sujet?.trim() || '',
  partenaires: entry.partenaires?.trim() || '',
  nombre_projets_executes: Number(entry.nombre_projets_executes) || 0,
  activites_realisees: entry.activites_realisees?.trim() || '',
  observations: entry.observations?.trim() || '',
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

export function usePePartenariats(rapportId: string | null, options?: { enabled?: boolean }) {
  return useEntityEntries<PePartenariatEntry>({
    rapportId,
    tableName: 'pe_partenariats',
    buildPayload: buildPartenariatPayload,
    mapRowToEntry: mapPartenariatRow,
    // 🛡️ Garde-fou : Ne tente la sauvegarde BDD que si le sujet ou les partenaires sont renseignés
    validateBeforeSave: (entry) => Boolean(entry.sujet?.trim() || entry.partenaires?.trim()),
    enabled: options?.enabled ?? true,
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
  theme_formation: entry.theme_formation?.trim() || '',
  nombre_sessions: Number(entry.nombre_sessions) || 1,
  nombre_beneficiaires: Number(entry.nombre_beneficiaires) || 0,
  partenaires: entry.partenaires?.trim() || '',
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

export function usePeFormations(rapportId: string | null, options?: { enabled?: boolean }) {
  return useEntityEntries<PeFormationEntry>({
    rapportId,
    tableName: 'pe_formation_personnel',
    buildPayload: buildFormationPayload,
    mapRowToEntry: mapFormationRow,
    enabled: options?.enabled ?? true,
    // 🛡️ Garde-fou : Nécessite un thème de formation renseigné ou un nombre de bénéficiaires
    validateBeforeSave: (entry) => Boolean(entry.theme_formation?.trim() || entry.nombre_beneficiaires > 0),
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
  observations: entry.observations?.trim() || '',
});

const mapAmenagementRow = (row: any, local_id: string): PeAmenagementEntry => ({
  local_id,
  id: row.id,
  etablissement_id: row.etablissement_id || '',
  a_ete_rehabilite: Boolean(row.a_ete_rehabilite),
  a_ete_equipe: Boolean(row.a_ete_equipe),
  observations: row.observations || '',
});

export function usePeAmenagements(rapportId: string | null, options?: { enabled?: boolean }) {
  return useEntityEntries<PeAmenagementEntry>({
    rapportId,
    tableName: 'pe_amenagement_equipement',
    buildPayload: buildAmenagementPayload,
    mapRowToEntry: mapAmenagementRow,
    enabled: options?.enabled ?? true,
    // 🛡️ Garde-fou : Nécessite que le centre soit associé
    validateBeforeSave: (entry) => Boolean(entry.etablissement_id),
  });
}

// ============================================================================
// 4. VISITES OFFICIELLES (pe_visites_officielles)
// ============================================================================
export interface PeVisiteEntry extends BaseEntry {
  etablissement_id: string;
  entite_visiteuse: string;
  date_visite: string;
  type_visite?: string;
  objectifs?: string;
  nombre_visiteurs: number;
  observations?: string;
}

const buildVisitePayload = (entry: PeVisiteEntry, rId: string) => ({
  ...(entry.id ? { id: entry.id } : {}),
  rapport_id: rId,
  etablissement_id: entry.etablissement_id,
  entite_visiteuse: entry.entite_visiteuse?.trim() || '',
  date_visite: entry.date_visite || null,
  type_visite: entry.type_visite?.trim() || '',
  objectifs: entry.objectifs?.trim() || '',
  nombre_visiteurs: Number(entry.nombre_visiteurs) || 1,
  observations: entry.observations?.trim() || '',
});

const mapVisiteRow = (row: any, local_id: string): PeVisiteEntry => ({
  local_id,
  id: row.id,
  etablissement_id: row.etablissement_id || '',
  entite_visiteuse: row.entite_visiteuse || '',
  date_visite: row.date_visite ? row.date_visite.split('T')[0] : '',
  type_visite: row.type_visite || '',
  objectifs: row.objectifs || '',
  nombre_visiteurs: Number(row.nombre_visiteurs) || 1,
  observations: row.observations || '',
});

export function usePeVisites(rapportId: string | null, options?: { enabled?: boolean }) {
  return useEntityEntries<PeVisiteEntry>({
    rapportId,
    tableName: 'pe_visites_officielles',
    buildPayload: buildVisitePayload,
    mapRowToEntry: mapVisiteRow,
    enabled: options?.enabled ?? true,
    // 🛡️ Garde-fou : S'assure que l'entité visiteuse est renseignée avant de pousser vers Supabase
    validateBeforeSave: (entry) => Boolean(entry.etablissement_id && entry.entite_visiteuse?.trim()),
  });
}