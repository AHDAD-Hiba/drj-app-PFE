// src/hooks/Jeunesse/useJeunesseCompleteness.ts
import { useMemo, useEffect, useState } from 'react';
import { useAuth } from '@/hooks/common/useAuth';
import { useActivitesEntries } from '@/hooks/Jeunesse/useActivitesEntries';
import { useEtablissementEntries } from '@/hooks/Jeunesse/useEtablissementEntries';
import { useCampingEntries } from '@/hooks/Jeunesse/useCampingEntries';
import { useAssociationValues } from '@/hooks/Jeunesse/useAssociationValues';
import { useFormationEntries } from '@/hooks/Jeunesse/useFormationEntries';
import { usePartenariatEntries } from '@/hooks/Jeunesse/usePartenariatEntries';
import { useFestivalEntries } from '@/hooks/Jeunesse/useFestivalEntries';
import { useInsertionEntries } from '@/hooks/Jeunesse/useInsertionEntries';
import { useMouvementsAssociations } from '@/hooks/Jeunesse/useMouvementsAssociations';

import { computeJeunesseCompleteness } from '@/lib/jeunesseCompleteness';

export const useJeunesseCompleteness = (rapportId: string | null, refreshTrigger?: number) => {
  const { utilisateur: profile } = useAuth();
  
  // IMMÉDIAT - nécessaire pour Step 1
  const activites = useActivitesEntries(rapportId);
  
  // Charger après 200ms (arrière-plan)
  const [loadStep3, setLoadStep3] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setLoadStep3(true), 200);
    return () => clearTimeout(timer);
  }, []);
  
  const facilities = useEtablissementEntries(rapportId, profile?.direction_id ?? null, { enabled: loadStep3 });
  const camps = useCampingEntries(rapportId, { enabled: loadStep3 });
  const mouvements = useMouvementsAssociations(rapportId, { enabled: loadStep3 });

  // Charger après 400ms
  const [loadStep4, setLoadStep4] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setLoadStep4(true), 400);
    return () => clearTimeout(timer);
  }, []);
  
  const associationValues = useAssociationValues(rapportId, { enabled: loadStep4 });
  const formations = useFormationEntries(rapportId, { enabled: loadStep4 });

  // Charger après 600ms
  const [loadStep5, setLoadStep5] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setLoadStep5(true), 600);
    return () => clearTimeout(timer);
  }, []);
  
  const partenaires = usePartenariatEntries(rapportId, { enabled: loadStep5 });
  const festivals = useFestivalEntries(rapportId, { enabled: loadStep5 });
  const socios = useInsertionEntries(rapportId, { enabled: loadStep5 });

  const permanenteData = useMemo(() => {
    return activites.items.find((item) => item.type_activite === 'permanente');
  }, [activites.items]);

  const rayonanteData = useMemo(() => {
    return activites.items.find((item) => item.type_activite === 'rayonnante');
  }, [activites.items]);

  // ✅ TOUJOURS recharger TOUT quand refreshTrigger change
  useEffect(() => {
    if (refreshTrigger && refreshTrigger > 0) {
      activites.reload();
      facilities.reload();
      camps.reload();
      mouvements.reload();
      associationValues.reload();
      formations.reload();
      partenaires.reload();
      festivals.reload();
      socios.reload();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshTrigger]);

  // ✅ TOUJOURS CALCULER la complétude avec TOUTES les données
  return useMemo(() => {
    if (!rapportId) return 0;
    return computeJeunesseCompleteness({
      permanenteData,
      rayonanteData,
      facilities: facilities.items,
      camps: camps.items,
      partenaires: partenaires.items,
      festivals: festivals.items,
      socios: socios.items,
      associationValues: associationValues.items,
      formations: formations.items,
    });
  }, [
    rapportId,
    refreshTrigger,
    permanenteData, 
    rayonanteData, 
    facilities.items,
    camps.items, 
    partenaires.items, 
    festivals.items, 
    socios.items,
    associationValues.items, 
    formations.items,
    mouvements.items,
  ]);
};