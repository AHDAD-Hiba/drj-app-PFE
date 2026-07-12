import { memo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Network, Handshake } from 'lucide-react';
import { StepComponentProps } from '@/config/wizard.types';

export const Step6Reseau = memo(({ rapportId, disabled, onActivity }: StepComponentProps) => {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  // ==========================================
  // ÉTATS LOCAUX TEMPORAIRES
  // ==========================================
  const [mouvements, setMouvements] = useState<any[]>([]);
  const [partenariats, setPartenariats] = useState<any[]>([]);

  // ==========================================
  // ACTIONS MISE À JOUR RÉSEAU
  // ==========================================
  const handleAddMouvement = () => {
    setMouvements(prev => [
      ...prev, 
      { 
        local_id: crypto.randomUUID(), 
        type_mise_a_jour: '', 
        statut_juridique: '', 
        date_mouvement: '', 
        raisons: '', 
        suggestions: '', 
        observations: '' 
      }
    ]);
    if (onActivity) onActivity();
  };

  const handleUpdateMouvement = (local_id: string, patch: any) => {
    setMouvements(prev => prev.map(m => m.local_id === local_id ? { ...m, ...patch } : m));
    if (onActivity) onActivity();
  };

  const handleRemoveMouvement = (local_id: string) => {
    setMouvements(prev => prev.filter(m => m.local_id !== local_id));
    if (onActivity) onActivity();
  };

  // ==========================================
  // ACTIONS SUIVI PARTENARIATS
  // ==========================================
  const handleAddPartenariat = () => {
    setPartenariats(prev => [
      ...prev, 
      { 
        local_id: crypto.randomUUID(), 
        partenaires: '', 
        sujet_partenariat: '', 
        evaluation: '', 
        obstacles: '', 
        solutions_proposees: '' 
      }
    ]);
    if (onActivity) onActivity();
  };

  const handleUpdatePartenariat = (local_id: string, patch: any) => {
    setPartenariats(prev => prev.map(p => p.local_id === local_id ? { ...p, ...patch } : p));
    if (onActivity) onActivity();
  };

  const handleRemovePartenariat = (local_id: string) => {
    setPartenariats(prev => prev.filter(p => p.local_id !== local_id));
    if (onActivity) onActivity();
  };

  return (
    <div className="space-y-6">
      {/* ======================================================== */}
      {/* BLOC 1 : MISE À JOUR DU RÉSEAU DES ÉTABLISSEMENTS      */}
      {/* ======================================================== */}
      <Card className="p-5 sm:p-6 space-y-4 bg-card">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Network className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-bold">{isAr ? 'تحيين شبكة المؤسسات' : 'Mise à jour du réseau'}</h2>
              <p className="text-sm text-muted-foreground">{isAr ? 'تتبع حركية المؤسسات (إحداث، إغلاق، إعادة فتح)' : 'Suivi des mouvements d\'établissements'}</p>
            </div>
          </div>
          <Button type="button" size="sm" onClick={handleAddMouvement} disabled={disabled} className="gap-1.5 shadow-sm">
            <Plus className="h-4 w-4" />
            {isAr ? 'إضافة حركة' : 'Ajouter un mouvement'}
          </Button>
        </div>

        {mouvements.length === 0 ? (
          <div className="text-center py-8 text-sm text-muted-foreground border-2 border-dashed border-border rounded-xl bg-muted/30">
            {isAr ? 'لا توجد حركية مسجلة' : 'Aucun mouvement de réseau enregistré.'}
          </div>
        ) : (
          <div className="space-y-4 pt-2">
            {mouvements.map((item, idx) => (
              <div key={item.local_id} className="border border-border rounded-xl p-4 bg-muted/10 space-y-4 relative group transition-colors hover:border-primary/30">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-muted-foreground bg-muted px-2 py-1 rounded-md">#{idx + 1}</span>
                  <Button
                    type="button" size="icon" variant="ghost"
                    onClick={() => handleRemoveMouvement(item.local_id)} disabled={disabled}
                    className="h-8 w-8 text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">{isAr ? 'نوع الحركة' : 'Type de mouvement'}</Label>
                    <Select disabled={disabled} value={item.type_mise_a_jour} onValueChange={(v) => handleUpdateMouvement(item.local_id, { type_mise_a_jour: v })}>
                      <SelectTrigger className="h-10"><SelectValue placeholder={isAr ? 'اختر' : 'Sélectionner'} /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="creation_en_cours">{isAr ? 'إحداث في طور الإنجاز' : 'Création en cours'}</SelectItem>
                        <SelectItem value="fermeture_temporaire">{isAr ? 'إغلاق مؤقت' : 'Fermeture temporaire'}</SelectItem>
                        <SelectItem value="reouverture">{isAr ? 'إعادة فتح' : 'Réouverture'}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">{isAr ? 'الوضعية القانونية للعقار' : 'Statut juridique du foncier'}</Label>
                    <Input value={item.statut_juridique} onChange={e => handleUpdateMouvement(item.local_id, { statut_juridique: e.target.value })} disabled={disabled} className="h-10" />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">{isAr ? 'تاريخ الحركة' : 'Date du mouvement'}</Label>
                    <Input type="date" value={item.date_mouvement} onChange={e => handleUpdateMouvement(item.local_id, { date_mouvement: e.target.value })} disabled={disabled} className="h-10" />
                  </div>

                  <div className="space-y-1.5 sm:col-span-2 lg:col-span-1">
                    <Label className="text-xs font-semibold">{isAr ? 'الأسباب' : 'Raisons'}</Label>
                    <Input value={item.raisons} onChange={e => handleUpdateMouvement(item.local_id, { raisons: e.target.value })} disabled={disabled} className="h-10" />
                  </div>

                  <div className="space-y-1.5 sm:col-span-2 lg:col-span-1">
                    <Label className="text-xs font-semibold">{isAr ? 'المقترحات لحل المشكل' : 'Suggestions de solutions'}</Label>
                    <Input value={item.suggestions} onChange={e => handleUpdateMouvement(item.local_id, { suggestions: e.target.value })} disabled={disabled} className="h-10" />
                  </div>

                  <div className="space-y-1.5 sm:col-span-2 lg:col-span-1">
                    <Label className="text-xs font-semibold">{isAr ? 'ملاحظات' : 'Observations'}</Label>
                    <Input value={item.observations} onChange={e => handleUpdateMouvement(item.local_id, { observations: e.target.value })} disabled={disabled} className="h-10" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* ======================================================== */}
      {/* BLOC 2 : SUIVI DES PARTENARIATS                          */}
      {/* ======================================================== */}
      <Card className="p-5 sm:p-6 space-y-4 bg-card">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Handshake className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-bold">{isAr ? 'تتبع الشراكات' : 'Suivi des partenariats'}</h2>
              <p className="text-sm text-muted-foreground">{isAr ? 'حصيلة وتقييم الاتفاقيات' : 'Bilan et évaluation des conventions'}</p>
            </div>
          </div>
          <Button type="button" size="sm" onClick={handleAddPartenariat} disabled={disabled} className="gap-1.5 shadow-sm">
            <Plus className="h-4 w-4" />
            {isAr ? 'إضافة شراكة' : 'Ajouter un partenariat'}
          </Button>
        </div>

        {partenariats.length === 0 ? (
          <div className="text-center py-8 text-sm text-muted-foreground border-2 border-dashed border-border rounded-xl bg-muted/30">
            {isAr ? 'لا توجد شراكات مسجلة' : 'Aucun partenariat enregistré.'}
          </div>
        ) : (
          <div className="space-y-4 pt-2">
            {partenariats.map((item, idx) => (
              <div key={item.local_id} className="border border-border rounded-xl p-4 bg-muted/10 space-y-4 transition-colors hover:border-primary/30">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-muted-foreground bg-muted px-2 py-1 rounded-md">#{idx + 1}</span>
                  <Button type="button" size="icon" variant="ghost" onClick={() => handleRemovePartenariat(item.local_id)} disabled={disabled} className="h-8 w-8 text-destructive hover:bg-destructive/10">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">{isAr ? 'الشركاء' : 'Partenaires'}</Label>
                    <Input value={item.partenaires} onChange={e => handleUpdatePartenariat(item.local_id, { partenaires: e.target.value })} disabled={disabled} className="h-10" />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">{isAr ? 'موضوع الشراكة' : 'Sujet du partenariat'}</Label>
                    <Input value={item.sujet_partenariat} onChange={e => handleUpdatePartenariat(item.local_id, { sujet_partenariat: e.target.value })} disabled={disabled} className="h-10" />
                  </div>

                  <div className="space-y-1.5 sm:col-span-2">
                    <Label className="text-xs font-semibold">{isAr ? 'التقييم' : 'Évaluation'}</Label>
                    <Input value={item.evaluation} onChange={e => handleUpdatePartenariat(item.local_id, { evaluation: e.target.value })} disabled={disabled} className="h-10" />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">{isAr ? 'العراقيل والصعوبات' : 'Obstacles'}</Label>
                    <Input value={item.obstacles} onChange={e => handleUpdatePartenariat(item.local_id, { obstacles: e.target.value })} disabled={disabled} className="h-10" />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">{isAr ? 'الحلول المقترحة' : 'Solutions proposées'}</Label>
                    <Input value={item.solutions_proposees} onChange={e => handleUpdatePartenariat(item.local_id, { solutions_proposees: e.target.value })} disabled={disabled} className="h-10" />
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

Step6Reseau.displayName = 'Step6Reseau';