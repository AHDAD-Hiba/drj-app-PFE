import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Briefcase } from 'lucide-react';
import { StepComponentProps } from '@/config/wizard.types';
import { NumericField } from '@/components/form/NumericField';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

import { useAfEtablissements } from '@/hooks/common/useAfEtablissements';
import { useAuth } from '@/hooks/common/useAuth';
import { useInfraPartenariats } from '@/hooks/Infrastructure/useInfraPartenariats';

const TYPES_ETAB = [
  { id: 'maison_jeunes', ar: 'دار الشباب', fr: 'Maison de Jeunes' },
  { id: 'club_feminin', ar: 'نادي نسوي', fr: 'Club Féminin' },
  { id: 'centre_socio_sportif', ar: 'مركز سوسيو-رياضي', fr: 'Centre Socio-Sportif' },
  { id: 'ofppt', ar: 'مركز التكوين المهني', fr: 'OFPPT' },
  { id: 'direction_regional', ar: 'مقر المديرية الجهوية', fr: 'Siège Direction' },
];

const PHASES = [
  { id: 'etudes', ar: 'الدراسات', fr: 'Études' },
  { id: 'attente_foncier', ar: 'في انتظار تسوية الوضعية العقارية', fr: 'Attente Foncier' },
  { id: 'travaux', ar: 'الأشغال', fr: 'Travaux' },
  { id: 'attente_livraison', ar: 'في انتظار التسليم النهائي', fr: 'Attente Livraison' },
  { id: 'acheve', ar: 'مكتملة', fr: 'Achevé' },
];

export const Step3Partenariats = memo(({ disabled, onActivity, rapportId }: StepComponentProps & { rapportId?: string | null }) => {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  
  const { utilisateur } = useAuth();
  const directionId = utilisateur?.direction_id;
  const { items: etablissements, loading: loadingEtab } = useAfEtablissements(directionId);

  const hasDirectionRegionale = etablissements.some(e => e.type_etablissement === 'direction_regional');

  const { conventions, setConventions, loading } = useInfraPartenariats(rapportId || null);

  const addConvention = () => {
    setConventions([...conventions, {
      local_id: crypto.randomUUID(),
      sujet_convention: '',
      projets: []
    }]);
    if (onActivity) onActivity();
  };

  const removeConvention = (convId: string) => {
    setConventions(conventions.filter(c => c.local_id !== convId));
    if (onActivity) onActivity();
  };

  const updateConvention = (convId: string, data: any) => {
    setConventions(conventions.map(c => c.local_id === convId ? { ...c, ...data } : c));
    if (onActivity) onActivity();
  };

  const addProjet = (convId: string) => {
    setConventions(conventions.map(c => {
      if (c.local_id !== convId) return c;
      return {
        ...c,
        projets: [...c.projets, {
          local_id: crypto.randomUUID(),
          sujet_projet: '',
          types_etablissements: [],
          etablissement_id: '',
          maitre_ouvrage_delegue: '',
          phase_projet: '',
          taux_avancement: 0,
          observations: ''
        }]
      };
    }));
    if (onActivity) onActivity();
  };

  const removeProjet = (convId: string, projId: string) => {
    setConventions(conventions.map(c => {
      if (c.local_id !== convId) return c;
      return { ...c, projets: c.projets.filter((p: any) => p.local_id !== projId) };
    }));
    if (onActivity) onActivity();
  };

  const updateProjet = (convId: string, projId: string, data: any) => {
    setConventions(conventions.map(c => {
      if (c.local_id !== convId) return c;
      return {
        ...c,
        projets: c.projets.map((p: any) => p.local_id === projId ? { ...p, ...data } : p)
      };
    }));
    if (onActivity) onActivity();
  };

  const toggleTypeEtablissement = (convId: string, projId: string, currentTypes: string[], typeId: string) => {
    const newTypes = currentTypes.includes(typeId) 
      ? currentTypes.filter(t => t !== typeId) 
      : [...currentTypes, typeId];
    updateProjet(convId, projId, { types_etablissements: newTypes });
  };

  return (
    <Card className="p-5 sm:p-6 space-y-5 bg-background">
      {/* HEADER DE L'ÉTAPE */}
      <div className="flex items-center justify-between gap-3 flex-wrap border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Briefcase className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="text-base font-semibold">
              {isAr ? 'مشاريع الشراكة' : 'Projets de Partenariats'}
            </h3>
            <p className="text-xs text-muted-foreground">
              {isAr ? 'تتبع المشاريع حسب الاتفاقيات المبرمة' : 'Suivi des projets selon les conventions'}
            </p>
          </div>
        </div>
        <Button
          type="button"
          size="sm"
          onClick={addConvention}
          disabled={disabled || loading}
          className="gap-1.5"
        >
          <Plus className="h-4 w-4" />
          {isAr ? 'إضافة اتفاقية' : 'Ajouter une convention'}
        </Button>
      </div>

      {/* GESTION DU CHARGEMENT */}
      {loading ? (
        <div className="text-center py-10 text-sm text-muted-foreground">
          {isAr ? 'جاري التحميل...' : 'Chargement...'}
        </div>
      ) : conventions.length === 0 ? (
        <div className="text-center py-8 text-sm text-muted-foreground border-2 border-dashed border-border rounded-lg bg-muted/5">
          {isAr ? 'لا توجد اتفاقيات مسجلة' : 'Aucune convention enregistrée'}
        </div>
      ) : (
        <div className="space-y-6 pt-2">
          {conventions.map((conv, cIdx) => (
            <div key={conv.local_id} className="border-2 border-primary/10 rounded-xl bg-muted/10 overflow-hidden">
              
              {/* EN-TÊTE DE LA CONVENTION */}
              <div className="bg-primary/5 p-4 border-b border-primary/10 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-primary">
                    {isAr ? `الاتفاقية #${cIdx + 1}` : `Convention #${cIdx + 1}`}
                  </h4>
                  <Button
                    type="button" size="icon" variant="ghost"
                    onClick={() => removeConvention(conv.local_id)}
                    disabled={disabled}
                    className="h-8 w-8 text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="space-y-1.5 w-full">
                  <Label className="text-xs font-semibold">
                    {isAr ? 'موضوع الاتفاقية' : 'Sujet de la convention'}
                  </Label>
                  <Input
                    placeholder={isAr ? 'مثال: اتفاقية إطار موقعة أمام أنظار صاحب الجلالة...' : 'Ex: Convention cadre signée...'}
                    value={conv.sujet_convention}
                    onChange={(e) => updateConvention(conv.local_id, { sujet_convention: e.target.value })}
                    disabled={disabled}
                    className="h-10 bg-background shadow-sm"
                  />
                </div>
              </div>

              {/* SECTION PROJETS */}
              <div className="p-4 space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <h5 className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                    {isAr ? 'المشاريع المبرمجة' : 'Projets programmés'}
                  </h5>
                  <Button
                    type="button" size="sm" disabled={disabled} className="gap-1.5 h-8"
                    onClick={() => addProjet(conv.local_id)}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    {isAr ? 'إضافة مشروع' : 'Ajouter un projet'}
                  </Button>
                </div>

                {conv.projets.length === 0 ? (
                  <div className="text-center py-6 text-xs text-muted-foreground border border-dashed border-border rounded-lg bg-background/50">
                    {isAr ? 'أضف مشاريع لهذه الاتفاقية' : 'Ajoutez des projets à cette convention'}
                  </div>
                ) : (
                  conv.projets.map((proj: any, pIdx: number) => (
                    <div key={proj.local_id} className="border border-border/60 rounded-lg p-4 bg-background shadow-sm space-y-4 transition-all hover:border-primary/30">
                      
                      <div className="flex items-center justify-between border-b border-border/40 pb-3">
                        <span className="text-xs font-bold text-foreground bg-muted px-2 py-1 rounded-md">
                          {isAr ? `المشروع #${pIdx + 1}` : `Projet #${pIdx + 1}`}
                        </span>
                        <Button
                          type="button" variant="ghost" size="icon"
                          className="h-7 w-7 text-destructive hover:bg-destructive/10"
                          onClick={() => removeProjet(conv.local_id, proj.local_id)}
                          disabled={disabled}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>

                      {/* ROW 1: Sujet & Types */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <Label className="text-xs font-medium">{isAr ? 'موضوع المشروع' : 'Sujet du projet'}</Label>
                          <Input
                            placeholder={isAr ? 'بناء دار الشباب...' : 'Construction Maison...'}
                            value={proj.sujet_projet}
                            onChange={(e) => updateProjet(conv.local_id, proj.local_id, { sujet_projet: e.target.value })}
                            disabled={disabled} className="h-9"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-xs font-medium">{isAr ? 'نوع المؤسسة (اختيار متعدد)' : 'Types ciblés (Choix multiple)'}</Label>
                          <div className="flex flex-wrap gap-1.5">
                            {TYPES_ETAB.map((t) => {
                              const isSelected = proj.types_etablissements.includes(t.id);
                              
                              // Condition pour le siège de direction régionale
                              if (t.id === 'direction_regional' && !hasDirectionRegionale) return null;

                              return (
                                <button
                                  key={t.id} type="button" disabled={disabled}
                                  onClick={() => toggleTypeEtablissement(conv.local_id, proj.local_id, proj.types_etablissements, t.id)}
                                  className={cn(
                                    "px-2 py-1 rounded text-[11px] font-medium transition-colors border",
                                    isSelected ? "bg-primary text-primary-foreground border-primary" : "bg-muted text-muted-foreground hover:bg-muted/80 border-transparent"
                                  )}
                                >
                                  {isAr ? t.ar : t.fr}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      {/* ROW 2: Établissement, Maître d'ouvrage, Phase */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-border/40 pt-4">
                        <div className="space-y-1.5">
                          <Label className="text-xs font-medium">{isAr ? 'ارتباط بمؤسسة (اختياري)' : 'Lier à un existant'}</Label>
                          <Select
                            value={proj.etablissement_id || 'none'}
                            disabled={disabled || loadingEtab}
                            onValueChange={(v) => updateProjet(conv.local_id, proj.local_id, { etablissement_id: v === 'none' ? '' : v })}
                          >
                            <SelectTrigger className="h-9">
                              <SelectValue placeholder={isAr ? 'بناء جديد' : 'Aucun lien'} />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">{isAr ? 'بدون ارتباط / بناء جديد' : 'Aucun lien / Nouvelle constr.'}</SelectItem>
                              {etablissements.map((e) => (
                                <SelectItem key={e.id} value={e.id}>{e.nom}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-xs font-medium">{isAr ? 'صاحب المشروع المنتدب' : "Maître d'ouvrage"}</Label>
                          <Input
                            placeholder={isAr ? 'شركة العمران...' : 'Al Omrane...'}
                            value={proj.maitre_ouvrage_delegue}
                            onChange={(e) => updateProjet(conv.local_id, proj.local_id, { maitre_ouvrage_delegue: e.target.value })}
                            disabled={disabled} className="h-9"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-xs font-medium">{isAr ? 'مرحلة المشروع' : 'Phase'}</Label>
                          <Select
                            value={proj.phase_projet || 'none'}
                            disabled={disabled}
                            onValueChange={(v) => updateProjet(conv.local_id, proj.local_id, { phase_projet: v === 'none' ? '' : v })}
                          >
                            <SelectTrigger className="h-9">
                              <SelectValue placeholder={isAr ? 'اختر...' : 'Choisir...'} />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">{isAr ? 'اختر المرحلة' : 'Choisir la phase'}</SelectItem>
                              {PHASES.map((ph) => (
                                <SelectItem key={ph.id} value={ph.id}>{isAr ? ph.ar : ph.fr}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* ROW 3: Avancement & Observations */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-border/40 pt-4">
                        <NumericField
                          label={isAr ? 'نسبة التقدم (%)' : 'Avancement (%)'}
                          value={proj.taux_avancement || 0}
                          onChange={(val) => updateProjet(conv.local_id, proj.local_id, { taux_avancement: val })}
                          disabled={disabled}
                        />
                        <div className="space-y-1.5">
                          <Label className="text-xs font-medium">{isAr ? 'ملاحظات' : 'Observations'}</Label>
                          <Textarea
                            placeholder={isAr ? 'أضف ملاحظات...' : 'Observations...'}
                            value={proj.observations}
                            onChange={(e) => updateProjet(conv.local_id, proj.local_id, { observations: e.target.value })}
                            disabled={disabled} className="min-h-[80px] bg-background resize-y"
                          />
                        </div>
                      </div>

                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
});

Step3Partenariats.displayName = 'Step3Partenariats';