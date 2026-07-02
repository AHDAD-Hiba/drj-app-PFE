import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/card';
import { Tent } from 'lucide-react';
import type { CampEntry } from '@/hooks/useCampingEntries';
import { useAssociationValues, type AssociationValue } from '@/hooks/useAssociationValues';
import { useMouvementsAssociations } from '@/hooks/useMouvementsAssociations';
import { useFormationEntries, type FormationEntry } from '@/hooks/useFormationEntries';
import { CampParticipantsSection } from '@/components/wizard/step4/CampParticipantsSection';
import { AssociationsSection } from '@/components/wizard/step4/AssociationsSection';
import { MouvementsSection } from '@/components/wizard/step4/MouvementsSection';
import { FormationsSection } from '@/components/wizard/step4/FormationsSection';

export type { CampEntry };

interface Props {
  camps: CampEntry[];
  onAddCamp: (c: CampEntry) => void | Promise<void>;
  onUpdateCamp: (local_id: string, patch: Partial<CampEntry>) => void;
  onRemoveCamp: (local_id: string) => void | Promise<void>;
  associationValues?: AssociationValue[];
  onUpdateAssociationValue?: (local_id: string, patch: Partial<AssociationValue>) => void;
  formations?: FormationEntry[];
  onAddFormation?: (entry: FormationEntry) => Promise<boolean> | void;
  onUpdateFormation?: (local_id: string, patch: Partial<FormationEntry>) => void;
  onRemoveFormation?: (local_id: string) => Promise<boolean> | void;
  disabled?: boolean;
  rapportId?: string | null;
}

/**
 * Step4Camping - Main orchestrator component for camping section
 * Renders all subsections with independent modular components and hooks
 */
export const Step4Camping = memo(({
  camps,
  onAddCamp,
  onUpdateCamp,
  onRemoveCamp,
  associationValues,
  onUpdateAssociationValue,
  formations,
  onAddFormation,
  onUpdateFormation,
  onRemoveFormation,
  disabled,
  rapportId,
}: Props) => {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  // Load association values
  const internalAssociationValues = useAssociationValues(rapportId ?? null);

  // Load mouvements associations
  const mouvements = useMouvementsAssociations(rapportId ?? null);

  // Load formations
  const internalFormations = useFormationEntries(rapportId ?? null);

  const visibleAssociationValues = associationValues ?? internalAssociationValues.items;
  const updateAssociationValue = onUpdateAssociationValue ?? internalAssociationValues.update;
  const visibleFormations = formations ?? internalFormations.items;
  const addFormation = onAddFormation ?? internalFormations.add;
  const updateFormation = onUpdateFormation ?? internalFormations.update;
  const removeFormation = onRemoveFormation ?? internalFormations.remove;

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
          camps={camps}
          onAddCamp={onAddCamp}
          onUpdateCamp={onUpdateCamp}
          onRemoveCamp={onRemoveCamp}
          disabled={disabled}
        />

        {/* Associations Section */}
        <AssociationsSection
          items={visibleAssociationValues}
          onUpdate={(localId, patch) => void updateAssociationValue(localId, patch)}
          disabled={disabled}
        />

        {/* Mouvements Associations Section */}
        <MouvementsSection
          items={mouvements.items}
          onAdd={mouvements.add}
          onUpdate={mouvements.update}
          onRemove={mouvements.remove}
          disabled={disabled}
        />

        {/* Formations Section */}
        <FormationsSection
          items={visibleFormations}
          onAdd={addFormation}
          onUpdate={(localId, patch) => void updateFormation(localId, patch)}
          onRemove={removeFormation}
          disabled={disabled}
        />
      </Card>
    </div>
  );
});

Step4Camping.displayName = 'Step4Camping';
