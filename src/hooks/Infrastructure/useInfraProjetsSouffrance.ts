import { useEntityEntries, BaseEntry } from "../common/useEntityEntries";

export interface InfraProjetSouffranceEntry extends BaseEntry {
  type_filtre?: string; // Champ UI uniquement
  etablissement_id: string;
  causes_blocage: string;
  solutions_proposees: string;
  observations: string;
}

const buildPayload = (entry: InfraProjetSouffranceEntry, rId: string) => {
  const payload: any = {
    rapport_id: rId,
    etablissement_id:
      entry.etablissement_id && entry.etablissement_id.trim() !== ""
        ? entry.etablissement_id
        : null,
    causes_blocage: entry.causes_blocage?.trim() || "",
    solutions_proposees: entry.solutions_proposees?.trim() || "",
    observations: entry.observations?.trim() || "",
  };

  // Ne transmet id à Supabase que s'il est déjà créé en BDD
  if (entry.id) {
    payload.id = entry.id;
  }

  return payload;
};

const mapRowToEntry = (row: any, local_id: string): InfraProjetSouffranceEntry => ({
  local_id,
  id: row.id,
  type_filtre: "",
  etablissement_id: row.etablissement_id ?? "",
  causes_blocage: row.causes_blocage ?? "",
  solutions_proposees: row.solutions_proposees ?? "",
  observations: row.observations ?? "",
});

export function useInfraProjetsSouffrance(
  rapportId: string | null,
  options?: { enabled?: boolean },
) {
  return useEntityEntries<InfraProjetSouffranceEntry>({
    rapportId,
    tableName: "infra_projets_en_souffrance",
    buildPayload,
    mapRowToEntry,
    enabled: options?.enabled ?? true,
    // 🛡️ Garde-fou : Ne déclenche l'enregistrement que si l'établissement est sélectionné
    validateBeforeSave: (entry) =>
      Boolean(entry.etablissement_id && entry.etablissement_id.trim() !== ""),
  });
}
