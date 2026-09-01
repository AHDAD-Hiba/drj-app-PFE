import { BaseEntry, useEntityEntries } from "../common/useEntityEntries";

export interface AfMouvementEntry extends BaseEntry {
  etablissement_id: string | null;
  nom_etablissement: string;
  type_mise_a_jour: string;
  type_etablissement: string;
  statut_juridique: string;
  date_mouvement: string;
  raisons: string;
  suggestions: string;
  observations: string;
  is_new_entry?: boolean;
}

const buildPayload = (entry: AfMouvementEntry, rId: string) => ({
  ...(entry.id ? { id: entry.id } : {}),
  rapport_id: rId,
  etablissement_id: entry.etablissement_id || null,
  nom_etablissement: entry.nom_etablissement?.trim() || "",
  type_mise_a_jour:
    entry.type_mise_a_jour === "sans_changement" ? null : entry.type_mise_a_jour || "nouvel",
  type_etablissement: entry.type_etablissement || "club_feminin",
  statut_juridique: entry.statut_juridique?.trim() || null,
  date_mouvement: entry.date_mouvement || null,
  raisons: entry.raisons?.trim() || null,
  suggestions: entry.suggestions?.trim() || null,
  observations: entry.observations?.trim() || null,
});

const mapRowToEntry = (row: any, local_id: string): AfMouvementEntry => ({
  local_id,
  id: row.id,
  etablissement_id: row.etablissement_id,
  nom_etablissement: row.nom_etablissement ?? "",
  type_mise_a_jour: row.type_mise_a_jour ?? "nouvel",
  type_etablissement: row.type_etablissement ?? "club_feminin",
  statut_juridique: row.statut_juridique ?? "",
  date_mouvement: row.date_mouvement ?? "",
  raisons: row.raisons ?? "",
  suggestions: row.suggestions ?? "",
  observations: row.observations ?? "",
  is_new_entry: !row.etablissement_id,
});

export function useAfMiseAJourReseau(rapportId: string | null, options?: { enabled?: boolean }) {
  return useEntityEntries<AfMouvementEntry>({
    rapportId,
    tableName: "af_mise_a_jour_reseau",
    buildPayload,
    mapRowToEntry,
    enabled: options?.enabled ?? true,
    // Validation avant l'enregistrement : si c'est une nouvelle entrée ou si l'établissement_id est null, on vérifie que le nom de l'établissement n'est pas vide. Sinon, on vérifie que le type de mise à jour n'est pas "sans_changement". 
    validateBeforeSave: (entry) => {
      if (entry.is_new_entry || !entry.etablissement_id) {
        return Boolean(entry.nom_etablissement && entry.nom_etablissement.trim().length > 0);
      }
      return Boolean(entry.type_mise_a_jour && entry.type_mise_a_jour !== "sans_changement");
    },
  });
}