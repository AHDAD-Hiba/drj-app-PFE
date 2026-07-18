import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function useAfCompleteness(rapportId: string | null, refreshTrigger?: number) {
  const [globalPercentage, setGlobalPercentage] = useState<number>(0);

  const calculate = useCallback(async () => {
    if (!rapportId) {
      setGlobalPercentage(0);
      return;
    }

    try {
      // 1. Récupération des données depuis Supabase
      const [
        clubsRes, ofpptRes, laureatesRes, agrRes,
        sensiRes, portesRes, ecouteRes, rhRes, cadresRes,
        reseauRes, partenariatsRes
      ] = await Promise.all([
        supabase.from('af_inscriptions_clubs').select('*').eq('rapport_id', rapportId),
        supabase.from('af_inscriptions_ofppt').select('*').eq('rapport_id', rapportId),
        supabase.from('af_integration_laureates').select('*').eq('rapport_id', rapportId),
        supabase.from('af_activites_generatrices_revenus').select('*').eq('rapport_id', rapportId),
        supabase.from('af_activites_sensibilisation').select('*').eq('rapport_id', rapportId),
        supabase.from('af_portes_ouvertes').select('*').eq('rapport_id', rapportId),
        supabase.from('af_centres_ecoute').select('*').eq('rapport_id', rapportId),
        supabase.from('af_ressources_humaines').select('*').eq('rapport_id', rapportId),
        supabase.from('af_formation_cadres').select('*').eq('rapport_id', rapportId),
        supabase.from('af_mise_a_jour_reseau').select('*').eq('rapport_id', rapportId),
        supabase.from('af_suivi_partenariats').select('*').eq('rapport_id', rapportId),
      ]);

      // 2. Fonction magique : Calcule le ratio de remplissage (0 à 1) d'une liste de cartes
      const getRatio = (data: any[] | null, mandatoryFields: string[]) => {
        if (!data || data.length === 0) return { filled: 0, total: 0 };
        
        let filled = 0;
        let total = data.length * mandatoryFields.length;

        data.forEach(item => {
          mandatoryFields.forEach(field => {
            const val = item[field];
            // Le chiffre 0 est valide pour les bénéficiaires/inscrites
            if (val !== undefined && val !== null && val !== '') {
              filled++;
            }
          });
        });
        return { filled, total };
      };

      // 3. Fonction pour combiner plusieurs tables dans une même étape
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

        // Si l'étape est vide (aucune carte), elle donne 0 point !
        if (!hasCards || totalFields === 0) return 0; 
        
        // Renvoie la fraction de remplissage (ex: 0.5 si la moitié des champs sont remplis)
        return totalFilled / totalFields;
      };

      // =========================================================================
      // CALCUL DYNAMIQUE PAR ÉTAPE (Basé sur tes interfaces)
      // =========================================================================

      // --- ÉTAPE 1 : Formation ---
      const step1Ratio = getStepRatio([
        { data: clubsRes.data, fields: ['etablissement_id', 'filiere_id', 'type_formation', 'inscrites_annee_1', 'inscrites_annee_2'] },
        { data: ofpptRes.data, fields: ['etablissement_id', 'secteur_id', 'filiere_id', 'niveau_formation', 'inscrites_annee_1', 'inscrites_annee_2'] }
      ]);

      // --- ÉTAPE 2 : Insertion & AGR ---
      const step2Ratio = getStepRatio([
        { data: laureatesRes.data, fields: ['type_formation', 'nombre_laureates', 'nombre_integrees'] },
        { data: agrRes.data, fields: ['etablissement_id', 'nombre_beneficiaires', 'partenaires'] } // observations exclu car optionnel
      ]);

      // --- ÉTAPE 3 : Sensibilisation & Portes Ouvertes ---
      const step3Ratio = getStepRatio([
        { data: sensiRes.data, fields: ['type_activite_id', 'lieu', 'sujet', 'date_activite', 'partenaires', 'benef_urbain', 'benef_rural'] }, // resultats_evaluation exclu
        { data: portesRes.data, fields: ['etablissement_id', 'type_activite_id', 'contenu_activite', 'nombre_beneficiaires', 'partenaires'] }
      ]);

      // --- ÉTAPE 4 : Centres d'écoute ---
      const step4Ratio = getStepRatio([
        { data: ecouteRes.data, fields: ['etablissement_id', 'type_soutien', 'nombre_seances'] } // nombre_cas exclu car optionnel
      ]);

      // --- ÉTAPE 5 : RH & Formations ---
      const step5Ratio = getStepRatio([
        { data: rhRes.data, fields: ['etablissement_id', 'type_rh', 'profile', 'nombre'] }, // mission et observations exclus
        { data: cadresRes.data, fields: ['domaine_formation', 'nombre_cadres', 'duree_valeur', 'unite_duree'] } // observations exclu
      ]);

      // --- ÉTAPE 6 : Réseau ---
      const step6Ratio = getStepRatio([
        { data: reseauRes.data, fields: ['type_mise_a_jour'] } // On exige au moins d'avoir déclaré le type de mouvement
      ]);

      // --- ÉTAPE 7 : Partenariats ---
      const step7Ratio = getStepRatio([
        { data: partenariatsRes.data, fields: ['partenaires', 'sujet_partenariat', 'evaluation', 'obstacles', 'solutions_proposees'] }
      ]);

      // =========================================================================
      // SCORE FINAL : La somme des 7 étapes divisée par 7
      // =========================================================================
      const totalScore = step1Ratio + step2Ratio + step3Ratio + step4Ratio + step5Ratio + step6Ratio + step7Ratio;
      
      setGlobalPercentage(Math.round((totalScore / 7) * 100));

    } catch (err) {
      console.error('Erreur lors du calcul de complétude:', err);
    }
  }, [rapportId]);

  useEffect(() => {
    void calculate();
  }, [calculate, refreshTrigger]);

  return globalPercentage;
}