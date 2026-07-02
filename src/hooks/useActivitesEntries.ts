import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type TypeActivite = 'permanente' | 'rayonnante';

export interface Activite {
  id: string;
  rapport_id: string;
  type_activite: TypeActivite;

  activites_culturelles: number | null;
  activites_educatives: number | null;
  activites_sportives: number | null;
  nombre_associations: number | null;
  nombre_clubs: number | null;
  nombre_conventions: number | null;
  renforcement_capacites: number | null;
}

export const useActivitesEntries = (rapportId: string | null) => {
  const [items, setItems] = useState<Activite[]>([]);
  const [loading, setLoading] = useState(false);

  const reload = useCallback(async () => {
    if (!rapportId) {
      setItems([]);
      return;
    }

    const { data, error } = await supabase
      .from('activites')
      .select('*')
      .eq('rapport_id', rapportId);

    if (error) {
      console.error(error);
      return;
    }

    setItems(data ?? []);
  }, [rapportId]);

  useEffect(() => {
    setLoading(true);

    reload().finally(() => {
      setLoading(false);
    });
  }, [reload]);

  const save = useCallback(
    async (
      type: TypeActivite,
      values: Record<string, any>
    ): Promise<boolean> => {
      if (!rapportId) return false;

      const { error } = await supabase
        .from('activites')
        .upsert(
          {
            ...values,
            rapport_id: rapportId,
            type_activite: type,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: 'rapport_id,type_activite',
          }
        );

      if (error) {
        console.error(error);
        return false;
      }

      await reload();
      return true;
    },
    [rapportId, reload]
  );

  const permanente =
    items.find((x) => x.type_activite === 'permanente') ?? null;

  const rayonnante =
    items.find((x) => x.type_activite === 'rayonnante') ?? null;

  return {
    loading,
    permanente,
    rayonnante,

    savePermanente: (values: Record<string, any>) =>
      save('permanente', values),

    saveRayonnante: (values: Record<string, any>) =>
      save('rayonnante', values),

    reload,
  };
};