import { useEntityEntries, BaseEntry } from '@/hooks/common/useEntityEntries';

export interface MouvementAssociation extends BaseEntry {
  nom_association: string;
  type_mouvement: 'entrante' | 'sortante';
  date_mouvement: string;
  beneficiaires: number | string;
}

const buildPayload = (entry: MouvementAssociation, rapportId: string) => ({
  ...(entry.id ? { id: entry.id } : {}),
  rapport_id: rapportId,
  nom_association: entry.nom_association.trim(),
  type_mouvement: entry.type_mouvement,
  date_mouvement: entry.date_mouvement || new Date().toISOString().split('T')[0],
  beneficiaires:
    entry.beneficiaires === '' || entry.beneficiaires === null || entry.beneficiaires === undefined
      ? null
      : Number(entry.beneficiaires),
});

const mapRowToEntry = (row: any, localId: string): MouvementAssociation => ({
  local_id: localId,
  id: row.id,
  nom_association: row.nom_association ?? '',
  type_mouvement: (row.type_mouvement as 'entrante' | 'sortante') ?? 'entrante',
  date_mouvement: row.date_mouvement ?? '',
  beneficiaires: row.beneficiaires ?? '',
});

export function useMouvementsAssociations(rapportId: string | null) {
  return useEntityEntries<MouvementAssociation>({
    rapportId,
    tableName: 'mouvements_associations',
    buildPayload,
    mapRowToEntry,
    validateBeforeSave: (entry) => Boolean(entry.nom_association?.trim()),
  });
}