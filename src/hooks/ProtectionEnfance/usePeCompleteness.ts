import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { computePeCompleteness } from '@/lib/peCompleteness';

import { usePeDemographie } from './usePeStep1';
import { usePeEducation } from './usePeStep1';
import { usePeAteliers } from './usePeStep1';
import { usePeFormation } from './usePeStep1';
import { usePeActivites } from './usePeStep2';
import { usePeConseilEnfant } from './usePeStep2';
import { usePeDons } from './usePeStep2';
import { usePeIncidents } from './usePeStep2';
import { usePePartenariats } from './usePeStep3';
import { usePeFormations } from './usePeStep3';
import { usePeAmenagements } from './usePeStep3';
import { usePeVisites } from './usePeStep3';
import { usePeStatistiquesLS } from './usePeStep4';
import { usePeRapportsJudiciaires } from './usePeStep4';

export function usePeCompleteness(rapportId: string | null, refreshTrigger?: number) {

  // STEP 1 (IMMÉDIAT)
  const demographie = usePeDemographie(rapportId);
  const education = usePeEducation(rapportId);
  const ateliers = usePeAteliers(rapportId);
  const formationBen = usePeFormation(rapportId);

  // STEP 2 (APRÈS 400ms)
  const [loadStep2, setLoadStep2] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setLoadStep2(true), 400);
    return () => clearTimeout(timer);
  }, []);
  const activites = usePeActivites(rapportId, { enabled: loadStep2 });
  const conseil = usePeConseilEnfant(rapportId, { enabled: loadStep2 });
  const dons = usePeDons(rapportId, { enabled: loadStep2 });
  const incidents = usePeIncidents(rapportId, { enabled: loadStep2 });

  // STEP 3 (APRÈS 800ms)
  const [loadStep3, setLoadStep3] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setLoadStep3(true), 800);
    return () => clearTimeout(timer);
  }, []);
  const partenariats = usePePartenariats(rapportId, { enabled: loadStep3 });
  const formationPerso = usePeFormations(rapportId, { enabled: loadStep3 });
  const amenagement = usePeAmenagements(rapportId, { enabled: loadStep3 });
  const visites = usePeVisites(rapportId, { enabled: loadStep3 });
  
  // STEP 4 (APRÈS 1200ms)
  const [loadStep4, setLoadStep4] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setLoadStep4(true), 1200);
    return () => clearTimeout(timer);
  }, []);
  const statsLS = usePeStatistiquesLS(rapportId, { enabled: loadStep4 });
  const rapportsJudic = usePeRapportsJudiciaires(rapportId, { enabled: loadStep4 });

  // ✅ TOUJOURS recharger TOUT quand refreshTrigger change
  useEffect(() => {
    if (refreshTrigger && refreshTrigger > 0) {
      demographie.reload();
      education.reload();
      ateliers.reload();
      formationBen.reload();
      activites.reload();
      conseil.reload();
      dons.reload();
      incidents.reload();
      partenariats.reload();
      formationPerso.reload();
      amenagement.reload();
      visites.reload();
      statsLS.reload();
      rapportsJudic.reload();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshTrigger]);

  // ✅ TOUJOURS CALCULER la complétude avec TOUTES les données
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