import { useEntityEntries, BaseEntry } from "../common/useEntityEntries";

// ============================================================================
// 1. STATISTIQUES DÉMOGRAPHIQUES (pe_statistiques_demographiques)
// ============================================================================
export interface PeDemographieEntry extends BaseEntry {
  etablissement_id: string | null; // null بالنسبة للإحصائيات الإجمالية للمديرية
  type_prise_charge: "centre_sauvegarde" | "liberte_surveillee";
  garcons: number;
  filles: number;
  migrants_non_accompagnes: number;
  changement_mesure: number;
  taux_preparation_integration: number;
}

const buildDemographiePayload = (entry: PeDemographieEntry, rId: string) => ({
  ...(entry.id ? { id: entry.id } : {}),
  rapport_id: rId,
  etablissement_id: entry.etablissement_id || null,
  type_prise_charge: entry.type_prise_charge || "centre_sauvegarde",
  garcons: Number(entry.garcons) || 0,
  filles: Number(entry.filles) || 0,
  migrants_non_accompagnes: Number(entry.migrants_non_accompagnes) || 0,
  changement_mesure: Number(entry.changement_mesure) || 0,
  taux_preparation_integration: Number(entry.taux_preparation_integration) || 0,
});

const mapDemographieRow = (row: any, local_id: string): PeDemographieEntry => ({
  local_id,
  id: row.id,
  etablissement_id: row.etablissement_id || null,
  type_prise_charge: row.type_prise_charge,
  garcons: Number(row.garcons) || 0,
  filles: Number(row.filles) || 0,
  migrants_non_accompagnes: Number(row.migrants_non_accompagnes) || 0,
  changement_mesure: Number(row.changement_mesure) || 0,
  taux_preparation_integration: Number(row.taux_preparation_integration) || 0,
});

export function usePeDemographie(rapportId: string | null, options?: { enabled?: boolean }) {
  return useEntityEntries<PeDemographieEntry>({
    rapportId,
    tableName: "pe_statistiques_demographiques",
    buildPayload: buildDemographiePayload,
    mapRowToEntry: mapDemographieRow,
    enabled: options?.enabled ?? true,
  });
}

// ============================================================================
// 2. ÉDUCATION ET SCOLARITÉ (pe_education)
// ============================================================================
export interface PeEducationEntry extends BaseEntry {
  etablissement_id: string;
  beneficiaires_formel: number;
  beneficiaires_non_formel: number;
  beneficiaires_soutien: number;
}

const buildEducationPayload = (entry: PeEducationEntry, rId: string) => ({
  ...(entry.id ? { id: entry.id } : {}),
  rapport_id: rId,
  etablissement_id: entry.etablissement_id,
  beneficiaires_formel: Number(entry.beneficiaires_formel) || 0,
  beneficiaires_non_formel: Number(entry.beneficiaires_non_formel) || 0,
  beneficiaires_soutien: Number(entry.beneficiaires_soutien) || 0,
});

const mapEducationRow = (row: any, local_id: string): PeEducationEntry => ({
  local_id,
  id: row.id,
  etablissement_id: row.etablissement_id,
  beneficiaires_formel: Number(row.beneficiaires_formel) || 0,
  beneficiaires_non_formel: Number(row.beneficiaires_non_formel) || 0,
  beneficiaires_soutien: Number(row.beneficiaires_soutien) || 0,
});

export function usePeEducation(rapportId: string | null, options?: { enabled?: boolean }) {
  return useEntityEntries<PeEducationEntry>({
    rapportId,
    tableName: "pe_education",
    buildPayload: buildEducationPayload,
    mapRowToEntry: mapEducationRow,
    enabled: options?.enabled ?? true,
  });
}

// ============================================================================
// 3. ATELIERS CRÉÉS (pe_ateliers_crees)
// ============================================================================
export interface PeAtelierEntry extends BaseEntry {
  etablissement_id: string;
  nom_atelier: string;
  nombre: number;
}

const buildAtelierPayload = (entry: PeAtelierEntry, rId: string) => ({
  ...(entry.id ? { id: entry.id } : {}),
  rapport_id: rId,
  etablissement_id: entry.etablissement_id,
  nom_atelier: entry.nom_atelier || "",
  nombre: Number(entry.nombre) || 0,
});

const mapAtelierRow = (row: any, local_id: string): PeAtelierEntry => ({
  local_id,
  id: row.id,
  etablissement_id: row.etablissement_id,
  nom_atelier: row.nom_atelier || "",
  nombre: Number(row.nombre) || 0,
});

export function usePeAteliers(rapportId: string | null, options?: { enabled?: boolean }) {
  return useEntityEntries<PeAtelierEntry>({
    rapportId,
    tableName: "pe_ateliers_crees",
    buildPayload: buildAtelierPayload,
    mapRowToEntry: mapAtelierRow,
    enabled: options?.enabled ?? true,
  });
}

// ============================================================================
// 4. BÉNÉFICIAIRES DE LA FORMATION (pe_formation_beneficiaires)
// ============================================================================
export interface PeFormationEntry extends BaseEntry {
  etablissement_id: string;
  beneficiaires_intra: number;
  beneficiaires_extra: number;
  beneficiaires_initiation: number;
}

const buildFormationPayload = (entry: PeFormationEntry, rId: string) => ({
  ...(entry.id ? { id: entry.id } : {}),
  rapport_id: rId,
  etablissement_id: entry.etablissement_id,
  beneficiaires_intra: Number(entry.beneficiaires_intra) || 0,
  beneficiaires_extra: Number(entry.beneficiaires_extra) || 0,
  beneficiaires_initiation: Number(entry.beneficiaires_initiation) || 0,
});

const mapFormationRow = (row: any, local_id: string): PeFormationEntry => ({
  local_id,
  id: row.id,
  etablissement_id: row.etablissement_id,
  beneficiaires_intra: Number(row.beneficiaires_intra) || 0,
  beneficiaires_extra: Number(row.beneficiaires_extra) || 0,
  beneficiaires_initiation: Number(row.beneficiaires_initiation) || 0,
});

export function usePeFormation(rapportId: string | null, options?: { enabled?: boolean }) {
  return useEntityEntries<PeFormationEntry>({
    rapportId,
    tableName: "pe_formation_beneficiaires",
    buildPayload: buildFormationPayload,
    mapRowToEntry: mapFormationRow,
    enabled: options?.enabled ?? true,
  });
}
