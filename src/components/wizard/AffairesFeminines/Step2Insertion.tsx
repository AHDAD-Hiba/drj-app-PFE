import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Briefcase, Store } from 'lucide-react';
import { NumericField } from '@/components/form/NumericField';
import { StepComponentProps } from '@/config/wizard.types';

// Import de nos hooks
import { useAfIntegrationLaureates } from '@/hooks/AffairesFeminines/useAfIntegrationLaureates';
import { useAfAgrs } from '@/hooks/AffairesFeminines/useAfAgrs';
import { useAfEtablissements } from '@/hooks/common/useAfEtablissements';

export const Step2Insertion = memo(({ rapportId, disabled, onActivity }: StepComponentProps) => {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  // ==========================================
  // HOOKS DE PERSISTANCE (AUTO-SAVE)
  // ==========================================
  const laureates = useAfIntegrationLaureates(rapportId);
  const agrs = useAfAgrs(rapportId);

  // Chargement de la liste des établissements
  const { items: tousLesEtablissements } = useAfEtablissements();
  const etablissementsFiltres = tousLesEtablissements.filter(
    e => e.type_etablissement === 'club_feminin' || e.type_etablissement === 'ofppt'
  );

  // ==========================================
  // ACTIONS LAURÉATES
  // ==========================================
  const handleAddLaureate = async () => {
    if (onActivity) await onActivity();
    await laureates.add({ 
      local_id: crypto.randomUUID(), 
      type_formation: '', 
      nombre_laureates: 0, 
      nombre_integrees: 0 
    });
  };

  // ==========================================
  // ACTIONS AGR
  // ==========================================
  const handleAddAgr = async () => {
    if (onActivity) await onActivity();
    await agrs.add({ 
      local_id: crypto.randomUUID(), 
      etablissement_id: '', 
      nombre_beneficiaires: 0, 
      partenaires: '',
      observations: ''
    });
  };

  return (
    <div className="space-y-6">
      {/* ======================================================== */}
      {/* BLOC 1 : INTÉGRATION DES LAURÉATES                       */}
      {/* ======================================================== */}
      <Card className="p-5 sm:p-6 space-y-4 bg-card">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Briefcase className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-bold">{isAr ? 'إدماج الخريجات' : 'Intégration des lauréates'}</h2>
              <p className="text-sm text-muted-foreground">{isAr ? 'تتبع الإدماج المهني للخريجات' : 'Suivi de l\'insertion professionnelle'}</p>
            </div>
          </div>
          <Button type="button" size="sm" onClick={handleAddLaureate} disabled={disabled} className="gap-1.5 shadow-sm">
            <Plus className="h-4 w-4" />
            {isAr ? 'إضافة' : 'Ajouter'}
          </Button>
        </div>

        {laureates.items.length === 0 ? (
          <div className="text-center py-8 text-sm text-muted-foreground border-2 border-dashed border-border rounded-xl bg-muted/30">
            {isAr ? 'لا توجد بيانات مسجلة' : 'Aucune donnée enregistrée pour les lauréates.'}
          </div>
        ) : (
          <div className="space-y-4 pt-2">
            {laureates.items.map((item, idx) => (
              <div key={item.local_id} className="border border-border rounded-xl p-4 bg-muted/10 space-y-4 relative group transition-colors hover:border-primary/30">
                
                {/* En-tête épuré */}
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-muted-foreground">#{idx + 1}</span>
                  <Button type="button" size="icon" variant="ghost" onClick={() => { laureates.remove(item.local_id); if(onActivity) onActivity(); }} disabled={disabled} className="h-8 w-8 text-destructive hover:bg-destructive/10">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                {/* Grille du contenu */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="space-y-1.5 sm:col-span-2 lg:col-span-3">
                    <Label className="text-xs font-semibold">{isAr ? 'نوع التكوين' : 'Type de formation'}</Label>
                    <Input 
                      placeholder={isAr ? 'مثال: الخياطة العصرية' : 'Ex: Couture moderne'} 
                      value={item.type_formation} 
                      onChange={e => { laureates.update(item.local_id, { type_formation: e.target.value }); if(onActivity) onActivity(); }}
                      disabled={disabled}
                      className="h-10"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">{isAr ? 'عدد الخريجات' : 'Nombre de lauréates'}</Label>
                    <NumericField label="" value={item.nombre_laureates} onChange={(v) => { laureates.update(item.local_id, { nombre_laureates: v }); if(onActivity) onActivity(); }} disabled={disabled} />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">{isAr ? 'عدد المدمجات' : 'Nombre d\'intégrées'}</Label>
                    <NumericField label="" value={item.nombre_integrees} onChange={(v) => { laureates.update(item.local_id, { nombre_integrees: v }); if(onActivity) onActivity(); }} disabled={disabled} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* ======================================================== */}
      {/* BLOC 2 : ACTIVITÉS GÉNÉRATRICES DE REVENUS (AGR)         */}
      {/* ======================================================== */}
      <Card className="p-5 sm:p-6 space-y-4 bg-card">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Store className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-bold">{isAr ? 'الأنشطة المدرة للدخل' : 'Activités Génératrices de Revenus'}</h2>
              <p className="text-sm text-muted-foreground">{isAr ? 'المشاريع والتعاونيات' : 'Projets et coopératives'}</p>
            </div>
          </div>
          <Button type="button" size="sm" onClick={handleAddAgr} disabled={disabled} className="gap-1.5 shadow-sm">
            <Plus className="h-4 w-4" />
            {isAr ? 'إضافة مشروع' : 'Ajouter un projet'}
          </Button>
        </div>

        {agrs.items.length === 0 ? (
          <div className="text-center py-8 text-sm text-muted-foreground border-2 border-dashed border-border rounded-xl bg-muted/30">
            {isAr ? 'لا توجد بيانات مسجلة' : 'Aucune donnée enregistrée pour les AGR.'}
          </div>
        ) : (
          <div className="space-y-4 pt-2">
            {agrs.items.map((item, idx) => (
              <div key={item.local_id} className="border border-border rounded-xl p-4 bg-muted/10 space-y-4 transition-colors hover:border-primary/30">
                
                {/* En-tête épuré */}
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-muted-foreground">#{idx + 1}</span>
                  <Button type="button" size="icon" variant="ghost" onClick={() => { agrs.remove(item.local_id); if(onActivity) onActivity(); }} disabled={disabled} className="h-8 w-8 text-destructive hover:bg-destructive/10">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                
                {/* Grille du contenu */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="space-y-1.5 sm:col-span-2 lg:col-span-3">
                    <Label className="text-xs font-semibold">{isAr ? 'المؤسسة' : 'Nom de l\'établissement'}</Label>
                    <Select disabled={disabled} value={item.etablissement_id} onValueChange={(v) => { agrs.update(item.local_id, { etablissement_id: v }); if(onActivity) onActivity(); }}>
                      <SelectTrigger className="h-10">
                         <SelectValue placeholder={isAr ? 'اختر المؤسسة' : 'Sélectionner l\'établissement'} />
                      </SelectTrigger>
                      <SelectContent>
                        {etablissementsFiltres.map(etab => (
                          <SelectItem key={etab.id} value={etab.id}>
                            {etab.nom}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">{isAr ? 'عدد المستفيدات' : 'Nombre de bénéficiaires'}</Label>
                    <NumericField label="" value={item.nombre_beneficiaires} onChange={(v) => { agrs.update(item.local_id, { nombre_beneficiaires: v }); if(onActivity) onActivity(); }} disabled={disabled} />
                  </div>

                  <div className="space-y-1.5 lg:col-span-2">
                    <Label className="text-xs font-semibold">{isAr ? 'الشركاء' : 'Partenaires'}</Label>
                    <Input 
                      placeholder={isAr ? 'مثال: الوكالة الوطنية لانعاش الشغل' : 'Ex: ANAPEC'} 
                      value={item.partenaires} 
                      onChange={e => { agrs.update(item.local_id, { partenaires: e.target.value }); if(onActivity) onActivity(); }}
                      disabled={disabled}
                      className="h-10"
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

Step2Insertion.displayName = 'Step2Insertion';