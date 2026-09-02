import { computeInfraCompleteness } from "@/lib/infraCompleteness";
import { useEffect, useMemo, useState } from "react";

import { useInfraBtp } from "./useInfraBtp";
import { useInfraDepenses } from "./useInfraDepenses";
import { useInfraEauElectricite } from "./useInfraEauElectricite";
import { useInfraPartenariats } from "./useInfraPartenariats";
import { useInfraProjetsSouffrance } from "./useInfraProjetsSouffrance";

export function useInfraCompleteness(
  rapportId: string | null,
  refreshTrigger?: number,
  step?: number,
  onActivityTrigger?: number
) {
  // STEP 1
  const depenses = useInfraDepenses(rapportId);

  // STEP 2
  const [loadStep2, setLoadStep2] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setLoadStep2(true), 400);
    return () => clearTimeout(timer);
  }, []);
  const eauElec = useInfraEauElectricite(rapportId, { enabled: loadStep2 });

  // STEP 3
  const [loadStep3, setLoadStep3] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setLoadStep3(true), 800);
    return () => clearTimeout(timer);
  }, []);
  const partenariats = useInfraPartenariats(rapportId, { enabled: loadStep3 });

  // STEP 4
  const [loadStep4, setLoadStep4] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setLoadStep4(true), 1200);
    return () => clearTimeout(timer);
  }, []);
  const btp = useInfraBtp(rapportId, { enabled: loadStep4 });

  // STEP 5
  const [loadStep5, setLoadStep5] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setLoadStep5(true), 1600);
    return () => clearTimeout(timer);
  }, []);
  const souffrance = useInfraProjetsSouffrance(rapportId, { enabled: loadStep5 });

  // 🔄 1. REFRESH MANUEL (Immédiat)
  useEffect(() => {
    if (refreshTrigger && refreshTrigger > 0) {
      if (!rapportId) return;
      depenses.reload();
      if (loadStep2) eauElec.reload();
      if (loadStep4) btp.reload();
      if (loadStep5) souffrance.reload();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshTrigger]);

  // ⌨️ 2. REFRESH AUTO (Dual Polling)
  useEffect(() => {
    if (onActivityTrigger && onActivityTrigger > 0) {
      const reloadAll = () => {
        if (!rapportId) return;
        depenses.reload();
        if (loadStep2) eauElec.reload();
        if (loadStep4) btp.reload();
        if (loadStep5) souffrance.reload();
      };

      const t1 = setTimeout(reloadAll, 2000);
      const t2 = setTimeout(reloadAll, 4500);

      return () => { clearTimeout(t1); clearTimeout(t2); };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onActivityTrigger]);

  // ✅ CALCUL COMPLÉTUDE
  return useMemo(() => {
    if (!rapportId) return 0;

    const partenariatsData = (partenariats.conventions || []).reduce((acc: any[], conv: any) => {
      return [...acc, ...(conv.projets || [])];
    }, []);

    return computeInfraCompleteness({
      depenses: depenses.items,
      eauElec: eauElec.items,
      partenariats: partenariatsData,
      btp: btp.items,
      souffrance: souffrance.items,
    });
  }, [
    rapportId,
    refreshTrigger,
    step,
    onActivityTrigger,
    depenses.items,
    eauElec.items,
    partenariats.conventions,
    btp.items,
    souffrance.items,
  ]);
}