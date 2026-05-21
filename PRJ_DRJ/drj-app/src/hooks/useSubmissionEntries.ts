import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { toast } from 'sonner'; // Optionnel pour le debug

export function useSubmissionEntries<T extends Record<string, any>>(
  tableName: keyof Database['public']['Tables'],
  foreignKeyValue: string | null,
  foreignKeyName: string,
  readOnly = false,
) {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);

  const reload = useCallback(async () => {
  if (!foreignKeyValue) {
    setItems([]);
    return;
  }

  let query = supabase
    .from(tableName as any)
    .select('*')
    .eq(foreignKeyName, foreignKeyValue);

  // order only if created_at exists
  if (
    tableName !== 'activites_insertion' &&
    tableName !== 'etablissements'
  ) {
    query = query.order('created_at', {
      ascending: true,
    });
  }

  const { data, error } = await query;

  if (error) {
    console.error(
      `Error reloading from ${String(tableName)}:`,
      error
    );
    return;
  }

  setItems(((data as unknown) as T[]) ?? []);
}, [tableName, foreignKeyValue, foreignKeyName]);

  useEffect(() => {
    let cancelled = false;
    if (!foreignKeyValue) {
      setItems([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    (async () => {
      try {
        await reload();
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [foreignKeyValue, reload]);

/**
   * Inserts a new entry to DB and reloads to get the id.
   */
  const add = useCallback(
    async (draft: T): Promise<boolean> => {
      if (readOnly || !foreignKeyValue) return false;

      try {
        const { id: _omit, ...rest } = draft;
        const payload = { ...rest, [foreignKeyName]: foreignKeyValue };

        // On utilise 'as any' sur l'appel complet pour éviter les erreurs de lien (Relationships)
        const { data: user } = await supabase.auth.getUser();

        const response = await supabase
          .from(tableName as any)
          .insert(payload as any)
          .select()
          .single();

        const { data, error } = response;


        if (error) {
          console.error("❌ Supabase ERROR FULL:", {
            message: error.message,
            code: error.code,
            details: error.details,
            hint: error.hint,
          });
        }
        if (error) {
          console.error(`Erreur Supabase lors de l'insertion dans ${String(tableName)}:`, error);
          return false;
        }


        // Mise à jour de l'état local avec le nouvel item
        if (data) {
          setItems(prev => [...prev, data as unknown as T]);
        }

        await reload();
        return true;
      } catch (err) {
        console.error("Erreur inattendue dans la fonction add:", err);
        return false;
      }
    },
    [readOnly, foreignKeyValue, foreignKeyName, tableName, reload],
  );

const updateById = useCallback(
  async (id: string, patch: Partial<T>): Promise<boolean> => {
    if (readOnly || !id) return false;

    const { id: _id, created_at, ...updateData } = patch as Partial<T> & { created_at?: string };

    try {
      const response = await supabase
        .from(tableName as any)
        .update(updateData as any)
        .eq('id', id)
        .select()
        .single();

      const { data, error } = response;

      if (error) {
        console.error(`❌ UPDATE ERROR for ${String(tableName)} id=${id}:`, {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
        });
        return false;
      }

      if (!data) {
        console.error(`❌ UPDATE FAILED: no row found for ${String(tableName)} id=${id}`);
        return false;
      }

      await reload();
      return true;
    } catch (err) {
      console.error(`❌ Unexpected error during updateById for ${String(tableName)} id=${id}:`, err);
      return false;
    }
  },
  [readOnly, tableName, reload],
);

  return { items, add, updateById, removeById: useCallback(async (id: string) => { /* ... */ return true; }, []), reload, loading };
}