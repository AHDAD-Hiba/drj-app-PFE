import { useEntityEntries, BaseEntry } from '../common/useEntityEntries';

export interface InfraBtpEntry extends BaseEntry {
  type_projet: string;
  type_filtre?: string; // Champ UI uniquement
  etablissement_id: string;
  cout_projet: number;
  montant_paye: number;
  taux_avancement_travaux: number;
  observations: string;
}

const buildPayload = (entry: InfraBtpEntry, rId: string) => ({
  ...(entry.id ? { id: entry.id } : {}),
  rapport_id: rId,
  type_projet: entry.type_projet ?? null,
  etablissement_id: entry.etablissement_id ?? null, // Clé étrangère
  cout_projet: Number(entry.cout_projet) || 0,
  montant_paye: Number(entry.montant_paye) || 0,
  taux_avancement_travaux: Number(entry.taux_avancement_travaux) || 0,
  observations: entry.observations || '',
});

const mapRowToEntry = (row: any, local_id: string): InfraBtpEntry => ({
  local_id,
  id: row.id,
  type_projet: row.type_projet ?? 'construction',
  // On laisse vide pour forcer l'affichage du placeholder lors d'un ajout,
  // ou laisser le composant React le déduire au chargement :
  type_filtre: '', 
  etablissement_id: row.etablissement_id ?? '',
  cout_projet: Number(row.cout_projet) || 0,
  montant_paye: Number(row.montant_paye) || 0,
  taux_avancement_travaux: Number(row.taux_avancement_travaux) || 0,
  observations: row.observations ?? '',
});

export function useInfraBtp(rapportId: string | null, options?: { enabled?: boolean }) {
  return useEntityEntries<InfraBtpEntry>({
    rapportId,
    tableName: 'infra_projets_btp', // 👈 Modifie ici si ta table a un autre nom
    buildPayload,
    mapRowToEntry,
    enabled: options?.enabled ?? true,
  });
}