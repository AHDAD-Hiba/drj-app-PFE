import { DomainConfig } from './wizard.types';

// Le futur hook de calcul de complétude
import { useAfCompleteness } from '@/hooks/AffairesFeminines/useAfCompleteness';

// Les futurs composants visuels
import { Step1Formation } from '@/components/wizard/AffairesFeminines/Step1Formation';
import { Step2Insertion } from '@/components/wizard/AffairesFeminines/Step2Insertion';
import { Step3Sensibilisation } from '@/components/wizard/AffairesFeminines/Step3Sensibilisation';
import { Step4Ecoute } from '@/components/wizard/AffairesFeminines/Step4Ecoute';
import { Step5RH } from '@/components/wizard/AffairesFeminines/Step5RH';
import { Step6Infra } from '@/components/wizard/AffairesFeminines/Step6Infra';
import { Step7Partenariats } from '@/components/wizard/AffairesFeminines/Step7Partenariats';


export const affairesFemininesConfig: DomainConfig = {
  // Remplace cette chaîne par le vrai UUID de la table 'domaines' pour AF
  id: '9b9cca95-74dd-42b7-afca-19a19e1e70c3', 
  name: 'femme',
  useCompleteness: useAfCompleteness,
  steps: [
    { 
      id: 1, 
      labelFr: 'Formation Professionnelle', 
      labelAr: 'التكوين المهني', 
      component: Step1Formation 
    },
    { 
      id: 2, 
      labelFr: 'Insertion & AGR', 
      labelAr: 'الإدماج والأنشطة المدرة للدخل', 
      component: Step2Insertion 
    },
    { 
      id: 3, 
      labelFr: 'Sensibilisation & P.O.', 
      labelAr: 'التحسيس والأبواب المفتوحة', 
      component: Step3Sensibilisation 
    },
    { 
      id: 4, 
      labelFr: 'Centres d’Écoute', 
      labelAr: 'مراكز الاستماع', 
      component: Step4Ecoute 
    },
    { 
      id: 5, 
      labelFr: 'Ressources Humaines', 
      labelAr: 'الموارد البشرية', 
      component: Step5RH 
    },
    { 
      id: 6, 
      labelFr: 'Infrastructure', 
      labelAr: 'شبكة المؤسسات ', 
      component: Step6Infra 
    },
    {
      id: 7, 
      labelFr: 'Partenariats', 
      labelAr: 'الشراكات', 
      component: Step7Partenariats 
    }
  ],
};