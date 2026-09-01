import { useEntityEntries, BaseEntry } from "../common/useEntityEntries";

// ============================================================================
// 1. STATISTIQUES GLOBALES ENFANTS (cr_statistiques_enfants)
// ============================================================================
export interface CrStatistiquesEnfantsEntry extends BaseEntry {
  garcons: number;
  filles: number;
  urbain: number;
  rural: number;
  observations?: string;
}

const buildStatsPayload = (entry: CrStatistiquesEnfantsEntry, rId: string) => ({
  ...(entry.id ? { id: entry.id } : {}),
  rapport_id: rId,
  garcons: Number(entry.garcons) || 0,
  filles: Number(entry.filles) || 0,
  urbain: Number(entry.urbain) || 0,
  rural: Number(entry.rural) || 0,
  observations: entry.observations?.trim() || "",
});

const mapStatsRow = (row: any, local_id: string): CrStatistiquesEnfantsEntry => ({
  local_id,
  id: row.id,
  garcons: Number(row.garcons) || 0,
  filles: Number(row.filles) || 0,
  urbain: Number(row.urbain) || 0,
  rural: Number(row.rural) || 0,
  observations: row.observations || "",
});

export function useCrStatistiquesEnfants(
  rapportId: string | null,
  options?: { enabled?: boolean },
) {
  return useEntityEntries<CrStatistiquesEnfantsEntry>({
    rapportId,
    tableName: "cr_statistiques_enfants",
    buildPayload: buildStatsPayload,
    mapRowToEntry: mapStatsRow,
    enabled: options?.enabled ?? true,
  });
}

// ============================================================================
// 2. ACTIVITÉS DE RAYONNEMENT (cr_activites_enfants)
// ============================================================================
export interface CrActivitesEnfantsEntry extends BaseEntry {
  nom_activite: string;
  garcons: number;
  filles: number;
  urbain: number;
  rural: number;
  observations?: string;
}

const buildActivitePayload = (entry: CrActivitesEnfantsEntry, rId: string) => ({
  ...(entry.id ? { id: entry.id } : {}),
  rapport_id: rId,
  nom_activite: entry.nom_activite?.trim() || "",
  garcons: Number(entry.garcons) || 0,
  filles: Number(entry.filles) || 0,
  urbain: Number(entry.urbain) || 0,
  rural: Number(entry.rural) || 0,
  observations: entry.observations?.trim() || "",
});

const mapActiviteRow = (row: any, local_id: string): CrActivitesEnfantsEntry => ({
  local_id,
  id: row.id,
  nom_activite: row.nom_activite || "",
  garcons: Number(row.garcons) || 0,
  filles: Number(row.filles) || 0,
  urbain: Number(row.urbain) || 0,
  rural: Number(row.rural) || 0,
  observations: row.observations || "",
});

export function useCrActivitesEnfants(rapportId: string | null, options?: { enabled?: boolean }) {
  return useEntityEntries<CrActivitesEnfantsEntry>({
    rapportId,
    tableName: "cr_activites_enfants",
    buildPayload: buildActivitePayload,
    mapRowToEntry: mapActiviteRow,
    enabled: options?.enabled ?? true,
    // 🛡️ Garde-fou : Ne tente de sauvegarde que si le nom de l'activité est renseigné
    validateBeforeSave: (entry) => Boolean(entry.nom_activite?.trim()),
  });
}

// ============================================================================
// 3. FORMATIONS DES CADRES (cr_formations_cadres)
// ============================================================================
export interface CrFormationsCadresEntry extends BaseEntry {
  nombre_cadres: number;
  domaine_formation: string;
  duree_valeur: number;
  duree_unite: string; // 'heure' | 'jour' | 'semaine' | 'mois'
  observations?: string;
}

const buildFormationPayload = (entry: CrFormationsCadresEntry, rId: string) => ({
  ...(entry.id ? { id: entry.id } : {}),
  rapport_id: rId,
  nombre_cadres: Number(entry.nombre_cadres) || 0,
  domaine_formation: entry.domaine_formation?.trim() || "",
  duree_valeur: Number(entry.duree_valeur) || 1,
  duree_unite: entry.duree_unite || "jour",
  observations: entry.observations?.trim() || "",
});

const mapFormationRow = (row: any, local_id: string): CrFormationsCadresEntry => ({
  local_id,
  id: row.id,
  nombre_cadres: Number(row.nombre_cadres) || 0,
  domaine_formation: row.domaine_formation || "",
  duree_valeur: Number(row.duree_valeur) || 1,
  duree_unite: row.duree_unite || "jour",
  observations: row.observations || "",
});

export function useCrFormationsCadres(rapportId: string | null, options?: { enabled?: boolean }) {
  return useEntityEntries<CrFormationsCadresEntry>({
    rapportId,
    tableName: "cr_formations_cadres",
    buildPayload: buildFormationPayload,
    mapRowToEntry: mapFormationRow,
    enabled: options?.enabled ?? true,
    // 🛡️ Garde-fou : Ne sauvegarde que si le domaine de formation est spécifié
    validateBeforeSave: (entry) => Boolean(entry.domaine_formation?.trim()),
  });
}
