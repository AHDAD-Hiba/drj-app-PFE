import { useEntityEntries, BaseEntry } from '../common/useEntityEntries';

// ============================================================================
// 1. ACTIVITÉS ET PROGRAMMES (pe_activites)
// ============================================================================
export interface PeActiviteEntry extends BaseEntry {
  etablissement_id: string | null;
  domaine_id: string;
  domaine_autre?: string;
  nom_activite: string;
  nombre_beneficiaires: number;
  partenaires?: string;
}

const buildActivitePayload = (entry: PeActiviteEntry, rId: string) => ({
  ...(entry.id ? { id: entry.id } : {}),
  rapport_id: rId,
  etablissement_id: entry.etablissement_id || null,
  domaine_id: entry.domaine_id || null,
  domaine_autre: entry.domaine_autre?.trim() || null,
  nom_activite: entry.nom_activite?.trim() || '',
  nombre_beneficiaires: Number(entry.nombre_beneficiaires) || 0,
  partenaires: entry.partenaires?.trim() || '',
});

const mapActiviteRow = (row: any, local_id: string): PeActiviteEntry => ({
  local_id,
  id: row.id,
  etablissement_id: row.etablissement_id || null,
  domaine_id: row.domaine_id || '',
  domaine_autre: row.domaine_autre || '',
  nom_activite: row.nom_activite || '',
  nombre_beneficiaires: Number(row.nombre_beneficiaires) || 0,
  partenaires: row.partenaires || '',
});

export function usePeActivites(rapportId: string | null, options?: { enabled?: boolean }) {
  return useEntityEntries<PeActiviteEntry>({
    rapportId,
    tableName: 'pe_activites',
    buildPayload: buildActivitePayload,
    mapRowToEntry: mapActiviteRow,
    // 🛡️ Garde-fou renforcé : On exige toujours qu'au moins le nom de l'activité OU (domaine + nom) soit saisi 
    // pour éviter de sauvegarder des lignes Droits de l'Enfant dont seul le domaine_id est pré-rempli.
    validateBeforeSave: (entry) => Boolean(entry.nom_activite?.trim()),
    enabled: options?.enabled ?? true,
  });
}

// ============================================================================
// 2. SESSIONS DU CONSEIL DE L'ENFANT (pe_conseil_enfant)
// ============================================================================
export interface PeConseilEntry extends BaseEntry {
  etablissement_id: string;
  nom_session: string;
  date_session: string;
}

const buildConseilPayload = (entry: PeConseilEntry, rId: string) => ({
  ...(entry.id ? { id: entry.id } : {}),
  rapport_id: rId,
  etablissement_id: entry.etablissement_id,
  nom_session: entry.nom_session?.trim() || '',
  date_session: entry.date_session || null,
});

const mapConseilRow = (row: any, local_id: string): PeConseilEntry => ({
  local_id,
  id: row.id,
  etablissement_id: row.etablissement_id || '',
  nom_session: row.nom_session || '',
  date_session: row.date_session || '',
});

export function usePeConseilEnfant(rapportId: string | null, options?: { enabled?: boolean }) {
  return useEntityEntries<PeConseilEntry>({
    rapportId,
    tableName: 'pe_conseil_enfant',
    buildPayload: buildConseilPayload,
    mapRowToEntry: mapConseilRow,
    validateBeforeSave: (entry) => Boolean(entry.etablissement_id && entry.nom_session?.trim()),
    enabled: options?.enabled ?? true,
  });
}

// ============================================================================
// 3. DONS ET AIDES (pe_dons)
// ============================================================================
export interface PeDonEntry extends BaseEntry {
  etablissement_id: string;
  donateur: string;
  nature_don: string;
  date_reception: string;
  beneficiaires: number;
  observations?: string;
}

const buildDonPayload = (entry: PeDonEntry, rId: string) => ({
  ...(entry.id ? { id: entry.id } : {}),
  rapport_id: rId,
  etablissement_id: entry.etablissement_id,
  donateur: entry.donateur?.trim() || '',
  nature_don: entry.nature_don?.trim() || '',
  date_reception: entry.date_reception || null,
  beneficiaires: Number(entry.beneficiaires) || 0,
  observations: entry.observations?.trim() || '',
});

const mapDonRow = (row: any, local_id: string): PeDonEntry => ({
  local_id,
  id: row.id,
  etablissement_id: row.etablissement_id || '',
  donateur: row.donateur || '',
  nature_don: row.nature_don || '',
  date_reception: row.date_reception || '',
  beneficiaires: Number(row.beneficiaires) || 0,
  observations: row.observations || '',
});

export function usePeDons(rapportId: string | null, options?: { enabled?: boolean }) {
  return useEntityEntries<PeDonEntry>({
    rapportId,
    tableName: 'pe_dons',
    buildPayload: buildDonPayload,
    mapRowToEntry: mapDonRow,
    validateBeforeSave: (entry) => Boolean(entry.etablissement_id && (entry.donateur?.trim() || entry.nature_don?.trim())),
    enabled: options?.enabled ?? true,
  });
}

// ============================================================================
// 4. RAPPORTS EXCEPTIONNELS / INCIDENTS (pe_rapports_exceptionnels)
// ============================================================================
export interface PeIncidentEntry extends BaseEntry {
  type_incident_id: string;
  type_incident_autre?: string;
  sujet_detaille: string;
  nombre_cas: number;
  observations?: string;
}

const buildIncidentPayload = (entry: PeIncidentEntry, rId: string) => ({
  ...(entry.id ? { id: entry.id } : {}),
  rapport_id: rId,
  type_incident_id: entry.type_incident_id || null,
  type_incident_autre: entry.type_incident_autre?.trim() || null,
  sujet_detaille: entry.sujet_detaille?.trim() || '',
  nombre_cas: Number(entry.nombre_cas) || 0,
  observations: entry.observations?.trim() || '',
});

const mapIncidentRow = (row: any, local_id: string): PeIncidentEntry => ({
  local_id,
  id: row.id,
  type_incident_id: row.type_incident_id || '',
  type_incident_autre: row.type_incident_autre || '',
  sujet_detaille: row.sujet_detaille || '',
  nombre_cas: Number(row.nombre_cas) || 0,
  observations: row.observations || '',
});

export function usePeIncidents(rapportId: string | null, options?: { enabled?: boolean }) {
  return useEntityEntries<PeIncidentEntry>({
    rapportId,
    tableName: 'pe_rapports_exceptionnels',
    buildPayload: buildIncidentPayload,
    mapRowToEntry: mapIncidentRow,
    validateBeforeSave: (entry) => Boolean(entry.type_incident_id || entry.sujet_detaille?.trim()),
    enabled: options?.enabled ?? true,
  });
}