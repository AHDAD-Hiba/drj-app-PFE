import { computePeCompleteness } from "@/lib/peCompleteness";
import { useEffect, useMemo, useState } from "react";

import { usePeAteliers, usePeDemographie, usePeEducation, usePeFormation } from "./usePeStep1";
import { usePeActivites, usePeConseilEnfant, usePeDons, usePeIncidents } from "./usePeStep2";
import { usePeAmenagements, usePeFormations, usePePartenariats, usePeVisites } from "./usePeStep3";
import { usePeRapportsJudiciaires, usePeStatistiquesLS } from "./usePeStep4";

export function usePeCompleteness(
  rapportId: string | null,
  refreshTrigger?: number,
  step?: number,
  onActivityTrigger?: number
) {
  // STEP 1
  const demographie = usePeDemographie(rapportId);
  const education = usePeEducation(rapportId);
  const ateliers = usePeAteliers(rapportId);
  const formationBen = usePeFormation(rapportId);

  // STEP 2
  const [loadStep2, setLoadStep2] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setLoadStep2(true), 400);
    return () => clearTimeout(timer);
  }, []);
  const activites = usePeActivites(rapportId, { enabled: loadStep2 });
  const conseil = usePeConseilEnfant(rapportId, { enabled: loadStep2 });
  const dons = usePeDons(rapportId, { enabled: loadStep2 });
  const incidents = usePeIncidents(rapportId, { enabled: loadStep2 });

  // STEP 3
  const [loadStep3, setLoadStep3] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setLoadStep3(true), 800);
    return () => clearTimeout(timer);
  }, []);
  const partenariats = usePePartenariats(rapportId, { enabled: loadStep3 });
  const formationPerso = usePeFormations(rapportId, { enabled: loadStep3 });
  const amenagement = usePeAmenagements(rapportId, { enabled: loadStep3 });
  const visites = usePeVisites(rapportId, { enabled: loadStep3 });

  // STEP 4
  const [loadStep4, setLoadStep4] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setLoadStep4(true), 1200);
    return () => clearTimeout(timer);
  }, []);
  const statsLS = usePeStatistiquesLS(rapportId, { enabled: loadStep4 });
  const rapportsJudic = usePeRapportsJudiciaires(rapportId, { enabled: loadStep4 });

  // 🔄 1. REFRESH MANUEL (Immédiat)
  useEffect(() => {
    if (refreshTrigger && refreshTrigger > 0) {
      if (!rapportId) return;
      demographie.reload(); education.reload(); ateliers.reload(); formationBen.reload();
      if (loadStep2) { activites.reload(); conseil.reload(); dons.reload(); incidents.reload(); }
      if (loadStep3) { partenariats.reload(); formationPerso.reload(); amenagement.reload(); visites.reload(); }
      if (loadStep4) { statsLS.reload(); rapportsJudic.reload(); }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshTrigger]);

  // ⌨️ 2. REFRESH AUTO (Dual Polling)
  useEffect(() => {
    if (onActivityTrigger && onActivityTrigger > 0) {
      const reloadAll = () => {
        if (!rapportId) return;
        demographie.reload(); education.reload(); ateliers.reload(); formationBen.reload();
        if (loadStep2) { activites.reload(); conseil.reload(); dons.reload(); incidents.reload(); }
        if (loadStep3) { partenariats.reload(); formationPerso.reload(); amenagement.reload(); visites.reload(); }
        if (loadStep4) { statsLS.reload(); rapportsJudic.reload(); }
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
    return computePeCompleteness({
      demoCentres: demographie.items,
      education: education.items,
      ateliers: ateliers.items,
      formationBen: formationBen.items,
      activites: activites.items,
      conseil: conseil.items,
      dons: dons.items,
      incidents: incidents.items,
      partenariats: partenariats.items,
      formationPerso: formationPerso.items,
      amenagement: amenagement.items,
      visites: visites.items,
      demoLS: statsLS.items,
      rapportsJudic: rapportsJudic.items,
    });
  }, [
    rapportId,
    refreshTrigger,
    step,
    onActivityTrigger,
    demographie.items,
    education.items,
    ateliers.items,
    formationBen.items,
    activites.items,
    conseil.items,
    dons.items,
    incidents.items,
    partenariats.items,
    formationPerso.items,
    amenagement.items,
    visites.items,
    statsLS.items,
    rapportsJudic.items,
  ]);
}