import { useMemo, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import { AppLayout } from '@/components/AppLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  ChevronLeft, ChevronRight, Save, Send, ShieldAlert, Loader2, CheckCircle2, Pencil,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useDomainSubmission } from '@/hooks/useDomainSubmission';
import { useEtablissementEntries } from '@/hooks/useEtablissementEntries';
import { useFestivalEntries } from '@/hooks/useFestivalEntries';
import { useTypesPartenaires } from '@/hooks/useTypesPartenaires';
import { usePartenariatEntries } from '@/hooks/usePartenariatEntries';
import { supabase } from '@/integrations/supabase/client';
import type { ReportStatus } from '@/hooks/useDraftSubmission';
import { SaveIndicator } from '@/components/form/SaveIndicator';
import { Stepper, type Step } from '@/components/form/Stepper';
import { useRef } from 'react';
import { Step1Permanent } from '@/components/wizard/Step1Permanent';
import { Step2Rayonante } from '@/components/wizard/Step2Rayonante';
import { Step3Etablissement , FacilityEntry } from '@/components/wizard/Step3Etablissement';
import { Step4Camping, type CampEntry } from '@/components/wizard/Step4Camping';
import { useCampingEntries } from '@/hooks/useCampingEntries';
import { useAssociationValues } from '@/hooks/useAssociationValues';
import { useFormationEntries } from '@/hooks/useFormationEntries';
import { Step5Convention } from '@/components/wizard/Step5Convention';
import { Step6Festival } from '@/components/wizard/Step6Festival';
import { Step7SocioEco } from '@/components/wizard/Step7SocioEco';
import { useInsertionEntries, type InsertionEntry as SocioEcoEntry } from '@/hooks/useInsertionEntries';
import { PreFormSelection, type ReportSelection } from '@/components/wizard/PreFormSelection';
import { DEFAULT_YEAR } from '@/components/YearSwitcher';
import { computeJeunesseCompleteness } from '@/lib/jeunesseCompleteness';
import { useActivitesEntries } from '@/hooks/useActivitesEntries';

const STEPS: Step[] = [
  { id: 1, labelFr: 'Permanentes', labelAr: 'الدائمة' },
  { id: 2, labelFr: 'Rayonnantes', labelAr: 'الإشعاعية' },
  { id: 3, labelFr: 'Établissements', labelAr: 'المؤسسات' },
  { id: 4, labelFr: 'Camping', labelAr: 'التخييم' },
  { id: 5, labelFr: 'Conventions', labelAr: 'الاتفاقيات' },
  { id: 6, labelFr: 'Festivals', labelAr: 'المهرجانات' },
  { id: 7, labelFr: 'Socio-éco', labelAr: 'سوسيو-اقتصادي' },
];

/** Libellés i18n existants (brouillon / soumise / validée) alignés sur les statuts DB. */
const STATUS_I18N_KEY: Record<ReportStatus, 'brouillon' | 'soumise' | 'validee'> = {
  NON_COMMENCE: 'brouillon',
  EN_COURS: 'soumise',
  TERMINE: 'validee',
};

const DOMAIN_LABEL: Record<string, { fr: string; ar: string }> = {
  jeunesse: { fr: 'Jeunesse', ar: 'الشباب' },
  femme: { fr: 'Femme / Fille', ar: 'المرأة / الفتاة' },
  enfants: { fr: 'Enfants', ar: 'الأطفال' },
  creche: { fr: 'Crèche', ar: 'الحضانة' },
};

const Saisie = () => {
  const { t, i18n } = useTranslation();
const { utilisateur: profile, isPrefectoral: isDirector, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isAr = i18n.language === 'ar';

  // Pre-form selection
  const [selectionDone, setSelectionDone] = useState(false);
  const [selection, setSelection] = useState<ReportSelection>({
  year: DEFAULT_YEAR,
  quarter: 't1',
  domain: 'jeunesse',
});

  const [step, setStep] = useState<number>(1);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [warningOpen, setWarningOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [localLocked, setLocalLocked] = useState(false);

  const currentId = selection.rapportId ?? null;

  // Entry hooks for each table
  const activites = useActivitesEntries(currentId);
  const partenaires = usePartenariatEntries(currentId);
  const typesPartenaires = useTypesPartenaires();
  const camps = useCampingEntries(currentId);
  const associationValues = useAssociationValues(currentId);
  const formations = useFormationEntries(currentId);
  const festivals = useFestivalEntries(currentId);
  const socios = useInsertionEntries(currentId);
  const facilities = useEtablissementEntries(currentId, profile?.direction_id ?? null);

  const permanenteData = activites.permanente;
  const rayonanteData = activites.rayonnante;

const completeness = useMemo(() => {
  return computeJeunesseCompleteness({
    permanenteData,
    rayonanteData,
    facilities: facilities.items,
    camps: camps.items,
    partenaires: partenaires.items,
    festivals: festivals.items,
    socios: socios.items,
    associationValues: associationValues.items,
    formations: formations.items,
  });
}, [
  associationValues.items,
  camps.items,
  facilities.items,
  festivals.items,
  formations.items,
  partenaires.items,
  permanenteData,
  rayonanteData,
  socios.items,
]);

  // Orchestrate form lifecycle: status, save, submit
  const domain = useDomainSubmission({
    rapportId: currentId,
    directionId: profile?.direction_id ?? '',
    domain: '6a3a9ab9-2f5a-4775-a09e-ca4b4a6a8349',
    completeness,
  });

  // Stabilized callbacks for steps
  const onSaveStep1 = useCallback(
    async (values: any) => {
      return activites.savePermanente(values);
    },
    [activites]
  );
  const onActivityGlobal = useCallback(async () => {
    await domain.saveNow();
  }, [domain.saveNow]);

  const onSaveStep2 = useCallback(
    async (values: any) => {
      return activites.saveRayonnante(values);
    },
    [activites]
  );
  const onAddFacility = useCallback(async (f: FacilityEntry) => {
    await domain.ensureEnCours();
    void facilities.add(f);
  }, [facilities.add, domain.ensureEnCours]);

  const onUpdateFacility = useCallback(
    async (id: string, patch: Partial<FacilityEntry>) => {

      console.time('ensureEnCours');

      await domain.ensureEnCours();

      console.timeEnd('ensureEnCours');

      await facilities.update(id, patch);
    },
    [facilities.update, domain.ensureEnCours]
  );
  const onRemoveFacility = useCallback((id: string) => { void facilities.remove(id); }, [facilities.remove]);

  const onAddCamp = useCallback(async (c: CampEntry) => {
    await domain.ensureEnCours();
    void camps.add(c);
  }, [camps.add, domain.ensureEnCours]);

  const onRemoveCamp = useCallback((id: string) => { void camps.remove(id); }, [camps.remove]);

  const onAddConvention = useCallback(async () => {
    await domain.ensureEnCours();
    void partenaires.add({
      local_id: crypto.randomUUID(),
      type_partenaire_id: '',
      nombre_conventions: 0,
    });
  }, [partenaires.add, domain.ensureEnCours]);

  const onAddFestival = useCallback(async (f: any) => {
    await domain.ensureEnCours();
    void festivals.add(f);
  }, [festivals.add, domain.ensureEnCours]);

  const onRemoveFestival = useCallback((id: string) => { void festivals.remove(id); }, [festivals.remove]);

  const onAddSocio = useCallback(async (s: SocioEcoEntry) => {
    await domain.ensureEnCours();
    void socios.add(s);
  }, [socios.add, domain.ensureEnCours]);

  const onRemoveSocio = useCallback((id: string) => { void socios.remove(id); }, [socios.remove]);
  const onActivityStep7 = useCallback(async () => {
    domain.update();
    await domain.saveNow();
  }, [domain.update, domain.saveNow]);

  // IMPORTANT : Wrappers pour assurer que le statut EN_COURS est persisté en base
  // AVANT les UPSERTs métier. Cela évite les blocages RLS.
  const onUpdateCampWrapper = useCallback(async (id: string, patch: any) => {
    await domain.ensureEnCours();
    return camps.update(id, patch);
  }, [camps.update, domain.ensureEnCours]);

  const onUpdateAssociationValueWrapper = useCallback(async (id: string, patch: any) => {
    await domain.ensureEnCours();
    return associationValues.update(id, patch);
  }, [associationValues.update, domain.ensureEnCours]);

  const onUpdateFormationWrapper = useCallback(async (id: string, patch: any) => {
    await domain.ensureEnCours();
    return formations.update(id, patch);
  }, [formations.update, domain.ensureEnCours]);

  const onAddFormationWrapper = useCallback(async (entry: any) => {
    await domain.ensureEnCours();
    return formations.add(entry);
  }, [formations.add, domain.ensureEnCours]);

  const onRemoveFormationWrapper = useCallback(async (id: string) => {
    await domain.ensureEnCours();
    return formations.remove(id);
  }, [formations.remove, domain.ensureEnCours]);

  const onUpdatePartenaireWrapper = useCallback(async (id: string, patch: any) => {
    await domain.ensureEnCours();
    return partenaires.update(id, patch);
  }, [partenaires.update, domain.ensureEnCours]);

  const onRemovePartenaireWrapper = useCallback(async (id: string) => {
    await domain.ensureEnCours();
    void partenaires.remove(id);
  }, [partenaires.remove, domain.ensureEnCours]);

  const onUpdateFestivalWrapper = useCallback(async (id: string, patch: any) => {
    await domain.ensureEnCours();
    return festivals.update(id, patch);
  }, [festivals.update, domain.ensureEnCours]);

  const onRemoveFestivalWrapper = useCallback(async (id: string) => {
    await domain.ensureEnCours();
    void festivals.remove(id);
  }, [festivals.remove, domain.ensureEnCours]);

  const onUpdateSocioWrapper = useCallback(async (id: string, patch: any) => {
    await domain.ensureEnCours();
    return socios.update(id, patch);
  }, [socios.update, domain.ensureEnCours]);

  const onRemoveSocioWrapper = useCallback(async (id: string) => {
    await domain.ensureEnCours();
    void socios.remove(id);
  }, [socios.remove, domain.ensureEnCours]);

  if (authLoading || domain.loading) {
    return (
      <AppLayout><div className="h-32 bg-muted/50 rounded-xl animate-pulse" /></AppLayout>
    );
  }

if (!isDirector || !profile?.direction_id) {
    return (
      <AppLayout>
        <Card className="p-8 text-center max-w-md mx-auto">
          <ShieldAlert className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
          <h2 className="font-bold text-lg">{t('form.forbidden.title')}</h2>
          <p className="text-sm text-muted-foreground mt-2">{t('form.forbidden.body')}</p>
        </Card>
      </AppLayout>
    );
  }

  // PRE-FORM SELECTION FLOW (Stages 1 & 2)
  if (!selectionDone || !currentId) {
    return (
      <AppLayout>
        <div className="space-y-5 sm:space-y-6 animate-fade-in" dir={isAr ? 'rtl' : 'ltr'}>
          <div className="relative overflow-hidden rounded-2xl gradient-hero p-5 sm:p-7 text-primary-foreground shadow-elegant">
            <div className="relative z-10">
              <h1 className="text-2xl sm:text-3xl font-extrabold leading-tight">{t('form.title')}</h1>
            </div>
            <div className="absolute -top-12 -end-12 w-48 h-48 rounded-full bg-secondary/30 blur-3xl" />
          </div>
          <PreFormSelection
            initial={selection}
            onComplete={(sel) => { setSelection(sel); setSelectionDone(true); /* Removed setStep(1) as it's default */ }}
          />
        </div>
      </AppLayout>
    );
  }

  const isLocked = domain.isReadOnly || localLocked;

  const periodLabel =
    `${isAr ? 'فصلي' : 'Trimestriel'} · ${selection.quarter?.toUpperCase() ?? ''}`;
  const domainLabel = DOMAIN_LABEL[selection.domain]?.[isAr ? 'ar' : 'fr'] ?? selection.domain;

const handleSaveDraft = async () => {
  try {
    const ok = await domain.saveNow();

    if (ok) {
      toast({
        title: t('form.save.draftSavedTitle'),
      });
    } else {
      toast({
        title: t('form.save.draftErrorTitle'),
        variant: 'destructive',
      });
    }
  } catch (err) {
    console.error(err);

    toast({
      title: 'Erreur enregistrement',
      variant: 'destructive',
    });
  }
};

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('suivi_remplissage')
        .update({
          statut: 'TERMINE',
        })
        .eq('rapport_id', currentId);

      if (error) {
        toast({ title: t('form.submit.errorTitle'), description: error.message, variant: 'destructive' });
        return;
      }
      

      const ok = await domain.submit();
      setLocalLocked(true);
      
      if (ok || !error) {
        toast({ title: t('form.submit.successTitle'), description: t('form.submit.successBody', { year: selection.year }) });
      } else {
        toast({ title: t('form.submit.errorTitle'), description: domain.errorMsg ?? '', variant: 'destructive' });
      }
    } finally {
      setSubmitting(false);
      setConfirmOpen(false);
    }
  };

  const goNext = async () => {
    // It's assumed that child components will save their own data when navigating between steps or on blur.
    // The parent Saisie component only needs to ensure the `suivi_remplissage` status is updated to EN_COURS.
    await handleSaveDraft(); // Updates suivi_remplissage status to EN_COURS
    setStep(s => Math.min(STEPS.length, s + 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const goPrev = () => {
    setStep(s => Math.max(1, s - 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const totalActivities = socios.items.length; // Still valid, as socios is now for `activites_insertion`

  return (
    <AppLayout>
      <div className="space-y-5 sm:space-y-6 animate-fade-in pb-32" dir={isAr ? 'rtl' : 'ltr'}>
        {/* Hero */}
        <div className="relative overflow-hidden rounded-2xl gradient-hero p-5 sm:p-7 text-primary-foreground shadow-elegant">
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div className="space-y-2 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                {isLocked && (
                  <Badge variant="outline" className="bg-success/30 text-white border-0 gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    {t(`status.${STATUS_I18N_KEY[domain.status]}`)}
                  </Badge>
                )}
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold leading-tight">{t('form.title')}</h1>
            </div>
          </div>
          <div className="absolute -top-12 -end-12 w-48 h-48 rounded-full bg-secondary/30 blur-3xl" />
        </div>

        {/* Selection summary */}
        <Card className="p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="gap-1.5">
              <span className="text-muted-foreground">{isAr ? 'السنة' : 'Année'}:</span>
              <span className="font-bold tabular-nums">{selection.year}</span>
            </Badge>
            <Badge variant="outline" className="gap-1.5">
              <span className="text-muted-foreground">{isAr ? 'النوع' : 'Type'}:</span>
              <span className="font-bold">{periodLabel}</span>
            </Badge>
            <Badge variant="outline" className="gap-1.5">
              <span className="text-muted-foreground">{isAr ? 'المجال' : 'Domaine'}:</span>
              <span className="font-bold">{domainLabel}</span>
            </Badge>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setSelectionDone(false)} className="gap-1.5">
            <Pencil className="h-3.5 w-3.5" />
            {isAr ? 'تعديل' : 'Modifier'}
          </Button>
        </Card>

        {/* Stepper */}
        <Card className="p-4 sm:p-5">
          <Stepper steps={STEPS} current={step} isAr={isAr} onJump={(id) => !isLocked && setStep(id)} />
        </Card>

        {/* Progress sticky */}
        <div className="sticky top-16 z-30 -mx-4 px-4 py-2.5 bg-background/95 backdrop-blur border-y border-border">
          <div className="flex items-center justify-between gap-3 mb-1.5">
            <span className="text-xs font-semibold">
              {t('common.step', { n: step, total: STEPS.length })} ·{' '}
              {t('form.completeness')} <span className="text-primary tabular-nums">{domain.completeness}%</span>
            </span>
            <SaveIndicator state={domain.saveState} lastSavedAt={domain.lastSavedAt} errorMsg={domain.errorMsg} />
          </div>
          <Progress value={completeness} className="h-1.5" />
        </div>
        {/* Step content */}
        {domain.loading ? (
          <div className="h-64 bg-muted/40 rounded-xl animate-pulse" />
        ) : (
          <>
            {step === 1 && (
              <Step1Permanent
                data={permanenteData}
                onSave={onSaveStep1}
                onActivity={onActivityGlobal}
                disabled={isLocked || (activites as any).isSaving}
              />
            )}
            {step === 2 && (
              <Step2Rayonante
                data={rayonanteData}
                onSave={onSaveStep2}
                onActivity={onActivityGlobal}
                disabled={isLocked || (activites as any).isSaving}
              />
            )}
            {step === 3 && (
              <Step3Etablissement
                items={facilities.items}
                onAdd={onAddFacility}
                onUpdate={onUpdateFacility}
                onRemove={onRemoveFacility}
                disabled={isLocked || facilities.isSaving}
              />
            )}
            {step === 4 && (
              <Step4Camping
                camps={camps.items}
                onAddCamp={onAddCamp}
                onUpdateCamp={onUpdateCampWrapper}
                onRemoveCamp={onRemoveCamp}
                associationValues={associationValues.items}
                onUpdateAssociationValue={onUpdateAssociationValueWrapper}
                formations={formations.items}
                onAddFormation={onAddFormationWrapper}
                onUpdateFormation={onUpdateFormationWrapper}
                onRemoveFormation={onRemoveFormationWrapper}
                disabled={isLocked || camps.isSaving || associationValues.isSaving || formations.isSaving}
                rapportId={currentId}
              />
            )}
            {step === 5 && (
              <Step5Convention
                disabled={isLocked || (partenaires as any)?.isSaving}
                items={partenaires.items}
                partnerTypes={typesPartenaires.items}
                onAdd={onAddConvention}
                onUpdate={onUpdatePartenaireWrapper}
                onRemove={onRemovePartenaireWrapper}
              />
            )}
            {step === 6 && (
              <Step6Festival
                festivals={festivals.items}
                onAddFestival={onAddFestival}
                onUpdateFestival={onUpdateFestivalWrapper}
                onRemoveFestival={onRemoveFestivalWrapper}
                disabled={isLocked || festivals.isSaving}
              />
            )}
            {step === 7 && (
              <Step7SocioEco
                socioeco={socios.items}
                onAddSocio={onAddSocio}
                onUpdateSocio={onUpdateSocioWrapper}
                onRemoveSocio={onRemoveSocioWrapper}
                rapportId={currentId}
                domain={selection.domain}
                onActivity={onActivityStep7}
                disabled={isLocked || socios.isSaving}
              />
            )}
          </>
        )}

        {/* Bottom action bar */}
        <div className="fixed bottom-0 inset-x-0 z-40 bg-card/95 backdrop-blur border-t border-border">
          <div className="container py-3 flex items-center justify-between gap-2">
            <Button variant="outline" size="sm" onClick={goPrev} disabled={step === 1} className="gap-1.5">
              {isAr ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
              <span className="hidden sm:inline">{t('common.previous')}</span>
            </Button>

            <div className="flex items-center gap-2">
              {!isLocked && (
                <Button variant="outline" size="sm" type="submit"  form="step1-form"
                  disabled={domain.saveState === 'saving'} className="gap-1.5">
                  {domain.saveState === 'saving' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  <span className="hidden sm:inline">{t('form.actions.saveDraft')}</span>
                </Button>
              )}

              {step < STEPS.length ? (
                <Button size="sm" onClick={goNext} className="gap-1.5">
                  <span className="hidden sm:inline">{t('common.next')}</span>
                  {isAr ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </Button>
              ) : (
                !isLocked && (
                  <Button size="sm" onClick={() => {
                    if (completeness < 100) {
                      setWarningOpen(true);
                    } else {
                      setConfirmOpen(true);
                    }
                  }}
                    disabled={domain.saveState === 'saving' || submitting} className="gap-1.5">
                    <Send className="h-4 w-4" />
                    {t('form.actions.submit')}
                  </Button>
                )
              )}
            </div>
          </div>
        </div>

        <AlertDialog open={warningOpen} onOpenChange={setWarningOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{isAr ? 'تنبيه' : 'Attention'}</AlertDialogTitle>
              <AlertDialogDescription>
                {isAr ? 'الاستمارة غير مكتملة بعد.' : "Le formulaire n'est pas encore complètement rempli."}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setWarningOpen(false)}>
                {isAr ? 'حسنا' : 'OK'}
              </AlertDialogCancel>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{isAr ? 'تأكيد' : 'Confirmation'}</AlertDialogTitle>
              <AlertDialogDescription>
                {isAr 
                  ? 'هل أنت متأكد من إرسال هذه الاستمارة؟ بعد التأكيد ستصبح للقراءة فقط.' 
                  : 'Êtes-vous sûr de vouloir soumettre ce formulaire ? Après validation, il sera en lecture seule.'}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{isAr ? 'إلغاء' : 'Annuler'}</AlertDialogCancel>
              <AlertDialogAction onClick={handleSubmit} disabled={submitting}>
                {submitting ? <Loader2 className="h-4 w-4 animate-spin me-2" /> : null}
                {isAr ? 'تأكيد' : 'Confirmer'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AppLayout>
  );
};

export default Saisie;
