import { useEntityEntries, BaseEntry } from '../common/useEntityEntries';

export interface AfSuiviPartenariatEntry extends BaseEntry {
  partenaires: string;
  sujet_partenariat: string;
  evaluation: string;
  obstacles: string;
  solutions_proposees: string;
}

const buildPayload = (entry: AfSuiviPartenariatEntry, rId: string) => ({
  ...(entry.id ? { id: entry.id } : {}),
  rapport_id: rId,
  partenaires: entry.partenaires || null,
  sujet_partenariat: entry.sujet_partenariat || null,
  evaluation: entry.evaluation || null,
  obstacles: entry.obstacles || null,
  solutions_proposees: entry.solutions_proposees || null,
});

const mapRowToEntry = (row: any, local_id: string): AfSuiviPartenariatEntry => ({
  local_id,
  id: row.id,
  partenaires: row.partenaires ?? '',
  sujet_partenariat: row.sujet_partenariat ?? '',
  evaluation: row.evaluation ?? '',
  obstacles: row.obstacles ?? '',
  solutions_proposees: row.solutions_proposees ?? '',
});

export function useAfSuiviPartenariats(rapportId: string | null) {
  return useEntityEntries<AfSuiviPartenariatEntry>({
    rapportId,
    tableName: 'af_suivi_partenariats',
    buildPayload,
    mapRowToEntry,
  });
}