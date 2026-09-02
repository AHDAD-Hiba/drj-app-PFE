import { computeCrCompleteness } from "@/lib/crCompleteness";
import { useEffect, useMemo, useState } from "react";

import { useCrDemandesLicences, useCrTraitementLicences } from "./useCrStep1";
import { useCrCadresAssermentes, useCrControleCreches, useCrLabelQualite, useCrMouvementsFermetures, useCrPartenariats, useCrStatsInfrastructures } from "./useCrStep2";
import { useCrActivitesEnfants, useCrFormationsCadres, useCrStatistiquesEnfants } from "./useCrStep3";
import { useCrAnalysesPonctuelles, useCrSondagesEtudes } from "./useCrStep4";

export function useCrCompleteness(
  rapportId: string | null,
  refreshTrigger?: number,
  step?: number,
  onActivityTrigger?: number
) {
  // STEP 1
  const demandes = useCrDemandesLicences(rapportId);
  const traitement = useCrTraitementLicences(rapportId);

  // STEP 2
  const [loadStep2, setLoadStep2] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setLoadStep2(true), 400);
    return () => clearTimeout(timer);
  }, []);
  const statsInfra = useCrStatsInfrastructures(rapportId, { enabled: loadStep2 });
  const mouvements = useCrMouvementsFermetures(rapportId, { enabled: loadStep2 });
  const partenariats = useCrPartenariats(rapportId, { enabled: loadStep2 });
  const controle = useCrControleCreches(rapportId, { enabled: loadStep2 });
  const cadres = useCrCadresAssermentes(rapportId, { enabled: loadStep2 });
  const label = useCrLabelQualite(rapportId, { enabled: loadStep2 });

  // STEP 3
  const [loadStep3, setLoadStep3] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setLoadStep3(true), 800);
    return () => clearTimeout(timer);
  }, []);
  const statsEnfants = useCrStatistiquesEnfants(rapportId, { enabled: loadStep3 });
  const activites = useCrActivitesEnfants(rapportId, { enabled: loadStep3 });
  const formations = useCrFormationsCadres(rapportId, { enabled: loadStep3 });

  // STEP 4
  const [loadStep4, setLoadStep4] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setLoadStep4(true), 1200);
    return () => clearTimeout(timer);
  }, []);
  const analyses = useCrAnalysesPonctuelles(rapportId, { enabled: loadStep4 });
  const sondages = useCrSondagesEtudes(rapportId, { enabled: loadStep4 });

  // 🔄 1. REFRESH MANUEL (Immédiat)
  useEffect(() => {
    if (refreshTrigger && refreshTrigger > 0) {
      if (!rapportId) return;
      demandes.reload();
      traitement.reload();
      if (loadStep2) { statsInfra.reload(); mouvements.reload(); partenariats.reload(); controle.reload(); cadres.reload(); label.reload(); }
      if (loadStep3) { statsEnfants.reload(); activites.reload(); formations.reload(); }
      if (loadStep4) { analyses.reload(); sondages.reload(); }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshTrigger]);

  // ⌨️ 2. REFRESH AUTO (Dual Polling pendant la frappe)
  useEffect(() => {
    if (onActivityTrigger && onActivityTrigger > 0) {
      const reloadAll = () => {
        if (!rapportId) return;
        demandes.reload(); traitement.reload();
        if (loadStep2) { statsInfra.reload(); mouvements.reload(); partenariats.reload(); controle.reload(); cadres.reload(); label.reload(); }
        if (loadStep3) { statsEnfants.reload(); activites.reload(); formations.reload(); }
        if (loadStep4) { analyses.reload(); sondages.reload(); }
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
    return computeCrCompleteness({
      demandes: demandes.items,
      traitement: traitement.items,
      statsInfra: statsInfra.items,
      mouvements: mouvements.items,
      partenariats: partenariats.items,
      controle: controle.items,
      cadres: cadres.items,
      label: label.items,
      statsEnfants: statsEnfants.items,
      activites: activites.items,
      formations: formations.items,
      analyses: analyses.items,
      sondages: sondages.items,
    });
  }, [
    rapportId,
    refreshTrigger,
    step,
    onActivityTrigger,
    demandes.items,
    traitement.items,
    statsInfra.items,
    mouvements.items,
    partenariats.items,
    controle.items,
    cadres.items,
    label.items,
    statsEnfants.items,
    activites.items,
    formations.items,
    analyses.items,
    sondages.items,
  ]);
}