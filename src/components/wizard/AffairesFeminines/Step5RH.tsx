import { memo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Users, BookOpen } from 'lucide-react';
import { NumericField } from '@/components/form/NumericField';
import { StepComponentProps } from '@/config/wizard.types';

export const Step5RH = memo(({ rapportId, disabled, onActivity }: StepComponentProps) => {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  // ==========================================
  // ÉTATS LOCAUX TEMPORAIRES
  // ==========================================
  const [rh, setRh] = useState<any[]>([]);
  const [formations, setFormations] = useState<any[]>([]);

  // ==========================================
  // ACTIONS RESSOURCES HUMAINES
  // ==========================================
  const handleAddRh = () => {
    setRh(prev => [
      ...prev, 
      { 
        local_id: crypto.randomUUID(), 
        type_rh: '', 
        nom_cadre: '', 
        mission: '', 
        nombre: 0, 
        observations: '' 
      }
    ]);
    if (onActivity) onActivity();
  };

  const handleUpdateRh = (local_id: string, patch: any) => {
    setRh(prev => prev.map(r => r.local_id === local_id ? { ...r, ...patch } : r));
    if (onActivity) onActivity();
  };

  const handleRemoveRh = (local_id: string) => {
    setRh(prev => prev.filter(r => r.local_id !== local_id));
    if (onActivity) onActivity();
  };

  // ==========================================
  // ACTIONS FORMATION DES CADRES
  // ==========================================
  const handleAddFormation = () => {
    setFormations(prev => [
      ...prev, 
      { 
        local_id: crypto.randomUUID(), 
        nombre_cadres: 0, 
        domaine_formation: '', 
        duree_valeur: 0, 
        unite_duree: '', 
        observations: '' 
      }
    ]);
    if (onActivity) onActivity();
  };

  const handleUpdateFormation = (local_id: string, patch: any) => {
    setFormations(prev => prev.map(f => f.local_id === local_id ? { ...f, ...patch } : f));
    if (onActivity) onActivity();
  };

  const handleRemoveFormation = (local_id: string) => {
    setFormations(prev => prev.filter(f => f.local_id !== local_id));
    if (onActivity) onActivity();
  };

  return (
    <div className="space-y-6">
      {/* ======================================================== */}
      {/* BLOC 1 : RESSOURCES HUMAINES                             */}
      {/* ======================================================== */}
      <Card className="p-5 sm:p-6 space-y-4 bg-card">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-bold">{isAr ? 'الموارد البشرية' : 'Ressources Humaines'}</h2>
              <p className="text-sm text-muted-foreground">{isAr ? 'تتبع الأطر المتوفرة والخصاص' : 'Suivi des cadres disponibles et des besoins'}</p>
            </div>
          </div>
          <Button type="button" size="sm" onClick={handleAddRh} disabled={disabled} className="gap-1.5 shadow-sm">
            <Plus className="h-4 w-4" />
            {isAr ? 'إضافة' : 'Ajouter'}
          </Button>
        </div>

        {rh.length === 0 ? (
          <div className="text-center py-8 text-sm text-muted-foreground border-2 border-dashed border-border rounded-xl bg-muted/30">
            {isAr ? 'لا توجد بيانات مسجلة' : 'Aucune donnée enregistrée pour les ressources humaines.'}
          </div>
        ) : (
          <div className="space-y-4 pt-2">
            {rh.map((item, idx) => (
              <div key={item.local_id} className="border border-border rounded-xl p-4 bg-muted/10 space-y-4 relative group transition-colors hover:border-primary/30">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-muted-foreground bg-muted px-2 py-1 rounded-md">#{idx + 1}</span>
                  <Button
                    type="button" size="icon" variant="ghost"
                    onClick={() => handleRemoveRh(item.local_id)} disabled={disabled}
                    className="h-8 w-8 text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">{isAr ? 'الوضعية' : 'Statut (Type RH)'}</Label>
                    <Select disabled={disabled} value={item.type_rh} onValueChange={(v) => handleUpdateRh(item.local_id, { type_rh: v })}>
                      <SelectTrigger className="h-10"><SelectValue placeholder={isAr ? 'اختر الوضعية' : 'Sélectionner'} /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="disponible">{isAr ? 'متوفر' : 'Disponible'}</SelectItem>
                        <SelectItem value="besoin">{isAr ? 'خصاص (حاجة)' : 'Besoin'}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">{isAr ? 'الإطار / التخصص' : 'Cadre / Profil'}</Label>
                    <Input value={item.nom_cadre} onChange={e => handleUpdateRh(item.local_id, { nom_cadre: e.target.value })} disabled={disabled} className="h-10" />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">{isAr ? 'المهمة' : 'Mission'}</Label>
                    <Input value={item.mission} onChange={e => handleUpdateRh(item.local_id, { mission: e.target.value })} disabled={disabled} className="h-10" />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">{isAr ? 'العدد' : 'Nombre'}</Label>
                    <NumericField label="" value={item.nombre} onChange={(v) => handleUpdateRh(item.local_id, { nombre: v })} disabled={disabled} />
                  </div>

                  <div className="space-y-1.5 sm:col-span-2">
                    <Label className="text-xs font-semibold">{isAr ? 'ملاحظات' : 'Observations'}</Label>
                    <Input value={item.observations} onChange={e => handleUpdateRh(item.local_id, { observations: e.target.value })} disabled={disabled} className="h-10" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* ======================================================== */}
      {/* BLOC 2 : FORMATION DES CADRES                            */}
      {/* ======================================================== */}
      <Card className="p-5 sm:p-6 space-y-4 bg-card">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <BookOpen className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-bold">{isAr ? 'تكوين الأطر' : 'Formation des Cadres'}</h2>
              <p className="text-sm text-muted-foreground">{isAr ? 'تتبع الدورات التكوينية وتقوية القدرات' : 'Suivi des sessions de renforcement des capacités'}</p>
            </div>
          </div>
          <Button type="button" size="sm" onClick={handleAddFormation} disabled={disabled} className="gap-1.5 shadow-sm">
            <Plus className="h-4 w-4" />
            {isAr ? 'إضافة' : 'Ajouter'}
          </Button>
        </div>

        {formations.length === 0 ? (
          <div className="text-center py-8 text-sm text-muted-foreground border-2 border-dashed border-border rounded-xl bg-muted/30">
            {isAr ? 'لا توجد تكوينات مسجلة' : 'Aucune formation enregistrée.'}
          </div>
        ) : (
          <div className="space-y-4 pt-2">
            {formations.map((item, idx) => (
              <div key={item.local_id} className="border border-border rounded-xl p-4 bg-muted/10 space-y-4 transition-colors hover:border-primary/30">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-muted-foreground bg-muted px-2 py-1 rounded-md">#{idx + 1}</span>
                  <Button type="button" size="icon" variant="ghost" onClick={() => handleRemoveFormation(item.local_id)} disabled={disabled} className="h-8 w-8 text-destructive hover:bg-destructive/10">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="space-y-1.5 sm:col-span-2 lg:col-span-1">
                    <Label className="text-xs font-semibold">{isAr ? 'مجال التكوين' : 'Domaine de formation'}</Label>
                    <Input value={item.domaine_formation} onChange={e => handleUpdateFormation(item.local_id, { domaine_formation: e.target.value })} disabled={disabled} className="h-10" />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">{isAr ? 'عدد المستفيدين' : 'Nombre de cadres'}</Label>
                    <NumericField label="" value={item.nombre_cadres} onChange={(v) => handleUpdateFormation(item.local_id, { nombre_cadres: v })} disabled={disabled} />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">{isAr ? 'مدة التكوين' : 'Durée'}</Label>
                    <div className="flex gap-2">
                      <NumericField label="" value={item.duree_valeur} onChange={(v) => handleUpdateFormation(item.local_id, { duree_valeur: v })} disabled={disabled} />
                      <Select disabled={disabled} value={item.unite_duree} onValueChange={(v) => handleUpdateFormation(item.local_id, { unite_duree: v })}>
                        <SelectTrigger className="h-10 w-24 shrink-0"><SelectValue placeholder={isAr ? 'الوحدة' : 'Unité'} /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="heures">{isAr ? 'ساعات' : 'Heures'}</SelectItem>
                          <SelectItem value="jours">{isAr ? 'أيام' : 'Jours'}</SelectItem>
                          <SelectItem value="mois">{isAr ? 'أشهر' : 'Mois'}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-1.5 sm:col-span-2 lg:col-span-3">
                    <Label className="text-xs font-semibold">{isAr ? 'ملاحظات' : 'Observations'}</Label>
                    <Input value={item.observations} onChange={e => handleUpdateFormation(item.local_id, { observations: e.target.value })} disabled={disabled} className="h-10" />
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

Step5RH.displayName = 'Step5RH';