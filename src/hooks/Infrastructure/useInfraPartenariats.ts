import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function useInfraPartenariats(rapportId: string | null) {
  const [conventions, setConventions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Références pour gérer l'auto-sauvegarde (comme dans useEntityEntries)
  const isInitialLoad = useRef(true);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 1. CHARGEMENT : On lit la BDD plate et on la transforme en liste imbriquée
  const fetchItems = useCallback(async () => {
    if (!rapportId) {
      setConventions([]);
      return;
    }

    setLoading(true);
    isInitialLoad.current = true; // Empêche la sauvegarde au démarrage
    
    try {
      const { data, error } = await supabase
        .from('infra_projets_partenariat')
        .select('*')
        .eq('rapport_id', rapportId);

      if (error) throw error;

      // Groupement par "sujet_convention"
      const grouped = (data || []).reduce((acc: any[], row: any) => {
        let conv = acc.find(c => c.sujet_convention === row.sujet_convention);
        
        // Si la convention n'existe pas encore dans notre tableau, on la crée
        if (!conv) {
          conv = {
            local_id: crypto.randomUUID(),
            sujet_convention: row.sujet_convention,
            projets: []
          };
          acc.push(conv);
        }
        
        // On ajoute le projet à l'intérieur
        conv.projets.push({
          local_id: row.id,
          sujet_projet: row.sujet_projet,
          types_etablissements: row.types_etablissements || [],
          etablissement_id: row.etablissement_id || 'none',
          maitre_ouvrage_delegue: row.maitre_ouvrage_delegue || '',
          phase_projet: row.phase_projet || 'none',
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
      // On autorise les futures sauvegardes automatiques après 500ms
      setTimeout(() => { isInitialLoad.current = false; }, 500); 
    }
  }, [rapportId]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  // 2. SAUVEGARDE : On aplatit la liste et on utilise le "Delete & Insert" (Replace All)
  const saveItems = useCallback(async (dataToSave: any[]) => {
    if (!rapportId) return;

    try {
      const flatData: any[] = [];
      
      dataToSave.forEach(conv => {
        if (!conv.sujet_convention?.trim()) return; // On ignore les conventions vides

        (conv.projets || []).forEach((proj: any) => {
          if (!proj.sujet_projet?.trim()) return; // Un projet doit avoir un sujet

          flatData.push({
            rapport_id: rapportId,
            sujet_convention: conv.sujet_convention,
            sujet_projet: proj.sujet_projet,
            types_etablissements: proj.types_etablissements || [],
            etablissement_id: proj.etablissement_id === 'none' || !proj.etablissement_id ? null : proj.etablissement_id,
            maitre_ouvrage_delegue: proj.maitre_ouvrage_delegue || '',
            phase_projet: proj.phase_projet === 'none' || !proj.phase_projet ? null : proj.phase_projet,
            taux_avancement: Number(proj.taux_avancement) || 0,
            observations: proj.observations || ''
          });
        });
      });

      // Technique robuste : On supprime tout l'ancien historique pour ce rapport et on insère le nouveau
      await supabase.from('infra_projets_partenariat').delete().eq('rapport_id', rapportId);

      if (flatData.length > 0) {
        const { error } = await supabase.from('infra_projets_partenariat').insert(flatData);
        if (error) throw error;
      }
    } catch (err) {
      console.error('Erreur save partenariats:', err);
    }
  }, [rapportId]);

  // 3. AUTO-SAVE DEBOUNCE (Attend 1.5s d'inactivité avant de sauvegarder)
  useEffect(() => {
    if (isInitialLoad.current) return;

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    
    saveTimerRef.current = setTimeout(() => {
      saveItems(conventions);
    }, 1500);

    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [conventions, saveItems]);

  return { conventions, setConventions, loading };
}