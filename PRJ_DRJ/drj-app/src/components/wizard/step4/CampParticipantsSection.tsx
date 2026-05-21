import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Plus, Trash2, AlertTriangle } from 'lucide-react';
import { NumericField } from '@/components/form/NumericField';
import { useProgrammesCamping } from '@/hooks/useProgrammesCamping';
import { useNiveauxFormation } from '@/hooks/useNiveauxFormation';
import type { CampEntry } from '@/hooks/useCampingEntries';

interface CampParticipantsSectionProps {
  camps: CampEntry[];
  onAddCamp: (c: CampEntry) => void | Promise<void>;
  onUpdateCamp: (local_id: string, patch: Partial<CampEntry>) => void;
  onRemoveCamp: (local_id: string) => void | Promise<void>;
  disabled?: boolean;
}

export const CampParticipantsSection = ({
  camps,
  onAddCamp,
  onUpdateCamp,
  onRemoveCamp,
  disabled,
}: CampParticipantsSectionProps) => {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const { items: programmes } = useProgrammesCamping();
  const { items: niveauxFormation } = useNiveauxFormation();

  return (
    <Card className="p-5 sm:p-6 space-y-4 bg-background">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h3 className="text-base font-semibold">
            {isAr ? 'قائمة المخيمات' : 'Liste des camps'}
          </h3>
          <p className="text-xs text-muted-foreground">
            {isAr ? 'أضف كل مخيّم على حدة مع تفاصيل المشاركين والتأطير' : 'Ajoutez chaque camp avec les détails des participants et de l\'encadrement'}
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          onClick={() => void onAddCamp({
            local_id: crypto.randomUUID(),
            programme_id: '',
            girls: 0,
            boys: 0,
            rural: 0,
            urban: 0,
            immigrant_children: 0,
            special_needs: 0,
            encadrements: [],
          })}
          disabled={disabled}
          className="gap-1.5"
        >
          <Plus className="h-4 w-4" />
          {isAr ? 'إضافة مخيّم' : 'Ajouter un camp'}
        </Button>
      </div>

      {camps.length === 0 ? (
        <div className="text-center py-4 text-xs text-muted-foreground border-2 border-dashed border-border rounded-lg">
          {isAr ? 'لا توجد مخيمات' : 'Aucun camp enregistré'}
        </div>
      ) : (
        <div className="space-y-3 pt-2">
          {camps.map((c, idx) => {
            const total = (Number(c.girls) || 0) + (Number(c.boys) || 0);
            const totalMilieu = (Number(c.urban) || 0) + (Number(c.rural) || 0);
            const isMilieuValid = total === totalMilieu;

            return (
              <div
                key={c.local_id}
                className="border border-border rounded-lg p-4 bg-muted/20 space-y-3"
              >
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="text-xs font-semibold text-muted-foreground">
                    #{idx + 1}
                  </span>
                  <div className="space-y-1.5 w-full order-2">
                    <Label className="text-xs">
                      {isAr ? 'نوع المخيم' : 'Type de camp'}
                    </Label>
                    <Select
                      value={c.programme_id || 'none'}
                      onValueChange={(v) =>
                        onUpdateCamp(c.local_id, {
                          programme_id: v === 'none' ? '' : v,
                        })
                      }
                      disabled={disabled}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue
                          placeholder={
                            isAr
                              ? 'اختر نوع المخيم'
                              : 'Choisir le type de camp'
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">
                          {isAr ? 'اختر نوع المخيم' : 'Choisir le type de camp'}
                        </SelectItem>
                        {programmes.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {isAr && p.nom_ar ? p.nom_ar : p.nom}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    onClick={() => void onRemoveCamp(c.local_id)}
                    disabled={disabled}
                    className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10 order-1"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                {/* Participants Section */}
                <div className="space-y-3 pt-4 border-t">
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {isAr ? 'المشاركون' : 'Participants'}
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <NumericField
                      label={isAr ? 'فتيات' : 'Filles'}
                      value={Number(c.girls) || 0}
                      onChange={(v) =>
                        onUpdateCamp(c.local_id, { girls: v })
                      }
                      disabled={disabled}
                    />
                    <NumericField
                      label={isAr ? 'فتيان' : 'Garçons'}
                      value={Number(c.boys) || 0}
                      onChange={(v) =>
                        onUpdateCamp(c.local_id, { boys: v })
                      }
                      disabled={disabled}
                    />
                    <NumericField
                      label={isAr ? 'المجموع' : 'Total'}
                      value={total}
                      computed
                      disabled={disabled}
                    />

                    <div className="col-span-1 hidden sm:block"></div>

                    <NumericField
                      label={isAr ? 'حضري' : 'Urbain'}
                      value={Number(c.urban) || 0}
                      onChange={(v) =>
                        onUpdateCamp(c.local_id, { urban: v })
                      }
                      disabled={disabled}
                    />
                    <NumericField
                      label={isAr ? 'قروي' : 'Rural'}
                      value={Number(c.rural) || 0}
                      onChange={(v) =>
                        onUpdateCamp(c.local_id, { rural: v })
                      }
                      disabled={disabled}
                    />
                    <NumericField
                      label={isAr ? 'أبناء المهاجرين' : "Enfants d'immigrés"}
                      value={Number(c.immigrant_children) || 0}
                      onChange={(v) =>
                        onUpdateCamp(c.local_id, { immigrant_children: v })
                      }
                      disabled={disabled}
                    />
                    <NumericField
                      label={isAr ? 'احتياجات خاصة' : 'Besoins spécifiques'}
                      value={Number(c.special_needs) || 0}
                      onChange={(v) =>
                        onUpdateCamp(c.local_id, { special_needs: v })
                      }
                      disabled={disabled}
                    />
                  </div>

                  {!isMilieuValid && total > 0 && (
                    <div className="flex items-center gap-2 text-destructive text-xs mt-2 bg-destructive/10 p-2 rounded">
                      <AlertTriangle className="h-4 w-4" />
                      <span>
                        {isAr
                          ? 'تنبيه: يجب أن يكون مجموع (حضري + قروي) مساوياً للمجموع العام (فتيات + فتيان).'
                          : 'Attention : Le total (Urbain + Rural) doit être égal au total général (Filles + Garçons).'}
                      </span>
                    </div>
                  )}
                </div>
                  {/* Encadrement Section */}
                  <div className="space-y-3 pt-4 border-t">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        {isAr ? 'التأطير' : 'Encadrement'}
                      </h4>

                      <Button
                        type="button"
                        size="sm"
                        disabled={disabled}
                        className="gap-1.5"
                        onClick={() =>
                          onUpdateCamp(c.local_id, {
                            encadrements: [
                              ...(c.encadrements || []),
                              {
                                local_id: crypto.randomUUID(),
                                niveau_formation_id: '',
                                nombre_femmes: 0,
                                nombre_hommes: 0,
                              },
                            ],
                          })
                        }
                      >
                        <Plus className="h-4 w-4" />
                        {isAr ? 'إضافة' : 'Ajouter'}
                      </Button>
                    </div>

                    {(c.encadrements || []).map((enc, encIdx) => (
                      <div
                        key={enc.local_id}
                        className="border border-border rounded-lg p-4 bg-background/50 space-y-3"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-semibold text-muted-foreground">
                            #{encIdx + 1}
                          </span>

                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() =>
                              onUpdateCamp(c.local_id, {
                                encadrements: c.encadrements.filter(
                                  (e) => e.local_id !== enc.local_id
                                ),
                              })
                            }
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="space-y-1.5">
                          <Label className="text-xs">
                            {isAr ? 'مستوى التكوين' : 'Niveau'}
                          </Label>

                          <Select
                            value={enc.niveau_formation_id || 'none'}
                            onValueChange={(v) => {
                              onUpdateCamp(c.local_id, {
                                encadrements: c.encadrements.map((e) =>
                                  e.local_id === enc.local_id
                                    ? {
                                        ...e,
                                        niveau_formation_id:
                                          v === 'none' ? '' : v,
                                      }
                                    : e
                                ),
                              });
                            }}
                          >
                            <SelectTrigger className="h-9">
                              <SelectValue
                                placeholder={
                                  isAr
                                    ? 'اختر المستوى'
                                    : 'Choisir niveau'
                                }
                              />
                            </SelectTrigger>

                            <SelectContent>
                              <SelectItem value="none">
                                {isAr
                                  ? 'اختر المستوى'
                                  : 'Choisir niveau'}
                              </SelectItem>

                              {niveauxFormation.map((n) => (
                                <SelectItem key={n.id} value={n.id}>
                                  {isAr && n.nom_ar ? n.nom_ar : n.nom}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <NumericField
                          label={isAr ? 'مؤطرات' : 'Monitrices'}
                          value={enc.nombre_femmes}
                          onChange={(v) =>
                            onUpdateCamp(c.local_id, {
                              encadrements: c.encadrements.map((e) =>
                                e.local_id === enc.local_id
                                  ? { ...e, nombre_femmes: v }
                                  : e
                              ),
                            })
                          }
                          disabled={disabled}
                        />

                        <NumericField
                          label={isAr ? 'مؤطرون' : 'Moniteurs'}
                          value={enc.nombre_hommes}
                          onChange={(v) =>
                            onUpdateCamp(c.local_id, {
                              encadrements: c.encadrements.map((e) =>
                                e.local_id === enc.local_id
                                  ? { ...e, nombre_hommes: v }
                                  : e
                              ),
                            })
                          }
                          disabled={disabled}
                        />
                        </div>
                      </div>
                    ))}
                  </div>

              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
};
