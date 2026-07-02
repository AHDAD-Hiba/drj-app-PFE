import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Plus, Trash2 } from 'lucide-react';
import { NumericField } from '@/components/form/NumericField';
import type { FormationEntry } from '@/hooks/useFormationEntries';

interface FormationsSectionProps {
  items: FormationEntry[];
  onAdd: (entry: FormationEntry) => Promise<boolean> | void;
  onUpdate: (local_id: string, patch: Partial<FormationEntry>) => void;
  onRemove: (local_id: string) => Promise<boolean> | void;
  disabled?: boolean;
}

export const FormationsSection = ({
  items,
  onAdd,
  onUpdate,
  onRemove,
  disabled,
}: FormationsSectionProps) => {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  return (
    <Card className="p-5 sm:p-6 space-y-4 bg-background">
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h3 className="text-base font-semibold">
              {isAr ? 'التكوينات المنجزة' : 'Formations réalisées'}
            </h3>
            <p className="text-xs text-muted-foreground">
              {isAr ? 'سجل التكوينات المنجزة مع التفاصيل' : 'Enregistrez les formations réalisées avec les détails'}
            </p>
          </div>
          <Button
            type="button"
            size="sm"
            onClick={() =>
              void onAdd({
                local_id: crypto.randomUUID(),
                numero_session: 1,
                centre: '',
                beneficiaries_girls: 0,
                beneficiaries_boys: 0,
                trainers_girls: 0,
                trainers_boys: 0,
              })
            }
            disabled={disabled}
            className="gap-1.5"
          >
            <Plus className="h-4 w-4" />
            {isAr ? 'إضافة تكوين' : 'Ajouter une formation'}
          </Button>
        </div>
        {items.length === 0 ? (
          <div className="text-center py-4 text-xs text-muted-foreground border-2 border-dashed border-border rounded-lg">
            {isAr ? 'لا توجد تكوينات' : 'Aucune formation enregistrée'}
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((fr, idx) => (
              <div
                key={fr.local_id}
                className="border border-border rounded-lg p-4 bg-muted/20 space-y-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-muted-foreground">
                    #{idx + 1}
                  </span>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    onClick={() => void onRemove(fr.local_id)}
                    disabled={disabled}
                    className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <NumericField
                    label={isAr ? 'رقم الدورة' : 'Numéro de session'}
                    value={fr.numero_session}
                    onChange={(v) =>
                      onUpdate(fr.local_id, { numero_session: v })
                    }
                    disabled={disabled}
                  />
                  <div className="space-y-1.5">
                    <Label className="text-xs">
                      {isAr ? 'المركز' : 'Centre'}
                    </Label>
                    <Input
                      value={fr.centre}
                      className="h-9"
                      disabled={disabled}
                      onChange={(e) =>
                        onUpdate(fr.local_id, {
                          centre: e.target.value.slice(0, 200),
                        })
                      }
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <NumericField
                    label={isAr ? 'مستفيدات (فتيات)' : 'Bénéficiaires (Filles)'}
                    value={fr.beneficiaries_girls}
                    onChange={(v) =>
                      onUpdate(fr.local_id, { beneficiaries_girls: v })
                    }
                    disabled={disabled}
                  />
                  <NumericField
                    label={
                      isAr ? 'مستفيدون (فتيان)' : 'Bénéficiaires (Garçons)'
                    }
                    value={fr.beneficiaries_boys}
                    onChange={(v) =>
                      onUpdate(fr.local_id, { beneficiaries_boys: v })
                    }
                    disabled={disabled}
                  />
                  <NumericField
                    label={isAr ? 'مكوّنات (فتيات)' : 'Formatrices (Filles)'}
                    value={fr.trainers_girls}
                    onChange={(v) =>
                      onUpdate(fr.local_id, { trainers_girls: v })
                    }
                    disabled={disabled}
                  />
                  <NumericField
                    label={isAr ? 'مكوّنون (فتيان)' : 'Formateurs (Garçons)'}
                    value={fr.trainers_boys}
                    onChange={(v) =>
                      onUpdate(fr.local_id, { trainers_boys: v })
                    }
                    disabled={disabled}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
};
