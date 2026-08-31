import { memo, useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { SafeInput } from '@/components/form/SafeInput';
import { SafeTextarea } from '@/components/form/SafeTextarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, FileCheck, Clock, Building } from 'lucide-react';
import { StepComponentProps } from '@/config/wizard.types';
import { NumericField } from '@/components/form/NumericField';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/common/useAuth';
import { useRapportDirection } from '@/hooks/common/useRapport';


import { 
  useCrDemandesLicences, 
  useCrTraitementLicences, 
  useDirCrechesPrivees 
} from '@/hooks/Creches/useCrStep1';

export const Step1Autorisations = memo(({ disabled, onActivity, rapportId }: StepComponentProps & { rapportId?: string | null }) => {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  const { utilisateur } = useAuth();
  const directionId = utilisateur?.direction_id;

  const [refTypesDemande, setRefTypesDemande] = useState<any[]>([]);
  const [refStatutsDemande, setRefStatutsDemande] = useState<any[]>([]);

  const { data: rapport} = useRapportDirection(rapportId);
  const effectiveDirectionId = rapport?.direction_id || directionId;

  useEffect(() => {
    const fetchRefs = async () => {
      const { data: types } = await supabase.from('ref_cr_types_demande').select('*').order('ordre_affichage');
      if (types) setRefTypesDemande(types);

      const { data: statuts } = await supabase.from('ref_cr_statuts_demande').select('*').order('ordre_affichage');
      if (statuts) setRefStatutsDemande(statuts);
    };
    void fetchRefs();
  }, []);


  const typeAutreId = refTypesDemande.find(t => t.code === 'AUTRE')?.id;
  const statutAutreId = refStatutsDemande.find(s => s.code === 'AUTRE')?.id;

  const { items: demandes, add: addDemande, update: updateDemande, remove: removeDemande } = useCrDemandesLicences(rapportId || null);
  const { items: traitements, add: addTraitement, update: updateTraitement } = useCrTraitementLicences(rapportId || null);
  
  const { items: creches, add: addCreche, update: updateCreche, remove: removeCreche } = useDirCrechesPrivees(effectiveDirectionId);

  const traitementEntry = traitements[0];

  // 3. دوال المعالجة (Handlers)
  const handleAddDemande = useCallback(() => {
    addDemande({
      local_id: crypto.randomUUID(),
      type_demande_id: '', type_demande_autre: '',
      statut_demande_id: '', statut_demande_autre: '',
      nombre_demandes: 1, observations: ''
    });
    if (onActivity) onActivity();
  }, [addDemande, onActivity]);

  const handleTraitementChange = useCallback((field: string, value: any) => {
    if (traitementEntry) {
      updateTraitement(traitementEntry.local_id, { [field]: value });
    } else {
      addTraitement({
        local_id: crypto.randomUUID(),
        nombre_demandes_traitees: 0, delai_moyen_traitement_jours: 0, observations: '',
        [field]: value
      } as any);
    }
    if (onActivity) onActivity();
  }, [addTraitement, onActivity, traitementEntry, updateTraitement]);

  const handleAddCreche = useCallback(() => {
    if (!effectiveDirectionId) return;
    addCreche({
      local_id: crypto.randomUUID(),
      direction_id: effectiveDirectionId, // 🆕 استخدام المعرف الصحيح عند الإضافة
      nom_creche: '', capacite: 0,
      type_autorisation: '', date_autorisation: '', observations: ''
    });
    if (onActivity) onActivity();
  }, [addCreche, effectiveDirectionId, onActivity]);

  return (
    <div className="space-y-8">
      
      {/* ========================================================================= */}
      {/* SECTION 1 : Demandes de licences (Tableau 1) */}
      {/* ========================================================================= */}
      <Card className="p-5 sm:p-6 bg-card border-border shadow-sm border-t-4 border-t-primary">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border pb-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <FileCheck className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-bold">
                {isAr ? '1. طلبات الترخيص لفتح وتسيير دور الحضانة الخاصة' : '1. Demandes de Licences'}
              </h2>
              <p className="text-sm text-muted-foreground">
                {isAr ? 'متابعة الطلبات الجديدة، التجديد، والتحويل' : 'Suivi des demandes d\'ouverture, renouvellement et modification'}
              </p>
            </div>
          </div>

          <Button type="button" size="sm" onClick={handleAddDemande} disabled={disabled || refTypesDemande.length === 0} className="gap-1.5">
            <Plus className="h-4 w-4" />
            {isAr ? 'إضافة طلب' : 'Ajouter une demande'}
          </Button>
        </div>

        <div className="space-y-3">
          {demandes.map((dem) => (
            <div key={dem.local_id} className="grid grid-cols-1 md:grid-cols-12 gap-3 border border-border p-3 rounded-lg bg-muted/5 items-start">
              
              {/* Type de demande */}
              <div className="md:col-span-3 space-y-1.5">
                <Label className="text-xs">{isAr ? 'نوع الطلب' : 'Type de demande'}</Label>
                <Select value={dem.type_demande_id} disabled={disabled} onValueChange={(v) => { updateDemande(dem.local_id, { type_demande_id: v }); if(onActivity) onActivity(); }}>
                  <SelectTrigger className="h-9 bg-background text-xs"><SelectValue placeholder={isAr ? 'اختر...' : 'Choisir...'} /></SelectTrigger>
                  <SelectContent>
                    {refTypesDemande.map(t => (
                      <SelectItem key={t.id} value={t.id}>{isAr ? t.libelle_ar : t.libelle_fr}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {dem.type_demande_id === typeAutreId && (
                  <SafeInput placeholder={isAr ? 'تحديد نوع الطلب...' : 'Préciser...'} value={dem.type_demande_autre || ''} onValueChange={(value) => { updateDemande(dem.local_id, { type_demande_autre: value }); if(onActivity) onActivity(); }} disabled={disabled} className="h-9 mt-1.5 text-xs bg-background border-primary/50" />
                )}
              </div>

              {/* Statut du dossier */}
              <div className="md:col-span-3 space-y-1.5">
                <Label className="text-xs">{isAr ? 'وضعية الملف' : 'Statut de l\'étude'}</Label>
                <Select value={dem.statut_demande_id} disabled={disabled} onValueChange={(v) => { updateDemande(dem.local_id, { statut_demande_id: v }); if(onActivity) onActivity(); }}>
                  <SelectTrigger className="h-9 bg-background text-xs"><SelectValue placeholder={isAr ? 'اختر...' : 'Choisir...'} /></SelectTrigger>
                  <SelectContent>
                    {refStatutsDemande.map(s => (
                      <SelectItem key={s.id} value={s.id}>{isAr ? s.libelle_ar : s.libelle_fr}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {dem.statut_demande_id === statutAutreId && (
                  <SafeInput placeholder={isAr ? 'تحديد الوضعية...' : 'Préciser...'} value={dem.statut_demande_autre || ''} onValueChange={(value) => { updateDemande(dem.local_id, { statut_demande_autre: value }); if(onActivity) onActivity(); }} disabled={disabled} className="h-9 mt-1.5 text-xs bg-background border-primary/50" />
                )}
              </div>

              {/* Nombre */}
              <div className="md:col-span-2">
                <NumericField label={isAr ? 'عدد الطلبات' : 'Nombre'} value={dem.nombre_demandes} onChange={(v) => { updateDemande(dem.local_id, { nombre_demandes: v }); if(onActivity) onActivity(); }} disabled={disabled} />
              </div>

              {/* Observations */}
              <div className="md:col-span-3 space-y-1.5">
                <Label className="text-xs">{isAr ? 'ملاحظات' : 'Observations'}</Label>
                <SafeTextarea value={dem.observations || ''} 
                onValueChange={(value) => { updateDemande(dem.local_id, { observations: value }); 
                if(onActivity) onActivity(); }} 
                disabled={disabled} 
                className="h-9 bg-background text-xs" />
              </div>

              {/* Action */}
              <div className="md:col-span-1 flex justify-end mt-6">
                <Button type="button" size="icon" variant="ghost" onClick={() => { removeDemande(dem.local_id); if(onActivity) onActivity(); }} disabled={disabled} className="h-9 w-9 text-destructive hover:bg-destructive/10">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

            </div>
          ))}

          {demandes.length === 0 && (
            <div className="text-center py-6 text-xs text-muted-foreground border border-dashed rounded-lg">
              {isAr ? 'لا توجد طلبات مسجلة' : 'Aucune demande enregistrée'}
            </div>
          )}
        </div>
      </Card>

      {/* ========================================================================= */}
      {/* SECTION 2 : Traitement des licences (Tableau 2) */}
      {/* ========================================================================= */}
      <Card className="p-5 sm:p-6 bg-card border-border shadow-sm">
        <div className="flex items-center gap-3 border-b border-border pb-4 mb-5">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Clock className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-bold">
              {isAr ? '2. معدل مدة معالجة الطلبات' : '2. Délais de Traitement'}
            </h2>
            <p className="text-sm text-muted-foreground">
              {isAr ? 'إحصائيات حول سرعة معالجة الملفات بالمديرية' : 'Indicateurs de performance de traitement'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 border border-border/60 p-4 rounded-lg bg-muted/5 items-center">
          <div className="md:col-span-3">
            <NumericField 
              label={isAr ? 'الطلبات المعالجة' : 'Dossiers traités'} 
              value={traitementEntry?.nombre_demandes_traitees || 0} 
              onChange={(v) => handleTraitementChange('nombre_demandes_traitees', v)} 
              disabled={disabled} 
            />
          </div>
          <div className="md:col-span-4">
            <NumericField 
              label={isAr ? 'متوسط مدة المعالجة (بالأيام)' : 'Délai moyen (en jours)'} 
              value={traitementEntry?.delai_moyen_traitement_jours || 0} 
              onChange={(v) => handleTraitementChange('delai_moyen_traitement_jours', v)} 
              disabled={disabled} 
            />
          </div>
          <div className="md:col-span-5 space-y-1.5">
            <Label className="text-xs">{isAr ? 'توضيحات وملاحظات' : 'Remarques / Explications'}</Label>
            <SafeTextarea 
              value={traitementEntry?.observations || ''} 
              onValueChange={(value) => handleTraitementChange('observations', value)} 
              disabled={disabled} 
              className="h-9 bg-background text-xs" 
            />
          </div>
        </div>
      </Card>

      {/* ========================================================================= */}
      {/* SECTION 3 : Crèches privées (Tableau 10) -> S'enregistre dans le Répertoire de la Direction */}
      {/* ========================================================================= */}
      <Card className="p-5 sm:p-6 bg-card border-border shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border pb-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Building className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-bold">
                {isAr ? '3. سجل دور الحضانة الخاصة بالمديرية' : '3. Répertoire des Crèches Privées'}
              </h2>
              <p className="text-sm text-muted-foreground">
                {isAr ? 'لائحة المؤسسات الحاصلة على رخصة (يتم حفظها في سجل المديرية)' : 'Liste des établissements privés (Sauvegardé dans le répertoire provincial)'}
              </p>
            </div>
          </div>

          <Button type="button" size="sm" onClick={handleAddCreche} disabled={disabled || !effectiveDirectionId} className="gap-1.5">
            <Plus className="h-4 w-4" />
            {isAr ? 'إضافة دار حضانة' : 'Ajouter une crèche'}
          </Button>
        </div>

        <div className="space-y-3">
          {creches.map((cr) => (
            <div key={cr.local_id} className="grid grid-cols-1 md:grid-cols-12 gap-3 border border-border p-3 rounded-lg bg-muted/5 items-start">
              
              <div className="md:col-span-3 space-y-1.5">
                <Label className="text-xs">{isAr ? 'اسم دار الحضانة' : 'Nom de la crèche'}</Label>
                <SafeInput value={cr.nom_creche} onValueChange={(value) => { updateCreche(cr.local_id, { nom_creche: value }); if(onActivity) onActivity(); }} disabled={disabled} className="h-9 bg-background text-xs" />
              </div>

              <div className="md:col-span-2">
                <NumericField label={isAr ? 'الطاقة الاستيعابية' : 'Capacité'} value={cr.capacite} onChange={(v) => { updateCreche(cr.local_id, { capacite: v }); if(onActivity) onActivity(); }} disabled={disabled} />
              </div>

              <div className="md:col-span-3 space-y-1.5">
                <Label className="text-xs">{isAr ? 'نوع/رقم الرخصة' : 'Type / N° d\'autorisation'}</Label>
                <SafeInput value={cr.type_autorisation || ''} onValueChange={(value) => { updateCreche(cr.local_id, { type_autorisation: value }); if(onActivity) onActivity(); }} disabled={disabled} className="h-9 bg-background text-xs" />
              </div>

              <div className="md:col-span-3 space-y-1.5">
                <Label className="text-xs">{isAr ? 'تاريخ الرخصة' : 'Date d\'autorisation'}</Label>
                <SafeInput type="date" value={cr.date_autorisation || ''} onValueChange={(value) => { updateCreche(cr.local_id, { date_autorisation: value }); if(onActivity) onActivity(); }} disabled={disabled} className="h-9 bg-background text-xs" />
              </div>

              <div className="md:col-span-1 flex justify-end mt-6">
                <Button type="button" size="icon" variant="ghost" onClick={() => { removeCreche(cr.local_id); if(onActivity) onActivity(); }} disabled={disabled} className="h-9 w-9 text-destructive hover:bg-destructive/10">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="md:col-span-12 space-y-1.5 pt-2 border-t border-border/50">
                <Label className="text-xs">{isAr ? 'ملاحظات' : 'Observations'}</Label>
                <SafeTextarea value={cr.observations || ''} onValueChange={(value) => { updateCreche(cr.local_id, { observations: value }); if(onActivity) onActivity(); }} disabled={disabled} className="h-9 bg-background text-xs" />
              </div>

            </div>
          ))}

          {creches.length === 0 && (
            <div className="text-center py-6 text-xs text-muted-foreground border border-dashed rounded-lg">
              {isAr ? 'سجل دور الحضانة الخاصة فارغ' : 'Répertoire des crèches privées vide'}
            </div>
          )}
        </div>
      </Card>

    </div>
  );
});

Step1Autorisations.displayName = 'Step1Autorisations';