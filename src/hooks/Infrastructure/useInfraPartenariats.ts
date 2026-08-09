import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function useInfraPartenariats(rapportId: string | null) {
  const [conventions, setConventions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  const isInitialLoad = useRef(true);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 1. CHARGEMENT : Groupement par "sujet_convention"
  const fetchItems = useCallback(async () => {
    if (!rapportId) {
      setConventions([]);
      return;
    }

    setLoading(true);
    isInitialLoad.current = true;
    
    try {
      const { data, error } = await supabase
        .from('infra_projets_partenariat')
        .select('*')
        .eq('rapport_id', rapportId);

      if (error) throw error;

      const grouped = (data || []).reduce((acc: any[], row: any) => {
        let conv = acc.find(c => c.sujet_convention === row.sujet_convention);
        
        if (!conv) {
          conv = {
            local_id: crypto.randomUUID(),
            sujet_convention: row.sujet_convention || '',
            projets: []
          };
          acc.push(conv);
        }
        
        conv.projets.push({
          local_id: row.id,
          db_id: row.id,
          sujet_projet: row.sujet_projet || '',
          types_etablissements: row.types_etablissements || [],
          etablissement_id: row.etablissement_id || '',
          maitre_ouvrage_delegue: row.maitre_ouvrage_delegue || '',
          phase_projet: row.phase_projet || '',
          taux_avancement: Number(row.taux_avancement) || 0,
          observations: row.observations || ''
        });
        
        return acc;
      }, []);

      setConventions(grouped);
    } catch (err) {
      console.error('Erreur fetch partenariats:', err);
    } finally {
      setLoading(false);
      setTimeout(() => { isInitialLoad.current = false; }, 500); 
    }
  }, [rapportId]);

  useEffect(() => {
    void fetchItems();
  }, [fetchItems]);

  // 2. SAUVEGARDE SÉCURISÉE SANS PERTE DE DONNÉES
  const saveItems = useCallback(async (dataToSave: any[]) => {
    if (!rapportId) return;

    try {
      const flatData: any[] = [];
      const currentDbIds: string[] = [];

      dataToSave.forEach(conv => {
        // 🎯 Ne pas bloquer la sauvegarde si le sujet est temporairement vide
        const sujetConv = conv.sujet_convention?.trim() || 'Sans titre';

        (conv.projets || []).forEach((proj: any) => {
          const row: any = {
            rapport_id: rapportId,
            sujet_convention: sujetConv,
            sujet_projet: proj.sujet_projet?.trim() || 'Nouveau projet',
            types_etablissements: proj.types_etablissements || [],
            etablissement_id: proj.etablissement_id && proj.etablissement_id !== 'none' ? proj.etablissement_id : null,
            maitre_ouvrage_delegue: proj.maitre_ouvrage_delegue?.trim() || '',
            phase_projet: proj.phase_projet && proj.phase_projet !== 'none' ? proj.phase_projet : null,
            taux_avancement: Number(proj.taux_avancement) || 0,
            observations: proj.observations?.trim() || ''
          };

          if (proj.db_id) {
            row.id = proj.db_id;
            currentDbIds.push(proj.db_id);
          }

          flatData.push(row);
        });
      });

      // 🎯 1. Supprimer uniquement les projets qui ont été retirés de l'UI (qui avaient un ID mais ne sont plus dans flatData)
      const { data: existingInDb } = await supabase
        .from('infra_projets_partenariat')
        .select('id')
        .eq('rapport_id', rapportId);

      if (existingInDb && existingInDb.length > 0) {
        const idsToDelete = existingInDb
          .map(item => item.id)
          .filter(id => !currentDbIds.includes(id));

        if (idsToDelete.length > 0) {
          await supabase
            .from('infra_projets_partenariat')
            .delete()
            .in('id', idsToDelete);
        }
      }

      // 🎯 2. Utiliser UPSERT pour enregistrer/mettre à jour les projets sans tout supprimer
      if (flatData.length > 0) {
        const { data: savedData, error } = await supabase
          .from('infra_projets_partenariat')
          .upsert(flatData, { onConflict: 'id' })
          .select('id, sujet_convention, sujet_projet');

        if (error) throw error;

        // 🎯 3. Mettre à jour les `db_id` localement pour les nouveaux projets créés
        if (savedData && savedData.length > 0) {
          setConventions(prev =>
            prev.map(c => ({
              ...c,
              projets: c.projets.map(p => {
                const matched = savedData.find(
                  s => s.sujet_convention === c.sujet_convention && s.sujet_projet === p.sujet_projet
                );
                return matched ? { ...p, db_id: matched.id, local_id: matched.id } : p;
              })
            }))
          );
        }
      }
    } catch (err) {
      console.error('Erreur save partenariats:', err);
    }
  }, [rapportId]);

  // 3. AUTO-SAVE DEBOUNCE (1.5s)
  useEffect(() => {
    if (isInitialLoad.current) return;

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    
    saveTimerRef.current = setTimeout(() => {
      void saveItems(conventions);
    }, 1500);

    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [conventions, saveItems]);

  return { conventions, setConventions, loading };
}