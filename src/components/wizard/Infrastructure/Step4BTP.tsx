import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { SafeInput } from '@/components/form/SafeInput';
import { SafeTextarea } from '@/components/form/SafeTextarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, HardHat } from 'lucide-react';
import { StepComponentProps } from '@/config/wizard.types';
import { NumericField } from '@/components/form/NumericField';

import { useAfEtablissements } from '@/hooks/common/useAfEtablissements';
import { useAuth } from '@/hooks/common/useAuth';
import { useInfraBtp } from '@/hooks/Infrastructure/useInfraBtp';

const TYPES_PROJET = [
  { id: 'construction', ar: 'مشاريع البناء', fr: 'Construction' },
  { id: 'amenagement', ar: 'مشاريع التأهيل والتهيئة', fr: 'Aménagement & Réhabilitation' },
];

export const Step4BTP = memo(({ disabled, onActivity, rapportId }: StepComponentProps & { rapportId?: string | null }) => {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  
  const { utilisateur } = useAuth();
  const directionId = utilisateur?.direction_id;
  
  // 🚀 Récupération dynamique (inclut typesDisponibles)
  const { items: etablissements, typesDisponibles, loading: loadingEtab } = useAfEtablissements(directionId);

  const { items: projets, add: addEntry, remove: removeEntry, update: updateEntry, loading } = useInfraBtp(rapportId || null);

  const handleAddProjet = () => {
    void addEntry({
      local_id: crypto.randomUUID(),
      type_projet: '',
      type_filtre: '', 
      etablissement_id: '',
      cout_projet: 0,
      montant_paye: 0,
      taux_avancement_travaux: 0,
      observations: ''
    });
    if (onActivity) void onActivity();
  };

  const handleRemoveProjet = (id: string) => {
    void removeEntry(id);
    if (onActivity) void onActivity();
  };

  const handleUpdateProjet = (id: string, data: any) => {
    void updateEntry(id, data);
    if (onActivity) void onActivity();
  };

  return (
    <Card className="p-5 sm:p-6 space-y-4 bg-background">
      {/* HEADER */}
      <div className="flex items-center justify-between gap-3 flex-wrap border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
            <HardHat className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="text-base font-semibold">
              {isAr ? 'مشاريع البناء والتهيئة' : 'Projets BTP & Aménagement'}
            </h3>
            <p className="text-xs text-muted-foreground">
              {isAr ? 'تتبع تقدم الأشغال والأداء المالي للمشاريع' : 'Suivi de l\'avancement physique et financier des projets'}
            </p>
          </div>
        </div>
        <Button
          type="button" size="sm" onClick={handleAddProjet}
          disabled={disabled || loadingEtab || loading || !directionId}
          className="gap-1.5"
        >
          <Plus className="h-4 w-4" />
          {isAr ? 'إضافة مشروع' : 'Ajouter un projet'}
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-10 text-sm text-muted-foreground">
          {isAr ? 'جاري التحميل...' : 'Chargement...'}
        </div>
      ) : projets.length === 0 ? (
        <div className="text-center py-8 text-sm text-muted-foreground border-2 border-dashed border-border rounded-lg bg-muted/5">
          {isAr ? 'لم يتم تسجيل أي مشروع بعد' : 'Aucun projet enregistré'}
        </div>
      ) : (
        <div className="space-y-4 pt-2">
          {projets.map((proj, pIdx) => {
            
            const typeFiltreActuel = 
              proj.type_filtre || 
              etablissements.find(e => e.id === proj.etablissement_id)?.type_etablissement || 
              '';

            const filteredEtablissements = typeFiltreActuel 
              ? etablissements.filter(e => e.type_etablissement === typeFiltreActuel)
              : [];

            const cout = Number(proj.cout_projet) || 0;
            const paye = Number(proj.montant_paye) || 0;
            const tauxPaiement = cout > 0 ? ((paye / cout) * 100).toFixed(2) : 0;

            return (
              <div key={proj.local_id} className="border border-border rounded-lg p-4 bg-muted/20 space-y-4 transition-colors hover:border-primary/30">
                <div className="flex items-center justify-between gap-2 border-b border-border/40 pb-3">
                  <span className="text-xs font-bold text-foreground bg-background border shadow-sm px-2 py-1 rounded-md">
                    {isAr ? `المشروع #${pIdx + 1}` : `Projet #${pIdx + 1}`}
                  </span>
                  <Button
                    type="button" size="icon" variant="ghost" onClick={() => handleRemoveProjet(proj.local_id)}
                    disabled={disabled} className="h-8 w-8 text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                {/* ROW 1: Nature du projet */}
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">{isAr ? 'طبيعة المشروع' : 'Nature du projet'}</Label>
                    <Select value={proj.type_projet} disabled={disabled} onValueChange={(v) => handleUpdateProjet(proj.local_id, { type_projet: v })}>
                      <SelectTrigger className="h-9 bg-background">
                        <SelectValue placeholder={isAr ? 'اختر طبيعة المشروع' : 'Choisir la nature'} />
                      </SelectTrigger>
                      <SelectContent>
                        {TYPES_PROJET.map((tp) => (
                          <SelectItem key={tp.id} value={tp.id}>{isAr ? tp.ar : tp.fr}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* ROW 2: Type & Nom de l'établissement */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-border/40 pt-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">{isAr ? 'نوع المؤسسة' : "Type d'établissement"}</Label>
                    <Select value={typeFiltreActuel} disabled={disabled} onValueChange={(v) => handleUpdateProjet(proj.local_id, { type_filtre: v, etablissement_id: '' })}>
                      <SelectTrigger className="h-9 bg-background">
                        <SelectValue placeholder={isAr ? 'اختر النوع' : 'Choisir le type'} />
                      </SelectTrigger>
                      <SelectContent>
                        {/* 💡 Traduction i18n dynamique */}
                        {typesDisponibles.map((typeVal) => (
                          <SelectItem key={typeVal} value={typeVal}>
                            {t(`etablissements.types.${typeVal}`, { defaultValue: typeVal })}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">{isAr ? 'اسم المؤسسة' : "Nom de l'établissement"}</Label>
                    <Select value={proj.etablissement_id} disabled={disabled || loadingEtab || !typeFiltreActuel} onValueChange={(v) => handleUpdateProjet(proj.local_id, { etablissement_id: v })}>
                      <SelectTrigger className="h-9 bg-background">
                        <SelectValue placeholder={isAr ? 'اختر المؤسسة' : 'Choisir l\'établissement'} />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredEtablissements.length === 0 ? (
                          <div className="p-2 text-xs text-muted-foreground text-center">
                            {!typeFiltreActuel 
                                ? (isAr ? 'اختر نوع المؤسسة أولاً' : 'Choisir d\'abord un type')
                                : (isAr ? 'لا توجد مؤسسات من هذا النوع' : 'Aucun établissement')}
                          </div>
                        ) : (
                          filteredEtablissements.map((e) => (
                            <SelectItem key={e.id} value={e.id}>{e.nom}</SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* ROW 3: Finance & Avancement */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-border/40 pt-4">
                  <div className="space-y-1.5">
                    <NumericField label={isAr ? 'الكلفة المالية للمشروع (درهم)' : 'Coût financier du projet (DH)'} value={proj.cout_projet} onChange={(val) => handleUpdateProjet(proj.local_id, { cout_projet: val })} disabled={disabled} />
                  </div>
                  <div className="space-y-1.5">
                    <NumericField label={isAr ? 'المبلغ المؤدى (درهم)' : 'Montant payé (DH)'} value={proj.montant_paye} onChange={(val) => handleUpdateProjet(proj.local_id, { montant_paye: val })} disabled={disabled} />
                  </div>
                  
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-muted-foreground flex items-center justify-between">
                      <span>{isAr ? 'نسبة تقدم الأداء (%)' : 'Taux de paiement (%)'}</span>
                      <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded">{isAr ? 'تلقائي' : 'Auto'}</span>
                    </Label>
                    <SafeInput value={tauxPaiement} disabled className="h-9 bg-muted/50 font-semibold text-primary" />
                  </div>
                  <div className="space-y-1.5">
                    <NumericField label={isAr ? 'نسبة تقدم الأشغال (%)' : 'Avancement des travaux (%)'} value={proj.taux_avancement_travaux} onChange={(val) => handleUpdateProjet(proj.local_id, { taux_avancement_travaux: val })} disabled={disabled} />
                  </div>
                </div>

                {/* ROW 4: Observations */}
                <div className="pt-4 border-t border-border/40">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">{isAr ? 'ملاحظات' : 'Observations'}</Label>
                    <SafeTextarea 
                      placeholder={isAr ? 'أضف ملاحظات (اختياري)...' : 'Ajouter des observations...'} 
                      value={proj.observations || ''} 
                      onValueChange={(val) => handleUpdateProjet(proj.local_id, { observations: val })} 
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
  );
});

Step4BTP.displayName = 'Step4BTP';