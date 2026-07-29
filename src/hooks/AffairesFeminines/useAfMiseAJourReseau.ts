import { useEntityEntries, BaseEntry } from '../common/useEntityEntries';

export interface AfMouvementEntry extends BaseEntry {
  etablissement_id: string | null; // Null si c'est un nouvel établissement pas encore dans la table de référence
  nom_etablissement: string; // Utilisé temporairement pour l'affichage avant création réelle
  type_mise_a_jour: string; // 'nouvel', 'creation_en_cours', 'fermeture_temporaire', 'reouverture'
  statut_juridique: string;
  date_mouvement: string;
  raisons: string;
  suggestions: string;
  observations: string;
  is_new_entry?: boolean; // Attribut purement local/UI pour distinguer les créations brutes
}

const buildPayload = (entry: AfMouvementEntry, rId: string) => ({
  ...(entry.id ? { id: entry.id } : {}),
  rapport_id: rId,
  etablissement_id: entry.etablissement_id || null, // Important : envoyer l'ID s'il existe
  type_mise_a_jour: entry.type_mise_a_jour === 'sans_changement' ? null : entry.type_mise_a_jour,
  statut_juridique: entry.statut_juridique || null,
  date_mouvement: entry.date_mouvement || null,
  raisons: entry.raisons || null,
  suggestions: entry.suggestions || null,
  observations: entry.observations || null,
});

const mapRowToEntry = (row: any, local_id: string): AfMouvementEntry => ({
  local_id,
  id: row.id,
  etablissement_id: row.etablissement_id,
  nom_etablissement: '', // Sera rempli par fusion dans le composant
  type_mise_a_jour: row.type_mise_a_jour ?? 'sans_changement',
  statut_juridique: row.statut_juridique ?? '',
  date_mouvement: row.date_mouvement ?? '',
  raisons: row.raisons ?? '',
  suggestions: row.suggestions ?? '',
  observations: row.observations ?? '',
  is_new_entry: !row.etablissement_id, // Si pas d'ID d'établissement, c'est considéré comme nouveau
});

export function useAfMiseAJourReseau(rapportId: string | null) {
  return useEntityEntries<AfMouvementEntry>({
    rapportId,
    tableName: 'af_mise_a_jour_reseau',
    buildPayload,
    mapRowToEntry,
  });
}