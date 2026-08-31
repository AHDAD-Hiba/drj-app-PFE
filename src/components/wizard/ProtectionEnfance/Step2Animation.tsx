import { memo, useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { SafeInput } from '@/components/form/SafeInput';
import { SafeTextarea } from '@/components/form/SafeTextarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Palette, Mic, Gift, AlertTriangle, Building2, Globe, ShieldCheck } from 'lucide-react';
import { StepComponentProps } from '@/config/wizard.types';
import { NumericField } from '@/components/form/NumericField';

import { useAfEtablissements } from '@/hooks/common/useAfEtablissements';
import { useAuth } from '@/hooks/common/useAuth';
import { supabase } from '@/integrations/supabase/client'; 
import { useRapportDirection } from '@/hooks/common/useRapport';

import { 
  usePeActivites, 
  usePeConseilEnfant, 
  usePeDons, 
  usePeIncidents 
} from '@/hooks/ProtectionEnfance/usePeStep2';

export const Step2Animation = memo(({ disabled, onActivity, rapportId }: StepComponentProps & { rapportId?: string | null }) => {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const { utilisateur } = useAuth();
  const directionId = utilisateur?.direction_id;
  const { data: rapport} = useRapportDirection(rapportId);
  const effectiveDirectionId = rapport?.direction_id || directionId;

  const { items: etablissements, loading: loadingEtab } = useAfEtablissements(effectiveDirectionId);  
  const centresProtection = etablissements.filter(e => e.type_etablissement === 'centre_protection_enfance');
  const [centers, setCenters] = useState<{ local_id: string; etablissement_id: string }[]>([]);

  const [refDomaines, setRefDomaines] = useState<any[]>([]);
  const [refIncidents, setRefIncidents] = useState<any[]>([]);
  const centersRef = useRef<{ local_id: string; etablissement_id: string }[]>([]);

  useEffect(() => {
    const fetchRefs = async () => {
      const { data: domaines } = await supabase.from('ref_domaines_activite').select('*').order('ordre_affichage');
      if (domaines) setRefDomaines(domaines);

      const { data: incidents } = await supabase.from('ref_types_incident').select('*').order('ordre_affichage');
      if (incidents) setRefIncidents(incidents);
    };
    void fetchRefs();
  }, []);

  const { items: activites, add: addAct, update: updateAct, remove: removeAct } = usePeActivites(rapportId);
  const { items: conseils, add: addConseil, update: updateConseil, remove: removeConseil } = usePeConseilEnfant(rapportId);
  const { items: dons, add: addDon, update: updateDon, remove: removeDon } = usePeDons(rapportId);
  const { items: incidents, add: addIncident, update: updateIncident, remove: removeIncident } = usePeIncidents(rapportId);

  useEffect(() => {
    const allEtabIds = new Set<string>();

    activites.forEach(a => { if (a.etablissement_id) allEtabIds.add(a.etablissement_id); });
    conseils.forEach(c => { if (c.etablissement_id) allEtabIds.add(c.etablissement_id); });
    dons.forEach(d => { if (d.etablissement_id) allEtabIds.add(d.etablissement_id); });

    const currentCenterIds = new Set(centersRef.current.map(c => c.etablissement_id).filter(Boolean));
    const missingIds = Array.from(allEtabIds).filter(id => !currentCenterIds.has(id));

    if (missingIds.length > 0) {
      const newCenters = missingIds.map(id => ({
        local_id: crypto.randomUUID(),
        etablissement_id: id
      }));
      setCenters(prev => {
        centersRef.current = [...prev, ...newCenters];
        return centersRef.current;
      });
    }
  }, [activites, conseils, dons]);

  useEffect(() => {
    centersRef.current = centers;
  }, [centers]);

  // IDs spécifiques des domaines pour filtrer
  const droitsEnfantDomaineObj = refDomaines.find(d => d.code === 'DROITS_ENFANT');
  const droitsEnfantDomaineId = droitsEnfantDomaineObj?.id || '';

  // 🔍 FILTRAGE DES ACTIVITÉS GLOBALES
  // 1. Activités Générales (exclut Droits de l'Enfant)
  const globalActivitesGenerales = activites.filter(
    a => !a.etablissement_id && a.domaine_id !== droitsEnfantDomaineId
  );

  // 2. Activités Droits de l'Enfant
  const globalActivitesDroitsEnfant = activites.filter(
    a => !a.etablissement_id && a.domaine_id === droitsEnfantDomaineId
  );

  const getCenterActivites = (etabId: string) => activites.filter(a => a.etablissement_id === etabId);

  // Handler pour ajouter une activité générale
  const handleAddGlobalActivite = useCallback(() => {
    addAct({ local_id: crypto.randomUUID(), etablissement_id: null, domaine_id: '', nom_activite: '', nombre_beneficiaires: 0 });
    if (onActivity) void onActivity();
  }, [addAct, onActivity]);

  // Handler pour ajouter une activité Droits de l'Enfant
  const handleAddDroitsEnfantActivite = useCallback(() => {
    addAct({ 
      local_id: crypto.randomUUID(), 
      etablissement_id: null, 
      domaine_id: droitsEnfantDomaineId, // ID pré-sélectionné automatiquement
      nom_activite: '', 
      nombre_beneficiaires: 0,
      partenaires: '' 
    });
    if (onActivity) void onActivity();
  }, [addAct, onActivity, droitsEnfantDomaineId]);

  const handleAddCenterActivite = useCallback((etabId: string) => {
    const compVieId = refDomaines.find(d => d.code === 'COMPETENCES_VIE')?.id || '';
    addAct({ local_id: crypto.randomUUID(), etablissement_id: etabId, domaine_id: compVieId, nom_activite: '', nombre_beneficiaires: 0 });
    if (onActivity) void onActivity();
  }, [addAct, onActivity, refDomaines]);

  const handleAddData = useCallback((addFn: Function, etabId: string, initialData = {}) => {
    addFn({ local_id: crypto.randomUUID(), etablissement_id: etabId, ...initialData });
    if (onActivity) void onActivity();
  }, [onActivity]);

  const handleAddGlobalIncident = useCallback(() => {
    addIncident({ local_id: crypto.randomUUID(), type_incident_id: '', type_incident_autre: '', sujet_detaille: '', nombre_cas: 0, observations: '' });
    if (onActivity) void onActivity();
  }, [addIncident, onActivity]);

  const handleAddCentre = useCallback(() => {
    setCenters(prev => [...prev, { local_id: crypto.randomUUID(), etablissement_id: '' }]);
    if (onActivity) void onActivity();
  }, [onActivity]);

  const handleRemoveCentre = useCallback((local_id: string) => {
    setCenters(prev => prev.filter(c => c.local_id !== local_id));
    if (onActivity) void onActivity();
  }, [onActivity]);

  const handleUpdateEtablissement = useCallback((local_id: string, new_etab_id: string) => {
    setCenters(prev => prev.map(c => c.local_id === local_id ? { ...c, etablissement_id: new_etab_id } : c));
    if (onActivity) void onActivity();
  }, [onActivity]);

  const getAvailableEtablissements = useCallback((current_id: string) => {
    const selectedIds = centers.map(c => c.etablissement_id).filter(id => id !== '' && id !== current_id);
    return centresProtection.filter(e => !selectedIds.includes(e.id));
  }, [centresProtection, centers]);

  const domaineAutreId = refDomaines.find(d => d.code === 'AUTRE')?.id;
  const incidentAutreId = refIncidents.find(i => i.code === 'AUTRE')?.id;

  return (
    <div className="space-y-8">
      
      {/* ========================================================================= */}
      {/* SECTION GLOBALE 1 : الأنشطة الإقليمية المجمعة */}
      {/* ========================================================================= */}
      <Card className="p-5 sm:p-6 bg-card border-border shadow-sm border-t-4 border-t-primary space-y-8">
        
        {/* ------------------------------------------------------------------------- */}
        {/* SOUS-SECTION 1.1 : البرامج والأنشطة في مختلف المجالات */}
        {/* ------------------------------------------------------------------------- */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border pb-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Globe className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-bold">
                  {isAr ? 'إجمالي البرامج والأنشطة المنجزة في مختلف المجالات' : 'Activités Provinciales Globales'}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {isAr ? 'الترفيهية، الثقافية، الرياضية، التربية الصحية والنفسية...' : 'Activités transversales'}
                </p>
              </div>
            </div>
            <Button type="button" size="sm" onClick={handleAddGlobalActivite} disabled={disabled || refDomaines.length === 0} className="gap-1.5">
              <Plus className="h-4 w-4" />
              {isAr ? 'إضافة نشاط' : 'Ajouter une activité'}
            </Button>
          </div>

          <div className="space-y-3">
            {globalActivitesGenerales.map((act) => (
              <div key={act.local_id} className="grid grid-cols-1 md:grid-cols-12 gap-3 border border-border p-3 rounded-lg bg-muted/5 items-start">
                <div className="md:col-span-3 space-y-1.5">
                  <Label className="text-xs">{isAr ? 'المجال' : 'Domaine'}</Label>
                  <Select value={act.domaine_id} disabled={disabled} onValueChange={(v) => { updateAct(act.local_id, { domaine_id: v }); if(onActivity) void onActivity(); }}>
                    <SelectTrigger className="h-9 bg-background text-xs"><SelectValue placeholder={isAr ? 'اختر...' : 'Choisir...'} /></SelectTrigger>
                    <SelectContent>
                      {refDomaines
                        .filter(d => d.code !== 'COMPETENCES_VIE' && d.code !== 'DROITS_ENFANT')
                        .map(d => (
                          <SelectItem key={d.id} value={d.id}>
                            {isAr ? d.libelle_ar : d.libelle_fr}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  {act.domaine_id === domaineAutreId && (
                    <SafeInput placeholder={isAr ? 'يرجى التحديد...' : 'Préciser...'} value={act.domaine_autre || ''} onValueChange={(val) => { updateAct(act.local_id, { domaine_autre: val }); if(onActivity) void onActivity(); }} disabled={disabled} className="h-9 mt-2 text-xs bg-background" />
                  )}
                </div>
                <div className="md:col-span-6 space-y-1.5">
                  <Label className="text-xs">{isAr ? 'نوع النشاط' : 'Type d\'activité'}</Label>
                  <SafeInput value={act.nom_activite} onValueChange={(val) => { updateAct(act.local_id, { nom_activite: val }); if(onActivity) void onActivity(); }} disabled={disabled} className="h-9 bg-background text-xs" />
                </div>
                <div className="md:col-span-1">
                  <NumericField label={isAr ? 'المستفيدين' : 'Bénéficiaires'} value={act.nombre_beneficiaires} onChange={(v) => { updateAct(act.local_id, { nombre_beneficiaires: v }); if(onActivity) void onActivity(); }} disabled={disabled} />
                </div>
                <div className="md:col-span-1 flex justify-end mt-6">
                  <Button type="button" size="icon" variant="ghost" onClick={() => { removeAct(act.local_id); if(onActivity) void onActivity(); }} disabled={disabled} className="h-9 w-9 text-destructive hover:bg-destructive/10">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            {globalActivitesGenerales.length === 0 && <div className="text-center py-4 text-xs text-muted-foreground border border-dashed rounded-lg">{isAr ? 'لا توجد أنشطة إقليمية مسجلة' : 'Aucune activité globale'}</div>}
          </div>
        </div>

        {/* ------------------------------------------------------------------------- */}
        {/* SOUS-SECTION 1.2 : أنشطة وبرامج نشر ثقافة حقوق الطفل */}
        {/* ------------------------------------------------------------------------- */}
        <div className="space-y-4 pt-4 border-t border-border">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border pb-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
                <ShieldCheck className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-emerald-900 dark:text-emerald-400">
                  {isAr ? 'أنشطة وبرامج نشر ثقافة حقوق الطفل' : 'Activités de Promotion des Droits de l\'Enfant'}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {isAr ? 'عدد الأنشطة والبرامج التي تم تنفيذها لنشر ثقافة حقوق الطفل' : 'Sensibilisation aux droits de l\'enfant'}
                </p>
              </div>
            </div>
            <Button type="button" size="sm" onClick={handleAddDroitsEnfantActivite} disabled={disabled || !droitsEnfantDomaineId} className="gap-1.5">
              <Plus className="h-4 w-4" />
              {isAr ? 'إضافة نشاط حقوق الطفل' : 'Ajouter un activité Droits'}
            </Button>
          </div>

          <div className="space-y-3">
            {globalActivitesDroitsEnfant.map((act) => (
              <div key={act.local_id} className="grid grid-cols-1 md:grid-cols-12 gap-3 border border-border p-3 rounded-lg bg-muted/5 items-start">
                <div className="md:col-span-5 space-y-1.5">
                  <Label className="text-xs">{isAr ? 'نوع النشاط' : 'Type d\'activité'}</Label>
                  <SafeInput value={act.nom_activite} onValueChange={(val) => { updateAct(act.local_id, { nom_activite: val }); if(onActivity) void onActivity(); }} disabled={disabled} className="h-9 bg-background text-xs" placeholder={isAr ? 'مثال: ورشة تحسيسية حول حقوق الطفل...' : 'Ex: Atelier de sensibilisation...'} />
                </div>
                <div className="md:col-span-5 space-y-1.5">
                  <Label className="text-xs">{isAr ? 'الشركاء' : 'Partenaires'}</Label>
                  <SafeInput value={act.partenaires || ''} onValueChange={(val) => { updateAct(act.local_id, { partenaires: val }); if(onActivity) void onActivity(); }} disabled={disabled} className="h-9 bg-background text-xs" />
                </div>
                <div className="md:col-span-1">
                  <NumericField label={isAr ? 'المستفيدين' : 'Bénéficiaires'} value={act.nombre_beneficiaires} onChange={(v) => { updateAct(act.local_id, { nombre_beneficiaires: v }); if(onActivity) void onActivity(); }} disabled={disabled} />
                </div>
                <div className="md:col-span-1 flex justify-end mt-6">
                  <Button type="button" size="icon" variant="ghost" onClick={() => { removeAct(act.local_id); if(onActivity) void onActivity(); }} disabled={disabled} className="h-9 w-9 text-destructive hover:bg-destructive/10">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            {globalActivitesDroitsEnfant.length === 0 && <div className="text-center py-4 text-xs text-muted-foreground border border-dashed border-emerald-500/30 rounded-lg">{isAr ? 'لا توجد أنشطة حقوق الطفل مسجلة' : 'Aucune activité enregistrée'}</div>}
          </div>
        </div>

      </Card>

      {/* ========================================================================= */}
      {/* SECTION GLOBALE 2 : التقارير الاستثنائية */}
      {/* ========================================================================= */}
      <Card className="p-5 sm:p-6 bg-card border-border shadow-sm border-t-4 border-t-destructive">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border pb-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <h2 className="text-lg font-bold">
                {isAr ? 'التقارير الاستثنائية الإقليمية' : 'Rapports Exceptionnels Provinciaux'}
              </h2>
              <p className="text-sm text-muted-foreground">
                {isAr ? 'تقارير حول نقطة محددة عند الطلب' : 'Rapports ponctuels'}
              </p>
            </div>
          </div>
          <Button type="button" size="sm" variant="outline" onClick={handleAddGlobalIncident} disabled={disabled || refIncidents.length === 0} className="gap-1.5 border-destructive/50 text-destructive hover:bg-destructive/10">
            <Plus className="h-4 w-4" />
            {isAr ? 'إضافة تقرير' : 'Ajouter un incident'}
          </Button>
        </div>

        <div className="space-y-3">
          {incidents.map((inc) => (
            <div key={inc.local_id} className="grid grid-cols-1 md:grid-cols-12 gap-3 border border-destructive/20 p-3 rounded-lg bg-destructive/5 items-start">
              <div className="md:col-span-3 space-y-1.5">
                <Label className="text-xs">{isAr ? 'نوع الحادث' : 'Type incident'}</Label>
                <Select value={inc.type_incident_id} disabled={disabled} onValueChange={(v) => { updateIncident(inc.local_id, { type_incident_id: v }); if(onActivity) void onActivity(); }}>
                  <SelectTrigger className="h-9 bg-background text-xs"><SelectValue placeholder={isAr ? 'اختر...' : 'Choisir...'} /></SelectTrigger>
                  <SelectContent>
                    {refIncidents.map(r => <SelectItem key={r.id} value={r.id}>{isAr ? r.libelle_ar : r.libelle_fr}</SelectItem>)}
                  </SelectContent>
                </Select>
                {inc.type_incident_id === incidentAutreId && (
                  <SafeInput placeholder={isAr ? 'يرجى التحديد...' : 'Préciser...'} value={inc.type_incident_autre || ''} onValueChange={(val) => { updateIncident(inc.local_id, { type_incident_autre: val }); if(onActivity) void onActivity(); }} disabled={disabled} className="h-9 mt-2 text-xs bg-background" />
                )}
              </div>
              <div className="md:col-span-4 space-y-1.5">
                <Label className="text-xs">{isAr ? 'موضوع التقرير بالتفصيل' : 'Sujet détaillé'}</Label>
                <SafeTextarea value={inc.sujet_detaille} onValueChange={(val) => { updateIncident(inc.local_id, { sujet_detaille: val }); if(onActivity) void onActivity(); }} disabled={disabled} placeholder={isAr ? 'الموضوع بالتفصيل...' : 'Sujet détaillé...'} />
              </div>
              <div className="md:col-span-4 space-y-1.5">
                <Label className="text-xs">{isAr ? 'ملاحظات وتدخلات' : 'Observations'}</Label>
                <SafeTextarea value={inc.observations || ''} onValueChange={(val) => { updateIncident(inc.local_id, { observations: val }); if(onActivity) void onActivity(); }} disabled={disabled} placeholder={isAr ? 'ملاحظات...' : 'Observations...'} />
              </div>
              <div className="md:col-span-1 flex flex-col justify-between h-full">
                <NumericField label={isAr ? 'العدد' : 'Cas'} value={inc.nombre_cas} onChange={(v) => { updateIncident(inc.local_id, { nombre_cas: v }); if(onActivity) void onActivity(); }} disabled={disabled} />
                <Button type="button" size="icon" variant="ghost" onClick={() => { removeIncident(inc.local_id); if(onActivity) void onActivity(); }} disabled={disabled} className="h-9 w-9 text-destructive self-end mt-2">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
          {incidents.length === 0 && <div className="text-center py-4 text-xs text-muted-foreground border border-dashed border-destructive/30 rounded-lg">{isAr ? 'لا توجد تقارير مسجلة' : 'Aucun rapport enregistré'}</div>}
        </div>
      </Card>

      {/* ========================================================================= */}
      {/* SECTION CENTRES : أنشطة المراكز، مجلس الطفل، والهبات */}
      {/* ========================================================================= */}
      <Card className="p-5 sm:p-6 bg-card border-border shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-bold">
                {isAr ? 'التنشيط داخل المراكز' : 'Animation dans les Centres'}
              </h2>
              <p className="text-sm text-muted-foreground">
                {isAr ? 'المهارات الحياتية، مجلس الطفل، والهبات' : 'Compétences de vie, conseil de l\'enfant, dons'}
              </p>
            </div>
          </div>

          <Button 
            type="button" size="sm" onClick={handleAddCentre} 
            disabled={disabled || loadingEtab || centers.length >= centresProtection.length} 
            className="gap-1.5"
          >
            <Plus className="h-4 w-4" />
            {isAr ? 'إضافة مركز' : 'Ajouter un centre'}
          </Button>
        </div>

        {loadingEtab ? (
          <div className="text-center py-10 text-sm text-muted-foreground">{isAr ? 'جاري التحميل...' : 'Chargement...'}</div>
        ) : centers.length === 0 ? (
          <div className="text-center py-10 text-sm text-muted-foreground border-2 border-dashed border-border rounded-lg bg-muted/5 mt-4">
            {isAr ? 'لم يتم تسجيل أي مركز بعد. اضغط على "إضافة مركز" للبدء.' : 'Aucun centre enregistré.'}
          </div>
        ) : (
          <div className="space-y-6 pt-6">
            {centers.map((center, idx) => {
              const availableEtabs = getAvailableEtablissements(center.etablissement_id);
              const activitesDuCentre = getCenterActivites(center.etablissement_id);
              const conseilsDuCentre = conseils.filter(c => c.etablissement_id === center.etablissement_id);
              const donsDuCentre = dons.filter(d => d.etablissement_id === center.etablissement_id);

              return (
                <div key={center.local_id} className="border border-border rounded-lg p-5 bg-card space-y-8 shadow-sm">
                  
                  {/* HEADER DU CENTRE */}
                  <div className="flex flex-col md:flex-row gap-4 items-start md:items-end border-b border-border pb-4">
                    <div className="space-y-1.5 flex-1">
                      <Label className="text-xs font-semibold">
                        {isAr ? `اسم المركز #${idx + 1}` : `Nom du centre #${idx + 1}`}
                      </Label>
                      <Select value={center.etablissement_id} disabled={disabled} onValueChange={(v) => handleUpdateEtablissement(center.local_id, v)}>
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
                    <Button type="button" variant="outline" onClick={() => handleRemoveCentre(center.local_id)} disabled={disabled} className="text-destructive border-destructive/30 hover:bg-destructive/10">
                      <Trash2 className="h-4 w-4 mr-2" />
                      {isAr ? 'حذف المركز' : 'Supprimer'}
                    </Button>
                  </div>

                  {center.etablissement_id ? (
                    <div className="space-y-10 pt-2">
                      
                      {/* SECTION 1: برامج المهارات الحياتية */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm font-bold flex items-center gap-1.5 text-primary">
                            <Palette className="h-4 w-4" />
                            {isAr ? '1. برامج المهارات الحياتية' : '1. Programmes Compétences de vie'}
                          </Label>
                          <Button type="button" size="sm" variant="outline" onClick={() => handleAddCenterActivite(center.etablissement_id)} disabled={disabled || refDomaines.length === 0} className="h-8 gap-1 text-xs">
                            <Plus className="h-3.5 w-3.5" /> {isAr ? 'إضافة برنامج' : 'Ajouter un programme'}
                          </Button>
                        </div>
                        
                        <div className="space-y-3">
                          {activitesDuCentre.map((act) => (
                            <div key={act.local_id} className="grid grid-cols-1 md:grid-cols-12 gap-3 border border-border p-3 rounded-lg bg-muted/5 items-start">
                              <div className="md:col-span-3 space-y-1.5">
                                <Label className="text-xs text-muted-foreground">{isAr ? 'المجال' : 'Domaine'}</Label>
                                <SafeInput value={isAr ? 'المهارات الحياتية' : 'Compétences de vie'} disabled={true} className="h-9 bg-muted text-xs" />
                              </div>
                              <div className="md:col-span-5 space-y-1.5">
                                <Label className="text-xs">{isAr ? 'اسم البرنامج' : 'Nom du programme'}</Label>
                                <SafeInput value={act.nom_activite} onValueChange={(val) => { updateAct(act.local_id, { nom_activite: val }); if(onActivity) void onActivity(); }} disabled={disabled} className="h-9 bg-background text-xs" />
                              </div>
                              <div className="md:col-span-3">
                                <NumericField label={isAr ? 'المستفيدين' : 'Bénéficiaires'} value={act.nombre_beneficiaires} onChange={(v) => { updateAct(act.local_id, { nombre_beneficiaires: v }); if(onActivity) void onActivity(); }} disabled={disabled} />
                              </div>
                              <div className="md:col-span-1 flex justify-end mt-6">
                                <Button type="button" size="icon" variant="ghost" onClick={() => { removeAct(act.local_id); if(onActivity) void onActivity(); }} disabled={disabled} className="h-9 w-9 text-destructive hover:bg-destructive/10">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                          {activitesDuCentre.length === 0 && <div className="text-center py-4 text-xs text-muted-foreground border border-dashed rounded-lg">{isAr ? 'لا توجد برامج مسجلة' : 'Aucun programme'}</div>}
                        </div>
                      </div>

                      {/* SECTION 2: مجلس الطفل */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm font-bold flex items-center gap-1.5 text-primary">
                            <Mic className="h-4 w-4" />
                            {isAr ? '2. دورات مجلس الطفل' : '2. Sessions du Conseil'}
                          </Label>
                          <Button type="button" size="sm" variant="outline" onClick={() => handleAddData(addConseil, center.etablissement_id, { nom_session: '', date_session: '' })} disabled={disabled} className="h-8 gap-1 text-xs">
                            <Plus className="h-3.5 w-3.5" /> {isAr ? 'إضافة دورة' : 'Ajouter une session'}
                          </Button>
                        </div>
                        
                        <div className="space-y-3">
                          {conseilsDuCentre.map((cons) => (
                            <div key={cons.local_id} className="flex flex-col md:flex-row gap-3 border border-border p-3 rounded-lg bg-muted/5 items-center">
                              <div className="flex-1 w-full space-y-1.5">
                                <Label className="text-xs">{isAr ? 'اسم الدورة' : 'Nom de la session'}</Label>
                                <SafeInput value={cons.nom_session} onValueChange={(val) => { updateConseil(cons.local_id, { nom_session: val }); if(onActivity) void onActivity(); }} disabled={disabled} className="h-9 bg-background text-xs" />
                              </div>
                              <div className="flex-1 w-full space-y-1.5">
                                <Label className="text-xs">{isAr ? 'تاريخ الانعقاد' : 'Date de la session'}</Label>
                                <SafeInput type="date" value={cons.date_session} onValueChange={(val) => { updateConseil(cons.local_id, { date_session: val }); if(onActivity) void onActivity(); }} disabled={disabled} className="h-9 bg-background text-xs" />
                              </div>
                              <Button type="button" size="icon" variant="ghost" onClick={() => { removeConseil(cons.local_id); if(onActivity) void onActivity(); }} disabled={disabled} className="h-9 w-9 text-destructive mt-6 shrink-0">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* SECTION 3: الهبات والمساعدات */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm font-bold flex items-center gap-1.5 text-primary">
                            <Gift className="h-4 w-4" />
                            {isAr ? '3. الهبات والمساعدات' : '3. Dons et Aides'}
                          </Label>
                          <Button type="button" size="sm" variant="outline" onClick={() => handleAddData(addDon, center.etablissement_id, { donateur: '', nature_don: '', date_reception: '', beneficiaires: 0, observations: '' })} disabled={disabled} className="h-8 gap-1 text-xs">
                            <Plus className="h-3.5 w-3.5" /> {isAr ? 'إضافة هبة' : 'Ajouter un don'}
                          </Button>
                        </div>
                        
                        <div className="space-y-3">
                          {donsDuCentre.map((don) => (
                            <div key={don.local_id} className="grid grid-cols-1 md:grid-cols-12 gap-3 border border-border p-3 rounded-lg bg-muted/5 items-start">
                              <div className="md:col-span-3 space-y-1.5">
                                <Label className="text-xs">{isAr ? 'الجهة المانحة' : 'Donateur'}</Label>
                                <SafeInput value={don.donateur} onValueChange={(val) => { updateDon(don.local_id, { donateur: val }); if(onActivity) void onActivity(); }} disabled={disabled} className="h-9 bg-background text-xs" />
                              </div>
                              <div className="md:col-span-3 space-y-1.5">
                                <Label className="text-xs">{isAr ? 'نوع الهبة' : 'Nature du don'}</Label>
                                <SafeInput value={don.nature_don} onValueChange={(val) => { updateDon(don.local_id, { nature_don: val }); if(onActivity) void onActivity(); }} disabled={disabled} className="h-9 bg-background text-xs" />
                              </div>
                              <div className="md:col-span-3 space-y-1.5">
                                <Label className="text-xs">{isAr ? 'التاريخ' : 'Date'}</Label>
                                <SafeInput type="date" value={don.date_reception} onValueChange={(val) => { updateDon(don.local_id, { date_reception: val }); if(onActivity) void onActivity(); }} disabled={disabled} className="h-9 bg-background text-xs" />
                              </div>
                              <div className="md:col-span-2">
                                <NumericField label={isAr ? 'المستفيدين' : 'Bénéficiaires'} value={don.beneficiaires} onChange={(v) => { updateDon(don.local_id, { beneficiaires: v }); if(onActivity) void onActivity(); }} disabled={disabled} />
                              </div>
                              <div className="md:col-span-1 flex justify-end mt-6">
                                <Button type="button" size="icon" variant="ghost" onClick={() => { removeDon(don.local_id); if(onActivity) void onActivity(); }} disabled={disabled} className="h-9 w-9 text-destructive hover:bg-destructive/10">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                              
                              {/* Ligne 2 : Observations */}
                              <div className="md:col-span-12 space-y-1.5 pt-2 border-t border-border/50 mt-1">
                                <Label className="text-xs">{isAr ? 'ملاحظات' : 'Observations'}</Label>
                                <SafeTextarea 
                                  value={don.observations || ''} 
                                  onValueChange={(val) => { updateDon(don.local_id, { observations: val }); if(onActivity) void onActivity(); }} 
                                  disabled={disabled} 
                                  placeholder={isAr ? 'أضف ملاحظات (اختياري)...' : 'Ajouter des observations (optionnel)...'}
                                />
                              </div>
                            </div>
                          ))}
                          {donsDuCentre.length === 0 && <div className="text-center py-4 text-xs text-muted-foreground border border-dashed rounded-lg">{isAr ? 'لا توجد هبات مسجلة' : 'Aucun don enregistré'}</div>}
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

Step2Animation.displayName = 'Step2Animation';