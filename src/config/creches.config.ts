import { DomainConfig } from './wizard.types';

// Hook de complétude (version initiale)
import { useCrCompleteness } from '@/hooks/Creches/useCrCompleteness';

// Les composants visuels des 4 étapes
import { Step1Autorisations } from '@/components/wizard/Creches/Step1Autorisations';
import { Step2Infrastructures } from '@/components/wizard/Creches/Step2Infrastructures';
import { Step3Beneficiaires } from '@/components/wizard/Creches/Step3Beneficiaires';
import { Step4EtudesAnalyses } from '@/components/wizard/Creches/Step4EtudesAnalyses';

export const crechesConfig: DomainConfig = {
  // نفس الـ ID الذي استخدمناه في قاعدة البيانات
  id: '556a7353-770d-48a2-8adf-643004a46884',
  name: 'creches',
  useCompleteness: (rapportId: string | null, refreshTrigger?: number) => {
    return useCrCompleteness(rapportId, refreshTrigger);
  },
  steps: [
    { 
      id: 1, 
      labelFr: 'Autorisations & Registre', 
      labelAr: 'التراخيص وسجل الحضانات', 
      component: Step1Autorisations
    },
    { 
      id: 2, 
      labelFr: 'Infrastructures & Contrôle', 
      labelAr: 'البنية التحتية والمراقبة', 
      component: Step2Infrastructures
    },
    { 
      id: 3, 
      labelFr: 'Bénéficiaires & Activités', 
      labelAr: 'المستفيدون والأنشطة', 
      component: Step3Beneficiaires
    },
    { 
      id: 4, 
      labelFr: 'Études, Analyses et Sondages',
      labelAr: 'الدراسات, التحليلات المعمقة، واستطلاعات الرأي', 
      component: Step4EtudesAnalyses
    }
  ],
};