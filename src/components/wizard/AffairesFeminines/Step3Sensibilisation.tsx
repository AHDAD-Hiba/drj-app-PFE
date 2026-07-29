import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Megaphone, DoorOpen } from 'lucide-react';
import { NumericField } from '@/components/form/NumericField';
import { StepComponentProps } from '@/config/wizard.types';

// Import de nos hooks
import { useAfSensibilisations } from '@/hooks/AffairesFeminines/useAfSensibilisations';
import { useAfPortesOuvertes } from '@/hooks/AffairesFeminines/useAfPortesOuvertes';
import { useAfTypesActivite } from '@/hooks/AffairesFeminines/useAfTypesActivite';
import { useAfEtablissements } from '@/hooks/common/useAfEtablissements';

export const Step3Sensibilisation = memo(({ rapportId, disabled, onActivity }: StepComponentProps) => {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  // ==========================================
  // HOOKS DE PERSISTANCE (AUTO-SAVE)
  // ==========================================
  const sensibilisations = useAfSensibilisations(rapportId);
  const portesOuvertes = useAfPortesOuvertes(rapportId);

  // Chargement des référentiels
  const { items: typesActivite } = useAfTypesActivite();
  const { items: tousLesEtablissements } = useAfEtablissements();

  // Filtrage intelligent des établissements (exclure maisons de jeunes)
  const etablissementsFiltres = tousLesEtablissements.filter(
    e => e.type_etablissement === 'club_feminin' || e.type_etablissement === 'ofppt'
  );

  // ==========================================
  // ACTIONS SENSIBILISATION
  // ==========================================
  const handleAddSensibilisation = async () => {
    if (onActivity) await onActivity();
    await sensibilisations.add({ 
      local_id: crypto.randomUUID(), 
      type_activite_id: '', 
      lieu: '', 
      sujet: '', 
      date_activite: '', 
      partenaires: '', 
      benef_urbain: 0, 
      benef_rural: 0, 
      resultats_evaluation: '' 
    });
  };

  // ==========================================
  // ACTIONS PORTES OUVERTES
  // ==========================================
  const handleAddPortesOuvertes = async () => {
    if (onActivity) await onActivity();
    await portesOuvertes.add({ 
      local_id: crypto.randomUUID(), 
      etablissement_id: '', 
      type_activite_id: '', 
      contenu_activite: '', 
      nombre_beneficiaires: 0, 
      partenaires: '', 
      evaluation: '' 
    });
  };

  return (
    <div className="space-y-6">
      {/* ======================================================== */}
      {/* BLOC 1 : ACTIVITÉS DE SENSIBILISATION                    */}
      {/* ======================================================== */}
      <Card className="p-5 sm:p-6 space-y-4 bg-card">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Megaphone className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-bold">{isAr ? 'أنشطة التحسيس والتوعية' : 'Activités de sensibilisation'}</h2>
              <p className="text-sm text-muted-foreground">{isAr ? 'الندوات، الورشات والحملات التحسيسية' : 'Conférences, ateliers et campagnes'}</p>
            </div>
          </div>
          <Button type="button" size="sm" onClick={handleAddSensibilisation} disabled={disabled} className="gap-1.5 shadow-sm">
            <Plus className="h-4 w-4" />
            {isAr ? 'إضافة نشاط' : 'Ajouter une activité'}
          </Button>
        </div>

        {sensibilisations.items.length === 0 ? (
          <div className="text-center py-8 text-sm text-muted-foreground border-2 border-dashed border-border rounded-xl bg-muted/30">
            {isAr ? 'لا توجد أنشطة مسجلة' : 'Aucune activité de sensibilisation enregistrée.'}
          </div>
        ) : (
          <div className="space-y-4 pt-2">
            {sensibilisations.items.map((item, idx) => (
              <div key={item.local_id} className="border border-border rounded-xl p-4 bg-muted/10 space-y-4 relative group transition-colors hover:border-primary/30">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-muted-foreground">#{idx + 1}</span>
                  <Button
                    type="button" size="icon" variant="ghost"
                    onClick={() => { sensibilisations.remove(item.local_id); if(onActivity) onActivity(); }} disabled={disabled}
                    className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">{isAr ? 'نوع النشاط' : 'Type d\'activité'}</Label>
                    <Select disabled={disabled} value={item.type_activite_id} onValueChange={(v) => { sensibilisations.update(item.local_id, { type_activite_id: v }); if(onActivity) onActivity(); }}>
                      <SelectTrigger className="h-10"><SelectValue placeholder={isAr ? 'اختر النوع' : 'Sélectionner'} /></SelectTrigger>
                      <SelectContent>
                        {typesActivite.map(type => (
                          <SelectItem key={type.id} value={type.id}>{isAr ? type.nom_ar : (type.nom_fr || type.nom_ar)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">{isAr ? 'الموضوع' : 'Sujet'}</Label>
                    <Input value={item.sujet} onChange={e => { sensibilisations.update(item.local_id, { sujet: e.target.value }); if(onActivity) onActivity(); }} disabled={disabled} className="h-10" />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">{isAr ? 'المكان' : 'Lieu'}</Label>
                    <Input value={item.lieu} onChange={e => { sensibilisations.update(item.local_id, { lieu: e.target.value }); if(onActivity) onActivity(); }} disabled={disabled} className="h-10" />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">{isAr ? 'التاريخ' : 'Date'}</Label>
                    <Input type="date" value={item.date_activite} onChange={e => { sensibilisations.update(item.local_id, { date_activite: e.target.value }); if(onActivity) onActivity(); }} disabled={disabled} className="h-10" />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">{isAr ? 'المستفيدين (حضري)' : 'Bénéficiaires (Urbain)'}</Label>
                    <NumericField label="" value={item.benef_urbain} onChange={(v) => { sensibilisations.update(item.local_id, { benef_urbain: v }); if(onActivity) onActivity(); }} disabled={disabled} />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">{isAr ? 'المستفيدين (قروي)' : 'Bénéficiaires (Rural)'}</Label>
                    <NumericField label="" value={item.benef_rural} onChange={(v) => { sensibilisations.update(item.local_id, { benef_rural: v }); if(onActivity) onActivity(); }} disabled={disabled} />
                  </div>

                  <div className="space-y-1.5 sm:col-span-2 lg:col-span-1">
                    <Label className="text-xs font-semibold">{isAr ? 'الشركاء' : 'Partenaires'}</Label>
                    <Input value={item.partenaires} onChange={e => { sensibilisations.update(item.local_id, { partenaires: e.target.value }); if(onActivity) onActivity(); }} disabled={disabled} className="h-10" />
                  </div>

                  <div className="space-y-1.5 sm:col-span-2 lg:col-span-2">
                    <Label className="text-xs font-semibold">{isAr ? 'النتائج / التقييم' : 'Résultats / Évaluation'}</Label>
                    <Input value={item.resultats_evaluation} onChange={e => { sensibilisations.update(item.local_id, { resultats_evaluation: e.target.value }); if(onActivity) onActivity(); }} disabled={disabled} className="h-10" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* ======================================================== */}
      {/* BLOC 2 : JOURNÉES PORTES OUVERTES                        */}
      {/* ======================================================== */}
      <Card className="p-5 sm:p-6 space-y-4 bg-card">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <DoorOpen className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-bold">{isAr ? 'الأبواب المفتوحة' : 'Journées Portes Ouvertes'}</h2>
              <p className="text-sm text-muted-foreground">{isAr ? 'أنشطة الإشعاع والتعريف بالمؤسسات' : 'Rayonnement et présentation des établissements'}</p>
            </div>
          </div>
          <Button type="button" size="sm" onClick={handleAddPortesOuvertes} disabled={disabled} className="gap-1.5 shadow-sm">
            <Plus className="h-4 w-4" />
            {isAr ? 'إضافة' : 'Ajouter'}
          </Button>
        </div>

        {portesOuvertes.items.length === 0 ? (
          <div className="text-center py-8 text-sm text-muted-foreground border-2 border-dashed border-border rounded-xl bg-muted/30">
            {isAr ? 'لا توجد بيانات مسجلة' : 'Aucune donnée enregistrée.'}
          </div>
        ) : (
          <div className="space-y-4 pt-2">
            {portesOuvertes.items.map((item, idx) => (
              <div key={item.local_id} className="border border-border rounded-xl p-4 bg-muted/10 space-y-4 transition-colors hover:border-primary/30">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-muted-foreground">#{idx + 1}</span>
                  <Button 
                    type="button" size="icon" variant="ghost" 
                    onClick={() => { portesOuvertes.remove(item.local_id); if(onActivity) onActivity(); }} disabled={disabled} 
                    className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="space-y-1.5 sm:col-span-2 lg:col-span-3">
                    <Label className="text-xs font-semibold">{isAr ? 'المؤسسة' : 'Nom de l\'établissement'}</Label>
                    <Select disabled={disabled} value={item.etablissement_id} onValueChange={(v) => { portesOuvertes.update(item.local_id, { etablissement_id: v }); if(onActivity) onActivity(); }}>
                      <SelectTrigger className="h-10">
                         <SelectValue placeholder={isAr ? 'اختر المؤسسة' : 'Sélectionner l\'établissement'} />
                      </SelectTrigger>
                      <SelectContent>
                        {etablissementsFiltres.map(etab => (
                          <SelectItem key={etab.id} value={etab.id}>{etab.nom}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">{isAr ? 'نوع النشاط' : 'Type d\'activité'}</Label>
                    <Select disabled={disabled} value={item.type_activite_id} onValueChange={(v) => { portesOuvertes.update(item.local_id, { type_activite_id: v }); if(onActivity) onActivity(); }}>
                      <SelectTrigger className="h-10"><SelectValue placeholder={isAr ? 'اختر النوع' : 'Sélectionner'} /></SelectTrigger>
                      <SelectContent>
                        {typesActivite.map(type => (
                          <SelectItem key={type.id} value={type.id}>{isAr ? type.nom_ar : (type.nom_fr || type.nom_ar)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5 lg:col-span-2">
                    <Label className="text-xs font-semibold">{isAr ? 'مضمون النشاط' : 'Contenu de l\'activité'}</Label>
                    <Input value={item.contenu_activite} onChange={e => { portesOuvertes.update(item.local_id, { contenu_activite: e.target.value }); if(onActivity) onActivity(); }} disabled={disabled} className="h-10" />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">{isAr ? 'عدد المستفيدين' : 'Nombre de bénéficiaires'}</Label>
                    <NumericField label="" value={item.nombre_beneficiaires} onChange={(v) => { portesOuvertes.update(item.local_id, { nombre_beneficiaires: v }); if(onActivity) onActivity(); }} disabled={disabled} />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">{isAr ? 'الشركاء' : 'Partenaires'}</Label>
                    <Input value={item.partenaires} onChange={e => { portesOuvertes.update(item.local_id, { partenaires: e.target.value }); if(onActivity) onActivity(); }} disabled={disabled} className="h-10" />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">{isAr ? 'التقييم' : 'Évaluation'}</Label>
                    <Input value={item.evaluation} onChange={e => { portesOuvertes.update(item.local_id, { evaluation: e.target.value }); if(onActivity) onActivity(); }} disabled={disabled} className="h-10" />
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

Step3Sensibilisation.displayName = 'Step3Sensibilisation';