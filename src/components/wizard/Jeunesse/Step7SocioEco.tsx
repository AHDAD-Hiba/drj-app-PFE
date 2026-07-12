import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Plus, Trash2, Landmark, AlertTriangle } from 'lucide-react';
import { NumericField } from '@/components/form/NumericField';
import { useTypesPartenaires } from '@/hooks/Jeunesse/useTypesPartenaires';

// NOUVEAUX IMPORTS POUR L'AUTONOMIE
import { StepComponentProps } from '@/config/wizard.types';
import { useInsertionEntries, type InsertionEntry as SocioEcoEntry } from '@/hooks/Jeunesse/useInsertionEntries';

const createEmptySocioEco = (): SocioEcoEntry => ({
  local_id: crypto.randomUUID(),
  sujet: '',
  duree_valeur: 0,
  unite_duree: '',
  type_partenaire_id: '',
  femmes: 0,
  hommes: 0,
  rural: 0,
  urbain: 0,
});

// UTILISATION DE L'INTERFACE GÉNÉRIQUE DE NOTRE CONTRAT
export const Step7SocioEco = memo(({
  rapportId,
  disabled,
  onActivity,
}: StepComponentProps) => {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  
  // 1. Appel autonome du hook métier pour la gestion des listes d'insertion
  const insertionEntries = useInsertionEntries(rapportId);
  const socioeco = insertionEntries.items;

  // 2. Encapsulation des actions métiers avec prise en charge du onActivity
  const handleAddSocio = async (s: SocioEcoEntry) => {
    if (onActivity) await onActivity();
    void insertionEntries.add(s);
  };

  const handleUpdateSocio = async (local_id: string, patch: Partial<SocioEcoEntry>) => {
    void insertionEntries.update(local_id, patch);
    if (onActivity) await onActivity();
  };

  const handleRemoveSocio = async (local_id: string) => {
    void insertionEntries.remove(local_id);
    if (onActivity) await onActivity();
  };

  const partnerTypes = useTypesPartenaires(); 
  const autreId = partnerTypes.items.find(
    x => x.nom?.toLowerCase() === 'autre' || x.nom_ar === 'أخرى'
  )?.id;

  return (
    <div className="space-y-5">
      <Card className="p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Landmark className="h-5 w-5 text-primary" />
              {isAr ? 'الإدماج السوسيو-اقتصادي' : 'Intégration socio-économique'}
            </h2>
            <p className="text-sm text-muted-foreground">
              {isAr ? 'أضف كل نشاط على حدة' : 'Ajoutez chaque activité individuellement'}
            </p>
          </div>
          <Button
            type="button"
            size="sm"
            onClick={() => void handleAddSocio(createEmptySocioEco())}
            disabled={disabled}
            className="gap-1.5"
          >
            <Plus className="h-4 w-4" />
            {isAr ? 'إضافة' : 'Ajouter'}
          </Button>
        </div>

        {socioeco.length === 0 ? (
          <div className="text-center py-4 text-xs text-muted-foreground border-2 border-dashed border-border rounded-lg">
            {isAr ? 'لا توجد أنشطة' : 'Aucune activité enregistrée'}
          </div>
        ) : (
          <div className="space-y-3 pt-2">
            {socioeco.map((item, idx) => {
              const totalGenre = (Number(item.femmes) || 0) + (Number(item.hommes) || 0);
              const totalMilieu = (Number(item.urbain) || 0) + (Number(item.rural) || 0);
              const isMilieuValid = totalGenre === totalMilieu;

              return (
              <div
                key={item.local_id}
                className="border border-border rounded-lg p-4 bg-muted/20 space-y-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-muted-foreground">#{idx + 1}</span>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    onClick={() => void handleRemoveSocio(item.local_id)}
                    disabled={disabled}
                    className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">{isAr ? 'موضوع النشاط' : "Sujet de l'activité"}</Label>
                    <Input
                      value={item.sujet ?? ''}
                      maxLength={200}
                      placeholder={isAr ? 'مثال: (تكوين، لقاء تحسيسي، ورشات علمية..)' : 'Ex: (formation, rencontre de sensibilisation, ateliers scientifiques...)'}
                      className="h-9"
                      disabled={disabled}
                      onChange={(e) => handleUpdateSocio(item.local_id, { sujet: e.target.value.slice(0, 200) })}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="grid grid-cols-2 gap-2">
                      <NumericField
                        label={isAr ? 'المدة' : 'Durée'}
                        value={item.duree_valeur ?? 0}
                        onChange={(value) =>
                          handleUpdateSocio(item.local_id, {
                            duree_valeur: value,
                          })
                        }
                        disabled={disabled}
                      />

                      <div className="space-y-1.5">
                        <Label className="text-xs">
                          {isAr ? 'الوحدة' : 'Unité'}
                        </Label>

                        <Select
                          value={item.unite_duree || 'none'}
                          onValueChange={(value) =>
                            handleUpdateSocio(item.local_id, {
                              unite_duree: (value === 'none' ? '' : value) as SocioEcoEntry['unite_duree'],
                            })
                          }
                          disabled={disabled}
                        >
                          <SelectTrigger className="h-9">
                            <SelectValue placeholder={isAr ? 'اختر' : 'Choisir'} />
                          </SelectTrigger>

                          <SelectContent>
                            <SelectItem value="none">
                              {isAr ? 'اختر الوحدة' : 'Choisir unité'}
                            </SelectItem>
                            <SelectItem value="heure">
                              {isAr ? 'ساعة' : 'Heure'}
                            </SelectItem>
                            <SelectItem value="jour">
                              {isAr ? 'يوم' : 'Jour'}
                            </SelectItem>
                            <SelectItem value="semaine">
                              {isAr ? 'أسبوع' : 'Semaine'}
                            </SelectItem>
                            <SelectItem value="mois">
                              {isAr ? 'شهر' : 'Mois'}
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">{isAr ? 'نوع الشريك' : 'Type de partenaire'}</Label>
                  <Select
                    value={item.type_partenaire_id || 'none'}
                    onValueChange={(value) =>
                      handleUpdateSocio(item.local_id, {
                        type_partenaire_id: value === 'none' ? '' : value,
                        autre_partenaire: value === autreId ? item.autre_partenaire : '',
                      })
                    }
                    disabled={disabled}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder={isAr ? 'اختر' : 'Choisir'} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">{isAr ? 'اختر نوع الشريك' : 'Choisir un partenaire'}</SelectItem>
                      {(partnerTypes.items ?? []).map((type) => (
                        <SelectItem key={type.id} value={type.id}>{(isAr ? type.nom_ar : type.nom) ?? type.nom}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  {item.type_partenaire_id === autreId && (
                    <div className="mt-3 space-y-1.5">
                      <Label className="text-xs">
                        {isAr ? 'تحديد الشريك' : 'Préciser le partenaire'}
                      </Label>
                      <Input
                        value={item.autre_partenaire ?? ''}
                        disabled={disabled}
                        onChange={(e) =>
                          handleUpdateSocio(item.local_id, {
                            autre_partenaire: e.target.value,
                          })
                        }
                      />
                    </div>
                  )}
                </div>

                <section className="space-y-2">
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {isAr ? 'المشاركون' : 'Participants'}
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <NumericField
                      label={isAr ? 'عدد النساء' : 'Femmes'}
                      value={item.femmes ?? 0}
                      onChange={(value) => handleUpdateSocio(item.local_id, { femmes: value })}
                      disabled={disabled}
                    />
                    <NumericField
                      label={isAr ? 'عدد الرجال' : 'Hommes'}
                      value={item.hommes ?? 0}
                      onChange={(value) => handleUpdateSocio(item.local_id, { hommes: value })}
                      disabled={disabled}
                    />
                    <NumericField
                      label={isAr ? 'عدد (قروي)' : 'Nbr Rural'}
                      value={item.rural ?? 0}
                      onChange={(value) => handleUpdateSocio(item.local_id, { rural: value })}
                      disabled={disabled}
                    />
                    <NumericField
                      label={isAr ? 'عدد (حضري)' : 'Nbr Urbain'}
                      value={item.urbain ?? 0}
                      onChange={(value) => handleUpdateSocio(item.local_id, { urbain: value })}
                      disabled={disabled}
                    />
                  </div>
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

Step7SocioEco.displayName = 'Step7SocioEco';