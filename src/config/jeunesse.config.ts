// src/config/jeunesse.config.ts
import { DomainConfig } from './wizard.types';
import { useJeunesseCompleteness } from '@/hooks/useJeunesseCompleteness';
// Import de tes composants autonomes
import { Step1Permanent } from '@/components/wizard/Step1Permanent';
import { Step2Rayonante } from '@/components/wizard/Step2Rayonante';
import { Step3Etablissement } from '@/components/wizard/Step3Etablissement';
import { Step4Camping } from '@/components/wizard/Step4Camping';
import { Step5Convention } from '@/components/wizard/Step5Convention';
import { Step6Festival } from '@/components/wizard/Step6Festival';
import { Step7SocioEco } from '@/components/wizard/Step7SocioEco';

export const jeunesseConfig: DomainConfig = {
  id: '9b15dc1d-5f39-4e5d-915c-33c465b3276e',
  name: 'jeunesse',
  // Pour l'instant on simule la complétude, on pourra extraire ton ancien script de calcul plus tard
  useCompleteness: useJeunesseCompleteness,
  steps: [
    { id: 1, labelFr: 'Permanentes', labelAr: 'الدائمة', component: Step1Permanent },
    { id: 2, labelFr: 'Rayonnantes', labelAr: 'الإشعاعية', component: Step2Rayonante },
    { id: 3, labelFr: 'Établissements', labelAr: 'المؤسسات', component: Step3Etablissement },
    { id: 4, labelFr: 'Camping', labelAr: 'التخييم', component: Step4Camping },
    { id: 5, labelFr: 'Conventions', labelAr: 'الاتفاقيات', component: Step5Convention },
    { id: 6, labelFr: 'Festivals', labelAr: 'المهرجانات', component: Step6Festival },
    { id: 7, labelFr: 'Socio-éco', labelAr: 'سوسيو-اقتصادي', component: Step7SocioEco },
  ],
};