import { memo, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from '@/components/ui/select';
import { Plus, Trash2, Building, RefreshCw, Handshake, ShieldCheck, UserCheck, Award } from 'lucide-react';
import { StepComponentProps } from '@/config/wizard.types';
import { NumericField } from '@/components/form/NumericField';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/common/useAuth';

// Hooks locaux
import { useCrStatsInfrastructures, useCrMouvementsFermetures, useCrPartenariats, useCrControleCreches, useCrCadresAssermentes, useCrLabelQualite } from '@/hooks/Creches/useCrStep2';
// Récupérer la liste des crèches privées pour le contrôle
import { useDirCrechesPrivees } from '@/hooks/Creches/useCrStep1';

export const Step2Infrastructures = memo(({ disabled, onActivity, rapportId }: StepComponentProps & { rapportId?: string | null }) => {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const { utilisateur } = useAuth();

  // 1. Chargement des référentiels
  const [refStatutsCadre, setRefStatutsCadre] = useState<any[]>([]);
  const [etablissementsPublics, setEtablissementsPublics] = useState<any[]>([]);

  useEffect(() => {
    const fetchRefs = async () => {
      const { data: cadres } = await supabase.from('ref_cr_statuts_cadre').select('*').order('ordre_affichage');
      if (cadres) setRefStatutsCadre(cadres);

      if (utilisateur?.direction_id) {
        const { data: etablissements } = await supabase.from('etablissements')
          .select('id, nom_ar, nom_fr')
          .eq('direction_id', utilisateur.direction_id);
        if (etablissements) setEtablissementsPublics(etablissements);
      }
    };
    void fetchRefs();
  }, [utilisateur]);

  const statutCadreAutreId = refStatutsCadre.find(s => s.code === 'AUTRE')?.id;

  // 2. Initialisation des Hooks
  const { items: stats, add: addStat, update: updateStat } = useCrStatsInfrastructures(rapportId || null);
  const { items: mouvements, add: addMouvement, update: updateMouvement, remove: removeMouvement } = useCrMouvementsFermetures(rapportId || null);
  const { items: partenariats, add: addPartenariat, update: updatePartenariat, remove: removePartenariat } = useCrPartenariats(rapportId || null);
  const { items: controles, add: addControle, update: updateControle, remove: removeControle } = useCrControleCreches(rapportId || null);
  const { items: cadres, add: addCadre, update: updateCadre, remove: removeCadre } = useCrCadresAssermentes(rapportId || null);
  const { items: labels, add: addLabel, update: updateLabel, remove: removeLabel } = useCrLabelQualite(rapportId || null);
  
  // Liste des crèches privées de la direction
  const { items: crechesPrivees } = useDirCrechesPrivees(utilisateur?.direction_id);

  const statsEntry = stats[0];

  // 3. Handlers
  const handleStatsChange = (field: string, value: any) => {
    if (!rapportId) return;
    if (statsEntry) {
      updateStat(statsEntry.local_id, { [field]: value });
    } else {
      addStat({ local_id: crypto.randomUUID(), nombre_creches_creees: 0, nombre_creches_qualifiees: 0, nombre_creches_equipees: 0, observations: '', [field]: value } as any);
    }
    if (onActivity) onActivity();
  };

  const handleAddMouvement = () => {
    if (!rapportId) return;
    addMouvement({ local_id: crypto.randomUUID(), type_mouvement: 'fermeture', nombre_creches: 1, secteur: 'prive', raisons: '', observations: '' });
    if (onActivity) onActivity();
  };

  const handleAddPartenariat = () => {
    if (!rapportId) return;
    addPartenariat({ local_id: crypto.randomUUID(), partenaire: '', nombre_conventions: 1, objectif: '', evaluation_engagement: '', observations: '' });
    if (onActivity) onActivity();
  };

  const handleAddCadre = () => {
    if (!rapportId) return;
    addCadre({ local_id: crypto.randomUUID(), statut_cadre_id: '', statut_cadre_autre: '', nombre_cadres: 1, observations: '' });
    if (onActivity) onActivity();
  };

  return (
    <div className="space-y-8">

      {/* ========================================================================= */}
      {/* CARTE 1 : Statistiques Globales Infrastructures */}
      {/* ========================================================================= */}
      <Card className="p-5 sm:p-6 bg-card border-border shadow-sm border-t-4 border-t-primary">
        <div className="flex items-center gap-3 border-b border-border pb-4 mb-5">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Building className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-bold">{isAr ? '1. إحصائيات البنية التحتية' : '1. Statistiques Infrastructures'}</h2>
            <p className="text-sm text-muted-foreground">{isAr ? 'دور الحضانة المحدثة، المؤهلة والمجهزة' : 'Crèches créées, qualifiées et équipées'}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 border border-border p-4 rounded-lg bg-muted/5 items-start">
          <div className="md:col-span-4">
            <NumericField label={isAr ? 'المحدثة (التابعة للقطاع)' : 'Créées (Secteur public)'} value={statsEntry?.nombre_creches_creees || 0} onChange={(v) => handleStatsChange('nombre_creches_creees', v)} disabled={disabled} />
          </div>
          <div className="md:col-span-4">
            <NumericField label={isAr ? 'عدد الحضانات المؤهلة' : 'Crèches qualifiées'} value={statsEntry?.nombre_creches_qualifiees || 0} onChange={(v) => handleStatsChange('nombre_creches_qualifiees', v)} disabled={disabled} />
          </div>
          <div className="md:col-span-4">
            <NumericField label={isAr ? 'عدد الحضانات المجهزة' : 'Crèches équipées'} value={statsEntry?.nombre_creches_equipees || 0} onChange={(v) => handleStatsChange('nombre_creches_equipees', v)} disabled={disabled} />
          </div>
          <div className="md:col-span-12 space-y-1.5">
            <Label className="text-xs">{isAr ? 'ملاحظات' : 'Observations'}</Label>
            <Textarea value={statsEntry?.observations || ''} onChange={(e) => handleStatsChange('observations', e.target.value)} disabled={disabled} className="min-h-[80px] bg-background text-xs resize-none" />
          </div>
        </div>
      </Card>

      {/* ========================================================================= */}
      {/* CARTE 2 : Mouvements (Fermetures & Réouvertures) */}
      {/* ========================================================================= */}
      <Card className="p-5 sm:p-6 bg-card border-border shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between gap-4 border-b border-border pb-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <RefreshCw className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-bold">{isAr ? '2. حركية المؤسسات (الإغلاق وإعادة الفتح)' : '2. Mouvements des établissements'}</h2>
            </div>
          </div>
          <Button type="button" size="sm" onClick={handleAddMouvement} disabled={disabled || !rapportId} className="gap-1.5">
            <Plus className="h-4 w-4" /> {isAr ? 'إضافة حركة' : 'Ajouter un mouvement'}
          </Button>
        </div>

        <div className="space-y-3">
          {mouvements.map((mvt) => (
            <div key={mvt.local_id} className="grid grid-cols-1 md:grid-cols-12 gap-4 border border-border p-4 rounded-lg bg-muted/5 items-start">
              <div className="md:col-span-11 grid grid-cols-1 md:grid-cols-12 gap-4">
                
                <div className="md:col-span-4 space-y-1.5">
                  <Label className="text-xs">{isAr ? 'نوع الحركة' : 'Type de mouvement'}</Label>
                  <Select value={mvt.type_mouvement} disabled={disabled} onValueChange={(v) => { updateMouvement(mvt.local_id, { type_mouvement: v }); if(onActivity) onActivity(); }}>
                    <SelectTrigger className="h-9 text-xs bg-background"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fermeture">{isAr ? 'إغلاق' : 'Fermeture'}</SelectItem>
                      <SelectItem value="reouverture">{isAr ? 'إعادة فتح' : 'Réouverture'}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="md:col-span-4 space-y-1.5">
                  <Label className="text-xs">{isAr ? 'القطاع' : 'Secteur'}</Label>
                  <Select value={mvt.secteur} disabled={disabled} onValueChange={(v) => { updateMouvement(mvt.local_id, { secteur: v }); if(onActivity) onActivity(); }}>
                    <SelectTrigger className="h-9 text-xs bg-background"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="prive">{isAr ? 'خاص' : 'Privé'}</SelectItem>
                      <SelectItem value="public">{isAr ? 'عمومي / تابعة للقطاع' : 'Public'}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="md:col-span-4">
                  <NumericField label={isAr ? 'عدد الحضانات' : 'Nombre'} value={mvt.nombre_creches} onChange={(v) => { updateMouvement(mvt.local_id, { nombre_creches: v }); if(onActivity) onActivity(); }} disabled={disabled} />
                </div>

                <div className="md:col-span-6 space-y-1.5">
                  <Label className="text-xs">{isAr ? 'ذكر الأسباب' : 'Raisons'}</Label>
                  <Textarea value={mvt.raisons || ''} onChange={(e) => { updateMouvement(mvt.local_id, { raisons: e.target.value }); if(onActivity) onActivity(); }} disabled={disabled} className="min-h-[60px] text-xs bg-background" />
                </div>

                <div className="md:col-span-6 space-y-1.5">
                  <Label className="text-xs">{isAr ? 'ملاحظات' : 'Observations'}</Label>
                  <Textarea value={mvt.observations || ''} onChange={(e) => { updateMouvement(mvt.local_id, { observations: e.target.value }); if(onActivity) onActivity(); }} disabled={disabled} className="min-h-[60px] text-xs bg-background" />
                </div>

              </div>
              <div className="md:col-span-1 flex justify-end">
                <Button size="icon" variant="ghost" onClick={() => removeMouvement(mvt.local_id)} disabled={disabled} className="text-destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
          {mouvements.length === 0 && <div className="text-center py-4 text-xs text-muted-foreground border border-dashed rounded-lg">{isAr ? 'لا توجد حركات مسجلة' : 'Aucun enregistrement'}</div>}
        </div>
      </Card>

      {/* ========================================================================= */}
      {/* CARTE 3 : Partenariats & Conventions */}
      {/* ========================================================================= */}
      <Card className="p-5 sm:p-6 bg-card border-border shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between gap-4 border-b border-border pb-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Handshake className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-bold">{isAr ? '3. الاتفاقيات الموقعة وتقييم التزام الشركاء' : '3. Partenariats & Conventions'}</h2>
            </div>
          </div>
          <Button type="button" size="sm" onClick={handleAddPartenariat} disabled={disabled || !rapportId} className="gap-1.5">
            <Plus className="h-4 w-4" /> {isAr ? 'إضافة شراكة' : 'Ajouter un partenariat'}
          </Button>
        </div>

        <div className="space-y-3">
          {partenariats.map((part) => (
            <div key={part.local_id} className="grid grid-cols-1 md:grid-cols-12 gap-4 border border-border p-4 rounded-lg bg-muted/5 items-start">
              <div className="md:col-span-11 grid grid-cols-1 md:grid-cols-12 gap-4">
                
                <div className="md:col-span-5 space-y-1.5">
                  <Label className="text-xs">{isAr ? 'الشركاء' : 'Partenaires'}</Label>
                  <Input value={part.partenaire} onChange={(e) => { updatePartenariat(part.local_id, { partenaire: e.target.value }); if(onActivity) onActivity(); }} disabled={disabled} className="h-9 text-xs bg-background" />
                </div>

                <div className="md:col-span-3">
                  <NumericField label={isAr ? 'عدد الاتفاقيات' : 'Conventions'} value={part.nombre_conventions} onChange={(v) => { updatePartenariat(part.local_id, { nombre_conventions: v }); if(onActivity) onActivity(); }} disabled={disabled} />
                </div>

                <div className="md:col-span-4 space-y-1.5">
                  <Label className="text-xs">{isAr ? 'تقييم الالتزام' : 'Évaluation'}</Label>
                  <Select value={part.evaluation_engagement || ''} disabled={disabled} onValueChange={(v) => { updatePartenariat(part.local_id, { evaluation_engagement: v }); if(onActivity) onActivity(); }}>
                    <SelectTrigger className="h-9 text-xs bg-background"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">{isAr ? 'مفعلة' : 'Active'}</SelectItem>
                      <SelectItem value="realisee">{isAr ? 'منجزة' : 'Réalisée'}</SelectItem>
                      <SelectItem value="en_cours">{isAr ? 'في طور الإنجاز' : 'En cours'}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="md:col-span-6 space-y-1.5">
                  <Label className="text-xs">{isAr ? 'الهدف (تجهيز، تكوين...)' : 'Objectif'}</Label>
                  <Input value={part.objectif || ''} onChange={(e) => { updatePartenariat(part.local_id, { objectif: e.target.value }); if(onActivity) onActivity(); }} disabled={disabled} className="h-9 text-xs bg-background" />
                </div>

                <div className="md:col-span-6 space-y-1.5">
                  <Label className="text-xs">{isAr ? 'ملاحظات' : 'Observations'}</Label>
                  <Input value={part.observations || ''} onChange={(e) => { updatePartenariat(part.local_id, { observations: e.target.value }); if(onActivity) onActivity(); }} disabled={disabled} className="h-9 text-xs bg-background" />
                </div>

              </div>
              <div className="md:col-span-1 flex justify-end">
                <Button size="icon" variant="ghost" onClick={() => removePartenariat(part.local_id)} disabled={disabled} className="text-destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
          {partenariats.length === 0 && <div className="text-center py-4 text-xs text-muted-foreground border border-dashed rounded-lg">{isAr ? 'لا توجد شراكات' : 'Aucun partenariat'}</div>}
        </div>
      </Card>

      {/* ========================================================================= */}
      {/* CARTE 4 : Cadres Assermentés */}
      {/* ========================================================================= */}
      <Card className="p-5 sm:p-6 bg-card border-border shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between gap-4 border-b border-border pb-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <UserCheck className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-bold">{isAr ? '4. وضعية الأطر المحلفة' : '4. Cadres Assermentés'}</h2>
            </div>
          </div>
          <Button type="button" size="sm" onClick={handleAddCadre} disabled={disabled || !rapportId} className="gap-1.5">
            <Plus className="h-4 w-4" /> {isAr ? 'إضافة إطار' : 'Ajouter un cadre'}
          </Button>
        </div>

        <div className="space-y-3">
          {cadres.map((cadre) => (
            <div key={cadre.local_id} className="grid grid-cols-1 md:grid-cols-12 gap-4 border border-border p-4 rounded-lg bg-muted/5 items-start">
              <div className="md:col-span-11 grid grid-cols-1 md:grid-cols-12 gap-4">
                
                <div className="md:col-span-6 space-y-1.5">
                  <Label className="text-xs">{isAr ? 'الوضعية' : 'Statut'}</Label>
                  <Select value={cadre.statut_cadre_id} disabled={disabled} onValueChange={(v) => { updateCadre(cadre.local_id, { statut_cadre_id: v }); if(onActivity) onActivity(); }}>
                    <SelectTrigger className="h-9 text-xs bg-background"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {refStatutsCadre.map(s => (
                        <SelectItem key={s.id} value={s.id}>{isAr ? s.libelle_ar : s.libelle_fr}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {cadre.statut_cadre_id === statutCadreAutreId && (
                    <Input placeholder={isAr ? 'تحديد...' : 'Préciser...'} value={cadre.statut_cadre_autre || ''} onChange={(e) => { updateCadre(cadre.local_id, { statut_cadre_autre: e.target.value }); if(onActivity) onActivity(); }} disabled={disabled} className="h-9 mt-1.5 text-xs bg-background" />
                  )}
                </div>

                <div className="md:col-span-6">
                  <NumericField label={isAr ? 'عدد الأطر' : 'Nombre'} value={cadre.nombre_cadres} onChange={(v) => { updateCadre(cadre.local_id, { nombre_cadres: v }); if(onActivity) onActivity(); }} disabled={disabled} />
                </div>

                <div className="md:col-span-12 space-y-1.5">
                  <Label className="text-xs">{isAr ? 'ملاحظات' : 'Observations'}</Label>
                  <Input value={cadre.observations || ''} onChange={(e) => { updateCadre(cadre.local_id, { observations: e.target.value }); if(onActivity) onActivity(); }} disabled={disabled} className="h-9 text-xs bg-background" />
                </div>

              </div>
              <div className="md:col-span-1 flex justify-end">
                <Button size="icon" variant="ghost" onClick={() => removeCadre(cadre.local_id)} disabled={disabled} className="text-destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
          {cadres.length === 0 && <div className="text-center py-4 text-xs text-muted-foreground border border-dashed rounded-lg">{isAr ? 'لا توجد أطر مسجلة' : 'Aucun cadre'}</div>}
        </div>
      </Card>

    </div>
  );
});

Step2Infrastructures.displayName = 'Step2Infrastructures';