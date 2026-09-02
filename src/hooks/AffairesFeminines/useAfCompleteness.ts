// src/hooks/AffairesFeminines/useAfCompleteness.ts
import { computeAfCompleteness } from "@/lib/afCompleteness";
import { useEffect, useMemo, useState } from "react";

import { useAfAgrs } from "./useAfAgrs";
import { useAfCentresEcoute } from "./useAfCentresEcoute";
import { useAfFormationCadres } from "./useAfFormationCadres";
import { useAfInscriptionsClubs } from "./useAfInscriptionsClubs";
import { useAfInscriptionsOfppt } from "./useAfInscriptionsOfppt";
import { useAfIntegrationLaureates } from "./useAfIntegrationLaureates";
import { useAfMiseAJourReseau } from "./useAfMiseAJourReseau";
import { useAfPortesOuvertes } from "./useAfPortesOuvertes";
import { useAfRessourcesHumaines } from "./useAfRessourcesHumaines";
import { useAfSensibilisations } from "./useAfSensibilisations";
import { useAfSuiviPartenariats } from "./useAfSuiviPartenariats";

export const useAfCompleteness = (rapportId: string | null, refreshTrigger?: number, step?: number, onActivityTrigger?: number) => {
  // IMMÉDIAT
  const clubs = useAfInscriptionsClubs(rapportId);
  const ofppt = useAfInscriptionsOfppt(rapportId);

  // Charger après 200ms (arrière-plan)
  const [loadStep2, setLoadStep2] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setLoadStep2(true), 200);
    return () => clearTimeout(timer);
  }, []);

  const laureates = useAfIntegrationLaureates(rapportId, { enabled: loadStep2 });
  const agr = useAfAgrs(rapportId, { enabled: loadStep2 });

  // Charger après 400ms
  const [loadStep3, setLoadStep3] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setLoadStep3(true), 400);
    return () => clearTimeout(timer);
  }, []);

  const sensi = useAfSensibilisations(rapportId, { enabled: loadStep3 });
  const portes = useAfPortesOuvertes(rapportId, { enabled: loadStep3 });

  // Charger après 600ms
  const [loadStep4, setLoadStep4] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setLoadStep4(true), 600);
    return () => clearTimeout(timer);
  }, []);

  const ecoute = useAfCentresEcoute(rapportId, { enabled: loadStep4 });

  // Charger après 800ms
  const [loadStep5, setLoadStep5] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setLoadStep5(true), 800);
    return () => clearTimeout(timer);
  }, []);

  const rh = useAfRessourcesHumaines(rapportId, { enabled: loadStep5 });
  const cadres = useAfFormationCadres(rapportId, { enabled: loadStep5 });

  // Charger après 1000ms
  const [loadStep6, setLoadStep6] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setLoadStep6(true), 1000);
    return () => clearTimeout(timer);
  }, []);

  const reseau = useAfMiseAJourReseau(rapportId, { enabled: loadStep6 });

  // Charger après 1200ms
  const [loadStep7, setLoadStep7] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setLoadStep7(true), 1200);
    return () => clearTimeout(timer);
  }, []);

  const partenariats = useAfSuiviPartenariats(rapportId, { enabled: loadStep7 });

  // TOUJOURS recharger TOUT quand refreshTrigger change
  useEffect(() => {
    if (onActivityTrigger && onActivityTrigger > 0) {
      const timer = setTimeout(() => {
        if (!rapportId) return;
        clubs.reload();
        ofppt.reload();
        if (loadStep2) { laureates.reload(); agr.reload(); }
        if (loadStep3) { sensi.reload(); portes.reload(); }
        if (loadStep4) { ecoute.reload(); }
        if (loadStep5) { rh.reload(); cadres.reload(); }
        if (loadStep6) { reseau.reload(); }
        if (loadStep7) { partenariats.reload(); }
      }, 2500); 
      return () => clearTimeout(timer);
    }
  }, [onActivityTrigger, rapportId, loadStep2, loadStep3, loadStep4, loadStep5, loadStep6, loadStep7]);

  // TOUJOURS CALCULER la complétude avec TOUTES les données
  return useMemo(() => {
    if (!rapportId) return 0;
    return computeAfCompleteness({
      clubs: clubs.items,
      ofppt: ofppt.items,
      laureates: laureates.items,
      agr: agr.items,
      sensi: sensi.items,
      portes: portes.items,
      ecoute: ecoute.items,
      rh: rh.items,
      cadres: cadres.items,
      reseau: reseau.items,
      partenariats: partenariats.items,
    });
  }, [
    rapportId,
    refreshTrigger,
    step,
    onActivityTrigger,
    clubs.items,
    ofppt.items,
    laureates.items,
    agr.items,
    sensi.items,
    portes.items,
    ecoute.items,
    rh.items,
    cadres.items,
    reseau.items,
    partenariats.items,
  ]);
};