import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function useCrCompleteness(rapportId: string | null, refreshTrigger?: number) {
  const [globalPercentage, setGlobalPercentage] = useState<number>(0);

  const calculate = useCallback(async () => {
    if (!rapportId) {
      setGlobalPercentage(0);
      return;
    }

    try {
      // 1. جلب البيانات من كافة جداول قطاع دور الحضانة المرتبطة بالتقرير
      const [
        // Step 1
        demandesRes, traitementRes,
        // Step 2
        statsInfraRes, mouvementsRes, partenariatsRes, controleRes, cadresRes, labelRes,
        // Step 3
        statsEnfantsRes, activitesRes, formationsRes,
        // Step 4
        analysesRes, sondagesRes
      ] = await Promise.all([
        supabase.from('cr_demandes_licences').select('*').eq('rapport_id', rapportId),
        supabase.from('cr_traitement_licences').select('*').eq('rapport_id', rapportId),
        
        supabase.from('cr_stats_infrastructures').select('*').eq('rapport_id', rapportId),
        supabase.from('cr_mouvements_fermetures').select('*').eq('rapport_id', rapportId),
        supabase.from('cr_partenariats_conventions').select('*').eq('rapport_id', rapportId),
        supabase.from('cr_controle_creches').select('*').eq('rapport_id', rapportId),
        supabase.from('cr_cadres_assermentes').select('*').eq('rapport_id', rapportId),
        supabase.from('cr_label_qualite').select('*').eq('rapport_id', rapportId),
        
        supabase.from('cr_statistiques_enfants').select('*').eq('rapport_id', rapportId),
        supabase.from('cr_activites_enfants').select('*').eq('rapport_id', rapportId),
        supabase.from('cr_formations_cadres').select('*').eq('rapport_id', rapportId),
        
        supabase.from('cr_analyses_ponctuelles').select('*').eq('rapport_id', rapportId),
        supabase.from('cr_sondages_etudes').select('*').eq('rapport_id', rapportId),
      ]);

      // 2. دالة حساب نسبة الملء بناءً على الحقول الإجبارية (0 يعتبر قيمة صالحة)
      const getRatio = (data: any[] | null | undefined, mandatoryFields: string[]) => {
        if (!data || data.length === 0) return { filled: 0, total: 0 };
        let filled = 0;
        let total = data.length * mandatoryFields.length;
        
        data.forEach(item => {
          mandatoryFields.forEach(field => {
            const val = item[field];
            // الأرقام 0 صالحة، لذلك نتحقق فقط من null أو undefined أو السلاسل الفارغة
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

      // 3. تجميع الجداول في كل خطوة واستخراج نسبة الخطوة (0 إلى 1)
      const getStepRatio = (configs: { data: any[] | null | undefined, fields: string[] }[]) => {
        let totalFilled = 0;
        let totalFields = 0;
        let hasCards = false;

        configs.forEach(config => {
          if (config.data && config.data.length > 0) hasCards = true;
          const res = getRatio(config.data, config.fields);
          totalFilled += res.filled;
          totalFields += res.total;
        });

        if (!hasCards || totalFields === 0) return 0; 
        return totalFilled / totalFields;
      };

      // =========================================================================
      // CALCUL DYNAMIQUE PAR ÉTAPE (CRÈCHES)
      // =========================================================================

      // --- ÉTAPE 1 : Autorisations (تراخيص) ---
      const step1Ratio = getStepRatio([
        { data: demandesRes.data, fields: ['type_demande_id', 'statut_demande_id', 'nombre_demandes'] }, // observations excluded
        { data: traitementRes.data, fields: ['nombre_demandes_traitees', 'delai_moyen_traitement_jours'] } // observations excluded
      ]);

      // --- ÉTAPE 2 : Infrastructures & Contrôle (البنية التحتية والمراقبة) ---
      const step2Ratio = getStepRatio([
        { data: statsInfraRes.data, fields: ['nombre_creches_creees', 'nombre_creches_qualifiees', 'nombre_creches_equipees'] },
        { data: mouvementsRes.data, fields: ['type_mouvement', 'secteur', 'nombre_creches', 'raisons'] },
        { data: partenariatsRes.data, fields: ['partenaire', 'nombre_conventions'] }, // evaluation_engagement excluded if optional
        { data: controleRes.data, fields: ['creche_privee_id'] }, // resultats_controle excluded if optional
        { data: cadresRes.data, fields: ['statut_cadre_id', 'nombre_cadres'] },
        { data: labelRes.data, fields: ['statut_label'] }
      ]);

      // --- ÉTAPE 3 : Bénéficiaires & Ressources Humaines (المستفيدين والموارد البشرية) ---
      const step3Ratio = getStepRatio([
        { data: statsEnfantsRes.data, fields: ['garcons', 'filles', 'urbain', 'rural'] },
        { data: activitesRes.data, fields: ['nom_activite', 'garcons', 'filles', 'urbain', 'rural'] },
        { data: formationsRes.data, fields: ['domaine_formation', 'nombre_cadres', 'duree_valeur', 'duree_unite'] }
      ]);

      // --- ÉTAPE 4 : Études & Analyses (دراسات وتحليلات) ---
      const step4Ratio = getStepRatio([
        { data: analysesRes.data, fields: ['sujet', 'nombre_beneficiaires'] }, // explications excluded if optional
        { data: sondagesRes.data, fields: ['type_sondage', 'nombre_participants'] } // resultats excluded if optional
      ]);

      // =========================================================================
      // SCORE FINAL : La somme des 4 étapes divisée par 4
      // =========================================================================
      const totalScore = step1Ratio + step2Ratio + step3Ratio + step4Ratio;
      
      setGlobalPercentage(Math.round((totalScore / 4) * 100));

    } catch (err) {
      console.error('Erreur lors du calcul de complétude Crèches:', err);
    }
  }, [rapportId]);

  useEffect(() => {
    void calculate();
  }, [calculate, refreshTrigger]);

  return globalPercentage;
}