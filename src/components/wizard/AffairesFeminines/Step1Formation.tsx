import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, School, GraduationCap } from 'lucide-react';
import { NumericField } from '@/components/form/NumericField';
import { StepComponentProps } from '@/config/wizard.types';

// Import de tes hooks
import { useAfInscriptionsClubs } from '@/hooks/AffairesFeminines/useAfInscriptionsClubs';
import { useAfInscriptionsOfppt } from '@/hooks/AffairesFeminines/useAfInscriptionsOfppt';
import { useAfSecteurs } from '@/hooks/AffairesFeminines/useAfSecteurs';
import { useAfFilieres } from '@/hooks/AffairesFeminines/useAfFilieres';
import { useAfEtablissements } from '@/hooks/AffairesFeminines/useAfEtablissements';

export const Step1Formation = memo(({ rapportId, disabled, onActivity }: StepComponentProps) => {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  // Chargement des données sauvegardées
  const clubs = useAfInscriptionsClubs(rapportId);
  const ofppt = useAfInscriptionsOfppt(rapportId);
  
  // Chargement des référentiels
  const { items: secteurs } = useAfSecteurs();
  const { items: filieres } = useAfFilieres();
  const { items: etablissements } = useAfEtablissements();

  // Filtrage intelligent des établissements selon leur type
  const foyersEtabs = etablissements.filter(e => e.type_etablissement === 'club_feminin');
  const ofpptEtabs = etablissements.filter(e => e.type_etablissement === 'ofppt');

  // ==========================================
  // ACTIONS CLUBS
  // ==========================================
  const handleAddClub = async () => {
    if (onActivity) await onActivity();
    await clubs.add({
      local_id: crypto.randomUUID(), 
      etablissement_id: '', 
      filiere_id: '', 
      type_formation: '', // 'fondamental' | 'rapide'
      inscrites_annee_1: 0, 
      inscrites_annee_2: 0 
    });
  };

  // ==========================================
  // ACTIONS OFPPT
  // ==========================================
  const handleAddOfppt = async () => {
    if (onActivity) await onActivity();
    await ofppt.add({
      local_id: crypto.randomUUID(), 
      etablissement_id: '', 
      secteur_id: '', 
      filiere_id: '', 
      niveau_formation: '', // 'specialisation' | 'qualification' | 'technicien' | 'technicien_specialise'
      inscrites_annee_1: 0, 
      inscrites_annee_2: 0 
    });
  };

return (
    <div className="space-y-6">
      {/* ======================================================== */}
      {/* BLOC 1 : CLUBS FÉMININS (Foyers)                         */}
      {/* ======================================================== */}
      <Card className="p-5 sm:p-6 space-y-4 bg-card">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <School className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-bold">{isAr ? 'الأندية النسوية' : 'Clubs Féminins'}</h2>
              <p className="text-sm text-muted-foreground">{isAr ? 'إحصائيات حسب المؤسسة، الشعبة ونوع التكوين' : 'Statistiques par établissement, filière et type'}</p>
            </div>
          </div>
          <Button type="button" size="sm" onClick={handleAddClub} disabled={disabled} className="gap-1.5 shadow-sm">
            <Plus className="h-4 w-4" />
            {isAr ? 'إضافة تسجيل' : 'Ajouter une ligne'}
          </Button>
        </div>

        {clubs.items.length === 0 ? (
          <div className="text-center py-8 text-sm text-muted-foreground border-2 border-dashed border-border rounded-xl bg-muted/30">
            {isAr ? 'لا توجد بيانات مسجلة' : 'Aucune donnée enregistrée.'}
          </div>
        ) : (
          <div className="space-y-4 pt-2">
            {clubs.items.map((item, idx) => (
              <div key={item.local_id} className="border border-border rounded-xl p-4 bg-muted/10 space-y-4 relative group transition-colors hover:border-primary/30">
                
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-xs font-semibold text-muted-foreground">#{idx + 1}</span>
                  <Button type="button" size="icon" variant="ghost" onClick={() => { clubs.remove(item.local_id); if(onActivity) onActivity(); }} disabled={disabled} className="h-8 w-8 text-destructive hover:bg-destructive/10">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                  {/* Établissement (Dynamique & Filtré) */}
                  <div className="space-y-1.5 lg:col-span-1">
                    <Label className="text-xs font-semibold">{isAr ? 'المؤسسة' : 'Établissement'}</Label>
                    <Select disabled={disabled} value={item.etablissement_id} onValueChange={(v) => { clubs.update(item.local_id, { etablissement_id: v }); if(onActivity) onActivity(); }}>
                      <SelectTrigger className="h-10"><SelectValue placeholder={isAr ? 'اختر المؤسسة' : 'Sélectionner'} /></SelectTrigger>
                      <SelectContent>
                        {foyersEtabs.map(etab => (
                          <SelectItem key={etab.id} value={etab.id}>{etab.nom}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Filière (Dynamique) */}
                  <div className="space-y-1.5 lg:col-span-1">
                    <Label className="text-xs font-semibold">{isAr ? 'الشعبة' : 'Filière'}</Label>
                    <Select disabled={disabled} value={item.filiere_id} onValueChange={(v) => { clubs.update(item.local_id, { filiere_id: v }); if(onActivity) onActivity(); }}>
                      <SelectTrigger className="h-10"><SelectValue placeholder={isAr ? 'الشعبة' : 'Filière'} /></SelectTrigger>
                      <SelectContent>
                        {filieres.map(f => (
                          <SelectItem key={f.id} value={f.id}>{isAr ? f.nom_ar : (f.nom_fr || f.nom_ar)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Type de Formation */}
                  <div className="space-y-1.5 lg:col-span-1">
                    <Label className="text-xs font-semibold">{isAr ? 'نوع التكوين' : 'Type formation'}</Label>
                    <Select disabled={disabled} value={item.type_formation} onValueChange={(v) => { clubs.update(item.local_id, { type_formation: v }); if(onActivity) onActivity(); }}>
                      <SelectTrigger className="h-10"><SelectValue placeholder={isAr ? 'النوع' : 'Type'} /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fondamental">{isAr ? 'تكوين أساسي' : 'Fondamental'}</SelectItem>
                        <SelectItem value="rapide">{isAr ? 'تكوين سريع' : 'Rapide'}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Nombres (Année 1 & 2) */}
                  <div className="space-y-1.5 lg:col-span-1">
                    <Label className="text-xs font-semibold">{isAr ? 'مسجلات السنة 1' : 'Inscrites A1'}</Label>
                    <NumericField label="" value={item.inscrites_annee_1} onChange={(v) => { clubs.update(item.local_id, { inscrites_annee_1: v }); if(onActivity) onActivity(); }} disabled={disabled} />
                  </div>
                  <div className="space-y-1.5 lg:col-span-1">
                    <Label className="text-xs font-semibold">{isAr ? 'مسجلات السنة 2' : 'Inscrites A2'}</Label>
                    <NumericField label="" value={item.inscrites_annee_2} onChange={(v) => { clubs.update(item.local_id, { inscrites_annee_2: v }); if(onActivity) onActivity(); }} disabled={disabled} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* ======================================================== */}
      {/* BLOC 2 : OFPPT                                         */}
      {/* ======================================================== */}
      <Card className="p-5 sm:p-6 space-y-4 bg-card">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <GraduationCap className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-bold">{isAr ? 'مكتب التكوين المهني' : 'Inscriptions OFPPT'}</h2>
              <p className="text-sm text-muted-foreground">{isAr ? 'إحصائيات حسب المؤسسة، القطاع والمستوى' : 'Statistiques par établissement, secteur et niveau'}</p>
            </div>
          </div>
          <Button type="button" size="sm" onClick={handleAddOfppt} disabled={disabled} className="gap-1.5 shadow-sm">
            <Plus className="h-4 w-4" />
            {isAr ? 'إضافة تسجيل' : 'Ajouter une ligne'}
          </Button>
        </div>

        {ofppt.items.length === 0 ? (
          <div className="text-center py-8 text-sm text-muted-foreground border-2 border-dashed border-border rounded-xl bg-muted/30">
            {isAr ? 'لا توجد بيانات مسجلة' : 'Aucune donnée enregistrée.'}
          </div>
        ) : (
          <div className="space-y-4 pt-2">
            {ofppt.items.map((item, idx) => {
              // Filtrer les filières pour n'afficher que celles du secteur sélectionné
              const filieresDuSecteur = filieres.filter(f => f.secteur_id === item.secteur_id);

              return (
                <div key={item.local_id} className="border border-border rounded-xl p-4 bg-muted/10 space-y-4 transition-colors hover:border-primary/30">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-semibold text-muted-foreground">#{idx + 1}</span>
                    <Button type="button" size="icon" variant="ghost" onClick={() => { ofppt.remove(item.local_id); if(onActivity) onActivity(); }} disabled={disabled} className="h-8 w-8 text-destructive hover:bg-destructive/10">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
                    {/* Établissement (Dynamique & Filtré) */}
                    <div className="space-y-1.5 lg:col-span-1">
                      <Label className="text-xs font-semibold">{isAr ? 'المؤسسة' : 'Établissement'}</Label>
                      <Select disabled={disabled} value={item.etablissement_id} onValueChange={(v) => { ofppt.update(item.local_id, { etablissement_id: v }); if(onActivity) onActivity(); }}>
                        <SelectTrigger className="h-10"><SelectValue placeholder={isAr ? 'المؤسسة' : 'Établissement'} /></SelectTrigger>
                        <SelectContent>
                          {ofpptEtabs.map(etab => (
                            <SelectItem key={etab.id} value={etab.id}>{etab.nom}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Secteur (Dynamique) */}
                    <div className="space-y-1.5 lg:col-span-1">
                      <Label className="text-xs font-semibold">{isAr ? 'القطاع' : 'Secteur'}</Label>
                      <Select disabled={disabled} value={item.secteur_id} onValueChange={(v) => { ofppt.update(item.local_id, { secteur_id: v, filiere_id: '' }); if(onActivity) onActivity(); }}>
                        <SelectTrigger className="h-10"><SelectValue placeholder={isAr ? 'القطاع' : 'Secteur'} /></SelectTrigger>
                        <SelectContent>
                          {secteurs.map(s => (
                            <SelectItem key={s.id} value={s.id}>{isAr ? s.nom_ar : (s.nom_fr || s.nom_ar)}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Filière (Dynamique et filtrée) */}
                    <div className="space-y-1.5 lg:col-span-1">
                      <Label className="text-xs font-semibold">{isAr ? 'الشعبة' : 'Filière'}</Label>
                      <Select disabled={disabled || !item.secteur_id} value={item.filiere_id} onValueChange={(v) => { ofppt.update(item.local_id, { filiere_id: v }); if(onActivity) onActivity(); }}>
                        <SelectTrigger className="h-10"><SelectValue placeholder={isAr ? 'الشعبة' : 'Filière'} /></SelectTrigger>
                        <SelectContent>
                          {filieresDuSecteur.map(f => (
                            <SelectItem key={f.id} value={f.id}>{isAr ? f.nom_ar : (f.nom_fr || f.nom_ar)}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Niveau OFPPT */}
                    <div className="space-y-1.5 lg:col-span-1">
                      <Label className="text-xs font-semibold">{isAr ? 'المستوى' : 'Niveau'}</Label>
                      <Select disabled={disabled} value={item.niveau_formation} onValueChange={(v) => { ofppt.update(item.local_id, { niveau_formation: v }); if(onActivity) onActivity(); }}>
                        <SelectTrigger className="h-10"><SelectValue placeholder={isAr ? 'المستوى' : 'Niveau'} /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="specialisation">{isAr ? 'التخصص' : 'Spécialisation'}</SelectItem>
                          <SelectItem value="qualification">{isAr ? 'التأهيل' : 'Qualification'}</SelectItem>
                          <SelectItem value="technicien">{isAr ? 'التقني' : 'Technicien'}</SelectItem>
                          <SelectItem value="technicien_specialise">{isAr ? 'التقني المتخصص' : 'Tech. Spécialisé'}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Nombres (Année 1 & 2) */}
                    <div className="space-y-1.5 lg:col-span-1">
                      <Label className="text-xs font-semibold">{isAr ? 'مسجلات السنة 1' : 'Inscrites A1'}</Label>
                      <NumericField label="" value={item.inscrites_annee_1} onChange={(v) => { ofppt.update(item.local_id, { inscrites_annee_1: v }); if(onActivity) onActivity(); }} disabled={disabled} />
                    </div>
                    <div className="space-y-1.5 lg:col-span-1">
                      <Label className="text-xs font-semibold">{isAr ? 'مسجلات السنة 2' : 'Inscrites A2'}</Label>
                      <NumericField label="" value={item.inscrites_annee_2} onChange={(v) => { ofppt.update(item.local_id, { inscrites_annee_2: v }); if(onActivity) onActivity(); }} disabled={disabled} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
});

Step1Formation.displayName = 'Step1Formation';