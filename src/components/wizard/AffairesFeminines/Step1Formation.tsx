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
  // ÉTATS LOCAUX TEMPORAIRES (Simulation des Hooks)
  // ==========================================
  const [clubs, setClubs] = useState<any[]>([]);
  const [ofppt, setOfppt] = useState<any[]>([]);

  // ==========================================
  // ACTIONS CLUBS
  // ==========================================
  const handleAddClub = () => {
    setClubs(prev => [...prev, { local_id: crypto.randomUUID(), filiere_id: '', type_formation: '', annee_1: 0, annee_2: 0 }]);
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
    setOfppt(prev => [...prev, { local_id: crypto.randomUUID(), secteur_id: '', filiere_id: '', niveau_formation: '', annee_1: 0, annee_2: 0 }]);
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
              <p className="text-sm text-muted-foreground">{isAr ? 'إضافة الإحصائيات حسب الشعبة' : 'Ajoutez les statistiques par filière'}</p>
            </div>
          </div>
          <Button type="button" size="sm" onClick={handleAddClub} disabled={disabled} className="gap-1.5 shadow-sm">
            <Plus className="h-4 w-4" />
            {isAr ? 'إضافة شعبة' : 'Ajouter une filière'}
          </Button>
        </div>

        {clubs.length === 0 ? (
          <div className="text-center py-8 text-sm text-muted-foreground border-2 border-dashed border-border rounded-xl bg-muted/30">
            {isAr ? 'لا توجد بيانات مسجلة' : 'Aucune donnée enregistrée pour les clubs.'}
          </div>
        ) : (
          <div className="space-y-4 pt-2">
            {clubs.map((item, idx) => (
              <div key={item.local_id} className="border border-border rounded-xl p-4 bg-muted/10 space-y-4 relative group transition-colors hover:border-primary/30">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-muted-foreground bg-muted px-2 py-1 rounded-md">
                    #{idx + 1}
                  </span>
                  <Button
                    type="button" size="icon" variant="ghost"
                    onClick={() => handleRemoveClub(item.local_id)} disabled={disabled}
                    className="h-8 w-8 text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Sélecteur Filière */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">{isAr ? 'الشعبة' : 'Filière'}</Label>
                    <Select disabled={disabled} value={item.filiere_id} onValueChange={(v) => handleUpdateClub(item.local_id, { filiere_id: v })}>
                      <SelectTrigger className="h-10"><SelectValue placeholder={isAr ? 'اختر الشعبة' : 'Sélectionner la filière'} /></SelectTrigger>
                      <SelectContent>
                        {/* Options temporaires, à remplacer par les données de ta BDD */}
                        <SelectItem value="couture">{isAr ? 'الخياطة' : 'Couture'}</SelectItem>
                        <SelectItem value="coiffure">{isAr ? 'الحلاقة' : 'Coiffure'}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Sélecteur Type Formation */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">{isAr ? 'نوع التكوين' : 'Type de formation'}</Label>
                    <Select disabled={disabled} value={item.type_formation} onValueChange={(v) => handleUpdateClub(item.local_id, { type_formation: v })}>
                      <SelectTrigger className="h-10"><SelectValue placeholder={isAr ? 'اختر النوع' : 'Sélectionner le type'} /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fondamental">{isAr ? 'أساسي' : 'Fondamental'}</SelectItem>
                        <SelectItem value="rapide">{isAr ? 'سريع' : 'Rapide'}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Inputs Numériques */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">{isAr ? 'المسجلات - السنة 1' : 'Inscrites - Année 1'}</Label>
                    <NumericField label="" value={item.annee_1} onChange={(v) => handleUpdateClub(item.local_id, { annee_1: v })} disabled={disabled} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">{isAr ? 'المسجلات - السنة 2' : 'Inscrites - Année 2'}</Label>
                    <NumericField label="" value={item.annee_2} onChange={(v) => handleUpdateClub(item.local_id, { annee_2: v })} disabled={disabled} />
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
              <p className="text-sm text-muted-foreground">{isAr ? 'إضافة الإحصائيات حسب القطاع والشعبة' : 'Ajoutez par secteur et filière'}</p>
            </div>
          </div>
          <Button type="button" size="sm" onClick={handleAddOfppt} disabled={disabled} className="gap-1.5 shadow-sm">
            <Plus className="h-4 w-4" />
            {isAr ? 'إضافة' : 'Ajouter'}
          </Button>
        </div>

        {ofppt.length === 0 ? (
          <div className="text-center py-8 text-sm text-muted-foreground border-2 border-dashed border-border rounded-xl bg-muted/30">
            {isAr ? 'لا توجد بيانات مسجلة' : 'Aucune donnée enregistrée pour l\'OFPPT.'}
          </div>
        ) : (
          <div className="space-y-4 pt-2">
            {ofppt.map((item, idx) => (
              <div key={item.local_id} className="border border-border rounded-xl p-4 bg-muted/10 space-y-4 transition-colors hover:border-primary/30">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-muted-foreground bg-muted px-2 py-1 rounded-md">#{idx + 1}</span>
                  <Button type="button" size="icon" variant="ghost" onClick={() => handleRemoveOfppt(item.local_id)} disabled={disabled} className="h-8 w-8 text-destructive hover:bg-destructive/10">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Sélecteur Secteur */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">{isAr ? 'القطاع' : 'Secteur'}</Label>
                    <Select disabled={disabled} value={item.secteur_id} onValueChange={(v) => handleUpdateOfppt(item.local_id, { secteur_id: v })}>
                      <SelectTrigger className="h-10"><SelectValue placeholder={isAr ? 'اختر القطاع' : 'Sélectionner le secteur'} /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="artisanat">{isAr ? 'الصناعة التقليدية' : 'Artisanat'}</SelectItem>
                        <SelectItem value="services">{isAr ? 'الخدمات' : 'Services'}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Sélecteur Filière */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">{isAr ? 'الشعبة' : 'Filière'}</Label>
                    <Select disabled={disabled} value={item.filiere_id} onValueChange={(v) => handleUpdateOfppt(item.local_id, { filiere_id: v })}>
                      <SelectTrigger className="h-10"><SelectValue placeholder={isAr ? 'اختر الشعبة' : 'Sélectionner la filière'} /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="couture_moderne">{isAr ? 'الخياطة العصرية' : 'Couture moderne'}</SelectItem>
                        <SelectItem value="informatique">{isAr ? 'المعلوميات' : 'Informatique'}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Sélecteur Niveau de formation */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">{isAr ? 'مستوى التكوين' : 'Niveau de formation'}</Label>
                    <Select disabled={disabled} value={item.niveau_formation} onValueChange={(v) => handleUpdateOfppt(item.local_id, { niveau_formation: v })}>
                      <SelectTrigger className="h-10"><SelectValue placeholder={isAr ? 'اختر المستوى' : 'Sélectionner le niveau'} /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="specialisation">{isAr ? 'التخصص' : 'Spécialisation'}</SelectItem>
                        <SelectItem value="qualification">{isAr ? 'التأهيل' : 'Qualification'}</SelectItem>
                        <SelectItem value="technicien">{isAr ? 'التقني' : 'Technicien'}</SelectItem>
                        <SelectItem value="technicien_specialise">{isAr ? 'التقني المتخصص' : 'Technicien Spécialisé'}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Inputs Numériques */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">{isAr ? 'المسجلات - السنة 1' : 'Inscrites - Année 1'}</Label>
                    <NumericField label="" value={item.annee_1} onChange={(v) => handleUpdateOfppt(item.local_id, { annee_1: v })} disabled={disabled} />
                  </div>
                  
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">{isAr ? 'المسجلات - السنة 2' : 'Inscrites - Année 2'}</Label>
                    <NumericField label="" value={item.annee_2} onChange={(v) => handleUpdateOfppt(item.local_id, { annee_2: v })} disabled={disabled} />
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