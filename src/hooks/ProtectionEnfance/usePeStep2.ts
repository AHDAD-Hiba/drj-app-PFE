import { useEntityEntries, BaseEntry } from '../common/useEntityEntries';

// ============================================================================
// 1. ACTIVITÉS ET PROGRAMMES (pe_activites)
// ============================================================================
export interface PeActiviteEntry extends BaseEntry {
  etablissement_id: string | null; // null بالنسبة للأنشطة الإقليمية (الجدول 12 و 20)
  domaine_id: string;              // UUID من جدول ref_domaines_activite
  domaine_autre?: string;
  nom_activite: string;
  nombre_beneficiaires: number;
  partenaires?: string;
}

const buildActivitePayload = (entry: PeActiviteEntry, rId: string) => ({
  ...(entry.id ? { id: entry.id } : {}),
  rapport_id: rId,
  etablissement_id: entry.etablissement_id || null,
  domaine_id: entry.domaine_id,
  domaine_autre: entry.domaine_autre || null,
  nom_activite: entry.nom_activite || '',
  nombre_beneficiaires: Number(entry.nombre_beneficiaires) || 0,
  partenaires: entry.partenaires || '',
});

const mapActiviteRow = (row: any, local_id: string): PeActiviteEntry => ({
  local_id,
  id: row.id,
  etablissement_id: row.etablissement_id || null,
  domaine_id: row.domaine_id,
  domaine_autre: row.domaine_autre || '',
  nom_activite: row.nom_activite || '',
  nombre_beneficiaires: Number(row.nombre_beneficiaires) || 0,
  partenaires: row.partenaires || '',
});

export function usePeActivites(rapportId: string | null) {
  return useEntityEntries<PeActiviteEntry>({
    rapportId,
    tableName: 'pe_activites',
    buildPayload: buildActivitePayload,
    mapRowToEntry: mapActiviteRow,
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
  nom_session: entry.nom_session || '',
  date_session: entry.date_session || null,
});

const mapConseilRow = (row: any, local_id: string): PeConseilEntry => ({
  local_id,
  id: row.id,
  etablissement_id: row.etablissement_id,
  nom_session: row.nom_session || '',
  date_session: row.date_session || '',
});

export function usePeConseilEnfant(rapportId: string | null) {
  return useEntityEntries<PeConseilEntry>({
    rapportId,
    tableName: 'pe_conseil_enfant',
    buildPayload: buildConseilPayload,
    mapRowToEntry: mapConseilRow,
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
  beneficiaires: number; // تم التغيير إلى Number بناءً على تحديث قاعدة البيانات
  observations?: string;
}

const buildDonPayload = (entry: PeDonEntry, rId: string) => ({
  ...(entry.id ? { id: entry.id } : {}),
  rapport_id: rId,
  etablissement_id: entry.etablissement_id,
  donateur: entry.donateur || '',
  nature_don: entry.nature_don || '',
  date_reception: entry.date_reception || null,
  beneficiaires: Number(entry.beneficiaires) || 0,
  observations: entry.observations || '',
});

const mapDonRow = (row: any, local_id: string): PeDonEntry => ({
  local_id,
  id: row.id,
  etablissement_id: row.etablissement_id,
  donateur: row.donateur || '',
  nature_don: row.nature_don || '',
  date_reception: row.date_reception || '',
  beneficiaires: Number(row.beneficiaires) || 0,
  observations: row.observations || '',
});

export function usePeDons(rapportId: string | null) {
  return useEntityEntries<PeDonEntry>({
    rapportId,
    tableName: 'pe_dons',
    buildPayload: buildDonPayload,
    mapRowToEntry: mapDonRow,
  });
}

// ============================================================================
// 4. RAPPORTS EXCEPTIONNELS / INCIDENTS (pe_rapports_exceptionnels)
// ============================================================================
export interface PeIncidentEntry extends BaseEntry {
  type_incident_id: string; // UUID من جدول ref_types_incident
  type_incident_autre?: string;
  sujet_detaille: string;
  nombre_cas: number;
  observations?: string;
}

const buildIncidentPayload = (entry: PeIncidentEntry, rId: string) => ({
  ...(entry.id ? { id: entry.id } : {}),
  rapport_id: rId,
  type_incident_id: entry.type_incident_id,
  type_incident_autre: entry.type_incident_autre || null,
  sujet_detaille: entry.sujet_detaille || '',
  nombre_cas: Number(entry.nombre_cas) || 0,
  observations: entry.observations || '',
});

const mapIncidentRow = (row: any, local_id: string): PeIncidentEntry => ({
  local_id,
  id: row.id,
  type_incident_id: row.type_incident_id,
  type_incident_autre: row.type_incident_autre || '',
  sujet_detaille: row.sujet_detaille || '',
  nombre_cas: Number(row.nombre_cas) || 0,
  observations: row.observations || '',
});

export function usePeIncidents(rapportId: string | null) {
  return useEntityEntries<PeIncidentEntry>({
    rapportId,
    tableName: 'pe_rapports_exceptionnels',
    buildPayload: buildIncidentPayload,
    mapRowToEntry: mapIncidentRow,
  });
}