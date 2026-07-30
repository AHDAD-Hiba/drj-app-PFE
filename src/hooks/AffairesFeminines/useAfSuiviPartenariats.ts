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
  partenaires: entry.partenaires?.trim() || null,
  sujet_partenariat: entry.sujet_partenariat?.trim() || null,
  evaluation: entry.evaluation?.trim() || null,
  obstacles: entry.obstacles?.trim() || null,
  solutions_proposees: entry.solutions_proposees?.trim() || null,
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
    // 🛡️ Garde-fou : Ne déclenche l'upsert BDD que si le nom du partenaire ou le sujet est renseigné
    validateBeforeSave: (entry) =>
      Boolean(entry.partenaires?.trim() || entry.sujet_partenariat?.trim()),
  });
}