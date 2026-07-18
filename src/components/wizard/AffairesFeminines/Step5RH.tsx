import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Users, BookOpen } from 'lucide-react';
import { NumericField } from '@/components/form/NumericField';
import { StepComponentProps } from '@/config/wizard.types';

// Import de nos hooks
import { useAfRessourcesHumaines } from '@/hooks/AffairesFeminines/useAfRessourcesHumaines';
import { useAfFormationCadres } from '@/hooks/AffairesFeminines/useAfFormationCadres';
import { useAfEtablissements } from '@/hooks/AffairesFeminines/useAfEtablissements';

export const Step5RH = memo(({ rapportId, disabled, onActivity }: StepComponentProps) => {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  // ==========================================
  // HOOKS DE PERSISTANCE (AUTO-SAVE)
  // ==========================================
  const rh = useAfRessourcesHumaines(rapportId);
  const formations = useAfFormationCadres(rapportId);

  // Chargement des établissements filtrés (pas de maison de jeunes)
  const { items: tousLesEtablissements } = useAfEtablissements();
  const etablissementsFiltres = tousLesEtablissements.filter(
    e => e.type_etablissement === 'club_feminin' || e.type_etablissement === 'ofppt'
  );

  // ==========================================
  // ACTIONS RESSOURCES HUMAINES
  // ==========================================
  const handleAddRh = async () => {
    if (onActivity) await onActivity();
    await rh.add({ 
      local_id: crypto.randomUUID(), 
      etablissement_id: '', 
      type_rh: '', 
      profile: '', 
      mission: '', 
      nombre: 0, 
      observations: '' 
    });
  };

  // ==========================================
  // ACTIONS FORMATION DES CADRES
  // ==========================================
  const handleAddFormation = async () => {
    if (onActivity) await onActivity();
    await formations.add({ 
      local_id: crypto.randomUUID(), 
      nombre_cadres: 0, 
      domaine_formation: '', 
      duree_valeur: 0, 
      unite_duree: '', 
      observations: '' 
    });
  };

  return (
    <div className="space-y-6">
      {/* ======================================================== */}
      {/* BLOC 1 : RESSOURCES HUMAINES                             */}
      {/* ======================================================== */}
      <Card className="p-5 sm:p-6 space-y-4 bg-card">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-bold">{isAr ? 'الموارد البشرية' : 'Ressources Humaines'}</h2>
              <p className="text-sm text-muted-foreground">{isAr ? 'تتبع الأطر المتوفرة والخصاص لكل مؤسسة' : 'Suivi des cadres disponibles et des besoins par établissement'}</p>
            </div>
          </div>
          <Button type="button" size="sm" onClick={handleAddRh} disabled={disabled} className="gap-1.5 shadow-sm">
            <Plus className="h-4 w-4" />
            {isAr ? 'إضافة مورد بشري' : 'Ajouter une ressource'}
          </Button>
        </div>

        {rh.items.length === 0 ? (
          <div className="text-center py-8 text-sm text-muted-foreground border-2 border-dashed border-border rounded-xl bg-muted/30">
            {isAr ? 'لا توجد بيانات مسجلة' : 'Aucune donnée enregistrée pour les ressources humaines.'}
          </div>
        ) : (
          <div className="space-y-4 pt-2">
            {rh.items.map((item, idx) => (
              <div key={item.local_id} className="border border-border rounded-xl p-4 bg-muted/10 space-y-4 transition-colors hover:border-primary/30">
                
                {/* En-tête épuré */}
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-muted-foreground">#{idx + 1}</span>
                  <Button type="button" size="icon" variant="ghost" onClick={() => { rh.remove(item.local_id); if(onActivity) onActivity(); }} disabled={disabled} className="h-8 w-8 text-destructive hover:bg-destructive/10">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                {/* Grille principale */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-1">
                  
                  {/* Établissement */}
                  <div className="space-y-1.5 lg:col-span-2">
                    <Label className="text-xs font-semibold">{isAr ? 'المؤسسة' : 'Établissement'}</Label>
                    <Select disabled={disabled} value={item.etablissement_id} onValueChange={(v) => { rh.update(item.local_id, { etablissement_id: v }); if(onActivity) onActivity(); }}>
                      <SelectTrigger className="h-10"><SelectValue placeholder={isAr ? 'اختر المؤسسة' : 'Sélectionner l\'établissement'} /></SelectTrigger>
                      <SelectContent>
                        {etablissementsFiltres.map(etab => (
                          <SelectItem key={etab.id} value={etab.id}>{etab.nom}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Statut / Type RH */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">{isAr ? 'الوضعية' : 'Statut (Type RH)'}</Label>
                    <Select disabled={disabled} value={item.type_rh} onValueChange={(v) => { rh.update(item.local_id, { type_rh: v }); if(onActivity) onActivity(); }}>
                      <SelectTrigger className="h-10"><SelectValue placeholder={isAr ? 'اختر الوضعية' : 'Sélectionner'} /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="disponible">{isAr ? 'متوفر (الموارد الحالية)' : 'Disponible (Ressource actuelle)'}</SelectItem>
                        <SelectItem value="besoin">{isAr ? 'خصاص (حاجة)' : 'Besoin (Ressource manquante)'}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Profil / Fonction */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">{isAr ? 'الإطار / الوظيفة' : 'Profil / Fonction'}</Label>
                    <Input 
                      placeholder={isAr ? 'مثال: مدربة حلاقة، مديرة...' : 'Ex: Formatrice coiffure, Directrice...'} 
                      value={item.profile} 
                      onChange={e => { rh.update(item.local_id, { profile: e.target.value }); if(onActivity) onActivity(); }} 
                      disabled={disabled} 
                      className="h-10" 
                    />
                  </div>

                  {/* Mission / Filière */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-muted-foreground">{isAr ? 'المهمة / الشعبة (اختياري)' : 'Mission / Filière (Optionnel)'}</Label>
                    <Input placeholder={isAr ? 'مثال: تأطير شعبة الفصالة...' : 'Ex: Encadrement couture...'} value={item.mission} onChange={e => { rh.update(item.local_id, { mission: e.target.value }); if(onActivity) onActivity(); }} disabled={disabled} className="h-10" />
                  </div>

                  {/* Nombre */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">{isAr ? 'العدد' : 'Nombre'}</Label>
                    <NumericField label="" value={item.nombre} onChange={(v) => { rh.update(item.local_id, { nombre: v }); if(onActivity) onActivity(); }} disabled={disabled} />
                  </div>

                  {/* Observations */}
                  <div className="space-y-1.5 sm:col-span-2 lg:col-span-3">
                    <Label className="text-xs font-semibold">{isAr ? 'ملاحظات' : 'Observations'}</Label>
                    <Input value={item.observations} onChange={e => { rh.update(item.local_id, { observations: e.target.value }); if(onActivity) onActivity(); }} disabled={disabled} className="h-10" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* ======================================================== */}
      {/* BLOC 2 : FORMATION DES CADRES                            */}
      {/* ======================================================== */}
      <Card className="p-5 sm:p-6 space-y-4 bg-card">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <BookOpen className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-bold">{isAr ? 'تكوين الأطر' : 'Formation des Cadres'}</h2>
              <p className="text-sm text-muted-foreground">{isAr ? 'تتبع الدورات التكوينية وتقوية القدرات' : 'Suivi des sessions de renforcement des capacities'}</p>
            </div>
          </div>
          <Button type="button" size="sm" onClick={handleAddFormation} disabled={disabled} className="gap-1.5 shadow-sm">
            <Plus className="h-4 w-4" />
            {isAr ? 'إضافة' : 'Ajouter'}
          </Button>
        </div>

        {formations.items.length === 0 ? (
          <div className="text-center py-8 text-sm text-muted-foreground border-2 border-dashed border-border rounded-xl bg-muted/30">
            {isAr ? 'لا توجد تكوينات مسجلة' : 'Aucune formation enregistrée.'}
          </div>
        ) : (
          <div className="space-y-4 pt-2">
            {formations.items.map((item, idx) => (
              <div key={item.local_id} className="border border-border rounded-xl p-4 bg-muted/10 space-y-4 transition-colors hover:border-primary/30">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-muted-foreground">#{idx + 1}</span>
                  <Button type="button" size="icon" variant="ghost" onClick={() => { formations.remove(item.local_id); if(onActivity) onActivity(); }} disabled={disabled} className="h-8 w-8 text-destructive hover:bg-destructive/10">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-1">
                  <div className="space-y-1.5 sm:col-span-2 lg:col-span-1">
                    <Label className="text-xs font-semibold">{isAr ? 'مجال التكوين' : 'Domaine de formation'}</Label>
                    <Input value={item.domaine_formation} onChange={e => { formations.update(item.local_id, { domaine_formation: e.target.value }); if(onActivity) onActivity(); }} disabled={disabled} className="h-10" />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">{isAr ? 'عدد الأطر' : 'Nombre de cadres'}</Label>
                    <NumericField label="" value={item.nombre_cadres} onChange={(v) => { formations.update(item.local_id, { nombre_cadres: v }); if(onActivity) onActivity(); }} disabled={disabled} />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">{isAr ? 'مدة التكوين' : 'Durée'}</Label>
                    <div className="flex gap-2">
                      <NumericField label="" value={item.duree_valeur} onChange={(v) => { formations.update(item.local_id, { duree_valeur: v }); if(onActivity) onActivity(); }} disabled={disabled} />
                      
                      {/* 🛠️ FIX ENUM : Valeurs adaptées à unite_duree_enum */}
                      <Select disabled={disabled} value={item.unite_duree} onValueChange={(v) => { formations.update(item.local_id, { unite_duree: v }); if(onActivity) onActivity(); }}>
                        <SelectTrigger className="h-10 w-28 shrink-0"><SelectValue placeholder={isAr ? 'الوحدة' : 'Unité'} /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="heure">{isAr ? 'ساعة' : 'Heure'}</SelectItem>
                          <SelectItem value="jour">{isAr ? 'يوم' : 'Jour'}</SelectItem>
                          <SelectItem value="semaine">{isAr ? 'أسبوع' : 'Semaine'}</SelectItem>
                          <SelectItem value="mois">{isAr ? 'شهر' : 'Mois'}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-1.5 sm:col-span-2 lg:col-span-3">
                    <Label className="text-xs font-semibold">{isAr ? 'ملاحظات' : 'Observations'}</Label>
                    <Input value={item.observations} onChange={e => { formations.update(item.local_id, { observations: e.target.value }); if(onActivity) onActivity(); }} disabled={disabled} className="h-10" />
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

Step5RH.displayName = 'Step5RH';