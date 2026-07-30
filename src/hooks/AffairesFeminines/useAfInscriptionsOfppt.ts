import { useEntityEntries, BaseEntry } from '../common/useEntityEntries';

export interface AfInscriptionOfpptEntry extends BaseEntry {
  etablissement_id: string;
  secteur_id: string;
  filiere_id: string;
  niveau_formation: string; // 'specialisation', 'qualification', 'technicien', 'technicien_specialise'
  inscrites_annee_1: number;
  inscrites_annee_2: number;
}

// FIX : On sort les fonctions du hook
const buildPayload = (entry: AfInscriptionOfpptEntry, rId: string) => ({
  ...(entry.id ? { id: entry.id } : {}),
  rapport_id: rId,
  etablissement_id: entry.etablissement_id ?? null,
  secteur_id: entry.secteur_id ?? null,
  filiere_id: entry.filiere_id ?? null,
  niveau_formation: entry.niveau_formation ?? null,
  inscrites_annee_1: entry.inscrites_annee_1 || 0,
  inscrites_annee_2: entry.inscrites_annee_2 || 0,
});

const mapRowToEntry = (row: any, local_id: string): AfInscriptionOfpptEntry => ({
  local_id,
  id: row.id,
  etablissement_id: row.etablissement_id ?? '',
  secteur_id: row.secteur_id ?? '',
  filiere_id: row.filiere_id ?? '',
  niveau_formation: row.niveau_formation ?? '',
  inscrites_annee_1: row.inscrites_annee_1 ?? 0,
  inscrites_annee_2: row.inscrites_annee_2 ?? 0,
});

export function useAfInscriptionsOfppt(rapportId: string | null) {
  return useEntityEntries<AfInscriptionOfpptEntry>({
    rapportId,
    tableName: 'af_inscriptions_ofppt',
    buildPayload,  // On passe juste la référence
    mapRowToEntry, // On passe juste la référence
  });
}