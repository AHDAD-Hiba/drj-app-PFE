import { memo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, School, GraduationCap } from 'lucide-react';
import { NumericField } from '@/components/form/NumericField';
import { StepComponentProps } from '@/config/wizard.types';

export const Step1Formation = memo(({ rapportId, disabled, onActivity }: StepComponentProps) => {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  // ==========================================
  // ÉTATS LOCAUX TEMPORAIRES
  // ==========================================
  const [clubs, setClubs] = useState<any[]>([]);
  const [ofppt, setOfppt] = useState<any[]>([]);

  // ==========================================
  // ACTIONS CLUBS
  // ==========================================
  const handleAddClub = () => {
    setClubs(prev => [
      ...prev, 
      { local_id: crypto.randomUUID(), filiere_id: '', fondamental_a1: 0, fondamental_a2: 0, rapide_a1: 0, rapide_a2: 0 }
    ]);
    if (onActivity) onActivity();
  };

  const handleUpdateClub = (local_id: string, patch: any) => {
    setClubs(prev => prev.map(c => c.local_id === local_id ? { ...c, ...patch } : c));
    if (onActivity) onActivity();
  };

  const handleRemoveClub = (local_id: string) => {
    setClubs(prev => prev.filter(c => c.local_id !== local_id));
    if (onActivity) onActivity();
  };

  // ==========================================
  // ACTIONS OFPPT
  // ==========================================
  const handleAddOfppt = () => {
    setOfppt(prev => [
      ...prev, 
      { local_id: crypto.randomUUID(), secteur_id: '', filiere_id: '', spec_a1: 0, spec_a2: 0, qual_a1: 0, qual_a2: 0, tech_a1: 0, tech_a2: 0, ts_a1: 0, ts_a2: 0 }
    ]);
    if (onActivity) onActivity();
  };

  const handleUpdateOfppt = (local_id: string, patch: any) => {
    setOfppt(prev => prev.map(o => o.local_id === local_id ? { ...o, ...patch } : o));
    if (onActivity) onActivity();
  };

  const handleRemoveOfppt = (local_id: string) => {
    setOfppt(prev => prev.filter(o => o.local_id !== local_id));
    if (onActivity) onActivity();
  };

  return (
    <div className="space-y-6">
      {/* ======================================================== */}
      {/* BLOC 1 : CLUBS FÉMININS (Foyers)                         */}
      {/* ======================================================== */}
      <Card className="p-5 sm:p-6 space-y-4 bg-card">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <School className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-bold">{isAr ? 'الأندية النسوية' : 'Clubs Féminins'}</h2>
              <p className="text-sm text-muted-foreground">{isAr ? 'إحصائيات حسب الشعبة (أساسي / سريع)' : 'Statistiques par filière (Fondamental / Rapide)'}</p>
            </div>
          </div>
          <Button type="button" size="sm" onClick={handleAddClub} disabled={disabled} className="gap-1.5 shadow-sm">
            <Plus className="h-4 w-4" />
            {isAr ? 'إضافة شعبة' : 'Ajouter une filière'}
          </Button>
        </div>

        {clubs.length === 0 ? (
          <div className="text-center py-8 text-sm text-muted-foreground border-2 border-dashed border-border rounded-xl bg-muted/30">
            {isAr ? 'لا توجد بيانات مسجلة' : 'Aucune donnée enregistrée.'}
          </div>
        ) : (
          <div className="space-y-4 pt-2">
            {clubs.map((item, idx) => (
              <div key={item.local_id} className="border border-border rounded-xl p-4 bg-muted/10 space-y-4 relative group transition-colors hover:border-primary/30">
                
                {/* En-tête épuré */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-xs font-semibold text-muted-foreground">#{idx + 1}</span>
                  <Button type="button" size="icon" variant="ghost" onClick={() => handleRemoveClub(item.local_id)} disabled={disabled} className="h-8 w-8 text-destructive hover:bg-destructive/10">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="space-y-4">
                  {/* Sélecteur de filière au-dessus de la sous-grille */}
                  <div className="space-y-1.5 sm:max-w-md">
                    <Label className="text-xs font-semibold">{isAr ? 'الشعبة' : 'Filière'}</Label>
                    <Select disabled={disabled} value={item.filiere_id} onValueChange={(v) => handleUpdateClub(item.local_id, { filiere_id: v })}>
                      <SelectTrigger className="h-10"><SelectValue placeholder={isAr ? 'اختر الشعبة' : 'Sélectionner la filière'} /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="couture">{isAr ? 'الفصالة والخياطة العصرية' : 'Coupe et couture moderne'}</SelectItem>
                        <SelectItem value="coiffure">{isAr ? 'الحلاقة والتجميل' : 'Coiffure et esthétique'}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Sous-grille des types de formation */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Type: Fondamental */}
                    <div className="p-3 bg-background rounded-lg border border-border/50 space-y-3">
                      <h4 className="text-sm font-semibold text-primary">{isAr ? 'تكوين أساسي' : 'Formation Fondamentale'}</h4>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label className="text-xs">{isAr ? 'السنة الأولى' : 'Année 1'}</Label>
                          <NumericField label="" value={item.fondamental_a1} onChange={(v) => handleUpdateClub(item.local_id, { fondamental_a1: v })} disabled={disabled} />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs">{isAr ? 'السنة الثانية' : 'Année 2'}</Label>
                          <NumericField label="" value={item.fondamental_a2} onChange={(v) => handleUpdateClub(item.local_id, { fondamental_a2: v })} disabled={disabled} />
                        </div>
                      </div>
                    </div>

                    {/* Type: Rapide */}
                    <div className="p-3 bg-background rounded-lg border border-border/50 space-y-3">
                      <h4 className="text-sm font-semibold text-primary">{isAr ? 'تكوين سريع' : 'Formation Rapide'}</h4>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label className="text-xs">{isAr ? 'السنة الأولى' : 'Année 1'}</Label>
                          <NumericField label="" value={item.rapide_a1} onChange={(v) => handleUpdateClub(item.local_id, { rapide_a1: v })} disabled={disabled} />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs">{isAr ? 'السنة الثانية' : 'Année 2'}</Label>
                          <NumericField label="" value={item.rapide_a2} onChange={(v) => handleUpdateClub(item.local_id, { rapide_a2: v })} disabled={disabled} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* ======================================================== */}
      {/* BLOC 2 : OFPPT                                         */}
      {/* ======================================================== */}
      <Card className="p-5 sm:p-6 space-y-4 bg-card">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <GraduationCap className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-bold">{isAr ? 'مكتب التكوين المهني' : 'Inscriptions OFPPT'}</h2>
              <p className="text-sm text-muted-foreground">{isAr ? 'إحصائيات حسب الشعبة والمستويات' : 'Statistiques par filière et niveaux'}</p>
            </div>
          </div>
          <Button type="button" size="sm" onClick={handleAddOfppt} disabled={disabled} className="gap-1.5 shadow-sm">
            <Plus className="h-4 w-4" />
            {isAr ? 'إضافة شعبة' : 'Ajouter une filière'}
          </Button>
        </div>

        {ofppt.length === 0 ? (
          <div className="text-center py-8 text-sm text-muted-foreground border-2 border-dashed border-border rounded-xl bg-muted/30">
            {isAr ? 'لا توجد بيانات مسجلة' : 'Aucune donnée enregistrée.'}
          </div>
        ) : (
          <div className="space-y-4 pt-2">
            {ofppt.map((item, idx) => (
              <div key={item.local_id} className="border border-border rounded-xl p-4 bg-muted/10 space-y-4 transition-colors hover:border-primary/30">
                
                {/* En-tête épuré */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-xs font-semibold text-muted-foreground">#{idx + 1}</span>
                  <Button type="button" size="icon" variant="ghost" onClick={() => handleRemoveOfppt(item.local_id)} disabled={disabled} className="h-8 w-8 text-destructive hover:bg-destructive/10">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="space-y-4">
                  {/* Sélecteurs Secteur et Filière */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">{isAr ? 'القطاع' : 'Secteur'}</Label>
                      <Select disabled={disabled} value={item.secteur_id} onValueChange={(v) => handleUpdateOfppt(item.local_id, { secteur_id: v })}>
                        <SelectTrigger className="h-10"><SelectValue placeholder={isAr ? 'اختر القطاع' : 'Sélectionner le secteur'} /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="artisanat">{isAr ? 'الصناعة التقليدية' : 'Artisanat'}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">{isAr ? 'الشعبة' : 'Filière'}</Label>
                      <Select disabled={disabled} value={item.filiere_id} onValueChange={(v) => handleUpdateOfppt(item.local_id, { filiere_id: v })}>
                        <SelectTrigger className="h-10"><SelectValue placeholder={isAr ? 'اختر الشعبة' : 'Sélectionner la filière'} /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="couture">{isAr ? 'الفصالة والخياطة العصرية' : 'Coupe et couture moderne'}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Sous-grille des Niveaux OFPPT pour cette filière */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {/* Spécialisation */}
                    <div className="p-3 bg-background rounded-lg border border-border/50 space-y-3">
                      <h4 className="text-xs font-semibold text-primary">{isAr ? 'التخصص' : 'Spécialisation'}</h4>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1"><Label className="text-[10px]">{isAr ? 'سنة 1' : 'Année 1'}</Label><NumericField label="" value={item.spec_a1} onChange={(v) => handleUpdateOfppt(item.local_id, { spec_a1: v })} disabled={disabled} /></div>
                        <div className="space-y-1"><Label className="text-[10px]">{isAr ? 'سنة 2' : 'Année 2'}</Label><NumericField label="" value={item.spec_a2} onChange={(v) => handleUpdateOfppt(item.local_id, { spec_a2: v })} disabled={disabled} /></div>
                      </div>
                    </div>

                    {/* Qualification */}
                    <div className="p-3 bg-background rounded-lg border border-border/50 space-y-3">
                      <h4 className="text-xs font-semibold text-primary">{isAr ? 'التأهيل' : 'Qualification'}</h4>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1"><Label className="text-[10px]">{isAr ? 'سنة 1' : 'Année 1'}</Label><NumericField label="" value={item.qual_a1} onChange={(v) => handleUpdateOfppt(item.local_id, { qual_a1: v })} disabled={disabled} /></div>
                        <div className="space-y-1"><Label className="text-[10px]">{isAr ? 'سنة 2' : 'Année 2'}</Label><NumericField label="" value={item.qual_a2} onChange={(v) => handleUpdateOfppt(item.local_id, { qual_a2: v })} disabled={disabled} /></div>
                      </div>
                    </div>

                    {/* Technicien */}
                    <div className="p-3 bg-background rounded-lg border border-border/50 space-y-3">
                      <h4 className="text-xs font-semibold text-primary">{isAr ? 'التقني' : 'Technicien'}</h4>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1"><Label className="text-[10px]">{isAr ? 'سنة 1' : 'Année 1'}</Label><NumericField label="" value={item.tech_a1} onChange={(v) => handleUpdateOfppt(item.local_id, { tech_a1: v })} disabled={disabled} /></div>
                        <div className="space-y-1"><Label className="text-[10px]">{isAr ? 'سنة 2' : 'Année 2'}</Label><NumericField label="" value={item.tech_a2} onChange={(v) => handleUpdateOfppt(item.local_id, { tech_a2: v })} disabled={disabled} /></div>
                      </div>
                    </div>

                    {/* Technicien Spécialisé */}
                    <div className="p-3 bg-background rounded-lg border border-border/50 space-y-3">
                      <h4 className="text-xs font-semibold text-primary">{isAr ? 'التقني المتخصص' : 'Tech. Spécialisé'}</h4>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1"><Label className="text-[10px]">{isAr ? 'سنة 1' : 'Année 1'}</Label><NumericField label="" value={item.ts_a1} onChange={(v) => handleUpdateOfppt(item.local_id, { ts_a1: v })} disabled={disabled} /></div>
                        <div className="space-y-1"><Label className="text-[10px]">{isAr ? 'سنة 2' : 'Année 2'}</Label><NumericField label="" value={item.ts_a2} onChange={(v) => handleUpdateOfppt(item.local_id, { ts_a2: v })} disabled={disabled} /></div>
                      </div>
                    </div>
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

Step1Formation.displayName = 'Step1Formation';