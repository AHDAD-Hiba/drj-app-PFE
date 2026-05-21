import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/card';
import { NumericField } from '@/components/form/NumericField';
import { useCategoriesAssociations } from '@/hooks/useCategoriesAssociations';
import type { AssociationValue } from '@/hooks/useAssociationValues';

interface AssociationsSectionProps {
  items: AssociationValue[];
  onUpdate: (local_id: string, patch: Partial<AssociationValue>) => void;
  disabled?: boolean;
}

export const AssociationsSection = ({
  items,
  onUpdate,
  disabled,
}: AssociationsSectionProps) => {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const { items: categories } = useCategoriesAssociations();

  // Map items by categorie_association_id
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
          {isAr ? 'أدخل عدد الجمعيات حسب نوعها' : 'Saisissez le nombre d\'associations par catégorie'}
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {categories.map((category) => {
          const item = itemsMap.get(category.id);
          const local_id =
            item?.local_id || `temp-${category.id}`;
          const value = item?.nombre_associations || 0;

          // If item doesn't exist yet, create a temporary one on first update
          const handleChange = (v: number) => {
            if (!item) {
              // Create a new association value entry
              const newItem: AssociationValue = {
                local_id,
                categorie_association_id: category.id,
                nombre_associations: v,
              };
              // The parent will need to handle creating the item
              onUpdate(local_id, newItem);
            } else {
              onUpdate(local_id, { nombre_associations: v });
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
