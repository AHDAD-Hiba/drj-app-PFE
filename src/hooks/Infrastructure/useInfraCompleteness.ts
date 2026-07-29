import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function useInfraCompleteness(rapportId: string | null, refreshTrigger?: number) {
  const [globalPercentage, setGlobalPercentage] = useState<number>(0);

  const calculate = useCallback(async () => {
    if (!rapportId) {
      setGlobalPercentage(0);
      return;
    }

    try {
      // 1. Récupération des données des 5 tables d'Infrastructure depuis Supabase
      const [
        depensesRes,
        eauElecRes,
        partenariatsRes,
        btpRes,
        souffranceRes
      ] = await Promise.all([
        supabase.from('infra_depenses').select('*').eq('rapport_id', rapportId),
        supabase.from('infra_eau_electricite').select('*').eq('rapport_id', rapportId),
        supabase.from('infra_projets_partenariat').select('*').eq('rapport_id', rapportId),
        supabase.from('infra_projets_btp').select('*').eq('rapport_id', rapportId),
        supabase.from('infra_projets_en_souffrance').select('*').eq('rapport_id', rapportId),
      ]);

      // 2. Fonction pour calculer le ratio de remplissage d'une liste
      const getRatio = (data: any[] | null, mandatoryFields: string[]) => {
        if (!data || data.length === 0) return { filled: 0, total: 0 };
        
        let filled = 0;
        let total = data.length * mandatoryFields.length;

        data.forEach(item => {
          mandatoryFields.forEach(field => {
            const val = item[field];
            
            // On vérifie que la valeur existe, n'est pas vide, et n'est pas un tableau vide (pour les choix multiples)
            if (val !== undefined && val !== null && val !== '') {
              if (Array.isArray(val)) {
                if (val.length > 0) filled++;
              } else {
                filled++;
              }
            }
          });
        });
        return { filled, total };
      };

      // 3. Fonction pour combiner plusieurs tables/requêtes dans une même étape (si besoin)
      const getStepRatio = (configs: { data: any[] | null, fields: string[] }[]) => {
        let totalFilled = 0;
        let totalFields = 0;
        let hasCards = false;

        configs.forEach(config => {
          if (config.data && config.data.length > 0) hasCards = true;
          const res = getRatio(config.data, config.fields);
          totalFilled += res.filled;
          totalFields += res.total;
        });

        // Si l'étape est vide (aucune carte n'a été ajoutée), elle donne 0 point.
        if (!hasCards || totalFields === 0) return 0; 
        
        // Renvoie la fraction de remplissage (ex: 0.5 si la moitié des champs obligatoires sont remplis)
        return totalFilled / totalFields;
      };

      // =========================================================================
      // CALCUL DYNAMIQUE PAR ÉTAPE
      // =========================================================================

      // --- ÉTAPE 1 : Dépenses de Fonctionnement et Investissement ---
      const step1Ratio = getStepRatio([
        { 
          data: depensesRes.data, 
          fields: ['type_depense', 'projet_budgetaire', 'credits_ouverts', 'credits_engages', 'credits_payes'] 
        }
      ]);

      // --- ÉTAPE 2 : Consommation Eau & Électricité ---
      // (Le champ 'type_filtre' n'est qu'en UI, il n'est pas exigé en BDD, on exige etablissement_id)
      const step2Ratio = getStepRatio([
        { 
          data: eauElecRes.data, 
          fields: ['etablissement_id', 'arrieres_eau', 'arrieres_electricite', 'consommation_eau', 'consommation_electricite'] 
        }
      ]);

      // --- ÉTAPE 3 : Projets de Partenariats ---
      // (On exclut 'etablissement_id' (optionnel) et 'observations')
      const step3Ratio = getStepRatio([
        { 
          data: partenariatsRes.data, 
          fields: ['sujet_convention', 'sujet_projet', 'types_etablissements', 'maitre_ouvrage_delegue', 'phase_projet', 'taux_avancement'] 
        }
      ]);

      // --- ÉTAPE 4 : Projets BTP & Aménagement ---
      // (On exclut 'observations')
      const step4Ratio = getStepRatio([
        { 
          data: btpRes.data, 
          fields: ['type_projet', 'etablissement_id', 'cout_projet', 'montant_paye', 'taux_avancement_travaux'] 
        }
      ]);

      // --- ÉTAPE 5 : Projets en Souffrance ---
      // (On exclut 'observations')
      const step5Ratio = getStepRatio([
        { 
          data: souffranceRes.data, 
          fields: ['etablissement_id', 'causes_blocage', 'solutions_proposees'] 
        }
      ]);

      // =========================================================================
      // SCORE FINAL : La somme des 5 étapes divisée par 5
      // =========================================================================
      const totalScore = step1Ratio + step2Ratio + step3Ratio + step4Ratio + step5Ratio;
      
      setGlobalPercentage(Math.round((totalScore / 5) * 100));

    } catch (err) {
      console.error('Erreur lors du calcul de complétude Infra:', err);
    }
  }, [rapportId]);

  useEffect(() => {
    void calculate();
  }, [calculate, refreshTrigger]);

  return globalPercentage;
}