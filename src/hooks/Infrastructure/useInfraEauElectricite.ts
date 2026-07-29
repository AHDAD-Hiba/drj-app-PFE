import { useEntityEntries, BaseEntry } from '../common/useEntityEntries';

export interface InfraEauElectriciteEntry extends BaseEntry {
  type_filtre?: string; // Champ UI uniquement (ne sera pas envoyé à la BDD)
  etablissement_id: string;
  arrieres_eau: number;
  arrieres_electricite: number;
  consommation_eau: number;
  consommation_electricite: number;
}

// Fonctions sorties du hook pour la stabilité
const buildPayload = (entry: InfraEauElectriciteEntry, rId: string) => ({
  ...(entry.id ? { id: entry.id } : {}),
  rapport_id: rId,
  etablissement_id: entry.etablissement_id || null, // Clé étrangère
  arrieres_eau: Number(entry.arrieres_eau) || 0,
  arrieres_electricite: Number(entry.arrieres_electricite) || 0,
  consommation_eau: Number(entry.consommation_eau) || 0,
  consommation_electricite: Number(entry.consommation_electricite) || 0,
});

const mapRowToEntry = (row: any, local_id: string): InfraEauElectriciteEntry => ({
  local_id,
  id: row.id,
  etablissement_id: row.etablissement_id ?? '',
  // On initialise type_filtre à vide, on le corrigera dans le composant React au chargement
  type_filtre: '', 
  arrieres_eau: Number(row.arrieres_eau) || 0,
  arrieres_electricite: Number(row.arrieres_electricite) || 0,
  consommation_eau: Number(row.consommation_eau) || 0,
  consommation_electricite: Number(row.consommation_electricite) || 0,
});

export function useInfraEauElectricite(rapportId: string | null) {
  return useEntityEntries<InfraEauElectriciteEntry>({
    rapportId,
    tableName: 'infra_eau_electricite',
    buildPayload,
    mapRowToEntry,
  });
}