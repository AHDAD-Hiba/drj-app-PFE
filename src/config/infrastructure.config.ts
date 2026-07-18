import { DomainConfig } from './wizard.types';

//import { useInfraCompleteness } from '@/hooks/Infrastructure/useInfraCompleteness';

// Les composants visuels (nous ajouterons les autres au fur et à mesure)
//import { Step1Depenses } from '@/components/wizard/Infrastructure/Step1Depenses';

export const infrastructureConfig: DomainConfig = {
  // ⚠️ Remplace cette chaîne par le vrai UUID du domaine Infra généré dans ta base de données
  id: 'bf2cc627-577f-4028-a904-04172676ecfa', 
  name: 'infra',
  useCompleteness: (rapportId: string | null, refreshTrigger?: number) => {
    return useInfraCompleteness(rapportId, refreshTrigger);
  },
  steps: [
    { 
      id: 1, 
      labelFr: 'Dépenses', 
      labelAr: 'نفقات التسيير والاستثمار', 
      component: () => null
    },
    { 
      id: 2, 
      labelFr: 'Eau & Électricité', 
      labelAr: 'الماء والكهرباء', 
      component: () => null // Placeholder pour Step2
    },
    { 
      id: 3, 
      labelFr: 'Partenariats', 
      labelAr: 'مشاريع الشراكة', 
      component: () => null // Placeholder pour Step3
    },
    { 
      id: 4, 
      labelFr: 'Projets BTP', 
      labelAr: 'مشاريع البناء والتهيئة', 
      component: () => null // Placeholder pour Step4
    },
    { 
      id: 5, 
      labelFr: 'Projets Bloqués', 
      labelAr: 'المشاريع المتعثرة', 
      component: () => null // Placeholder pour Step5
    }
  ],
};