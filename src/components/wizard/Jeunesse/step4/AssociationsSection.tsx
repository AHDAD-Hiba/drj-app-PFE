import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/card";
import { NumericField } from "@/components/form/NumericField";
import { useCategoriesAssociations } from "@/hooks/Jeunesse/useCategoriesAssociations";
import type { AssociationValue } from "@/hooks/Jeunesse/useAssociationValues";

interface AssociationsSectionProps {
  items: AssociationValue[];
  onChangeValue: (categorieId: string, count: number) => void;
  disabled?: boolean;
}

export const AssociationsSection = ({
  items,
  onChangeValue,
  disabled,
}: AssociationsSectionProps) => {
  const { i18n } = useTranslation();
  const isAr = i18n.language === "ar";
  const { items: categories } = useCategoriesAssociations();

  const itemsMap = new Map(items.map((item) => [item.categorie_association_id, item]));

  return (
    <Card className="p-5 sm:p-6 space-y-4 bg-background">
      <div>
        <h3 className="text-base font-semibold">{isAr ? "الجمعيات" : "Associations"}</h3>
        <p className="text-xs text-muted-foreground">
          {isAr
            ? "أدخل عدد الجمعيات حسب نوعها"
            : "Saisissez le nombre d'associations par catégorie"}
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {categories.map((category) => {
          const item = itemsMap.get(category.id);
          const value = item?.nombre_associations ?? 0;

          return (
            <NumericField
              key={category.id}
              label={isAr && category.nom_ar ? category.nom_ar : category.nom}
              value={value}
              onChange={(val) => onChangeValue(category.id, val)} // 👈 Simple appel direct !
              disabled={disabled}
            />
          );
        })}
      </div>
    </Card>
  );
};
