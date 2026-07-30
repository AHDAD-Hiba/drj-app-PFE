import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/card';
import { NumericField } from '@/components/form/NumericField';
import { useCategoriesAssociations } from '@/hooks/Jeunesse/useCategoriesAssociations';
import type { AssociationValue } from '@/hooks/Jeunesse/useAssociationValues';

interface AssociationsSectionProps {
  items: AssociationValue[];
  onAdd?: (entry: AssociationValue) => void;
  onUpdate: (local_id: string, patch: Partial<AssociationValue>) => void;
  disabled?: boolean;
}

export const AssociationsSection = ({
  items,
  onAdd,
  onUpdate,
  disabled,
}: AssociationsSectionProps) => {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const { items: categories } = useCategoriesAssociations();

  // Map items par categorie_association_id
  const itemsMap = new Map(
    items.map((item) => [item.categorie_association_id, item])
  );

  return (
    <Card className="p-5 sm:p-6 space-y-4 bg-background">
      <div>
        <h3 className="text-base font-semibold">
          {isAr ? 'الجمعيات' : 'Associations'}
        </h3>
        <p className="text-xs text-muted-foreground">
          {isAr
            ? 'أدخل عدد الجمعيات حسب نوعها'
            : "Saisissez le nombre d'associations par catégorie"}
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {categories.map((category) => {
          const item = itemsMap.get(category.id);
          const value = item?.nombre_associations ?? 0;

          const handleChange = (v: number) => {
            const safeValue = Math.max(0, Number(v) || 0);

            if (!item) {
              // 🛡️ Si l'entrée n'existe pas encore dans items, on utilise add
              const newItem: AssociationValue = {
                local_id: crypto.randomUUID(),
                categorie_association_id: category.id,
                nombre_associations: safeValue,
              };

              if (onAdd) {
                onAdd(newItem);
              } else {
                // Fallback direct si onAdd n'est pas transmis par le parent
                onUpdate(newItem.local_id, newItem);
              }
            } else {
              // 🛡️ Si elle existe déjà, on fait un update classique
              onUpdate(item.local_id, { nombre_associations: safeValue });
            }
          };

          return (
            <NumericField
              key={category.id}
              label={isAr && category.nom_ar ? category.nom_ar : category.nom}
              value={value}
              onChange={handleChange}
              disabled={disabled}
            />
          );
        })}
      </div>
    </Card>
  );
};