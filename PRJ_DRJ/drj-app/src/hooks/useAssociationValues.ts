import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface AssociationValue {
  local_id: string;
  id?: string;
  categorie_association_id: string;
  nombre_associations: number;
}

interface AssociationValueRow {
  id: string;
  rapport_id: string;
  categorie_association_id: string;
  nombre_associations: number;
}

export function useAssociationValues(rapportId: string | null) {
  const [items, setItems] = useState<AssociationValue[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const itemsRef = useRef<AssociationValue[]>([]);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  // ====================
  // Reload Logic
  // ====================
  const reload = useCallback(async (): Promise<AssociationValue[]> => {
    if (!rapportId) {
      setItems([]);
      return [];
    }

    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('valeurs_associations')
        .select('*')
        .eq('rapport_id', rapportId);

      if (error) {
        console.error('[useAssociationValues] error:', error);
        return [];
      }

      const normalized: AssociationValue[] = (data as AssociationValueRow[] || []).map((v) => ({
        local_id: crypto.randomUUID(),
        id: v.id,
        categorie_association_id: v.categorie_association_id,
        nombre_associations: v.nombre_associations || 0,
      }));

      setItems(normalized);
      return normalized;
    } finally {
      setLoading(false);
    }
  }, [rapportId]);

  useEffect(() => {
    let cancelled = false;
    if (!rapportId) {
      setItems([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    (async () => {
      try {
        if (!cancelled) await reload();
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [rapportId, reload]);

  const updateLocal = useCallback(
    (local_id: string, patch: Partial<AssociationValue>) => {
      setItems(prev => {
        const existing = prev.find(x => x.local_id === local_id);

        if (!existing && local_id.startsWith('temp-')) {
          return [
            ...prev,
            {
              local_id,
              categorie_association_id:
                patch.categorie_association_id ?? '',
              nombre_associations:
                patch.nombre_associations ?? 0,
            },
          ];
        }

        return prev.map(item =>
          item.local_id === local_id
            ? { ...item, ...patch }
            : item
        );
      });
    },
    [],
  );
  
  const saveTimersRef = useRef<
    Record<string, ReturnType<typeof setTimeout>>
  >({});

  const savingEntriesRef = useRef<Set<string>>(new Set());

  const saveEntry = useCallback(
  async (local_id: string): Promise<boolean> => {
    if (savingEntriesRef.current.has(local_id)) {
      return true;
    }

    savingEntriesRef.current.add(local_id);

    try {
      const entry = itemsRef.current.find(
        x => x.local_id === local_id
      );

      if (!entry) {
        return true;
      }

      if (!rapportId) {
        return true;
      }

      if (entry.nombre_associations === 0) {
        if (entry.id) {
          await supabase
            .from('valeurs_associations')
            .delete()
            .eq('id', entry.id);
        }

        setItems(prev =>
          prev.filter(x => x.local_id !== local_id)
        );

        return true;
      }

      const payload = {
        rapport_id: rapportId,
        categorie_association_id:
          entry.categorie_association_id,
        nombre_associations:
          entry.nombre_associations,
      };

      const { data, error } = await supabase
        .from('valeurs_associations')
        .upsert(payload, {
          onConflict:
            'rapport_id,categorie_association_id',
        })
        .select('id')
        .single();

      if (error) throw error;

      setItems(prev =>
        prev.map(item =>
          item.local_id === local_id
            ? {
                ...item,
                id: data.id,
              }
            : item
        )
      );

      return true;
    } catch (error) {
      console.error(
        '[useAssociationValues] save error:',
        error
      );
      return false;
    } finally {
      savingEntriesRef.current.delete(local_id);
    }
  },
  [rapportId]
);
  // ====================
  // Update Logic
  // ====================
const update = useCallback(
  async (
    local_id: string,
    patch: Partial<AssociationValue>
  ): Promise<boolean> => {

    updateLocal(local_id, patch);

    if (saveTimersRef.current[local_id]) {
      clearTimeout(
        saveTimersRef.current[local_id]
      );
    }

    saveTimersRef.current[local_id] =
      setTimeout(() => {
        delete saveTimersRef.current[local_id];
        void saveEntry(local_id);
      }, 1500);

    return true;
  },
  [updateLocal, saveEntry]
);
  return { items, loading, isSaving, reload, update };
}
