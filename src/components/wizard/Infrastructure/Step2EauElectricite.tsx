import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Zap, Droplets } from 'lucide-react';
import { StepComponentProps } from '@/config/wizard.types';
import { NumericField } from '@/components/form/NumericField';

import { useAfEtablissements } from '@/hooks/common/useAfEtablissements';
import { useAuth } from '@/hooks/common/useAuth';
import { useInfraEauElectricite } from '@/hooks/Infrastructure/useInfraEauElectricite';

export const Step2EauElectricite = memo(({ disabled, onActivity, rapportId }: StepComponentProps & { rapportId?: string | null }) => {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  const { utilisateur } = useAuth();
  const directionId = utilisateur?.direction_id;
  
  const { items: etablissements, typesDisponibles, loading: loadingEtab } = useAfEtablissements(directionId);
  const { items, add: addEntry, remove: removeEntry, update: updateEntry, loading } = useInfraEauElectricite(rapportId || null);

  const handleAdd = () => {
    addEntry({
      local_id: crypto.randomUUID(),
      id: undefined as any,
      type_filtre: '',
      etablissement_id: '',
      arrieres_eau: 0,
      arrieres_electricite: 0,
      consommation_eau: 0,
      consommation_electricite: 0,
    });
    if (onActivity) void onActivity();
  };

  const handleRemove = (local_id: string) => {
    void removeEntry(local_id);
    if (onActivity) void onActivity();
  };

  const handleUpdate = (local_id: string, patch: Partial<any>) => {
    void updateEntry(local_id, patch);
    if (onActivity) void onActivity();
  };

  return (
    <div className="space-y-5">
      <Card className="p-5 sm:p-6 space-y-5 bg-card">
        
        {/* EN-TÊTE */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center relative">
              <Zap className="h-5 w-5 text-amber-500 absolute ml-1 mt-1" />
              <Droplets className="h-5 w-5 text-blue-500 absolute mr-1 mb-1" />
            </div>
            <div>
              <h2 className="text-lg font-bold">
                {isAr ? 'استهلاك الماء والكهرباء' : 'Consommation Eau & Électricité'}
              </h2>
              <p className="text-sm text-muted-foreground">
                {isAr ? 'تتبع متأخرات وتكاليف الاستهلاك حسب المؤسسة' : 'Suivi des arriérés et coûts de consommation par établissement'}
              </p>
            </div>
          </div>
          <Button type="button" size="sm" onClick={handleAdd} disabled={disabled || loading || loadingEtab} className="gap-1.5 shadow-sm">
            <Plus className="h-4 w-4" />
            {isAr ? 'إضافة مؤسسة' : 'Ajouter un établissement'}
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-10 text-sm text-muted-foreground">
            {isAr ? 'جاري التحميل...' : 'Chargement...'}
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-10 text-sm text-muted-foreground border-2 border-dashed border-border rounded-xl bg-muted/10">
            {isAr ? 'لم يتم تسجيل أي استهلاك بعد.' : 'Aucune consommation enregistrée.'}
          </div>
        ) : (
          <div className="space-y-4 pt-2">
            {items.map((item, idx) => {
              const typeFiltreActuel = 
                item.type_filtre || 
                etablissements.find(e => e.id === item.etablissement_id)?.type_etablissement || 
                '';

              const filteredEtablissements = etablissements.filter(e => e.type_etablissement === typeFiltreActuel);

              return (
                <div key={item.local_id} className="border border-border rounded-xl p-4 bg-muted/5 space-y-4 transition-colors hover:border-primary/30">
                  
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-xs font-semibold text-muted-foreground">#{idx + 1}</span>
                    <Button 
                      type="button" size="icon" variant="ghost" 
                      onClick={() => handleRemove(item.local_id)} 
                      disabled={disabled} 
                      className="h-8 w-8 text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Type d'établissement */}
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">{isAr ? 'نوع المؤسسة' : "Type d'établissement"}</Label>
                      <Select 
                        value={typeFiltreActuel} 
                        disabled={disabled}
                        onValueChange={(v) => handleUpdate(item.local_id, { type_filtre: v, etablissement_id: '' })}
                      >
                        <SelectTrigger className="h-10 bg-background">
                          <SelectValue placeholder={isAr ? 'اختر نوع المؤسسة' : 'Choisir le type'} />
                        </SelectTrigger>
                        <SelectContent>
                          {typesDisponibles.map((typeVal) => (
                            <SelectItem key={typeVal} value={typeVal}>
                              {/* 💡 Traduction dynamique depuis i18n avec fallback */}
                              {t(`etablissements.types.${typeVal}`, { defaultValue: typeVal })}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Nom de l'établissement */}
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">{isAr ? 'اسم المؤسسة' : "Nom de l'établissement"}</Label>
                      <Select 
                        value={item.etablissement_id} 
                        disabled={disabled || loadingEtab || !typeFiltreActuel}
                        onValueChange={(v) => handleUpdate(item.local_id, { etablissement_id: v })}
                      >
                        <SelectTrigger className="h-10 bg-background">
                          <SelectValue placeholder={isAr ? 'اختر المؤسسة' : "Choisir l'établissement"} />
                        </SelectTrigger>
                        <SelectContent>
                          {filteredEtablissements.length === 0 ? (
                            <div className="p-2 text-sm text-muted-foreground text-center">
                              {!typeFiltreActuel 
                                ? (isAr ? 'اختر نوع المؤسسة أولاً' : "Choisir d'abord un type")
                                : (isAr ? 'لا توجد مؤسسات من هذا النوع' : 'Aucun établissement')}
                            </div>
                          ) : (
                            filteredEtablissements.map(etab => (
                              <SelectItem key={etab.id} value={etab.id}>
                                {etab.nom}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Arriérés */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-border/50 pt-4">
                    <div className="space-y-1.5">
                      <NumericField 
                        label={isAr ? 'متأخرات الماء (درهم)' : 'Arriérés Eau (DH)'}
                        value={item.arrieres_eau || 0} 
                        onChange={(val) => handleUpdate(item.local_id, { arrieres_eau: val })} 
                        disabled={disabled} 
                      />
                    </div>
                    <div className="space-y-1.5">
                      <NumericField 
                        label={isAr ? 'متأخرات الكهرباء (درهم)' : 'Arriérés Électricité (DH)'}
                        value={item.arrieres_electricite || 0} 
                        onChange={(val) => handleUpdate(item.local_id, { arrieres_electricite: val })} 
                        disabled={disabled} 
                      />
                    </div>
                  </div>

                  {/* Consommation */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-border/50 pt-4">
                    <div className="space-y-1.5">
                      <NumericField 
                        label={isAr ? 'كلفة استهلاك الماء (درهم)' : 'Consommation Eau (DH)'}
                        value={item.consommation_eau || 0} 
                        onChange={(val) => handleUpdate(item.local_id, { consommation_eau: val })} 
                        disabled={disabled} 
                      />
                    </div>
                    <div className="space-y-1.5">
                      <NumericField 
                        label={isAr ? 'كلفة استهلاك الكهرباء (درهم)' : 'Consommation Électricité (DH)'}
                        value={item.consommation_electricite || 0} 
                        onChange={(val) => handleUpdate(item.local_id, { consommation_electricite: val })} 
                        disabled={disabled} 
                      />
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
});

Step2EauElectricite.displayName = 'Step2EauElectricite';