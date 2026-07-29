import { useEntityEntries, BaseEntry } from '../common/useEntityEntries';

export interface InfraDepenseEntry extends BaseEntry {
  type_depense: 'fonctionnement' | 'investissement';
  projet_budgetaire: string;
  credits_ouverts: number;
  credits_engages: number;
  credits_payes: number;
}

// Fonctions sorties du hook pour la stabilité
const buildPayload = (entry: InfraDepenseEntry, rId: string) => ({
  ...(entry.id ? { id: entry.id } : {}),
  rapport_id: rId,
  type_depense: entry.type_depense,
  projet_budgetaire: entry.projet_budgetaire || '',
  credits_ouverts: Number(entry.credits_ouverts) || 0,
  credits_engages: Number(entry.credits_engages) || 0,
  credits_payes: Number(entry.credits_payes) || 0,
});

const mapRowToEntry = (row: any, local_id: string): InfraDepenseEntry => ({
  local_id,
  id: row.id,
  type_depense: row.type_depense,
  projet_budgetaire: row.projet_budgetaire || '',
  credits_ouverts: Number(row.credits_ouverts) || 0,
  credits_engages: Number(row.credits_engages) || 0,
  credits_payes: Number(row.credits_payes) || 0,
});

export function useInfraDepenses(rapportId: string | null) {
  return useEntityEntries<InfraDepenseEntry>({
    rapportId,
    tableName: 'infra_depenses',
    buildPayload,
    mapRowToEntry,
  });
}