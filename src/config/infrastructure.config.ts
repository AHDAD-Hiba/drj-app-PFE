import { DomainConfig } from "./wizard.types";

import { useInfraCompleteness } from "@/hooks/Infrastructure/useInfraCompleteness";

// Les composants visuels (nous ajouterons les autres au fur et à mesure)
import { Step1Depenses } from "@/components/wizard/Infrastructure/Step1Depenses";
import { Step2EauElectricite } from "@/components/wizard/Infrastructure/Step2EauElectricite";
import { Step3Partenariats } from "@/components/wizard/Infrastructure/Step3Partenariats";
import { Step4BTP } from "@/components/wizard/Infrastructure/Step4BTP";
import { Step5ProjetsEnSouffrance } from "@/components/wizard/Infrastructure/Step5ProjetsEnSouffrance";

export const infrastructureConfig: DomainConfig = {
  id: "bf2cc627-577f-4028-a904-04172676ecfa",
  name: "infra",
  useCompleteness: useInfraCompleteness,
  steps: [
    {
      id: 1,
      labelFr: "Dépenses",
      labelAr: "نفقات التسيير والاستثمار",
      component: Step1Depenses,
    },
    {
      id: 2,
      labelFr: "Eau & Électricité",
      labelAr: "الماء والكهرباء",
      component: Step2EauElectricite,
    },
    {
      id: 3,
      labelFr: "Partenariats",
      labelAr: "مشاريع الشراكة",
      component: Step3Partenariats,
    },
    {
      id: 4,
      labelFr: "Projets BTP",
      labelAr: "مشاريع البناء والتهيئة",
      component: Step4BTP,
    },
    {
      id: 5,
      labelFr: "Projets Bloqués",
      labelAr: "المشاريع المتعثرة",
      component: Step5ProjetsEnSouffrance,
    },
  ],
};
