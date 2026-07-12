import { memo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, HeartHandshake } from 'lucide-react';
import { NumericField } from '@/components/form/NumericField';
import { StepComponentProps } from '@/config/wizard.types';

export const Step4Ecoute = memo(({ rapportId, disabled, onActivity }: StepComponentProps) => {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  // ==========================================
  // ÉTATS LOCAUX TEMPORAIRES
  // ==========================================
  const [seances, setSeances] = useState<any[]>([]);

  // ==========================================
  // ACTIONS
  // ==========================================
  const handleAddSeance = () => {
    setSeances(prev => [
      ...prev, 
      { 
        local_id: crypto.randomUUID(), 
        etablissement_id: '', 
        nombre_cas: 0, 
        nombre_seances: 0, 
        type_soutien: '' 
      }
    ]);
    if (onActivity) onActivity();
  };

  const handleUpdateSeance = (local_id: string, patch: any) => {
    setSeances(prev => prev.map(s => s.local_id === local_id ? { ...s, ...patch } : s));
    if (onActivity) onActivity();
  };

  const handleRemoveSeance = (local_id: string) => {
    setSeances(prev => prev.filter(s => s.local_id !== local_id));
    if (onActivity) onActivity();
  };

  return (
    <div className="space-y-6">
      <Card className="p-5 sm:p-6 space-y-4 bg-card">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <HeartHandshake className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-bold">{isAr ? 'مراكز الاستماع' : 'Centres d\'Écoute'}</h2>
              <p className="text-sm text-muted-foreground">{isAr ? 'أضف البيانات مجمعة حسب نوع الدعم لكل مؤسسة' : 'Ajoutez les données regroupées par type de soutien'}</p>
            </div>
          </div>
          <Button type="button" size="sm" onClick={handleAddSeance} disabled={disabled} className="gap-1.5 shadow-sm">
            <Plus className="h-4 w-4" />
            {isAr ? 'إضافة نوع دعم' : 'Ajouter un type de soutien'}
          </Button>
        </div>

        {seances.length === 0 ? (
          <div className="text-center py-8 text-sm text-muted-foreground border-2 border-dashed border-border rounded-xl bg-muted/30">
            {isAr ? 'لا توجد جلسات مسجلة' : 'Aucune donnée enregistrée pour les centres d\'écoute.'}
          </div>
        ) : (
          <div className="space-y-4 pt-2">
            {seances.map((item, idx) => (
              <div key={item.local_id} className="border border-border rounded-xl p-4 bg-muted/10 space-y-4 transition-colors hover:border-primary/30">
                
                {/* En-tête épuré */}
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-muted-foreground">#{idx + 1}</span>
                  <Button
                    type="button" size="icon" variant="ghost"
                    onClick={() => handleRemoveSeance(item.local_id)} disabled={disabled}
                    className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-1">
                  <div className="space-y-1.5 sm:col-span-2 lg:col-span-3">
                    <Label className="text-xs font-semibold">{isAr ? 'مقر نقطة الاستماع (المؤسسة)' : 'Établissement (Point d\'écoute)'}</Label>
                    <Select disabled={disabled} value={item.etablissement_id} onValueChange={(v) => handleUpdateSeance(item.local_id, { etablissement_id: v })}>
                      <SelectTrigger className="h-10">
                         <SelectValue placeholder={isAr ? 'اختر المؤسسة' : 'Sélectionner l\'établissement'} />
                      </SelectTrigger>
                      <SelectContent>
                         <SelectItem value="etab_1">{isAr ? 'النادي النسوي درب القاضي' : 'Foyer Féminin Derb El Kadi'}</SelectItem>
                         <SelectItem value="etab_2">{isAr ? 'مركز التكوين والتأهيل المهني حي عادل' : 'Centre de Qualification Hay Adel'}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5 lg:col-span-1">
                    <Label className="text-xs font-semibold">{isAr ? 'نوع الدعم أو الإجراءات المتخذة' : 'Type de soutien / Mesures'}</Label>
                    <Input 
                      placeholder={isAr ? 'مثال: توجيه، دعم نفسي، إنصات...' : 'Ex: Orientation, écoute, soutien psy...'} 
                      value={item.type_soutien} 
                      onChange={e => handleUpdateSeance(item.local_id, { type_soutien: e.target.value })} 
                      disabled={disabled} 
                      className="h-10" 
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">{isAr ? 'عدد الحالات المرصودة' : 'Nombre de cas (Bénéficiaires)'}</Label>
                    <NumericField 
                      label="" 
                      value={item.nombre_cas} 
                      onChange={(v) => handleUpdateSeance(item.local_id, { nombre_cas: v })} 
                      disabled={disabled} 
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">{isAr ? 'مجموع الجلسات المنعقدة' : 'Total des séances'}</Label>
                    <NumericField 
                      label="" 
                      value={item.nombre_seances} 
                      onChange={(v) => handleUpdateSeance(item.local_id, { nombre_seances: v })} 
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

Step4Ecoute.displayName = 'Step4Ecoute';