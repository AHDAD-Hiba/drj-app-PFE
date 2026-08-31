import { memo, useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { SafeInput } from '@/components/form/SafeInput';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Users, GraduationCap, Hammer, Briefcase, Building2, MapPin } from 'lucide-react';
import { StepComponentProps } from '@/config/wizard.types';
import { NumericField } from '@/components/form/NumericField';
import { supabase } from '@/integrations/supabase/client';

import { useAfEtablissements } from '@/hooks/common/useAfEtablissements';
import { useAuth } from '@/hooks/common/useAuth';
import { useRapportDirection } from '@/hooks/common/useRapport';

// Import des vrais hooks Supabase
import { 
  usePeDemographie, 
  usePeEducation, 
  usePeAteliers, 
  usePeFormation 
} from '@/hooks/ProtectionEnfance/usePeStep1';

export const Step1Education = memo(({ disabled, onActivity, rapportId }: StepComponentProps & { rapportId?: string | null }) => {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  const { utilisateur } = useAuth();
  const directionId = utilisateur?.direction_id;

  const { data: rapport} = useRapportDirection(rapportId);
  const effectiveDirectionId = rapport?.direction_id || directionId;

  const { items: etablissements, loading: loadingEtab } = useAfEtablissements(effectiveDirectionId);
  const centresProtection = etablissements.filter(e => e.type_etablissement === 'centre_protection_enfance');

  // Initialisation des Hooks
  const demHook = usePeDemographie(rapportId || null);
  const edHook = usePeEducation(rapportId || null);
  const atHook = usePeAteliers(rapportId || null);
  const foHook = usePeFormation(rapportId || null);

  const isDataLoading = loadingEtab || demHook.loading || edHook.loading || atHook.loading || foHook.loading;

  // État local pour les cartes
  const [centers, setCenters] = useState<{ local_id: string; etablissement_id: string }[]>([]);
  const [initialized, setInitialized] = useState(false);

  // Synchronisation initiale (Restaurer les centres existants depuis la BDD)
  useEffect(() => {
    if (!isDataLoading && !initialized && rapportId) {
      const uniqueIds = new Set<string>();
      demHook.items.forEach(i => { if (i.etablissement_id) uniqueIds.add(i.etablissement_id); });
      edHook.items.forEach(i => { if (i.etablissement_id) uniqueIds.add(i.etablissement_id); });
      atHook.items.forEach(i => { if (i.etablissement_id) uniqueIds.add(i.etablissement_id); });
      foHook.items.forEach(i => { if (i.etablissement_id) uniqueIds.add(i.etablissement_id); });

      const initialCenters = Array.from(uniqueIds).map(id => ({
        local_id: crypto.randomUUID(),
        etablissement_id: id
      }));
      setCenters(initialCenters);
      setInitialized(true);
    }
  }, [isDataLoading, initialized, rapportId, demHook.items, edHook.items, atHook.items, foHook.items]);

  // ==========================================================================
  // HANDLERS UNIFIÉS (Cartes Centres)
  // ==========================================================================
  const handleAddCentre = useCallback(() => {
    setCenters(prev => [...prev, { local_id: crypto.randomUUID(), etablissement_id: '' }]);
    if (onActivity) onActivity();
  }, [onActivity]);

  const handleRemoveCentre = useCallback((local_id: string, etablissement_id: string) => {
    setCenters(prev => prev.filter(c => c.local_id !== local_id));
    if (etablissement_id) {
      demHook.items.filter(i => i.etablissement_id === etablissement_id).forEach(i => void demHook.remove(i.local_id));
      edHook.items.filter(i => i.etablissement_id === etablissement_id).forEach(i => void edHook.remove(i.local_id));
      atHook.items.filter(i => i.etablissement_id === etablissement_id).forEach(i => void atHook.remove(i.local_id));
      foHook.items.filter(i => i.etablissement_id === etablissement_id).forEach(i => void foHook.remove(i.local_id));
    }
    if (onActivity) onActivity();
  }, [demHook, edHook, atHook, foHook, onActivity]);

  const handleUpdateEtablissement = useCallback((local_id: string, old_etab_id: string, new_etab_id: string) => {
    setCenters(prev => prev.map(c => c.local_id === local_id ? { ...c, etablissement_id: new_etab_id } : c));
    if (old_etab_id) {
      demHook.items.filter(i => i.etablissement_id === old_etab_id).forEach(i => void demHook.update(i.local_id, { etablissement_id: new_etab_id }));
      edHook.items.filter(i => i.etablissement_id === old_etab_id).forEach(i => void edHook.update(i.local_id, { etablissement_id: new_etab_id }));
      atHook.items.filter(i => i.etablissement_id === old_etab_id).forEach(i => void atHook.update(i.local_id, { etablissement_id: new_etab_id }));
      foHook.items.filter(i => i.etablissement_id === old_etab_id).forEach(i => void foHook.update(i.local_id, { etablissement_id: new_etab_id }));
    }
    if (onActivity) onActivity();
  }, [demHook, edHook, atHook, foHook, onActivity]);

  const getAvailableEtablissements = useCallback((current_id: string) => {
    const selectedIds = centers.map(c => c.etablissement_id).filter(id => id !== '' && id !== current_id);
    return centresProtection.filter(e => !selectedIds.includes(e.id));
  }, [centresProtection, centers]);

  // ==========================================================================
  // UPSERT HANDLERS (Mise à jour ou création à la volée)
  // ==========================================================================
  
  // 1. Démographie Globale (etablissement_id = null)
  const globalDemEntry = demHook.items.find(i => !i.etablissement_id && i.type_prise_charge === 'centre_sauvegarde');
  const handleGlobalDemChange = (field: string, value: number) => {
    if (globalDemEntry) {
      void demHook.update(globalDemEntry.local_id, { [field]: value });
    } else {
      void demHook.add({ 
        local_id: crypto.randomUUID(), etablissement_id: null, type_prise_charge: 'centre_sauvegarde',
        garcons: 0, filles: 0, migrants_non_accompagnes: 0, changement_mesure: 0, taux_preparation_integration: 0,
        [field]: value 
      } as any);
    }
    if (onActivity) onActivity();
  };

  // 2. Démographie Centre (Changement de mesure)
  const handleCenterDemChange = (etablissement_id: string, value: number) => {
    const existing = demHook.items.find(i => i.etablissement_id === etablissement_id && i.type_prise_charge === 'centre_sauvegarde');
    if (existing) {
      void demHook.update(existing.local_id, { changement_mesure: value });
    } else {
      void demHook.add({ 
        local_id: crypto.randomUUID(), etablissement_id, type_prise_charge: 'centre_sauvegarde',
        garcons: 0, filles: 0, migrants_non_accompagnes: 0, changement_mesure: value, taux_preparation_integration: 0
      } as any);
    }
    if (onActivity) onActivity();
  };

  // 3. Éducation Centre
  const handleCenterEdChange = (etablissement_id: string, field: string, value: number) => {
    const existing = edHook.items.find(i => i.etablissement_id === etablissement_id);
    if (existing) {
      void edHook.update(existing.local_id, { [field]: value });
    } else {
      void edHook.add({ 
        local_id: crypto.randomUUID(), etablissement_id,
        beneficiaires_formel: 0, beneficiaires_non_formel: 0, beneficiaires_soutien: 0,
        [field]: value 
      } as any);
    }
    if (onActivity) onActivity();
  };

  // 4. Formation Centre
  const handleCenterFoChange = (etablissement_id: string, field: string, value: number) => {
    const existing = foHook.items.find(i => i.etablissement_id === etablissement_id);
    if (existing) {
      void foHook.update(existing.local_id, { [field]: value });
    } else {
      void foHook.add({ 
        local_id: crypto.randomUUID(), etablissement_id,
        beneficiaires_intra: 0, beneficiaires_extra: 0, beneficiaires_initiation: 0,
        [field]: value 
      } as any);
    }
    if (onActivity) onActivity();
  };

  return (
    <div className="space-y-8">
      
      {/* ========================================================================= */}
      {/* القسم الأول: الإحصائيات الإجمالية للمديرية */}
      {/* ========================================================================= */}
      <Card className="p-5 sm:p-6 bg-card border-border shadow-sm border-t-4 border-t-primary">
        <div className="flex items-center gap-3 border-b border-border pb-4 mb-5">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
            <MapPin className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-bold">
              {isAr ? 'الإحصائيات الإجمالية للمديرية' : 'Statistiques Globales de la Direction'}
            </h2>
            <p className="text-sm text-muted-foreground">
              {isAr ? 'تخص جميع مراكز حماية الطفولة التابعة للمديرية' : 'Aggrégation provinciale pour l\'ensemble des centres'}
            </p>
          </div>
        </div>

        {isDataLoading ? (
          <div className="text-center py-5 text-sm text-muted-foreground">{isAr ? 'جاري التحميل...' : 'Chargement...'}</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <NumericField 
              label={isAr ? 'إجمالي الذكور' : 'Total Garçons'} 
              value={globalDemEntry?.garcons || 0} onChange={(v) => handleGlobalDemChange('garcons', v)} disabled={disabled} 
            />
            <NumericField 
              label={isAr ? 'إجمالي الإناث' : 'Total Filles'} 
              value={globalDemEntry?.filles || 0} onChange={(v) => handleGlobalDemChange('filles', v)} disabled={disabled} 
            />
            <NumericField 
              label={isAr ? 'المهاجرين غير المرفقين' : 'Migrants non accompagnés'} 
              value={globalDemEntry?.migrants_non_accompagnes || 0} onChange={(v) => handleGlobalDemChange('migrants_non_accompagnes', v)} disabled={disabled} 
            />
            <NumericField 
              label={isAr ? 'نسبة الأطفال المهيئين للاندماج %' : 'Taux d\'intégration %'} 
              value={globalDemEntry?.taux_preparation_integration || 0} onChange={(v) => handleGlobalDemChange('taux_preparation_integration', v)} disabled={disabled} 
            />
          </div>
        )}
        <p className="text-xs text-muted-foreground mt-3">
          * {isAr ? 'ملاحظة: إحصائيات نظام الحرية المحروسة سيتم إدخالها في المرحلة 4 الخاصة بها.' : 'Note: Les statistiques de la Liberté Surveillée seront saisies dans l\'Étape 4.'}
        </p>
      </Card>


      {/* ========================================================================= */}
      {/* القسم الثاني: إحصائيات المراكز */}
      {/* ========================================================================= */}
      <Card className="p-5 sm:p-6 bg-card border-border shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-bold">
                {isAr ? 'إحصائيات مراكز حماية الطفولة' : 'Statistiques des Centres'}
              </h2>
              <p className="text-sm text-muted-foreground">
                {isAr ? 'تغيير التدبير، التمدرس، والتكوين المهني لكل مركز' : 'Changement de mesure, éducation et formation par centre'}
              </p>
            </div>
          </div>

          <Button 
            type="button" size="sm" onClick={handleAddCentre} 
            disabled={disabled || isDataLoading || centers.length >= centresProtection.length} 
            className="gap-1.5"
          >
            <Plus className="h-4 w-4" />
            {isAr ? 'إضافة مركز' : 'Ajouter un centre'}
          </Button>
        </div>

        {isDataLoading ? (
          <div className="text-center py-10 text-sm text-muted-foreground">{isAr ? 'جاري التحميل...' : 'Chargement...'}</div>
        ) : centers.length === 0 ? (
          <div className="text-center py-10 text-sm text-muted-foreground border-2 border-dashed border-border rounded-lg bg-muted/5 mt-4">
            {isAr ? 'لم يتم تسجيل أي مركز بعد. اضغط على "إضافة مركز" لإدخال بيانات التمدرس والورشات.' : 'Aucun centre enregistré. Cliquez sur "Ajouter un centre".'}
          </div>
        ) : (
          <div className="space-y-6 pt-4">
            {centers.map((center, idx) => {
              const availableEtabs = getAvailableEtablissements(center.etablissement_id);

              // Récupération des données spécifiques à ce centre
              const centerDem = demHook.items.find(i => i.etablissement_id === center.etablissement_id);
              const centerEd = edHook.items.find(i => i.etablissement_id === center.etablissement_id);
              const centerFo = foHook.items.find(i => i.etablissement_id === center.etablissement_id);
              const centerAteliers = atHook.items.filter(i => i.etablissement_id === center.etablissement_id);

              return (
                <div key={center.local_id} className="border border-border rounded-lg p-5 bg-card space-y-6 shadow-sm">
                  
                  {/* اختيار المركز */}
                  <div className="flex flex-col md:flex-row gap-4 items-start md:items-end border-b border-border pb-4">
                    <div className="space-y-1.5 flex-1">
                      <Label className="text-xs font-semibold">
                        {isAr ? `اسم المركز #${idx + 1}` : `Nom du centre #${idx + 1}`}
                      </Label>
                      <Select value={center.etablissement_id} disabled={disabled} onValueChange={(v) => handleUpdateEtablissement(center.local_id, center.etablissement_id, v)}>
                        <SelectTrigger className="h-10 bg-muted/50 border-primary/30">
                          <SelectValue placeholder={isAr ? 'اختر المركز...' : 'Choisir le centre...'} />
                        </SelectTrigger>
                        <SelectContent>
                          {availableEtabs.length === 0 && !center.etablissement_id ? (
                            <div className="p-2 text-sm text-muted-foreground text-center">
                              {isAr ? 'تمت إضافة جميع المراكز' : 'Tous les centres sont ajoutés'}
                            </div>
                          ) : (
                            centresProtection
                              .filter(e => availableEtabs.some(a => a.id === e.id) || e.id === center.etablissement_id)
                              .map(e => <SelectItem key={e.id} value={e.id}>{e.nom}</SelectItem>)
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button type="button" variant="outline" onClick={() => handleRemoveCentre(center.local_id, center.etablissement_id)} disabled={disabled} className="text-destructive border-destructive/30 hover:bg-destructive/10">
                      <Trash2 className="h-4 w-4 mr-2" />
                    </Button>
                  </div>

                  {center.etablissement_id ? (
                    <div className="space-y-8 pt-2">
                      
                      {/* SECTION 1: البروتوكول الترابي */}
                      <div className="space-y-4">
                        <Label className="text-sm font-bold flex items-center gap-1.5 text-primary">
                          <Users className="h-4 w-4" />
                          {isAr ? '1. تفعيل البروتوكول الترابي' : '1. Protocole Territorial'}
                        </Label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border border-border/60 p-4 rounded-lg bg-muted/5">
                          <div className="md:col-span-1">
                            <NumericField 
                              label={isAr ? 'عدد الأطفال في وضعية صعبة الذين تم تغيير تدبيرهم' : 'Enfants dont la mesure a été changée'} 
                              value={centerDem?.changement_mesure || 0} 
                              onChange={(v) => handleCenterDemChange(center.etablissement_id, v)} 
                              disabled={disabled} 
                            />
                          </div>
                        </div>
                      </div>

                      {/* SECTION 2: التعليم والتمدرس */}
                      <div className="space-y-4">
                        <Label className="text-sm font-bold flex items-center gap-1.5 text-primary">
                          <GraduationCap className="h-4 w-4" />
                          {isAr ? '2. التعليم والتمدرس' : '2. Éducation et Scolarité'}
                        </Label>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border border-border/60 p-4 rounded-lg bg-muted/5">
                          <NumericField label={isAr ? 'التعليم النظامي' : 'Formel'} value={centerEd?.beneficiaires_formel || 0} onChange={(v) => handleCenterEdChange(center.etablissement_id, 'beneficiaires_formel', v)} disabled={disabled} />
                          <NumericField label={isAr ? 'التعليم غير النظامي' : 'Non formel'} value={centerEd?.beneficiaires_non_formel || 0} onChange={(v) => handleCenterEdChange(center.etablissement_id, 'beneficiaires_non_formel', v)} disabled={disabled} />
                          <NumericField label={isAr ? 'الدعم الدراسي' : 'Soutien scolaire'} value={centerEd?.beneficiaires_soutien || 0} onChange={(v) => handleCenterEdChange(center.etablissement_id, 'beneficiaires_soutien', v)} disabled={disabled} />
                        </div>
                      </div>

                      {/* SECTION 3: الورشات المهنية */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm font-bold flex items-center gap-1.5 text-primary">
                            <Hammer className="h-4 w-4" />
                            {isAr ? '3. الورشات المهنية المحدثة' : '3. Ateliers créés'}
                          </Label>
                          <Button 
                            type="button" size="sm" variant="outline" 
                            onClick={() => { void atHook.add({ local_id: crypto.randomUUID(), etablissement_id: center.etablissement_id, nom_atelier: '', nombre: 0 }); if(onActivity) onActivity(); }} 
                            disabled={disabled} className="h-8 gap-1 text-xs"
                          >
                            <Plus className="h-3.5 w-3.5" /> {isAr ? 'إضافة ورشة' : 'Ajouter un atelier'}
                          </Button>
                        </div>
                        
                        {centerAteliers.length === 0 ? (
                          <div className="text-center py-4 text-xs text-muted-foreground border border-dashed border-border rounded-lg bg-muted/5">
                            {isAr ? 'لا توجد ورشات مسجلة' : 'Aucun atelier'}
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {centerAteliers.map((at) => (
                              <div key={at.local_id} className="flex items-center gap-3 border border-border p-2.5 rounded-lg bg-muted/10">
                                <div className="flex-1">
                                  <SafeInput 
                                    placeholder={isAr ? 'اسم الورشة (مثال: الحلاقة)' : 'Nom de l\'atelier'} 
                                    value={at.nom_atelier} 
                                    onValueChange={(value) => { void atHook.update(at.local_id, { nom_atelier: value }); if(onActivity) onActivity(); }} 
                                    disabled={disabled} className="h-9 bg-background text-xs" 
                                  />
                                </div>
                                <div className="w-28">
                                  <NumericField 
                                    label="" 
                                    value={at.nombre} 
                                    onChange={(v) => { void atHook.update(at.local_id, { nombre: v }); if(onActivity) onActivity(); }} 
                                    disabled={disabled} 
                                  />
                                </div>
                                <Button type="button" size="icon" variant="ghost" onClick={() => { void atHook.remove(at.local_id); if(onActivity) onActivity(); }} disabled={disabled} className="h-9 w-9 text-destructive hover:bg-destructive/10">
                                  <Trash2 className="h-4 w-4 mr-2" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* SECTION 4: التكوين المهني */}
                      <div className="space-y-4">
                        <Label className="text-sm font-bold flex items-center gap-1.5 text-primary">
                          <Briefcase className="h-4 w-4" />
                          {isAr ? '4. المستفيدون من التكوين أو التدريب' : '4. Bénéficiaires de la formation'}
                        </Label>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border border-border/60 p-4 rounded-lg bg-muted/5">
                          <NumericField label={isAr ? 'داخل المركز (Intra)' : 'Au sein du centre'} value={centerFo?.beneficiaires_intra || 0} onChange={(v) => handleCenterFoChange(center.etablissement_id, 'beneficiaires_intra', v)} disabled={disabled} />
                          <NumericField label={isAr ? 'خارج المركز (Extra/OFPPT)' : 'En dehors du centre'} value={centerFo?.beneficiaires_extra || 0} onChange={(v) => handleCenterFoChange(center.etablissement_id, 'beneficiaires_extra', v)} disabled={disabled} />
                          <NumericField label={isAr ? 'الاستئناس المهني' : 'Initiation professionnelle'} value={centerFo?.beneficiaires_initiation || 0} onChange={(v) => handleCenterFoChange(center.etablissement_id, 'beneficiaires_initiation', v)} disabled={disabled} />
                        </div>
                      </div>

                    </div>
                  ) : (
                    <div className="p-4 text-center text-sm text-muted-foreground bg-muted/10 rounded-lg border border-border/50">
                      {isAr ? 'يرجى اختيار المركز لإظهار الاستمارات' : 'Veuillez sélectionner un centre'}
                    </div>
                  )}

                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
});

Step1Education.displayName = 'Step1Education';