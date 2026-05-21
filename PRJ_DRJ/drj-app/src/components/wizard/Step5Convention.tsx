import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Plus, Trash2, Handshake } from 'lucide-react';
import { NumericField } from '@/components/form/NumericField';
import type { PartenariatEntry } from '@/hooks/usePartenariatEntries';
import type { TypePartenaire } from '@/hooks/useTypesPartenaires';

interface Props {
  disabled?: boolean;
  items: PartenariatEntry[];
  partnerTypes: TypePartenaire[];
  onAdd: () => void;
  onUpdate: (local_id: string, patch: Partial<PartenariatEntry>) => void;
  onRemove: (local_id: string) => void;
}

export const Step5Convention = memo(({
  disabled,
  items,
  partnerTypes,
  onAdd,
  onUpdate,
  onRemove,
}: Props) => {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  return (
    <div className="space-y-5">
      <Card className="p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Handshake className="h-5 w-5 text-primary" />
              {isAr ? 'الاتفاقيات والشراكات' : 'Conventions et partenariats'}
            </h2>
            <p className="text-sm text-muted-foreground">
              {isAr ? 'أضف كل اتفاقية حسب نوع الشريك' : 'Ajoutez chaque convention par type de partenaire'}
            </p>
          </div>
          <Button type="button" size="sm" onClick={onAdd} disabled={disabled} className="gap-1.5">
            <Plus className="h-4 w-4" />
            {isAr ? 'إضافة' : 'Ajouter'}
          </Button>
        </div>

        {items.length === 0 ? (
          <div className="text-center py-4 text-xs text-muted-foreground border-2 border-dashed border-border rounded-lg">
            {isAr ? 'لا توجد اتفاقيات' : 'Aucune convention enregistrée'}
          </div>
        ) : (
          <div className="space-y-3 pt-2">
            {items.map((item, idx) => (
              <div
                key={item.local_id}
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
                    onClick={() => onRemove(item.local_id)}
                    disabled={disabled}
                    className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-start">
                <div className="space-y-1.5">
                  <Label className="text-xs">{isAr ? 'نوع الشريك' : 'Type de partenaire'}</Label>
                  <Select
                    value={item.type_partenaire_id || 'none'}
                    onValueChange={(value) => onUpdate(item.local_id, { type_partenaire_id: value === 'none' ? '' : value })}
                    disabled={disabled}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder={isAr ? 'اختر' : 'Choisir'} />
                    </SelectTrigger>
                    <SelectContent>
                      {partnerTypes.length === 0 ? (
                        <SelectItem value="none">{isAr ? 'جارٍ التحميل...' : 'Chargement...'}</SelectItem>
                      ) : null}
                      {partnerTypes.map((partnerType) => (
                        <SelectItem key={partnerType.id} value={partnerType.id}>
                          {(isAr ? partnerType.nom_ar : partnerType.nom) ?? partnerType.nom}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">{isAr ? 'عدد الاتفاقيات' : 'Nombre de conventions'}</Label>
                  <NumericField
                    label=""
                    value={typeof item.nombre_conventions === 'number' ? item.nombre_conventions : 0}
                    onChange={(value) => onUpdate(item.local_id, { nombre_conventions: value })}
                    disabled={disabled}
                  />
                </div>

                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
});

Step5Convention.displayName = 'Step5Convention';
