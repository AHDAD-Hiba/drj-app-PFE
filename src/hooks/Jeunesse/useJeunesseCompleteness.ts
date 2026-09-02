// src/hooks/Jeunesse/useJeunesseCompleteness.ts
import { useAuth } from "@/hooks/common/useAuth";
import { useActivitesEntries } from "@/hooks/Jeunesse/useActivitesEntries";
import { useAssociationValues } from "@/hooks/Jeunesse/useAssociationValues";
import { useCampingEntries } from "@/hooks/Jeunesse/useCampingEntries";
import { useEtablissementEntries } from "@/hooks/Jeunesse/useEtablissementEntries";
import { useFestivalEntries } from "@/hooks/Jeunesse/useFestivalEntries";
import { useFormationEntries } from "@/hooks/Jeunesse/useFormationEntries";
import { useInsertionEntries } from "@/hooks/Jeunesse/useInsertionEntries";
import { useMouvementsAssociations } from "@/hooks/Jeunesse/useMouvementsAssociations";
import { usePartenariatEntries } from "@/hooks/Jeunesse/usePartenariatEntries";
import { useEffect, useMemo, useState } from "react";

import { computeJeunesseCompleteness } from "@/lib/jeunesseCompleteness";

export const useJeunesseCompleteness = (rapportId: string | null, refreshTrigger?: number, step?: number, onActivityTrigger?: number) => {
  const { utilisateur: profile } = useAuth();

  // IMMÉDIAT - nécessaire pour Step 1
  const activites = useActivitesEntries(rapportId);

  // Charger après 200ms (arrière-plan)
  const [loadStep3, setLoadStep3] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setLoadStep3(true), 200);
    return () => clearTimeout(timer);
  }, []);

  const facilities = useEtablissementEntries(rapportId, profile?.direction_id ?? null, {
    enabled: loadStep3,
  });
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
    return activites.items.find((item) => item.type_activite === "permanente");
  }, [activites.items]);

  const rayonanteData = useMemo(() => {
    return activites.items.find((item) => item.type_activite === "rayonnante");
  }, [activites.items]);

  // TOUJOURS recharger TOUT quand refreshTrigger change
  useEffect(() => {
    if (onActivityTrigger && onActivityTrigger > 0) {
      const timer = setTimeout(() => {
        if (!rapportId) return;
        activites.reload();
        if (loadStep3) { facilities.reload(); camps.reload(); mouvements.reload(); }
        if (loadStep4) { associationValues.reload(); formations.reload(); }
        if (loadStep5) { partenaires.reload(); festivals.reload(); socios.reload(); }
      }, 2500); 
      return () => clearTimeout(timer);
    }
  }, [onActivityTrigger, rapportId, loadStep3, loadStep4, loadStep5]);
  // TOUJOURS CALCULER la complétude avec TOUTES les données
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
    step,
    onActivityTrigger,
    permanenteData,
    rayonanteData,
    facilities.items,
    camps.items,
    partenaires.items,
    festivals.items,
    socios.items,
    associationValues.items,
    formations.items,
  ]);
};