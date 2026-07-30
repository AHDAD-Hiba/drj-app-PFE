import { useEntityEntries, BaseEntry } from '../common/useEntityEntries';

// ============================================================================
// 1. STATISTIQUES DES INFRASTRUCTURES (cr_stats_infrastructures)
// ============================================================================
export interface CrStatsInfraEntry extends BaseEntry {
  nombre_creches_creees: number;
  nombre_creches_qualifiees: number;
  nombre_creches_equipees: number;
  observations?: string;
}

const buildStatsPayload = (entry: CrStatsInfraEntry, rId: string) => ({
  ...(entry.id ? { id: entry.id } : {}),
  rapport_id: rId,
  nombre_creches_creees: Number(entry.nombre_creches_creees) || 0,
  nombre_creches_qualifiees: Number(entry.nombre_creches_qualifiees) || 0,
  nombre_creches_equipees: Number(entry.nombre_creches_equipees) || 0,
  observations: entry.observations?.trim() || '',
});

const mapStatsRow = (row: any, local_id: string): CrStatsInfraEntry => ({
  local_id,
  id: row.id,
  nombre_creches_creees: Number(row.nombre_creches_creees) || 0,
  nombre_creches_qualifiees: Number(row.nombre_creches_qualifiees) || 0,
  nombre_creches_equipees: Number(row.nombre_creches_equipees) || 0,
  observations: row.observations || '',
});

export function useCrStatsInfrastructures(rapportId: string | null) {
  return useEntityEntries<CrStatsInfraEntry>({
    rapportId,
    tableName: 'cr_stats_infrastructures',
    buildPayload: buildStatsPayload,
    mapRowToEntry: mapStatsRow,
  });
}

// ============================================================================
// 2. FERMETURES ET RÉOUVERTURES (cr_mouvements_fermetures)
// ============================================================================
export interface CrMouvementFermetureEntry extends BaseEntry {
  type_mouvement: string;
  nombre_creches: number;
  secteur: string;
  raisons: string;
  observations?: string;
}

const buildMouvementPayload = (entry: CrMouvementFermetureEntry, rId: string) => ({
  ...(entry.id ? { id: entry.id } : {}),
  rapport_id: rId,
  type_mouvement: entry.type_mouvement || 'fermeture',
  nombre_creches: Number(entry.nombre_creches) || 1,
  secteur: entry.secteur || 'prive',
  raisons: entry.raisons?.trim() || '',
  observations: entry.observations?.trim() || '',
});

const mapMouvementRow = (row: any, local_id: string): CrMouvementFermetureEntry => ({
  local_id,
  id: row.id,
  type_mouvement: row.type_mouvement || 'fermeture',
  nombre_creches: Number(row.nombre_creches) || 1,
  secteur: row.secteur || 'prive',
  raisons: row.raisons || '',
  observations: row.observations || '',
});

export function useCrMouvementsFermetures(rapportId: string | null) {
  return useEntityEntries<CrMouvementFermetureEntry>({
    rapportId,
    tableName: 'cr_mouvements_fermetures',
    buildPayload: buildMouvementPayload,
    mapRowToEntry: mapMouvementRow,
    // 🛡️ Garde-fou : N'enregistre que si le type de mouvement et le secteur sont définis
    validateBeforeSave: (entry) => Boolean(entry.type_mouvement && entry.secteur),
  });
}

// ============================================================================
// 3. PARTENARIATS & CONVENTIONS (cr_partenariats_conventions)
// ============================================================================
export interface CrPartenariatEntry extends BaseEntry {
  partenaire: string;
  nombre_conventions: number;
  objectif?: string;
  evaluation_engagement?: string;
  observations?: string;
}

const buildPartenariatPayload = (entry: CrPartenariatEntry, rId: string) => ({
  ...(entry.id ? { id: entry.id } : {}),
  rapport_id: rId,
  partenaire: entry.partenaire?.trim() || '',
  nombre_conventions: Number(entry.nombre_conventions) || 1,
  objectif: entry.objectif?.trim() || null,
  evaluation_engagement:
    entry.evaluation_engagement && entry.evaluation_engagement.trim() !== ''
      ? entry.evaluation_engagement
      : null,
  observations: entry.observations?.trim() || '',
});

const mapPartenariatRow = (row: any, local_id: string): CrPartenariatEntry => ({
  local_id,
  id: row.id,
  partenaire: row.partenaire || '',
  nombre_conventions: Number(row.nombre_conventions) || 1,
  objectif: row.objectif || '',
  evaluation_engagement: row.evaluation_engagement || '',
  observations: row.observations || '',
});

export function useCrPartenariats(rapportId: string | null) {
  return useEntityEntries<CrPartenariatEntry>({
    rapportId,
    tableName: 'cr_partenariats_conventions',
    buildPayload: buildPartenariatPayload,
    mapRowToEntry: mapPartenariatRow,
    // 🛡️ Garde-fou : Ne tente d'upsert que si le nom du partenaire est renseigné
    validateBeforeSave: (entry) => Boolean(entry.partenaire?.trim()),
  });
}

// ============================================================================
// 4. CONTRÔLE DES CRÈCHES PRIVÉES (cr_controle_creches)
// ============================================================================
export interface CrControleCrecheEntry extends BaseEntry {
  creche_privee_id: string;
  resultats_controle?: string;
  observations?: string;
}

const buildControlePayload = (entry: CrControleCrecheEntry, rId: string) => ({
  ...(entry.id ? { id: entry.id } : {}),
  rapport_id: rId,
  creche_privee_id:
    entry.creche_privee_id && entry.creche_privee_id.trim() !== '' ? entry.creche_privee_id : null,
  resultats_controle: entry.resultats_controle?.trim() || null,
  observations: entry.observations?.trim() || '',
});

const mapControleRow = (row: any, local_id: string): CrControleCrecheEntry => ({
  local_id,
  id: row.id,
  creche_privee_id: row.creche_privee_id || '',
  resultats_controle: row.resultats_controle || '',
  observations: row.observations || '',
});

export function useCrControleCreches(rapportId: string | null) {
  return useEntityEntries<CrControleCrecheEntry>({
    rapportId,
    tableName: 'cr_controle_creches',
    buildPayload: buildControlePayload,
    mapRowToEntry: mapControleRow,
    validateBeforeSave: (entry) => Boolean(entry.creche_privee_id?.trim()),
  });
}

// ============================================================================
// 5. CADRES ASSERMENTÉS (cr_cadres_assermentes)
// ============================================================================
export interface CrCadresAssermentesEntry extends BaseEntry {
  statut_cadre_id: string;
  statut_cadre_autre?: string;
  nombre_cadres: number;
  observations?: string;
}

const buildCadrePayload = (entry: CrCadresAssermentesEntry, rId: string) => ({
  ...(entry.id ? { id: entry.id } : {}),
  rapport_id: rId,
  statut_cadre_id:
    entry.statut_cadre_id && entry.statut_cadre_id.trim() !== '' ? entry.statut_cadre_id : null,
  statut_cadre_autre: entry.statut_cadre_autre?.trim() || null,
  nombre_cadres: Number(entry.nombre_cadres) || 0,
  observations: entry.observations?.trim() || '',
});

const mapCadreRow = (row: any, local_id: string): CrCadresAssermentesEntry => ({
  local_id,
  id: row.id,
  statut_cadre_id: row.statut_cadre_id || '',
  statut_cadre_autre: row.statut_cadre_autre || '',
  nombre_cadres: Number(row.nombre_cadres) || 0,
  observations: row.observations || '',
});

export function useCrCadresAssermentes(rapportId: string | null) {
  return useEntityEntries<CrCadresAssermentesEntry>({
    rapportId,
    tableName: 'cr_cadres_assermentes',
    buildPayload: buildCadrePayload,
    mapRowToEntry: mapCadreRow,
    // 🛡️ Garde-fou : Ne sauvegarde que si le statut du cadre est sélectionné
    validateBeforeSave: (entry) => Boolean(entry.statut_cadre_id?.trim()),
  });
}

// ============================================================================
// 6. LABEL DE QUALITÉ (cr_label_qualite)
// ============================================================================
export interface CrLabelQualiteEntry extends BaseEntry {
  etablissement_id?: string;
  creche_privee_id?: string;
  statut_label: string;
  motif_refus?: string;
  observations?: string;
}

const buildLabelPayload = (entry: CrLabelQualiteEntry, rId: string) => ({
  ...(entry.id ? { id: entry.id } : {}),
  rapport_id: rId,
  etablissement_id:
    entry.etablissement_id && entry.etablissement_id.trim() !== '' ? entry.etablissement_id : null,
  creche_privee_id:
    entry.creche_privee_id && entry.creche_privee_id.trim() !== '' ? entry.creche_privee_id : null,
  statut_label: entry.statut_label || 'proposee',
  motif_refus: entry.motif_refus?.trim() || null,
  observations: entry.observations?.trim() || '',
});

const mapLabelRow = (row: any, local_id: string): CrLabelQualiteEntry => ({
  local_id,
  id: row.id,
  etablissement_id: row.etablissement_id || '',
  creche_privee_id: row.creche_privee_id || '',
  statut_label: row.statut_label || 'proposee',
  motif_refus: row.motif_refus || '',
  observations: row.observations || '',
});

export function useCrLabelQualite(rapportId: string | null) {
  return useEntityEntries<CrLabelQualiteEntry>({
    rapportId,
    tableName: 'cr_label_qualite',
    buildPayload: buildLabelPayload,
    mapRowToEntry: mapLabelRow,
  });
}