import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, Trophy, AlertTriangle } from 'lucide-react';
import { NumericField } from '@/components/form/NumericField';
import type { FestivalEntry } from '@/hooks/useFestivalEntries';

interface Props {
  festivals: FestivalEntry[];
  onAddFestival: (festival: FestivalEntry) => void | Promise<void>;
  onUpdateFestival: (local_id: string, patch: Partial<FestivalEntry>) => void;
  onRemoveFestival: (local_id: string) => void | Promise<void>;
  disabled?: boolean;
}

const createEmptyFestival = (): FestivalEntry => ({
  local_id: crypto.randomUUID(),
  name: '',
  participants_qualifies: 0,
  provinces_participantes: 0,
  rural: 0,
  urbain: 0,
  femmes: 0,
  hommes: 0,
});

export const Step6Festival = memo(({
  festivals,
  onAddFestival,
  onUpdateFestival,
  onRemoveFestival,
  disabled,
}: Props) => {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';


  return (
    <div className="space-y-5">
      <Card className="p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Trophy className="h-5 w-5 text-primary" />
              {isAr ? 'مهرجانات الشباب' : 'Festivals de jeunesse'}
            </h2>
            <p className="text-sm text-muted-foreground">
              {isAr ? 'أضف كل مهرجان مع تفاصيل الإقصائيات والمؤهلين' : 'Ajoutez chaque festival avec éliminatoires et qualifiés'}
            </p>
          </div>
          <Button
            type="button"
            size="sm"
            onClick={() => void onAddFestival(createEmptyFestival())}
            disabled={disabled}
            className="gap-1.5"
          >
            <Plus className="h-4 w-4" />
            {isAr ? 'إضافة مهرجان' : 'Ajouter un festival'}
          </Button>
        </div>

        {festivals.length === 0 ? (
          <div className="text-center py-4 text-xs text-muted-foreground border-2 border-dashed border-border rounded-lg">
            {isAr ? 'لا توجد مهرجانات' : 'Aucun festival enregistré'}
          </div>
        ) : (
          <div className="space-y-3 pt-2">
            {festivals.map((festival, idx) => {
              const totalGenre = (Number(festival.femmes) || 0) + (Number(festival.hommes) || 0);
              const totalMilieu = (Number(festival.urbain) || 0) + (Number(festival.rural) || 0);
              const isMilieuValid = totalGenre === totalMilieu;

              return (
              <div
                key={festival.local_id}
                className="border border-border rounded-lg p-4 bg-muted/20 space-y-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-muted-foreground">#{idx + 1}</span>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    onClick={() => void onRemoveFestival(festival.local_id)}
                    disabled={disabled}
                    className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">{isAr ? 'اسم المهرجان' : 'Nom du festival'}</Label>
                  <Input
                    value={festival.name ?? ''}
                    maxLength={200}
                    className="h-9"
                    disabled={disabled}
                    onChange={(e) => onUpdateFestival(festival.local_id, { name: e.target.value.slice(0, 200) })}
                  />
                </div>

                <section className="space-y-2">
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {isAr ? 'الإقصائيات' : 'Éliminatoires'}
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <NumericField
                      label={isAr ? 'عدد الأقاليم المشاركة' : 'Nombre de provinces participantes'}
                      value={festival.provinces_participantes ?? 0}
                      onChange={(value) => onUpdateFestival(festival.local_id, { provinces_participantes: value })}
                      disabled={disabled}
                    />
                    <NumericField
                      label={isAr ? 'عدد المشاركين المتأهلين' : 'Nombre de participants qualifiés'}
                      value={festival.participants_qualifies ?? 0}
                      onChange={(value) => onUpdateFestival(festival.local_id, { participants_qualifies: value })}
                      disabled={disabled}
                    />
                  </div>
                </section>

                <section className="space-y-2">
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {isAr ? 'التوزيع' : 'Répartition'}
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <NumericField
                      label={isAr ? 'عدد (حضري)' : 'Nbr Urbain'}
                      value={festival.urbain ?? 0}
                      onChange={(value) => onUpdateFestival(festival.local_id, { urbain: value })}
                      disabled={disabled}
                    />
                    <NumericField
                      label={isAr ? 'عدد (قروي)' : 'Nbr Rural'}
                      value={festival.rural ?? 0}
                      onChange={(value) => onUpdateFestival(festival.local_id, { rural: value })}
                      disabled={disabled}
                    />
                  </div>
                </section>

                <section className="space-y-2">
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {isAr ? 'الجنس' : 'Genre'}
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <NumericField
                      label={isAr ? 'عدد النساء' : 'Nombre de femmes'}
                      value={festival.femmes ?? 0}
                      onChange={(value) => onUpdateFestival(festival.local_id, { femmes: value })}
                      disabled={disabled}
                    />
                    <NumericField
                      label={isAr ? 'عدد الرجال' : 'Nombre d’hommes'}
                      value={festival.hommes ?? 0}
                      onChange={(value) => onUpdateFestival(festival.local_id, { hommes: value })}
                      disabled={disabled}
                    />
                  </div>
                </section>

                <section className="space-y-2">
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {isAr ? 'المجموع' : 'Total'}
                  </h4>
                  <NumericField
                    label={isAr ? 'المجموع' : 'Total participants'}
                    value={totalGenre}
                    onChange={() => undefined}
                    disabled={true}
                    computed
                  />
                </section>

                {!isMilieuValid && totalGenre > 0 && (
                  <div className="flex items-center gap-2 text-destructive text-xs mt-2 bg-destructive/10 p-2 rounded">
                    <AlertTriangle className="h-4 w-4" />
                    <span>
                      {isAr
                        ? 'تنبيه: يجب أن يكون مجموع (حضري + قروي) مساوياً للمجموع العام (نساء + رجال).'
                        : 'Attention : Le total (Urbain + Rural) doit être égal au total général (Femmes + Hommes).'}
                    </span>
                  </div>
                )}
              </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
});

Step6Festival.displayName = 'Step6Festival';
