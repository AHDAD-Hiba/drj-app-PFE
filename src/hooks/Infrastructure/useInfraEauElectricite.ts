import { useEntityEntries, BaseEntry } from '../common/useEntityEntries';

export interface InfraEauElectriciteEntry extends BaseEntry {
  type_filtre?: string; // Champ UI uniquement (non persisté)
  etablissement_id: string;
  arrieres_eau: number;
  arrieres_electricite: number;
  consommation_eau: number;
  consommation_electricite: number;
}

const buildPayload = (entry: InfraEauElectriciteEntry, rId: string) => {
  // 🎯 NE PAS inclure 'id' si la ligne n'est pas encore créée en BDD (évite l'échec sur id temporaire)
  const isPersisted = entry.id && !entry.id.includes('-'); 

  const payload: any = {
    rapport_id: rId,
    etablissement_id: entry.etablissement_id && entry.etablissement_id.trim() !== '' ? entry.etablissement_id : null,
    arrieres_eau: Number(entry.arrieres_eau) || 0,
    arrieres_electricite: Number(entry.arrieres_electricite) || 0,
    consommation_eau: Number(entry.consommation_eau) || 0,
    consommation_electricite: Number(entry.consommation_electricite) || 0,
  };

  // Si on a un vrai ID PostgreSQL (UUID existant renvoyé par la BDD)
  if (entry.id) {
    payload.id = entry.id;
  }

  return payload;
};

const mapRowToEntry = (row: any, local_id: string): InfraEauElectriciteEntry => ({
  local_id,
  id: row.id, // L'ID réel retourné par PostgreSQL
  etablissement_id: row.etablissement_id ?? '',
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
    // 🛡️ Garde-fou : Ne tente la sauvegarde en BDD que si etablissement_id n'est pas vide
    validateBeforeSave: (entry) => Boolean(entry.etablissement_id && entry.etablissement_id.trim() !== ''),
  });
}