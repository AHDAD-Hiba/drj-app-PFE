import { DomainConfig } from "./wizard.types";

// Hook de complétude (à créer plus tard)
import { usePeCompleteness } from "@/hooks/ProtectionEnfance/usePeCompleteness";

// Les composants visuels (nous les créerons un par un)
import { Step1Education } from "@/components/wizard/ProtectionEnfance/Step1Education";
import { Step2Animation } from "@/components/wizard/ProtectionEnfance/Step2Animation";
import { Step3Gestion } from "@/components/wizard/ProtectionEnfance/Step3Gestion";
import { Step4LiberteSurveillee } from "@/components/wizard/ProtectionEnfance/Step4LiberteSurveillee";

export const protectionEnfanceConfig: DomainConfig = {
  id: "e521e2c2-eb21-41d2-a442-a6a87440ec1e",
  name: "PE",
  useCompleteness: (rapportId: string | null, refreshTrigger?: number) => {
    return usePeCompleteness(rapportId, refreshTrigger);
  },
  steps: [
    {
      id: 1,
      labelFr: "Éducation & Formation",
      labelAr: "التعليم والتكوين المهني",
      component: Step1Education,
    },
    {
      id: 2,
      labelFr: "Activités & Conseil",
      labelAr: "الأنشطة ومجلس الطفل",
      component: Step2Animation,
    },
    {
      id: 3,
      labelFr: "Gestion, Partenariats & Encadrement",
      labelAr: "التدبير، الشراكات والتأطير",
      component: Step3Gestion,
    },
    {
      id: 4,
      labelFr: "Liberté Surveillée & Justice",
      labelAr: "الديموغرافيا والتأطير",
      component: Step4LiberteSurveillee,
    },
  ],
};
