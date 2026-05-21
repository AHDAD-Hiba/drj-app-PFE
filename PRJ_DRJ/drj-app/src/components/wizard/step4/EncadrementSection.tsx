import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Plus, Trash2 } from 'lucide-react';
import { NumericField } from '@/components/form/NumericField';
import { useNiveauxFormation } from '@/hooks/useNiveauxFormation';
import type { EncadrementEntry } from '@/hooks/useEncadrementEntries';

interface EncadrementSectionProps {
  items: EncadrementEntry[];
  onAdd: (entry: EncadrementEntry) => Promise<boolean> | void;
  onUpdate: (local_id: string, patch: Partial<EncadrementEntry>) => void;
  onRemove: (local_id: string) => Promise<boolean> | void;
  disabled?: boolean;
}

export const EncadrementSection = ({
  items,
  onAdd,
  onUpdate,
  onRemove,
  disabled,
}: EncadrementSectionProps) => {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const { items: niveaux } = useNiveauxFormation();

  return (
    <Card className="p-5 sm:p-6 space-y-4 bg-background">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h3 className="text-base font-bold">
            {isAr ? 'التأطير' : 'Encadrement'}
          </h3>
          <p className="text-xs text-muted-foreground">
            {isAr ? 'أضف تفاصيل التأطير حسب مستوى التكوين' : 'Ajoutez les détails de l\'encadrement par niveau de formation'}
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          onClick={() =>
            void onAdd({
              local_id: crypto.randomUUID(),
              niveau_formation_id: 'none',
              nombre_femmes: 0,
              nombre_hommes: 0,
            })
          }
          disabled={disabled}
          className="gap-1.5"
        >
          <Plus className="h-4 w-4" />
          {isAr ? 'إضافة تأطير' : 'Ajouter un encadrement'}
        </Button>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-6 text-sm text-muted-foreground border-2 border-dashed border-border rounded-lg">
          {isAr ? 'لا توجد بيانات تأطير' : 'Aucun encadrement enregistré'}
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={item.local_id}
              className="border border-border rounded-lg p-4 bg-muted/10 space-y-3"
            >
              <div className="flex items-center justify-between gap-2 border-b pb-2">
                <Label className="text-sm font-semibold">
                  {isAr ? 'مستوى التكوين' : 'Niveau de formation'}
                </Label>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  onClick={() => void onRemove(item.local_id)}
                  disabled={disabled}
                  className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                <div className="space-y-1.5">
                  <Label className="text-xs">{isAr ? 'المستوى' : 'Niveau'}</Label>
                  <Select
                    value={item.niveau_formation_id || 'none'}
                    onValueChange={(v) =>
                      onUpdate(item.local_id, {
                        niveau_formation_id: v === 'none' ? '' : v,
                      })
                    }
                    disabled={disabled}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue
                        placeholder={isAr ? 'اختر المستوى' : 'Choisir le niveau'}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">
                        {isAr ? 'اختر المستوى' : 'Choisir le niveau'}
                      </SelectItem>
                      {niveaux.map((n) => (
                        <SelectItem key={n.id} value={n.id}>
                          {isAr && n.nom_ar ? n.nom_ar : n.nom}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <NumericField
                  label={isAr ? 'مؤطرات (فتيات)' : 'Monitrices (Filles)'}
                  value={item.nombre_femmes}
                  onChange={(v) =>
                    onUpdate(item.local_id, { nombre_femmes: v })
                  }
                  disabled={disabled}
                />
                <NumericField
                  label={isAr ? 'مؤطرون (فتيان)' : 'Moniteurs (Garçons)'}
                  value={item.nombre_hommes}
                  onChange={(v) =>
                    onUpdate(item.local_id, { nombre_hommes: v })
                  }
                  disabled={disabled}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};
