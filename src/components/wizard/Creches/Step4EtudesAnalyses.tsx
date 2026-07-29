import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2, FileSearch, PieChart } from 'lucide-react';
import { StepComponentProps } from '@/config/wizard.types';
import { NumericField } from '@/components/form/NumericField';

import {
  useCrAnalysesPonctuelles,
  useCrSondagesEtudes,
} from '@/hooks/Creches/useCrStep4';

export const Step4EtudesAnalyses = memo(({ disabled, onActivity, rapportId }: StepComponentProps & { rapportId?: string | null }) => {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  const { items: analyses, add: addAnalyse, update: updateAnalyse, remove: removeAnalyse } = useCrAnalysesPonctuelles(rapportId || null);
  const { items: sondages, add: addSondage, update: updateSondage, remove: removeSondage } = useCrSondagesEtudes(rapportId || null);

  const handleAddAnalyse = () => {
    if (!rapportId) return;
    addAnalyse({
      local_id: crypto.randomUUID(),
      sujet: '',
      nombre_beneficiaires: 0,
      explications: '',
      observations: '',
    });
    if (onActivity) onActivity();
  };

  const handleAddSondage = () => {
    if (!rapportId) return;
    addSondage({
      local_id: crypto.randomUUID(),
      type_sondage: '',
      nombre_participants: 0,
      resultats: '',
      observations: '',
    });
    if (onActivity) onActivity();
  };

  return (
    <div className="space-y-8">

      {/* ========================================================================= */}
      {/* CARTE 1 : Analyses Approfondies (Tableau 14) */}
      {/* ========================================================================= */}
      <Card className="p-5 sm:p-6 bg-card border-border shadow-sm border-t-4 border-t-primary">
        <div className="flex flex-col sm:flex-row justify-between gap-4 border-b border-border pb-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <FileSearch className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-bold">{isAr ? '1. تحليل معمق حول نقطة محددة عند الطلب' : '1. Analyses approfondies / Rapports ponctuels'}</h2>
              <p className="text-sm text-muted-foreground">{isAr ? 'تقرير عن وضعية مستثمر، دراسة حالة، أنشطة استثنائية...' : 'Étude de cas, activités exceptionnelles...'}</p>
            </div>
          </div>
          <Button type="button" size="sm" onClick={handleAddAnalyse} disabled={disabled || !rapportId} className="gap-1.5">
            <Plus className="h-4 w-4" /> {isAr ? 'إضافة تحليل' : 'Ajouter une analyse'}
          </Button>
        </div>

        <div className="space-y-3">
          {analyses.map((analyse) => (
            <div key={analyse.local_id} className="grid grid-cols-1 md:grid-cols-12 gap-4 border border-border p-4 rounded-lg bg-muted/5 items-start">
              <div className="md:col-span-11 grid grid-cols-1 md:grid-cols-12 gap-4">
                
                <div className="md:col-span-8 space-y-1.5">
                  <Label className="text-xs">{isAr ? 'الموضوع' : 'Sujet'}</Label>
                  <Input value={analyse.sujet} onChange={(e) => { updateAnalyse(analyse.local_id, { sujet: e.target.value }); if(onActivity) onActivity(); }} disabled={disabled} className="h-9 text-xs bg-background" />
                </div>

                <div className="md:col-span-4">
                  <NumericField label={isAr ? 'عدد المستفيدين' : 'Bénéficiaires'} value={analyse.nombre_beneficiaires} onChange={(v) => { updateAnalyse(analyse.local_id, { nombre_beneficiaires: v }); if(onActivity) onActivity(); }} disabled={disabled} />
                </div>

                <div className="md:col-span-6 space-y-1.5">
                  <Label className="text-xs">{isAr ? 'توضيحات في الموضوع' : 'Explications'}</Label>
                  <Textarea value={analyse.explications || ''} onChange={(e) => { updateAnalyse(analyse.local_id, { explications: e.target.value }); if(onActivity) onActivity(); }} disabled={disabled} className="min-h-[70px] text-xs bg-background resize-none" />
                </div>

                <div className="md:col-span-6 space-y-1.5">
                  <Label className="text-xs">{isAr ? 'ملاحظات' : 'Observations'}</Label>
                  <Textarea value={analyse.observations || ''} onChange={(e) => { updateAnalyse(analyse.local_id, { observations: e.target.value }); if(onActivity) onActivity(); }} disabled={disabled} className="min-h-[70px] text-xs bg-background resize-none" />
                </div>

              </div>
              <div className="md:col-span-1 flex justify-end">
                <Button size="icon" variant="ghost" onClick={() => removeAnalyse(analyse.local_id)} disabled={disabled} className="text-destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
          {analyses.length === 0 && <div className="text-center py-4 text-xs text-muted-foreground border border-dashed rounded-lg">{isAr ? 'لا توجد تحليلات مسجلة' : 'Aucune analyse enregistrée'}</div>}
        </div>
      </Card>

      {/* ========================================================================= */}
      {/* CARTE 2 : Sondages et Études Terrain (Tableau 15) */}
      {/* ========================================================================= */}
      <Card className="p-5 sm:p-6 bg-card border-border shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between gap-4 border-b border-border pb-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <PieChart className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-bold">{isAr ? '2. تقارير عن نتائج استطلاعات الرأي أو دراسات ميدانية مفاجئة' : '2. Sondages et études de terrain'}</h2>
            </div>
          </div>
          <Button type="button" size="sm" onClick={handleAddSondage} disabled={disabled || !rapportId} className="gap-1.5">
            <Plus className="h-4 w-4" /> {isAr ? 'إضافة استطلاع' : 'Ajouter un sondage'}
          </Button>
        </div>

        <div className="space-y-3">
          {sondages.map((sondage) => (
            <div key={sondage.local_id} className="grid grid-cols-1 md:grid-cols-12 gap-4 border border-border p-4 rounded-lg bg-muted/5 items-start">
              <div className="md:col-span-11 grid grid-cols-1 md:grid-cols-12 gap-4">
                
                <div className="md:col-span-8 space-y-1.5">
                  <Label className="text-xs">{isAr ? 'نوع الاستطلاع' : 'Type de sondage'}</Label>
                  <Input value={sondage.type_sondage} onChange={(e) => { updateSondage(sondage.local_id, { type_sondage: e.target.value }); if(onActivity) onActivity(); }} disabled={disabled} className="h-9 text-xs bg-background" />
                </div>

                <div className="md:col-span-4">
                  <NumericField label={isAr ? 'عدد المشاركين' : 'Participants'} value={sondage.nombre_participants} onChange={(v) => { updateSondage(sondage.local_id, { nombre_participants: v }); if(onActivity) onActivity(); }} disabled={disabled} />
                </div>

                <div className="md:col-span-6 space-y-1.5">
                  <Label className="text-xs">{isAr ? 'النتائج' : 'Résultats'}</Label>
                  <Textarea value={sondage.resultats || ''} onChange={(e) => { updateSondage(sondage.local_id, { resultats: e.target.value }); if(onActivity) onActivity(); }} disabled={disabled} className="min-h-[70px] text-xs bg-background resize-none" />
                </div>

                <div className="md:col-span-6 space-y-1.5">
                  <Label className="text-xs">{isAr ? 'ملاحظات' : 'Observations'}</Label>
                  <Textarea value={sondage.observations || ''} onChange={(e) => { updateSondage(sondage.local_id, { observations: e.target.value }); if(onActivity) onActivity(); }} disabled={disabled} className="min-h-[70px] text-xs bg-background resize-none" />
                </div>

              </div>
              <div className="md:col-span-1 flex justify-end">
                <Button size="icon" variant="ghost" onClick={() => removeSondage(sondage.local_id)} disabled={disabled} className="text-destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
          {sondages.length === 0 && <div className="text-center py-4 text-xs text-muted-foreground border border-dashed rounded-lg">{isAr ? 'لا توجد استطلاعات مسجلة' : 'Aucun sondage enregistré'}</div>}
        </div>
      </Card>

    </div>
  );
});

Step4EtudesAnalyses.displayName = 'Step4EtudesAnalyses';