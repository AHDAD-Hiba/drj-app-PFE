import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useEntityEntries, BaseEntry } from '../common/useEntityEntries';

// ============================================================================
// 1. DEMANDES DE LICENCES (cr_demandes_licences)
// ============================================================================
export interface CrDemandeLicenceEntry extends BaseEntry {
  type_demande_id: string;
  type_demande_autre?: string;
  statut_demande_id: string;
  statut_demande_autre?: string;
  nombre_demandes: number;
  observations?: string;
}

const buildDemandePayload = (entry: CrDemandeLicenceEntry, rId: string) => ({
  ...(entry.id ? { id: entry.id } : {}),
  rapport_id: rId,
  type_demande_id: entry.type_demande_id || null,
  type_demande_autre: entry.type_demande_autre || null,
  statut_demande_id: entry.statut_demande_id || null,
  statut_demande_autre: entry.statut_demande_autre || null,
  nombre_demandes: Number(entry.nombre_demandes) || 0,
  observations: entry.observations || '',
});

const mapDemandeRow = (row: any, local_id: string): CrDemandeLicenceEntry => ({
  local_id,
  id: row.id,
  type_demande_id: row.type_demande_id || '',
  type_demande_autre: row.type_demande_autre || '',
  statut_demande_id: row.statut_demande_id || '',
  statut_demande_autre: row.statut_demande_autre || '',
  nombre_demandes: Number(row.nombre_demandes) || 0,
  observations: row.observations || '',
});

export function useCrDemandesLicences(rapportId: string | null) {
  return useEntityEntries<CrDemandeLicenceEntry>({
    rapportId,
    tableName: 'cr_demandes_licences',
    buildPayload: buildDemandePayload,
    mapRowToEntry: mapDemandeRow,
  });
}

// ============================================================================
// 2. TRAITEMENT DES LICENCES (cr_traitement_licences)
// ============================================================================
export interface CrTraitementLicenceEntry extends BaseEntry {
  nombre_demandes_traitees: number;
  delai_moyen_traitement_jours: number;
  observations?: string;
}

const buildTraitementPayload = (entry: CrTraitementLicenceEntry, rId: string) => ({
  ...(entry.id ? { id: entry.id } : {}),
  rapport_id: rId,
  nombre_demandes_traitees: Number(entry.nombre_demandes_traitees) || 0,
  delai_moyen_traitement_jours: Number(entry.delai_moyen_traitement_jours) || 0,
  observations: entry.observations || '',
});

const mapTraitementRow = (row: any, local_id: string): CrTraitementLicenceEntry => ({
  local_id,
  id: row.id,
  nombre_demandes_traitees: Number(row.nombre_demandes_traitees) || 0,
  delai_moyen_traitement_jours: Number(row.delai_moyen_traitement_jours) || 0,
  observations: row.observations || '',
});

export function useCrTraitementLicences(rapportId: string | null) {
  return useEntityEntries<CrTraitementLicenceEntry>({
    rapportId,
    tableName: 'cr_traitement_licences',
    buildPayload: buildTraitementPayload,
    mapRowToEntry: mapTraitementRow,
  });
}

// ============================================================================
// 3. CRÈCHES PRIVÉES AUTORISÉES (dir_creches_privees) -> Lié à la Direction !
// ============================================================================
export interface DirCrechePriveeEntry {
  id?: string;
  local_id: string;
  direction_id: string;
  nom_creche: string;
  capacite: number;
  type_autorisation: string;
  date_autorisation: string; // YYYY-MM-DD
  observations: string;
}

// Hook مخصص لأنه مرتبط بالمديرية (direction_id) وليس بالتقرير
export function useDirCrechesPrivees(directionId?: string) {
  const [items, setItems] = useState<DirCrechePriveeEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCreches = async () => {
      if (!directionId) return;
      setLoading(true);
      const { data, error } = await supabase
        .from('dir_creches_privees')
        .select('*')
        .eq('direction_id', directionId);

      if (!error && data) {
        setItems(data.map(row => ({
          local_id: crypto.randomUUID(),
          id: row.id,
          direction_id: row.direction_id,
          nom_creche: row.nom_creche || '',
          capacite: Number(row.capacite) || 0,
          type_autorisation: row.type_autorisation || '',
          date_autorisation: row.date_autorisation ? row.date_autorisation.split('T')[0] : '',
          observations: row.observations || ''
        })));
      }
      setLoading(false);
    };
    fetchCreches();
  }, [directionId]);

  const add = async (entry: Omit<DirCrechePriveeEntry, 'id'>) => {
    if (!directionId) return;
    setItems(prev => [...prev, entry as DirCrechePriveeEntry]);
    const payload = {
      direction_id: directionId,
      nom_creche: entry.nom_creche,
      capacite: entry.capacite,
      type_autorisation: entry.type_autorisation || null,
      date_autorisation: entry.date_autorisation || null,
      observations: entry.observations || null
    };
    const { data } = await supabase.from('dir_creches_privees').insert(payload).select().single();
    if (data) {
      setItems(prev => prev.map(item => item.local_id === entry.local_id ? { ...item, id: data.id } : item));
    }
  };

  const update = async (local_id: string, updates: Partial<DirCrechePriveeEntry>) => {
    setItems(prev => prev.map(item => item.local_id === local_id ? { ...item, ...updates } : item));
    const item = items.find(i => i.local_id === local_id);
    if (item && item.id) {
      const payload: any = { ...updates };
      // تنظيف القيم الفارغة للتواريخ
      if (payload.date_autorisation === '') payload.date_autorisation = null;
      await supabase.from('dir_creches_privees').update(payload).eq('id', item.id);
    }
  };

  const remove = async (local_id: string) => {
    const item = items.find(i => i.local_id === local_id);
    setItems(prev => prev.filter(i => i.local_id !== local_id));
    if (item && item.id) {
      await supabase.from('dir_creches_privees').delete().eq('id', item.id);
    }
  };

  return { items, add, update, remove, loading };
}