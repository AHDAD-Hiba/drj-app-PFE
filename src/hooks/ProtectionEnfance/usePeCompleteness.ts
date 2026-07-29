import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function usePeCompleteness(rapportId: string | null, refreshTrigger?: number) {
  const [globalPercentage, setGlobalPercentage] = useState<number>(0);

  const calculate = useCallback(async () => {
    if (!rapportId) {
      setGlobalPercentage(0);
      return;
    }

    try {
      // 1. جلب البيانات من الجداول الحقيقية المتوافقة مع الهيكلة الجديدة ذات الـ 4 مراحل
      const [
        demographieRes,       // pe_statistiques_demographiques (للمراكز والحرية المحروسة)
        educationRes,         // pe_education
        ateliersRes,          // pe_ateliers_crees
        formationBenRes,      // pe_formation_beneficiaires
        activitesRes,         // pe_activites
        conseilRes,           // pe_conseil_enfant
        donsRes,              // pe_dons
        incidentsRes,         // pe_rapports_exceptionnels
        partenariatsRes,      // pe_partenariats
        formationPersoRes,    // pe_formation_personnel
        amenagementRes,       // pe_amenagement_equipement
        visitesRes,           // pe_visites_officielles
        rapportsJudicRes      // pe_rapports_judiciaires (للحريات المحروسة)
      ] = await Promise.all([
        supabase.from('pe_statistiques_demographiques').select('*').eq('rapport_id', rapportId),
        supabase.from('pe_education').select('*').eq('rapport_id', rapportId),
        supabase.from('pe_ateliers_crees').select('*').eq('rapport_id', rapportId),
        supabase.from('pe_formation_beneficiaires').select('*').eq('rapport_id', rapportId),
        supabase.from('pe_activites').select('*').eq('rapport_id', rapportId),
        supabase.from('pe_conseil_enfant').select('*').eq('rapport_id', rapportId),
        supabase.from('pe_dons').select('*').eq('rapport_id', rapportId),
        supabase.from('pe_rapports_exceptionnels').select('*').eq('rapport_id', rapportId),
        supabase.from('pe_partenariats').select('*').eq('rapport_id', rapportId),
        supabase.from('pe_formation_personnel').select('*').eq('rapport_id', rapportId),
        supabase.from('pe_amenagement_equipement').select('*').eq('rapport_id', rapportId),
        supabase.from('pe_visites_officielles').select('*').eq('rapport_id', rapportId),
        supabase.from('pe_rapports_judiciaires').select('*').eq('rapport_id', rapportId),
      ]);

      const getRatio = (data: any[] | null | undefined, mandatoryFields: string[]) => {
        if (!data || data.length === 0) return { filled: 0, total: 0 };
        let filled = 0;
        let total = data.length * mandatoryFields.length;
        
        data.forEach(item => {
          mandatoryFields.forEach(field => {
            const val = item[field];
            // يعتبر الحقل ممتلئاً إذا لم يكن فارغاً (الأصفار 0 تعتبر قيمة مدخلة وصحيحة)
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

      // فصل الديموغرافيا إلى جزأين بناءً على type_prise_charge
      const demoCentres = demographieRes.data?.filter(d => d.type_prise_charge === 'centre_sauvegarde') || [];
      const demoLS = demographieRes.data?.filter(d => d.type_prise_charge === 'liberte_surveillee') || [];

      // --- ÉTAPE 1: Scolarisation & Formation ---
      const step1Ratio = getStepRatio([
        { data: demoCentres, fields: ['garcons', 'filles'] },
        { data: educationRes.data, fields: ['beneficiaires_formel', 'beneficiaires_non_formel'] },
        { data: ateliersRes.data, fields: ['nom_atelier', 'nombre'] },
        { data: formationBenRes.data, fields: ['beneficiaires_intra', 'beneficiaires_extra'] }
      ]);

      // --- ÉTAPE 2: Animation & Vie Quotidienne ---
      const step2Ratio = getStepRatio([
        { data: activitesRes.data, fields: ['domaine_id', 'nom_activite', 'nombre_beneficiaires'] },
        { data: conseilRes.data, fields: ['nom_session', 'date_session'] },
        { data: donsRes.data, fields: ['donateur', 'nature_don'] },
        { data: incidentsRes.data, fields: ['type_incident_id', 'sujet_detaille'] }
      ]);

      // --- ÉTAPE 3: Gestion & Encadrement RH ---
      const step3Ratio = getStepRatio([
        { data: partenariatsRes.data, fields: ['type_partenariat', 'sujet', 'partenaires'] },
        { data: formationPersoRes.data, fields: ['cible', 'theme_formation', 'nombre_beneficiaires'] },
        { data: amenagementRes.data, fields: ['etablissement_id'] },
        { data: visitesRes.data, fields: ['entite_visiteuse', 'date_visite'] }
      ]);

      // --- ÉTAPE 4: Liberté Surveillée ---
      const step4Ratio = getStepRatio([
        { data: demoLS, fields: ['garcons', 'filles', 'ls_integres_enseignement', 'ls_integres_formation_pro', 'ls_integres_apprentissage', 'ls_integres_activites_durables'] },
        { data: rapportsJudicRes.data, fields: ['nombre_rapports'] }
      ]);

      // حساب المعدل الإجمالي على 4 مراحل
      const totalScore = step1Ratio + step2Ratio + step3Ratio + step4Ratio;
      
      // التخزين كنسبة مئوية
      setGlobalPercentage(Math.round((totalScore / 4) * 100));

    } catch (err) {
      console.error('Erreur complétude Protection Enfance:', err);
    }
  }, [rapportId]);

  useEffect(() => {
    void calculate();
  }, [calculate, refreshTrigger]);

  return globalPercentage;
}