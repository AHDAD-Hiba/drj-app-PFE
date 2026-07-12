// src/hooks/useJeunesseCompleteness.ts
import { useMemo, useEffect } from 'react';
import { useAuth } from '@/hooks/common/useAuth';
import { useActivitesEntries } from '@/hooks/Jeunesse/useActivitesEntries';
import { useEtablissementEntries } from '@/hooks/Jeunesse/useEtablissementEntries';
import { useCampingEntries } from '@/hooks/Jeunesse/useCampingEntries';
import { useAssociationValues } from '@/hooks/Jeunesse/useAssociationValues';
import { useFormationEntries } from '@/hooks/Jeunesse/useFormationEntries';
import { usePartenariatEntries } from '@/hooks/Jeunesse/usePartenariatEntries';
import { useFestivalEntries } from '@/hooks/Jeunesse/useFestivalEntries';
import { useInsertionEntries } from '@/hooks/Jeunesse/useInsertionEntries';

// Importe ta fonction pure depuis ton fichier lib
import { computeJeunesseCompleteness } from '@/lib/jeunesseCompleteness';

export const useJeunesseCompleteness = (rapportId: string | null, refreshTrigger?: number) => {
  const { utilisateur: profile } = useAuth();
  
  // Récupération des données brutes
  const activites = useActivitesEntries(rapportId);
  const facilities = useEtablissementEntries(rapportId, profile?.direction_id ?? null);
  const camps = useCampingEntries(rapportId);
  const associationValues = useAssociationValues(rapportId);
  const formations = useFormationEntries(rapportId);
  const partenaires = usePartenariatEntries(rapportId);
  const festivals = useFestivalEntries(rapportId);
  const socios = useInsertionEntries(rapportId);

  //Forcer le rechargement des données du parent
  useEffect(() => {
    if (refreshTrigger > 0) {
      activites.reload();
      facilities.reload();
      camps.reload();
      associationValues.reload();
      formations.reload();
      partenaires.reload();
      festivals.reload();
      socios.reload();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshTrigger]);

  // Recalcul uniquement quand les données changent
  return useMemo(() => {
    if (!rapportId) return 0;

    return computeJeunesseCompleteness({
      permanenteData: activites.permanente,
      rayonanteData: activites.rayonnante,
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
    activites.permanente, activites.rayonnante, facilities.items,
    camps.items, partenaires.items, festivals.items, socios.items,
    associationValues.items, formations.items
  ]);
};