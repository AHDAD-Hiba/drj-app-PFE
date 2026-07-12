import { useMemo } from 'react';

export const useAfCompleteness = (rapportId: string | null, refreshTrigger?: number) => {
  
  // Plus tard, nous importerons ici les hooks :
  // useAfInscriptions()
  // useAfInsertion()
  // etc...

  return useMemo(() => {
    if (!rapportId) return 0;

    // Pour l'instant, on renvoie statiquement 0%
    return 0;
  }, [rapportId, refreshTrigger]);
};