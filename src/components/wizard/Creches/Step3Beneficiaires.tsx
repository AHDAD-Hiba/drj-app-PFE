import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Users, Sparkles, GraduationCap } from 'lucide-react';
import { StepComponentProps } from '@/config/wizard.types';
import { NumericField } from '@/components/form/NumericField';

import {
  useCrStatistiquesEnfants,
  useCrActivitesEnfants,
  useCrFormationsCadres,
} from '@/hooks/Creches/useCrStep3';

export const Step3Beneficiaires = memo(({ disabled, onActivity, rapportId }: StepComponentProps & { rapportId?: string | null }) => {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  const { items: stats, add: addStat, update: updateStat } = useCrStatistiquesEnfants(rapportId || null);
  const { items: activites, add: addActivite, update: updateActivite, remove: removeActivite } = useCrActivitesEnfants(rapportId || null);
  const { items: formations, add: addFormation, update: updateFormation, remove: removeFormation } = useCrFormationsCadres(rapportId || null);

  const statsEntry = stats[0];

  const handleStatsChange = (field: string, value: any) => {
    if (!rapportId) return;
    if (statsEntry) {
      updateStat(statsEntry.local_id, { [field]: value });
    } else {
      addStat({
        local_id: crypto.randomUUID(),
        garcons: 0,
        filles: 0,
        urbain: 0,
        rural: 0,
        observations: '',
        [field]: value,
      } as any);
    }
    if (onActivity) onActivity();
  };

  const handleAddActivite = () => {
    if (!rapportId) return;
    addActivite({
      local_id: crypto.randomUUID(),
      nom_activite: '',
      garcons: 0,
      filles: 0,
      urbain: 0,
      rural: 0,
      observations: '',
    });
    if (onActivity) onActivity();
  };

  const handleAddFormation = () => {
    if (!rapportId) return;
    addFormation({
      local_id: crypto.randomUUID(),
      domaine_formation: '',
      nombre_cadres: 1,
      duree_valeur: 1,
      duree_unite: 'jour',
      observations: '',
    });
    if (onActivity) onActivity();
  };

  return (
    <div className="space-y-8">

      {/* ========================================================================= */}
      {/* CARTE 1 : Statistiques Globales Enfants (Tableau 9) */}
      {/* ========================================================================= */}
      <Card className="p-5 sm:p-6 bg-card border-border shadow-sm border-t-4 border-t-primary">
        <div className="flex items-center gap-3 border-b border-border pb-4 mb-5">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Users className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-bold">{isAr ? '1. عدد الأطفال المستفيدين بمؤسسات الطفولة الصغرى' : '1. Enfants bénéficiaires dans les établissements'}</h2>
            <p className="text-sm text-muted-foreground">{isAr ? 'التوزيع حسب الجنس والمجال' : 'Répartition par genre et milieu'}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 border border-border p-4 rounded-lg bg-muted/5 items-start">
          <div className="md:col-span-3">
            <NumericField label={isAr ? 'ذكور' : 'Garçons'} value={statsEntry?.garcons || 0} onChange={(v) => handleStatsChange('garcons', v)} disabled={disabled} />
          </div>
          <div className="md:col-span-3">
            <NumericField label={isAr ? 'إناث' : 'Filles'} value={statsEntry?.filles || 0} onChange={(v) => handleStatsChange('filles', v)} disabled={disabled} />
          </div>
          <div className="md:col-span-3">
            <NumericField label={isAr ? 'حضري' : 'Urbain'} value={statsEntry?.urbain || 0} onChange={(v) => handleStatsChange('urbain', v)} disabled={disabled} />
          </div>
          <div className="md:col-span-3">
            <NumericField label={isAr ? 'قروي' : 'Rural'} value={statsEntry?.rural || 0} onChange={(v) => handleStatsChange('rural', v)} disabled={disabled} />
          </div>
          <div className="md:col-span-12 space-y-1.5">
            <Label className="text-xs">{isAr ? 'ملاحظات' : 'Observations'}</Label>
            <Textarea value={statsEntry?.observations || ''} onChange={(e) => handleStatsChange('observations', e.target.value)} disabled={disabled} className="min-h-[70px] bg-background text-xs resize-none" />
          </div>
        </div>
      </Card>

      {/* ========================================================================= */}
      {/* CARTE 2 : Activités de Rayonnement (Tableau 6) */}
      {/* ========================================================================= */}
      <Card className="p-5 sm:p-6 bg-card border-border shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between gap-4 border-b border-border pb-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-bold">{isAr ? '2. عدد الأطفال المستفيدين من الأنشطة الإشعاعية' : '2. Activités de rayonnement'}</h2>
            </div>
          </div>
          <Button type="button" size="sm" onClick={handleAddActivite} disabled={disabled || !rapportId} className="gap-1.5">
            <Plus className="h-4 w-4" /> {isAr ? 'إضافة نشاط' : 'Ajouter une activité'}
          </Button>
        </div>

        <div className="space-y-3">
          {activites.map((act) => (
            <div key={act.local_id} className="grid grid-cols-1 md:grid-cols-12 gap-4 border border-border p-4 rounded-lg bg-muted/5 items-start">
              <div className="md:col-span-11 grid grid-cols-1 md:grid-cols-12 gap-4">
                
                <div className="md:col-span-12 space-y-1.5">
                  <Label className="text-xs">{isAr ? 'نوعية النشاط (مثل: المسيرة الخضراء، يوم الطفل...)' : 'Type d\'activité'}</Label>
                  <Input value={act.nom_activite} onChange={(e) => { updateActivite(act.local_id, { nom_activite: e.target.value }); if(onActivity) onActivity(); }} disabled={disabled} className="h-9 text-xs bg-background" />
                </div>

                <div className="md:col-span-3">
                  <NumericField label={isAr ? 'ذكور' : 'Garçons'} value={act.garcons} onChange={(v) => { updateActivite(act.local_id, { garcons: v }); if(onActivity) onActivity(); }} disabled={disabled} />
                </div>
                <div className="md:col-span-3">
                  <NumericField label={isAr ? 'إناث' : 'Filles'} value={act.filles} onChange={(v) => { updateActivite(act.local_id, { filles: v }); if(onActivity) onActivity(); }} disabled={disabled} />
                </div>
                <div className="md:col-span-3">
                  <NumericField label={isAr ? 'حضري' : 'Urbain'} value={act.urbain} onChange={(v) => { updateActivite(act.local_id, { urbain: v }); if(onActivity) onActivity(); }} disabled={disabled} />
                </div>
                <div className="md:col-span-3">
                  <NumericField label={isAr ? 'قروي' : 'Rural'} value={act.rural} onChange={(v) => { updateActivite(act.local_id, { rural: v }); if(onActivity) onActivity(); }} disabled={disabled} />
                </div>

                <div className="md:col-span-12 space-y-1.5">
                  <Label className="text-xs">{isAr ? 'ملاحظات' : 'Observations'}</Label>
                  <Input value={act.observations || ''} onChange={(e) => { updateActivite(act.local_id, { observations: e.target.value }); if(onActivity) onActivity(); }} disabled={disabled} className="h-9 text-xs bg-background" />
                </div>

              </div>
              <div className="md:col-span-1 flex justify-end">
                <Button size="icon" variant="ghost" onClick={() => removeActivite(act.local_id)} disabled={disabled} className="text-destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
          {activites.length === 0 && <div className="text-center py-4 text-xs text-muted-foreground border border-dashed rounded-lg">{isAr ? 'لا توجد أنشطة إشعاعية مسجلة' : 'Aucune activité'}</div>}
        </div>
      </Card>

      {/* ========================================================================= */}
      {/* CARTE 3 : Formations des Cadres (Tableau 7) */}
      {/* ========================================================================= */}
      <Card className="p-5 sm:p-6 bg-card border-border shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between gap-4 border-b border-border pb-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <GraduationCap className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-bold">{isAr ? '3. عدد الأطر المستفيدة من برامج التكوين' : '3. Formations des cadres'}</h2>
            </div>
          </div>
          <Button type="button" size="sm" onClick={handleAddFormation} disabled={disabled || !rapportId} className="gap-1.5">
            <Plus className="h-4 w-4" /> {isAr ? 'إضافة تكوين' : 'Ajouter une formation'}
          </Button>
        </div>

        <div className="space-y-3">
          {formations.map((form) => (
            <div key={form.local_id} className="grid grid-cols-1 md:grid-cols-12 gap-4 border border-border p-4 rounded-lg bg-muted/5 items-start">
              <div className="md:col-span-11 grid grid-cols-1 md:grid-cols-12 gap-4">
                
                <div className="md:col-span-5 space-y-1.5">
                  <Label className="text-xs">{isAr ? 'مجال التكوين' : 'Domaine de formation'}</Label>
                  <Input value={form.domaine_formation} onChange={(e) => { updateFormation(form.local_id, { domaine_formation: e.target.value }); if(onActivity) onActivity(); }} disabled={disabled} className="h-9 text-xs bg-background" />
                </div>

                <div className="md:col-span-3">
                  <NumericField label={isAr ? 'عدد الأطر المستفيدة' : 'Nombre de cadres'} value={form.nombre_cadres} onChange={(v) => { updateFormation(form.local_id, { nombre_cadres: v }); if(onActivity) onActivity(); }} disabled={disabled} />
                </div>

                {/* CHAMP DURÉE DÉCOUPÉ (VALEUR + UNITÉ) */}
                <div className="md:col-span-4 space-y-1.5">
                  <Label className="text-xs">{isAr ? 'مدة التكوين' : 'Durée de la formation'}</Label>
                  <div className="flex gap-2">
                    <div className="w-1/2">
                      <NumericField label="" value={form.duree_valeur} onChange={(v) => { updateFormation(form.local_id, { duree_valeur: v }); if(onActivity) onActivity(); }} disabled={disabled} />
                    </div>
                    <div className="w-1/2">
                      <Select value={form.duree_unite} disabled={disabled} onValueChange={(v) => { updateFormation(form.local_id, { duree_unite: v }); if(onActivity) onActivity(); }}>
                        <SelectTrigger className="h-9 text-xs bg-background"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="heure">{isAr ? 'ساعة' : 'Heure(s)'}</SelectItem>
                          <SelectItem value="jour">{isAr ? 'يوم' : 'Jour(s)'}</SelectItem>
                          <SelectItem value="semaine">{isAr ? 'أسبوع' : 'Semaine(s)'}</SelectItem>
                          <SelectItem value="mois">{isAr ? 'شهر' : 'Mois'}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div className="md:col-span-12 space-y-1.5">
                  <Label className="text-xs">{isAr ? 'ملاحظات' : 'Observations'}</Label>
                  <Input value={form.observations || ''} onChange={(e) => { updateFormation(form.local_id, { observations: e.target.value }); if(onActivity) onActivity(); }} disabled={disabled} className="h-9 text-xs bg-background" />
                </div>

              </div>
              <div className="md:col-span-1 flex justify-end">
                <Button size="icon" variant="ghost" onClick={() => removeFormation(form.local_id)} disabled={disabled} className="text-destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
          {formations.length === 0 && <div className="text-center py-4 text-xs text-muted-foreground border border-dashed rounded-lg">{isAr ? 'لا توجد برامج تكوين مسجلة' : 'Aucune formation'}</div>}
        </div>
      </Card>

    </div>
  );
});

Step3Beneficiaires.displayName = 'Step3Beneficiaires';