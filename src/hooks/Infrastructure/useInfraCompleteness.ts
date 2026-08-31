import { useState, useEffect, useMemo } from 'react';
import { computeInfraCompleteness } from '@/lib/infraCompleteness';

import { useInfraDepenses } from './useInfraDepenses';
import { useInfraEauElectricite } from './useInfraEauElectricite';
import { useInfraPartenariats } from './useInfraPartenariats';
import { useInfraBtp } from './useInfraBtp';
import { useInfraProjetsSouffrance } from './useInfraProjetsSouffrance';

export function useInfraCompleteness(rapportId: string | null, refreshTrigger?: number) {
  // STEP 1 (IMMÉDIAT)
  const depenses = useInfraDepenses(rapportId);

  // STEP 2 (APRÈS 400ms)
  const [loadStep2, setLoadStep2] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setLoadStep2(true), 400);
    return () => clearTimeout(timer);
  }, []);

  const eauElec = useInfraEauElectricite(rapportId, { enabled: loadStep2 });

    // STEP 3 (APRÈS 800ms)
  const [loadStep3, setLoadStep3] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setLoadStep3(true), 800);
    return () => clearTimeout(timer);
  }, []);

  const partenariats = useInfraPartenariats(rapportId, { enabled: loadStep3 });

  // STEP 4 (APRÈS 1200ms) - Analyses et sondages
  const [loadStep4, setLoadStep4] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setLoadStep4(true), 1200);
    return () => clearTimeout(timer);
  }, []);

  const btp = useInfraBtp(rapportId, { enabled: loadStep4 });

  // STEP 5 (APRÈS 1600ms) - Projets en souffrance
  const [loadStep5, setLoadStep5] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setLoadStep5(true), 1600);
    return () => clearTimeout(timer);
  }, []);
  const souffrance = useInfraProjetsSouffrance(rapportId, { enabled: loadStep5 });

// ✅ TOUJOURS recharger TOUT quand refreshTrigger change
  useEffect(() => {
    if (refreshTrigger && refreshTrigger > 0) {
      depenses.reload();
      eauElec.reload();
      btp.reload();
      souffrance.reload();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshTrigger]);

  // TOUJOURS CALCULER la complétude avec TOUTES les données
  return useMemo(() => {
    if (!rapportId) return 0;

    // Transformer conventions en format attendu
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
    depenses.items,
    eauElec.items,
    partenariats.conventions,
    btp.items,
    souffrance.items,
  ]);
}