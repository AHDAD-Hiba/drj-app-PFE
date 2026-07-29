import { memo, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Building2, Globe, Handshake, UsersRound, Wrench, Eye, Briefcase, GraduationCap } from 'lucide-react';
import { StepComponentProps } from '@/config/wizard.types';
import { NumericField } from '@/components/form/NumericField';

import { useAfEtablissements } from '@/hooks/common/useAfEtablissements';
import { useAuth } from '@/hooks/common/useAuth';

// ⚠️ استيراد الـ Hooks الحقيقية
import { 
  usePePartenariats, 
  usePeFormations, 
  usePeAmenagements, 
  usePeVisites 
} from '@/hooks/ProtectionEnfance/usePeStep3';

export const Step3Gestion = memo(({ disabled, onActivity, rapportId }: StepComponentProps & { rapportId?: string | null }) => {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  const { utilisateur } = useAuth();
  const directionId = utilisateur?.direction_id;

  const { items: etablissements, loading: loadingEtab } = useAfEtablissements(directionId);
  const centresProtection = etablissements.filter(e => e.type_etablissement === 'centre_protection_enfance');

  // استدعاء البيانات من قاعدة البيانات
  const { items: partenariats, add: addPart, update: updatePart, remove: removePart, loading: loadPart } = usePePartenariats(rapportId);
  const { items: formations, add: addForm, update: updateForm, remove: removeForm, loading: loadForm } = usePeFormations(rapportId);
  const { items: amenagements, add: addAmen, update: updateAmen, remove: removeAmen, loading: loadAmen } = usePeAmenagements(rapportId);
  const { items: visites, add: addVis, update: updateVis, remove: removeVis, loading: loadVis } = usePeVisites(rapportId);

  const isDataLoading = loadingEtab || loadPart || loadForm || loadAmen || loadVis;

  const [centers, setCenters] = useState<{ local_id: string; etablissement_id: string }[]>([]);

  // ==========================================================================
  // 🌟 مزامنة المراكز: إنشاء البطاقات للمراكز المحفوظة في قاعدة البيانات
  // ==========================================================================
  useEffect(() => {
    const allEtabIds = new Set<string>();
    
    amenagements.forEach(a => { if (a.etablissement_id) allEtabIds.add(a.etablissement_id); });
    visites.forEach(v => { if (v.etablissement_id) allEtabIds.add(v.etablissement_id); });
    formations.forEach(f => { if (f.etablissement_id && f.cible === 'admin_pedago_reinsertion') allEtabIds.add(f.etablissement_id); });

    const currentCenterIds = new Set(centers.map(c => c.etablissement_id).filter(Boolean));
    const missingIds = Array.from(allEtabIds).filter(id => !currentCenterIds.has(id));

    if (missingIds.length > 0) {
      const newCenters = missingIds.map(id => ({
        local_id: crypto.randomUUID(),
        etablissement_id: id
      }));
      setCenters(prev => [...prev, ...newCenters]);
    }
  }, [amenagements, visites, formations, centers]);

  // ==========================================================================
  // دوال الإضافة والتحديث (Handlers)
  // ==========================================================================

  // -- الشراكات الإقليمية --
  const handleAddPartenariat = (type: 'insertion_pro' | 'protection_enfance') => {
    addPart({ local_id: crypto.randomUUID(), etablissement_id: null, type_partenariat: type, nombre_conventions: 1, sujet: '', partenaires: '', nombre_projets_executes: 0, activites_realisees: '', observations: '' });
    if (onActivity) onActivity();
  };

  // -- التكوين الإقليمي (الجدول 13 و 17) --
  const handleAddFormation = (cible: 'cadres_centres' | 'delegues_ls') => {
    addForm({ local_id: crypto.randomUUID(), etablissement_id: null, cible, theme_formation: '', nombre_sessions: 1, nombre_beneficiaires: 0, partenaires: '' });
    if (onActivity) onActivity();
  };

  // -- التكوين المحلي داخل المركز (الجدول 4) --
  const handleUpdateFormationLocale = (etabId: string, beneficiaires: number) => {
    const existing = formations.find(f => f.etablissement_id === etabId && f.cible === 'admin_pedago_reinsertion');
    if (existing) {
      updateForm(existing.local_id, { nombre_beneficiaires: beneficiaires });
    } else {
      addForm({ local_id: crypto.randomUUID(), etablissement_id: etabId, cible: 'admin_pedago_reinsertion', theme_formation: 'آليات وتقنيات المواكبة وإعادة الإدماج', nombre_beneficiaires: beneficiaires, nombre_sessions: 1 });
    }
    if (onActivity) onActivity();
  };

  // -- التهيئة والتجهيز (المركز) --
  const handleUpdateAmenagement = (etabId: string, val: any) => {
    const existing = amenagements.find(a => a.etablissement_id === etabId);
    if (existing) {
      updateAmen(existing.local_id, val);
    } else {
      addAmen({ local_id: crypto.randomUUID(), etablissement_id: etabId, a_ete_rehabilite: false, a_ete_equipe: false, observations: '', ...val });
    }
    if (onActivity) onActivity();
  };

  // -- الزيارات (المركز) --
  const handleAddVisite = (etabId: string) => {
    addVis({ local_id: crypto.randomUUID(), etablissement_id: etabId, entite_visiteuse: '', date_visite: '', type_visite: '', objectifs: '', nombre_visiteurs: 1, observations: '' });
    if (onActivity) onActivity();
  };

  // -- إدارة بطاقات المراكز --
  const handleAddCentre = () => { 
    setCenters(prev => [...prev, { local_id: crypto.randomUUID(), etablissement_id: '' }]); 
    if (onActivity) onActivity(); 
  };

  const handleRemoveCentre = (local_id: string, etablissement_id: string) => { 
    setCenters(prev => prev.filter(c => c.local_id !== local_id)); 
    if (etablissement_id) {
      // حذف جميع بيانات المركز من قاعدة البيانات
      amenagements.filter(a => a.etablissement_id === etablissement_id).forEach(a => removeAmen(a.local_id));
      visites.filter(v => v.etablissement_id === etablissement_id).forEach(v => removeVis(v.local_id));
      formations.filter(f => f.etablissement_id === etablissement_id && f.cible === 'admin_pedago_reinsertion').forEach(f => removeForm(f.local_id));
    }
    if (onActivity) onActivity(); 
  };

  const handleUpdateEtablissement = (local_id: string, old_etab_id: string, new_etab_id: string) => { 
    setCenters(prev => prev.map(c => c.local_id === local_id ? { ...c, etablissement_id: new_etab_id } : c)); 
    if (old_etab_id) {
      // نقل البيانات للمركز الجديد
      amenagements.filter(a => a.etablissement_id === old_etab_id).forEach(a => updateAmen(a.local_id, { etablissement_id: new_etab_id }));
      visites.filter(v => v.etablissement_id === old_etab_id).forEach(v => updateVis(v.local_id, { etablissement_id: new_etab_id }));
      formations.filter(f => f.etablissement_id === old_etab_id && f.cible === 'admin_pedago_reinsertion').forEach(f => updateForm(f.local_id, { etablissement_id: new_etab_id }));
    }
    if (onActivity) onActivity(); 
  };

  const getAvailableEtablissements = (current_id: string) => {
    const selectedIds = centers.map(c => c.etablissement_id).filter(id => id !== '' && id !== current_id);
    return centresProtection.filter(e => !selectedIds.includes(e.id));
  };

  // فلاتر البيانات الإقليمية
  const partInsertion = partenariats.filter(p => p.type_partenariat === 'insertion_pro');
  const partProtection = partenariats.filter(p => p.type_partenariat === 'protection_enfance');
  const formCentres = formations.filter(f => f.cible === 'cadres_centres');
  const formLS = formations.filter(f => f.cible === 'delegues_ls');

  return (
    <div className="space-y-8">
      
      {/* ========================================================================= */}
      {/* SECTION GLOBALE : الشراكات وتكوين الأطر */}
      {/* ========================================================================= */}
      <Card className="p-5 sm:p-6 bg-card border-border shadow-sm border-t-4 border-t-primary">
        <div className="flex items-center gap-3 border-b border-border pb-4 mb-5">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Globe className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-bold">
              {isAr ? 'الشراكات الإقليمية وتأطير الموارد البشرية' : 'Partenariats et Encadrement RH'}
            </h2>
            <p className="text-sm text-muted-foreground">
              {isAr ? 'الاتفاقيات المبرمة ودورات التكوين الإقليمية' : 'Conventions conclues et formations provinciales'}
            </p>
          </div>
        </div>

        {isDataLoading ? (
          <div className="text-center py-5 text-sm text-muted-foreground">{isAr ? 'جاري التحميل...' : 'Chargement...'}</div>
        ) : (
          <div className="space-y-8">
            
            {/* 1. شراكات الإدماج السوسيو مهني (الجدول 18) */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-bold flex items-center gap-1.5 text-primary">
                  <Briefcase className="h-4 w-4" />
                  {isAr ? '1. شراكات الإدماج السوسيو مهني' : '1. Partenariats d\'insertion'}
                </Label>
                <Button type="button" size="sm" variant="outline" onClick={() => handleAddPartenariat('insertion_pro')} disabled={disabled} className="h-8 gap-1 text-xs">
                  <Plus className="h-3.5 w-3.5" /> {isAr ? 'إضافة شراكة' : 'Ajouter un partenariat'}
                </Button>
              </div>
              <div className="space-y-3">
                {partInsertion.map((part) => (
                  <div key={part.local_id} className="grid grid-cols-1 md:grid-cols-12 gap-3 border border-border p-3 rounded-lg bg-muted/5 items-start">
                    <div className="md:col-span-2">
                      <NumericField label={isAr ? 'عدد الشراكات' : 'Nombre'} value={part.nombre_conventions} onChange={(v) => { updatePart(part.local_id, { nombre_conventions: v }); if(onActivity) onActivity(); }} disabled={disabled} />
                    </div>
                    <div className="md:col-span-3 space-y-1.5">
                      <Label className="text-xs">{isAr ? 'الشركاء' : 'Partenaires'}</Label>
                      <Input value={part.partenaires} onChange={(e) => { updatePart(part.local_id, { partenaires: e.target.value }); if(onActivity) onActivity(); }} disabled={disabled} className="h-9 bg-background text-xs" />
                    </div>
                    <div className="md:col-span-3 space-y-1.5">
                      <Label className="text-xs">{isAr ? 'موضوع الشراكة' : 'Sujet du partenariat'}</Label>
                      <Input value={part.sujet} onChange={(e) => { updatePart(part.local_id, { sujet: e.target.value }); if(onActivity) onActivity(); }} disabled={disabled} className="h-9 bg-background text-xs" />
                    </div>
                    <div className="md:col-span-3 space-y-1.5">
                      <Label className="text-xs">{isAr ? 'ملاحظات' : 'Observations'}</Label>
                      <Input value={part.observations || ''} onChange={(e) => { updatePart(part.local_id, { observations: e.target.value }); if(onActivity) onActivity(); }} disabled={disabled} className="h-9 bg-background text-xs" />
                    </div>
                    <div className="md:col-span-1 flex justify-end mt-6">
                      <Button type="button" size="icon" variant="ghost" onClick={() => { removePart(part.local_id); if(onActivity) onActivity(); }} disabled={disabled} className="h-9 w-9 text-destructive hover:bg-destructive/10">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                {partInsertion.length === 0 && <div className="text-center py-4 text-xs text-muted-foreground border border-dashed rounded-lg">{isAr ? 'لا توجد شراكات مسجلة' : 'Aucun partenariat'}</div>}
              </div>
            </div>

            {/* 2. اتفاقيات حماية الطفولة (الجدول 19) */}
            <div className="space-y-4 pt-4 border-t border-border/50">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-bold flex items-center gap-1.5 text-primary">
                  <Handshake className="h-4 w-4" />
                  {isAr ? '2. اتفاقيات في مجال حماية الطفولة' : '2. Conventions Protection de l\'enfance'}
                </Label>
                <Button type="button" size="sm" variant="outline" onClick={() => handleAddPartenariat('protection_enfance')} disabled={disabled} className="h-8 gap-1 text-xs">
                  <Plus className="h-3.5 w-3.5" /> {isAr ? 'إضافة اتفاقية' : 'Ajouter une convention'}
                </Button>
              </div>
              <div className="space-y-3">
                {partProtection.map((part) => (
                  <div key={part.local_id} className="grid grid-cols-1 md:grid-cols-12 gap-3 border border-border p-3 rounded-lg bg-muted/5 items-start">
                    <div className="md:col-span-2">
                      <NumericField label={isAr ? 'عدد الاتفاقيات' : 'Nombre'} value={part.nombre_conventions} onChange={(v) => { updatePart(part.local_id, { nombre_conventions: v }); if(onActivity) onActivity(); }} disabled={disabled} />
                    </div>
                    <div className="md:col-span-4 space-y-1.5">
                      <Label className="text-xs">{isAr ? 'موضوع الاتفاقية' : 'Objet de la convention'}</Label>
                      <Input value={part.sujet} onChange={(e) => { updatePart(part.local_id, { sujet: e.target.value }); if(onActivity) onActivity(); }} disabled={disabled} className="h-9 bg-background text-xs" />
                    </div>
                    <div className="md:col-span-5 space-y-1.5">
                      <Label className="text-xs">{isAr ? 'الشركاء' : 'Partenaires'}</Label>
                      <Input value={part.partenaires} onChange={(e) => { updatePart(part.local_id, { partenaires: e.target.value }); if(onActivity) onActivity(); }} disabled={disabled} className="h-9 bg-background text-xs" />
                    </div>
                    <div className="md:col-span-1 flex justify-end mt-6">
                      <Button type="button" size="icon" variant="ghost" onClick={() => { removePart(part.local_id); if(onActivity) onActivity(); }} disabled={disabled} className="h-9 w-9 text-destructive hover:bg-destructive/10">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="md:col-span-3 pt-2 border-t border-border/50">
                      <NumericField label={isAr ? 'عدد المشاريع المنفذة' : 'Projets exécutés'} value={part.nombre_projets_executes} onChange={(v) => { updatePart(part.local_id, { nombre_projets_executes: v }); if(onActivity) onActivity(); }} disabled={disabled} />
                    </div>
                    <div className="md:col-span-5 space-y-1.5 pt-2 border-t border-border/50">
                      <Label className="text-xs">{isAr ? 'البرامج والأنشطة المنجزة' : 'Programmes et activités'}</Label>
                      <Input value={part.activites_realisees || ''} onChange={(e) => { updatePart(part.local_id, { activites_realisees: e.target.value }); if(onActivity) onActivity(); }} disabled={disabled} className="h-9 bg-background text-xs" />
                    </div>
                    <div className="md:col-span-4 space-y-1.5 pt-2 border-t border-border/50">
                      <Label className="text-xs">{isAr ? 'ملاحظات' : 'Observations'}</Label>
                      <Input value={part.observations || ''} onChange={(e) => { updatePart(part.local_id, { observations: e.target.value }); if(onActivity) onActivity(); }} disabled={disabled} className="h-9 bg-background text-xs" />
                    </div>
                  </div>
                ))}
                {partProtection.length === 0 && <div className="text-center py-4 text-xs text-muted-foreground border border-dashed rounded-lg">{isAr ? 'لا توجد اتفاقيات مسجلة' : 'Aucune convention'}</div>}
              </div>
            </div>

            {/* 3. تكوين أطر مراكز حماية الطفولة (الجدول 13) */}
            <div className="space-y-4 pt-4 border-t border-border/50">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-bold flex items-center gap-1.5 text-primary">
                  <GraduationCap className="h-4 w-4" />
                  {isAr ? '3. تكوين الأطر العاملة بمراكز حماية الطفولة' : '3. Formation des cadres (Centres)'}
                </Label>
                <Button type="button" size="sm" variant="outline" onClick={() => handleAddFormation('cadres_centres')} disabled={disabled} className="h-8 gap-1 text-xs">
                  <Plus className="h-3.5 w-3.5" /> {isAr ? 'إضافة دورة' : 'Ajouter une formation'}
                </Button>
              </div>
              
              <div className="space-y-3">
                {formCentres.map((form) => (
                  <div key={form.local_id} className="grid grid-cols-1 md:grid-cols-12 gap-3 border border-border p-3 rounded-lg bg-muted/5 items-start">
                    <div className="md:col-span-4 space-y-1.5">
                      <Label className="text-xs">{isAr ? 'نوع التكوين' : 'Type de formation'}</Label>
                      <Input value={form.theme_formation} onChange={(e) => { updateForm(form.local_id, { theme_formation: e.target.value }); if(onActivity) onActivity(); }} disabled={disabled} className="h-9 bg-background text-xs" />
                    </div>
                    <div className="md:col-span-3 space-y-1.5">
                      <Label className="text-xs">{isAr ? 'الشركاء' : 'Partenaires'}</Label>
                      <Input value={form.partenaires} onChange={(e) => { updateForm(form.local_id, { partenaires: e.target.value }); if(onActivity) onActivity(); }} disabled={disabled} className="h-9 bg-background text-xs" />
                    </div>
                    <div className="md:col-span-2">
                      <NumericField label={isAr ? 'عدد الدورات' : 'Sessions'} value={form.nombre_sessions} onChange={(v) => { updateForm(form.local_id, { nombre_sessions: v }); if(onActivity) onActivity(); }} disabled={disabled} />
                    </div>
                    <div className="md:col-span-2">
                      <NumericField label={isAr ? 'المستفيدين' : 'Bénéficiaires'} value={form.nombre_beneficiaires} onChange={(v) => { updateForm(form.local_id, { nombre_beneficiaires: v }); if(onActivity) onActivity(); }} disabled={disabled} />
                    </div>
                    <div className="md:col-span-1 flex justify-end mt-6">
                      <Button type="button" size="icon" variant="ghost" onClick={() => { removeForm(form.local_id); if(onActivity) onActivity(); }} disabled={disabled} className="h-9 w-9 text-destructive hover:bg-destructive/10">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                {formCentres.length === 0 && <div className="text-center py-4 text-xs text-muted-foreground border border-dashed rounded-lg">{isAr ? 'لا توجد دورات مسجلة' : 'Aucune formation'}</div>}
              </div>
            </div>

            {/* 4. تكوين مندوبي الحرية المحروسة (الجدول 17) */}
            <div className="space-y-4 pt-4 border-t border-border/50">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-bold flex items-center gap-1.5 text-primary">
                  <UsersRound className="h-4 w-4" />
                  {isAr ? '4. تكوين مندوبي الحرية المحروسة' : '4. Formation (Liberté Surveillée)'}
                </Label>
                <Button type="button" size="sm" variant="outline" onClick={() => handleAddFormation('delegues_ls')} disabled={disabled} className="h-8 gap-1 text-xs">
                  <Plus className="h-3.5 w-3.5" /> {isAr ? 'إضافة دورة' : 'Ajouter une formation'}
                </Button>
              </div>
              
              <div className="space-y-3">
                {formLS.map((form) => (
                  <div key={form.local_id} className="grid grid-cols-1 md:grid-cols-12 gap-3 border border-border p-3 rounded-lg bg-muted/5 items-start">
                    <div className="md:col-span-6 space-y-1.5">
                      <Label className="text-xs">{isAr ? 'نوع التكوين' : 'Type de formation'}</Label>
                      <Input value={form.theme_formation} onChange={(e) => { updateForm(form.local_id, { theme_formation: e.target.value }); if(onActivity) onActivity(); }} disabled={disabled} className="h-9 bg-background text-xs" />
                    </div>
                    <div className="md:col-span-2">
                      <NumericField label={isAr ? 'عدد الدورات' : 'Sessions'} value={form.nombre_sessions} onChange={(v) => { updateForm(form.local_id, { nombre_sessions: v }); if(onActivity) onActivity(); }} disabled={disabled} />
                    </div>
                    <div className="md:col-span-3">
                      <NumericField label={isAr ? 'المستفيدين' : 'Bénéficiaires'} value={form.nombre_beneficiaires} onChange={(v) => { updateForm(form.local_id, { nombre_beneficiaires: v }); if(onActivity) onActivity(); }} disabled={disabled} />
                    </div>
                    <div className="md:col-span-1 flex justify-end mt-6">
                      <Button type="button" size="icon" variant="ghost" onClick={() => { removeForm(form.local_id); if(onActivity) onActivity(); }} disabled={disabled} className="h-9 w-9 text-destructive hover:bg-destructive/10">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                {formLS.length === 0 && <div className="text-center py-4 text-xs text-muted-foreground border border-dashed rounded-lg">{isAr ? 'لا توجد دورات مسجلة' : 'Aucune formation'}</div>}
              </div>
            </div>

          </div>
        )}
      </Card>

      {/* ========================================================================= */}
      {/* SECTION CENTRES : التدبير، التجهيز والزيارات */}
      {/* ========================================================================= */}
      <Card className="p-5 sm:p-6 bg-card border-border shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-bold">
                {isAr ? 'التدبير داخل المراكز' : 'Gestion des Centres'}
              </h2>
              <p className="text-sm text-muted-foreground">
                {isAr ? 'التكوين المحلي، أشغال التهيئة، والزيارات الرسمية' : 'Formations locales, aménagement, et visites'}
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
            {isAr ? 'لم يتم تسجيل أي مركز بعد. اضغط على "إضافة مركز" للبدء.' : 'Aucun centre enregistré.'}
          </div>
        ) : (
          <div className="space-y-6 pt-6">
            {centers.map((center, idx) => {
              const availableEtabs = getAvailableEtablissements(center.etablissement_id);
              const amenCenter = amenagements.find(a => a.etablissement_id === center.etablissement_id) || { a_ete_rehabilite: false, a_ete_equipe: false, observations: '' };
              const visitesDuCentre = visites.filter(v => v.etablissement_id === center.etablissement_id);
              
              // البحث عن التكوين المحلي لهذا المركز (الجدول 4)
              const formLocaleCenter = formations.find(f => f.etablissement_id === center.etablissement_id && f.cible === 'admin_pedago_reinsertion') || { nombre_beneficiaires: 0 };

              return (
                <div key={center.local_id} className="border border-border rounded-lg p-5 bg-card space-y-8 shadow-sm">
                  
                  {/* HEADER DU CENTRE */}
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
                      {isAr ? 'حذف المركز' : 'Supprimer'}
                    </Button>
                  </div>

                  {center.etablissement_id ? (
                    <div className="space-y-10 pt-2">
                      
                      {/* 1. التكوين المحلي (الجدول 4) */}
                      <div className="space-y-4">
                        <Label className="text-sm font-bold flex items-center gap-1.5 text-primary">
                          <GraduationCap className="h-4 w-4" />
                          {isAr ? '1. الأطر المستفيدة من برامج التكوين حول آليات المواكبة وإعادة الإدماج' : '1. Cadres formés sur la réinsertion'}
                        </Label>
                        <div className="border border-border/60 p-4 rounded-lg bg-muted/5 w-full md:w-1/2">
                          <NumericField 
                            label={isAr ? 'عدد الأطر المستفيدة' : 'Nombre de cadres formés'} 
                            value={formLocaleCenter.nombre_beneficiaires} 
                            onChange={(v) => handleUpdateFormationLocale(center.etablissement_id, v)} 
                            disabled={disabled} 
                          />
                        </div>
                      </div>

                      {/* 2. التهيئة والتجهيز */}
                      <div className="space-y-4">
                        <Label className="text-sm font-bold flex items-center gap-1.5 text-primary">
                          <Wrench className="h-4 w-4" />
                          {isAr ? '2. أشغال التهيئة والتجهيز' : '2. Aménagement et Équipement'}
                        </Label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border border-border/60 p-4 rounded-lg bg-muted/5">
                          <div className="space-y-1.5">
                            <Label className="text-xs">{isAr ? 'هل تم تأهيل وإصلاح المركز؟' : 'Centre réhabilité ?'}</Label>
                            <Select value={amenCenter.a_ete_rehabilite ? 'true' : 'false'} disabled={disabled} onValueChange={(v) => handleUpdateAmenagement(center.etablissement_id, { a_ete_rehabilite: v === 'true' })}>
                              <SelectTrigger className="h-9 bg-background text-xs"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="true">{isAr ? 'نعم (تم التأهيل)' : 'Oui (Réhabilité)'}</SelectItem>
                                <SelectItem value="false">{isAr ? 'لا' : 'Non'}</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div className="space-y-1.5">
                            <Label className="text-xs">{isAr ? 'هل تم تجهيز المركز؟' : 'Centre équipé ?'}</Label>
                            <Select value={amenCenter.a_ete_equipe ? 'true' : 'false'} disabled={disabled} onValueChange={(v) => handleUpdateAmenagement(center.etablissement_id, { a_ete_equipe: v === 'true' })}>
                              <SelectTrigger className="h-9 bg-background text-xs"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="true">{isAr ? 'نعم (تم التجهيز)' : 'Oui (Équipé)'}</SelectItem>
                                <SelectItem value="false">{isAr ? 'لا' : 'Non'}</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div className="md:col-span-2 space-y-1.5 mt-2 pt-2 border-t border-border/50">
                            <Label className="text-xs">{isAr ? 'ملاحظات' : 'Observations'}</Label>
                            <Input value={amenCenter.observations || ''} onChange={(e) => handleUpdateAmenagement(center.etablissement_id, { observations: e.target.value })} disabled={disabled} className="h-9 bg-background text-xs" placeholder={isAr ? 'أضف ملاحظات...' : 'Ajouter des observations...'} />
                          </div>
                        </div>
                      </div>

                      {/* 3. الزيارات الرسمية */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm font-bold flex items-center gap-1.5 text-primary">
                            <Eye className="h-4 w-4" />
                            {isAr ? '3. تقارير عن زيارات المنظمات والمؤسسات' : '3. Visites Officielles'}
                          </Label>
                          <Button type="button" size="sm" variant="outline" onClick={() => handleAddVisite(center.etablissement_id)} disabled={disabled} className="h-8 gap-1 text-xs">
                            <Plus className="h-3.5 w-3.5" /> {isAr ? 'إضافة زيارة' : 'Ajouter une visite'}
                          </Button>
                        </div>
                        
                        <div className="space-y-3">
                          {visitesDuCentre.map((visite) => (
                            <div key={visite.local_id} className="grid grid-cols-1 md:grid-cols-12 gap-3 border border-border p-3 rounded-lg bg-muted/5 items-start">
                              <div className="md:col-span-3 space-y-1.5">
                                <Label className="text-xs">{isAr ? 'الجهة الزائرة' : 'Entité visiteuse'}</Label>
                                <Input value={visite.entite_visiteuse} onChange={(e) => { updateVis(visite.local_id, { entite_visiteuse: e.target.value }); if(onActivity) onActivity(); }} disabled={disabled} className="h-9 bg-background text-xs" />
                              </div>
                              <div className="md:col-span-3 space-y-1.5">
                                <Label className="text-xs">{isAr ? 'نوع الزيارة' : 'Type de visite'}</Label>
                                <Input value={visite.type_visite || ''} onChange={(e) => { updateVis(visite.local_id, { type_visite: e.target.value }); if(onActivity) onActivity(); }} disabled={disabled} className="h-9 bg-background text-xs" />
                              </div>
                              <div className="md:col-span-3 space-y-1.5">
                                <Label className="text-xs">{isAr ? 'تاريخ الزيارة' : 'Date de visite'}</Label>
                                <Input type="date" value={visite.date_visite} onChange={(e) => { updateVis(visite.local_id, { date_visite: e.target.value }); if(onActivity) onActivity(); }} disabled={disabled} className="h-9 bg-background text-xs" />
                              </div>
                              <div className="md:col-span-2">
                                <NumericField label={isAr ? 'عدد الزائرين' : 'Visiteurs'} value={visite.nombre_visiteurs} onChange={(v) => { updateVis(visite.local_id, { nombre_visiteurs: v }); if(onActivity) onActivity(); }} disabled={disabled} />
                              </div>
                              <div className="md:col-span-1 flex justify-end mt-6">
                                <Button type="button" size="icon" variant="ghost" onClick={() => { removeVis(visite.local_id); if(onActivity) onActivity(); }} disabled={disabled} className="h-9 w-9 text-destructive hover:bg-destructive/10">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                              <div className="md:col-span-6 space-y-1.5 pt-2 border-t border-border/50">
                                <Label className="text-xs">{isAr ? 'أهداف الزيارة' : 'Objectifs'}</Label>
                                <Input value={visite.objectifs || ''} onChange={(e) => { updateVis(visite.local_id, { objectifs: e.target.value }); if(onActivity) onActivity(); }} disabled={disabled} className="h-9 bg-background text-xs" />
                              </div>
                              <div className="md:col-span-6 space-y-1.5 pt-2 border-t border-border/50">
                                <Label className="text-xs">{isAr ? 'ملاحظات' : 'Observations'}</Label>
                                <Input value={visite.observations || ''} onChange={(e) => { updateVis(visite.local_id, { observations: e.target.value }); if(onActivity) onActivity(); }} disabled={disabled} className="h-9 bg-background text-xs" />
                              </div>
                            </div>
                          ))}
                          {visitesDuCentre.length === 0 && <div className="text-center py-4 text-xs text-muted-foreground border border-dashed rounded-lg">{isAr ? 'لا توجد زيارات مسجلة' : 'Aucune visite'}</div>}
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

Step3Gestion.displayName = 'Step3Gestion';