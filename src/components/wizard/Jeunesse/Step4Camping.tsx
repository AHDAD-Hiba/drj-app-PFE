import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/card';
import { Tent } from 'lucide-react';

// NOUVEAUX IMPORTS POUR NOTRE CONTRAT ET LES HOOKS INTERNES
import { StepComponentProps } from '@/config/wizard.types';
import { useCampingEntries } from '@/hooks/Jeunesse/useCampingEntries';
import { useAssociationValues } from '@/hooks/Jeunesse/useAssociationValues';
import { useMouvementsAssociations } from '@/hooks/Jeunesse/useMouvementsAssociations';
import { useFormationEntries } from '@/hooks/Jeunesse/useFormationEntries';

import { CampParticipantsSection } from '@/components/wizard/Jeunesse/step4/CampParticipantsSection';
import { AssociationsSection } from '@/components/wizard/Jeunesse/step4/AssociationsSection';
import { MouvementsSection } from '@/components/wizard/Jeunesse/step4/MouvementsSection';
import { FormationsSection } from '@/components/wizard/Jeunesse/step4/FormationsSection';

/**
 * Step4Camping - Orchestrateur autonome pour la section camping
 */
export const Step4Camping = memo(({
  rapportId,
  disabled,
  onActivity,
}: StepComponentProps) => {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  // 1. Centralisation et chargement de TOUS les hooks métiers requis pour cette étape
  const camps = useCampingEntries(rapportId);
  const associationValues = useAssociationValues(rapportId);
  const mouvements = useMouvementsAssociations(rapportId);
  const formations = useFormationEntries(rapportId);

// 2. Wrappers d'action corrigés pour correspondre exactement aux signatures des sous-sections
const handleCampAdd = async (c: any) => {
    if (onActivity) await onActivity();
    await camps.add(c); // On attend la fin, mais on ne retourne pas le boolean
  };
  const handleCampUpdate = async (local_id: string, patch: any) => {
    void camps.update(local_id, patch);
    if (onActivity) await onActivity();
  };

  const handleCampRemove = async (local_id: string) => {
    if (onActivity) await onActivity();
    await camps.remove(local_id); // On attend la fin, mais on ne retourne pas le boolean
  };

  const handleAssociationUpdate = async (local_id: string, patch: any) => {
    void associationValues.update(local_id, patch);
    if (onActivity) await onActivity();
  };

  const handleMouvementAdd = async (m: any) => {
    if (onActivity) await onActivity();
    return mouvements.add(m); // Retourne la promesse du hook d'origine
  };

  const handleMouvementUpdate = async (local_id: string, patch: any) => {
    void mouvements.update(local_id, patch);
    if (onActivity) await onActivity();
  };

  const handleMouvementRemove = async (local_id: string) => {
    if (onActivity) await onActivity();
    return mouvements.remove(local_id); // Retourne la promesse du hook d'origine
  };

  const handleFormationAdd = async (f: any) => {
    if (onActivity) await onActivity();
    return formations.add(f); // Retourne la promesse du hook d'origine
  };

  const handleFormationUpdate = async (local_id: string, patch: any) => {
    void formations.update(local_id, patch);
    if (onActivity) await onActivity();
  };

  const handleFormationRemove = async (local_id: string) => {
    if (onActivity) await onActivity();
    return formations.remove(local_id); // Retourne la promesse du hook d'origine
  };

  return (
    <div className="space-y-5">
      <Card className="p-5 sm:p-6 space-y-5">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Tent className="h-5 w-5 text-primary" />
            {isAr ? 'البرنامج الوطني للتخييم' : 'Programme National de Camping'}
          </h2>
          <p className="text-sm text-muted-foreground">
            {isAr ? 'الجمعيات، التأطير والتكوينات' : 'Associations, encadrement et formations'}
          </p>
        </div>

        {/* Camp Participants Section */}
        <CampParticipantsSection
          camps={camps.items}
          onAddCamp={handleCampAdd}
          onUpdateCamp={handleCampUpdate}
          onRemoveCamp={handleCampRemove}
          disabled={disabled}
        />

        {/* Associations Section */}
        <AssociationsSection
          items={associationValues.items}
          onAdd={(newItem) => {
            void associationValues.add(newItem);
            if (onActivity) void onActivity();
          }}
          onUpdate={handleAssociationUpdate}
          disabled={disabled}
        />

        {/* Mouvements Associations Section */}
        <MouvementsSection
          items={mouvements.items}
          onAdd={handleMouvementAdd}
          onUpdate={handleMouvementUpdate}
          onRemove={handleMouvementRemove}
          disabled={disabled}
        />

        {/* Formations Section */}
        <FormationsSection
          items={formations.items}
          onAdd={handleFormationAdd}
          onUpdate={handleFormationUpdate}
          onRemove={handleFormationRemove}
          disabled={disabled}
        />
      </Card>
    </div>
  );
});

Step4Camping.displayName = 'Step4Camping';