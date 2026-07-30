import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { SafeInput } from '@/components/form/SafeInput';
import { SafeTextarea } from '@/components/form/SafeTextarea';
import { Plus, Trash2, Handshake } from 'lucide-react';
import { StepComponentProps } from '@/config/wizard.types';

// Import du hook
import { useAfSuiviPartenariats } from '@/hooks/AffairesFeminines/useAfSuiviPartenariats';

export const Step7Partenariats = memo(({ rapportId, disabled, onActivity }: StepComponentProps) => {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  // HOOKS DE PERSISTANCE (AUTO-SAVE)
  const partenariats = useAfSuiviPartenariats(rapportId);

  const handleAddPartenariat = async () => {
    if (onActivity) await onActivity();
    await partenariats.add({ 
      local_id: crypto.randomUUID(), 
      partenaires: '', 
      sujet_partenariat: '', 
      evaluation: '', 
      obstacles: '', 
      solutions_proposees: '' 
    });
  };

  return (
    <div className="space-y-5">
      <Card className="p-5 sm:p-6 space-y-5 bg-card">
        
        {/* EN-TÊTE */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Handshake className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-bold">{isAr ? 'تتبع الشراكات' : 'Suivi des partenariats'}</h2>
              <p className="text-sm text-muted-foreground">{isAr ? 'حصيلة وتقييم اتفاقيات الشراكة' : 'Bilan et évaluation des conventions de partenariat'}</p>
            </div>
          </div>
          <Button type="button" size="sm" onClick={handleAddPartenariat} disabled={disabled} className="gap-1.5 shadow-sm">
            <Plus className="h-4 w-4" />
            {isAr ? 'إضافة شراكة' : 'Ajouter un partenariat'}
          </Button>
        </div>

        {/* LISTE DES PARTENARIATS */}
        {partenariats.items.length === 0 ? (
          <div className="text-center py-10 text-sm text-muted-foreground border-2 border-dashed border-border rounded-xl bg-muted/10">
            {isAr ? 'لا توجد شراكات مسجلة' : 'Aucun partenariat enregistré.'}
          </div>
        ) : (
          <div className="space-y-4 pt-2">
            {partenariats.items.map((item, idx) => (
              <div key={item.local_id} className="border border-border rounded-xl p-4 bg-muted/5 space-y-4 transition-colors hover:border-primary/30">
                
                {/* En-tête épuré */}
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-xs font-semibold text-muted-foreground">#{idx + 1}</span>
                  <Button 
                    type="button" size="icon" variant="ghost" 
                    onClick={() => { partenariats.remove(item.local_id); if(onActivity) void onActivity(); }} disabled={disabled} 
                    className="h-8 w-8 text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                
                {/* Grille du formulaire */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  
                  {/* Partenaires */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">{isAr ? 'الشركاء المعنيون' : 'Partenaires concernés'}</Label>
                    <SafeInput 
                      placeholder={isAr ? 'مثال: المنظمة الدولية...' : 'Ex: ONG internationale...'} 
                      value={item.partenaires} 
                      onValueChange={(val) => {
                        partenariats.update(item.local_id, { partenaires: val });
                        if(onActivity) void onActivity();
                      }} 
                      disabled={disabled} 
                      className="h-10 bg-background" 
                    />
                  </div>

                  {/* Sujet */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">{isAr ? 'موضوع الشراكة' : 'Sujet du partenariat'}</Label>
                    <SafeInput 
                      placeholder={isAr ? 'مثال: مشروع عناية...' : 'Ex: Projet Inaya...'} 
                      value={item.sujet_partenariat} 
                      onValueChange={(val) => {
                        partenariats.update(item.local_id, { sujet_partenariat: val });
                        if(onActivity) void onActivity();
                      }} 
                      disabled={disabled} 
                      className="h-10 bg-background" 
                    />
                  </div>

                  {/* Évaluation */}
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label className="text-xs font-semibold">{isAr ? 'التقييم' : 'Évaluation'}</Label>
                    <SafeTextarea 
                      placeholder={isAr ? 'مثال: جيد، في طور الإنجاز...' : 'Ex: Positif, en cours...'} 
                      value={item.evaluation} 
                      onValueChange={(val) => {
                        partenariats.update(item.local_id, { evaluation: val });
                        if(onActivity) void onActivity();
                      }} 
                      disabled={disabled} 
                    />
                  </div>

                  {/* Obstacles */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">{isAr ? 'المعيقات' : 'Obstacles'}</Label>
                    <SafeTextarea 
                      placeholder={isAr ? 'مثال: تأخر في التمويل...' : 'Ex: Retard de financement...'} 
                      value={item.obstacles} 
                      onValueChange={(val) => {
                        partenariats.update(item.local_id, { obstacles: val });
                        if(onActivity) void onActivity();
                      }} 
                      disabled={disabled} 
                    />
                  </div>

                  {/* Solutions */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">{isAr ? 'الحلول المقترحة' : 'Solutions proposées'}</Label>
                    <SafeTextarea 
                      placeholder={isAr ? 'مثال: تمديد فترة المشروع...' : 'Ex: Prolongation du délai...'} 
                      value={item.solutions_proposees} 
                      onValueChange={(val) => {
                        partenariats.update(item.local_id, { solutions_proposees: val });
                        if(onActivity) void onActivity();
                      }} 
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

Step7Partenariats.displayName = 'Step7Partenariats';