// src/hooks/EnfanceCreches/useCrCompleteness.ts
import { useMemo, useEffect, useState } from "react";
import { computeCrCompleteness } from "@/lib/crCompleteness";

// Importer tous les hooks Crèches
import { useCrDemandesLicences } from "./useCrStep1";
import { useCrTraitementLicences } from "./useCrStep1";
import { useCrStatsInfrastructures } from "./useCrStep2";
import { useCrMouvementsFermetures } from "./useCrStep2";
import { useCrPartenariats } from "./useCrStep2";
import { useCrControleCreches } from "./useCrStep2";
import { useCrCadresAssermentes } from "./useCrStep2";
import { useCrLabelQualite } from "./useCrStep2";
import { useCrStatistiquesEnfants } from "./useCrStep3";
import { useCrActivitesEnfants } from "./useCrStep3";
import { useCrFormationsCadres } from "./useCrStep3";
import { useCrAnalysesPonctuelles } from "./useCrStep4";
import { useCrSondagesEtudes } from "./useCrStep4";

export function useCrCompleteness(rapportId: string | null, refreshTrigger?: number) {
  // ✅ STEP 1 (IMMÉDIAT) - Demandes et traitement licences
  const demandes = useCrDemandesLicences(rapportId);
  const traitement = useCrTraitementLicences(rapportId);

  // ✅ STEP 2 (APRÈS 400ms) - Infrastructure, mouvements, partenariats, contrôle, cadres, label
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

  // ✅ STEP 3 (APRÈS 800ms) - Statistiques enfants, activités, formations
  const [loadStep3, setLoadStep3] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setLoadStep3(true), 800);
    return () => clearTimeout(timer);
  }, []);

  const statsEnfants = useCrStatistiquesEnfants(rapportId, { enabled: loadStep3 });
  const activites = useCrActivitesEnfants(rapportId, { enabled: loadStep3 });
  const formations = useCrFormationsCadres(rapportId, { enabled: loadStep3 });

  // ✅ STEP 4 (APRÈS 1200ms) - Analyses et sondages
  const [loadStep4, setLoadStep4] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setLoadStep4(true), 1200);
    return () => clearTimeout(timer);
  }, []);

  const analyses = useCrAnalysesPonctuelles(rapportId, { enabled: loadStep4 });
  const sondages = useCrSondagesEtudes(rapportId, { enabled: loadStep4 });

  // ✅ TOUJOURS recharger TOUT quand refreshTrigger change
  useEffect(() => {
    if (refreshTrigger && refreshTrigger > 0) {
      demandes.reload();
      traitement.reload();
      statsInfra.reload();
      mouvements.reload();
      partenariats.reload();
      controle.reload();
      cadres.reload();
      label.reload();
      statsEnfants.reload();
      activites.reload();
      formations.reload();
      analyses.reload();
      sondages.reload();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshTrigger]);

  // ✅ TOUJOURS CALCULER la complétude avec TOUTES les données
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
