import { useEntityEntries, BaseEntry } from '../common/useEntityEntries';

export interface InfraProjetSouffranceEntry extends BaseEntry {
  type_filtre?: string; // Champ UI uniquement
  etablissement_id: string;
  causes_blocage: string;
  solutions_proposees: string;
  observations: string;
}

const buildPayload = (entry: InfraProjetSouffranceEntry, rId: string) => ({
  ...(entry.id ? { id: entry.id } : {}),
  rapport_id: rId,
  etablissement_id: entry.etablissement_id || null, // Clé étrangère
  causes_blocage: entry.causes_blocage || '',
  solutions_proposees: entry.solutions_proposees || '',
  observations: entry.observations || '',
});

const mapRowToEntry = (row: any, local_id: string): InfraProjetSouffranceEntry => ({
  local_id,
  id: row.id,
  type_filtre: '', // Vide par défaut pour forcer le placeholder ou l'auto-déduction
  etablissement_id: row.etablissement_id ?? '',
  causes_blocage: row.causes_blocage ?? '',
  solutions_proposees: row.solutions_proposees ?? '',
  observations: row.observations ?? '',
});

export function useInfraProjetsSouffrance(rapportId: string | null) {
  return useEntityEntries<InfraProjetSouffranceEntry>({
    rapportId,
    tableName: 'infra_projets_en_souffrance',
    buildPayload,
    mapRowToEntry,
  });
}