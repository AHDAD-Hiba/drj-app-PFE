import { useState, useEffect, useCallback,useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { computeAfCompleteness } from '@/lib/afCompleteness';

import { useAfInscriptionsClubs } from './useAfInscriptionsClubs';
import { useAfInscriptionsOfppt } from './useAfInscriptionsOfppt';
import { useAfIntegrationLaureates } from './useAfIntegrationLaureates';
import { useAfAgrs } from './useAfAgrs';
import { useAfSensibilisations } from './useAfSensibilisations';
import { useAfPortesOuvertes } from './useAfPortesOuvertes';
import { useAfCentresEcoute } from './useAfCentresEcoute';
import { useAfRessourcesHumaines } from './useAfRessourcesHumaines';
import { useAfFormationCadres } from './useAfFormationCadres';
import { useAfMiseAJourReseau } from './useAfMiseAJourReseau';
import { useAfSuiviPartenariats } from './useAfSuiviPartenariats';

export function useAfCompleteness(rapportId: string | null, refreshTrigger?: number) {
  // ✅ STEP 1 (IMMÉDIAT) - Inscriptions clubs et OFPPT
  const clubs = useAfInscriptionsClubs(rapportId);
  const ofppt = useAfInscriptionsOfppt(rapportId);
 
  // ✅ STEP 2 (APRÈS 200ms) - Intégration et AGR
  const [loadStep2, setLoadStep2] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setLoadStep2(true), 200);
    return () => clearTimeout(timer);
  }, []);
  
  const laureates = useAfIntegrationLaureates(rapportId, { enabled: loadStep2 });
  const agr = useAfAgrs(rapportId, { enabled: loadStep2 });
 
  // ✅ STEP 3 (APRÈS 400ms) - Sensibilisation et Portes ouvertes
  const [loadStep3, setLoadStep3] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setLoadStep3(true), 400);
    return () => clearTimeout(timer);
  }, []);
  
  const sensi = useAfSensibilisations(rapportId, { enabled: loadStep3 });
  const portes = useAfPortesOuvertes(rapportId, { enabled: loadStep3 });
 
  // ✅ STEP 4 (APRÈS 600ms) - Centres d'écoute
  const [loadStep4, setLoadStep4] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setLoadStep4(true), 600);
    return () => clearTimeout(timer);
  }, []);
  
  const ecoute = useAfCentresEcoute(rapportId, { enabled: loadStep4 });
 
  // ✅ STEP 5 (APRÈS 800ms) - RH et Cadres
  const [loadStep5, setLoadStep5] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setLoadStep5(true), 800);
    return () => clearTimeout(timer);
  }, []);
  
  const rh = useAfRessourcesHumaines(rapportId, { enabled: loadStep5 });
  const cadres = useAfFormationCadres(rapportId, { enabled: loadStep5 });
 
  // ✅ STEP 6 (APRÈS 1000ms) - Mise à jour réseau
  const [loadStep6, setLoadStep6] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setLoadStep6(true), 1000);
    return () => clearTimeout(timer);
  }, []);
  
  const reseau = useAfMiseAJourReseau(rapportId, { enabled: loadStep6 });
 
  // ✅ STEP 7 (APRÈS 1200ms) - Suivi partenariats
  const [loadStep7, setLoadStep7] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setLoadStep7(true), 1200);
    return () => clearTimeout(timer);
  }, []);
  
  const partenariats = useAfSuiviPartenariats(rapportId, { enabled: loadStep7 });
 
  // ✅ TOUJOURS recharger TOUT quand refreshTrigger change
  useEffect(() => {
    if (refreshTrigger && refreshTrigger > 0) {
      clubs.reload();
      ofppt.reload();
      laureates.reload();
      agr.reload();
      sensi.reload();
      portes.reload();
      ecoute.reload();
      rh.reload();
      cadres.reload();
      reseau.reload();
      partenariats.reload();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshTrigger]);
 
  // ✅ TOUJOURS CALCULER la complétude avec TOUTES les données
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
}