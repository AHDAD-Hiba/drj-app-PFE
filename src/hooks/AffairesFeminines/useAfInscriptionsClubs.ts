import { useEntityEntries, BaseEntry } from '../common/useEntityEntries';

export interface AfInscriptionClubEntry extends BaseEntry {
  etablissement_id: string;
  filiere_id: string;
  type_formation: string; // 'fondamental' ou 'rapide'
  inscrites_annee_1: number;
  inscrites_annee_2: number;
}

// FIX : On sort les fonctions du hook pour garder une référence stable 
const buildPayload = (entry: AfInscriptionClubEntry, rId: string) => ({
  ...(entry.id ? { id: entry.id } : {}),
  rapport_id: rId,
  etablissement_id: entry.etablissement_id ?? null,
  filiere_id: entry.filiere_id ?? null,
  type_formation: entry.type_formation ?? null,
  inscrites_annee_1: entry.inscrites_annee_1 || 0,
  inscrites_annee_2: entry.inscrites_annee_2 || 0,
});

const mapRowToEntry = (row: any, local_id: string): AfInscriptionClubEntry => ({
  local_id,
  id: row.id,
  etablissement_id: row.etablissement_id ?? '',
  filiere_id: row.filiere_id ?? '',
  type_formation: row.type_formation ?? '',
  inscrites_annee_1: row.inscrites_annee_1 ?? 0,
  inscrites_annee_2: row.inscrites_annee_2 ?? 0,
});

export function useAfInscriptionsClubs(rapportId: string | null, options?: { enabled?: boolean }) {
  return useEntityEntries<AfInscriptionClubEntry>({
    rapportId,
    tableName: 'af_inscriptions_clubs',
    enabled: options?.enabled ?? true,
    buildPayload,  // On passe juste la référence
    mapRowToEntry, // On passe juste la référence
  });
}