import { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/common/useAuth';
import { AppLayout } from '@/components/AppLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  ChevronLeft, ChevronRight, Save, Send, ShieldAlert, Loader2, CheckCircle2, Pencil, AlertTriangle,
} from 'lucide-react';
import { useToast } from '@/hooks/common/use-toast';
import { supabase } from '@/integrations/supabase/client';

import { useDomainSubmission } from '@/hooks/common/useDomainSubmission';
import { SaveIndicator } from '@/components/form/SaveIndicator';
import { Stepper } from '@/components/form/Stepper';

import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

import { PreFormSelection, type ReportSelection } from '@/components/wizard/PreFormSelection';
import { DEFAULT_YEAR } from '@/components/YearSwitcher';
import type { DomainConfig } from '@/config/wizard.types';
import { getDomainConfig } from '@/config/domainRegistry';
import { useDomaines } from '@/hooks/common/useDomaines';

type StatutRapport =
  | 'NON_COMMENCE'
  | 'EN_COURS'
  | 'SOUMIS'
  | 'RETOUR_CORRECTION'
  | 'VALIDE';

// =========================================================================
// 1. LE COMPOSANT DU WIZARD ACTIF
// =========================================================================
const ActiveWizard = ({
  selection,
  currentId,
  domainConfig,
  onBack,
  domainLabel,
  periodLabel,
  isAr,
  isReview,
  reportStatus,
  onReturnCorrection,
}: {
  selection: ReportSelection;
  currentId: string;
  domainConfig: DomainConfig;
  onBack: () => void;
  domainLabel: string;
  periodLabel: string;
  isAr: boolean;
  isReview: boolean;
  reportStatus: StatutRapport;
  onReturnCorrection: (correctionText: string) => Promise<boolean>;
}) => {
  const { t } = useTranslation();
  const { utilisateur: profile } = useAuth();
  const { toast } = useToast();

  const [step, setStep] = useState<number>(1);
  const [submitting, setSubmitting] = useState(false);
  const [localLocked, setLocalLocked] = useState(false);
  
  // États pour les modales
  const [reviewCorrectionOpen, setReviewCorrectionOpen] = useState(false);
  const [reviewCorrectionText, setReviewCorrectionText] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  // 🆕 État pour la modale de confirmation "Terminer le domaine"
  const [confirmCompleteOpen, setConfirmCompleteOpen] = useState(false);
  
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const completeness = domainConfig.useCompleteness(currentId, refreshTrigger, step);

  const domain = useDomainSubmission({
    rapportId: currentId,
    directionId: selection.directionId ?? profile?.direction_id ?? '',
    domaineId: domainConfig.id,
    completeness,
  });

  const prevCompletenessRef = useRef(completeness);
  const isFirstRender = useRef(true);
  
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      prevCompletenessRef.current = completeness;
      return;
    }

    if (prevCompletenessRef.current !== completeness) {
      prevCompletenessRef.current = completeness;
      const timeoutId = setTimeout(() => {
        domain.saveNow().catch(err => console.error("Erreur auto-save complétude:", err));
      }, 1500);
      return () => clearTimeout(timeoutId);
    }
  }, [completeness]);

  const isLocked = domain.isReadOnly || localLocked;
  const ensureEnCoursTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  const ensureEnCoursRef = useRef(domain.ensureEnCours);
  useEffect(() => {
    ensureEnCoursRef.current = domain.ensureEnCours;
  }, [domain.ensureEnCours]);

  const onActivityGlobal = useCallback(async () => {
    if (ensureEnCoursTimerRef.current) clearTimeout(ensureEnCoursTimerRef.current);
    
    ensureEnCoursTimerRef.current = setTimeout(async () => {
      try { 
        await ensureEnCoursRef.current(); 
      } catch (err) { 
        console.error(err); 
      }
      //setRefreshTrigger(prev => prev + 1); 
    }, 1500); 
  }, []);

  // 🆕 Ajout du paramètre `silent` pour ne pas afficher le toast lors du clic sur "Suivant"
  const handleSaveDraft = async (silent = false) => {
    try {
      const ok = await domain.saveNow();
      if (!silent) {
        toast({
          title: ok ? t('form.save.draftSavedTitle') : t('form.save.draftErrorTitle'),
          variant: ok ? 'default' : 'destructive',
        });
      }
    } catch (err) {
      console.error(err);
      if (!silent) {
        toast({ title: 'Erreur', variant: 'destructive' });
      }
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const { error } = await supabase.from('suivi_remplissage').update({ statut: 'TERMINE' }).eq('rapport_id', currentId).eq('domaine_id', domainConfig.id);
      if (error) throw error;
      const ok = await domain.submit();
      setLocalLocked(true);
      if (ok || !error) {
        toast({ title: t('form.submit.successTitle'), description: t('form.submit.successBody', { year: selection.year }) });
      }
    } catch (err: any) {
      toast({ title: t('form.submit.errorTitle'), description: err.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const goNext = async () => {
    await handleSaveDraft(true); // 🆕 Sauvegarde silencieuse : pas de toast
    setStep(s => Math.min(domainConfig.steps.length, s + 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goPrev = () => {
    setStep(s => Math.max(1, s - 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleReviewReturnCorrection = async () => {
    setReviewSubmitting(true);
    try {
      const completed = await onReturnCorrection(reviewCorrectionText);
      if (completed) {
        setReviewCorrectionOpen(false);
        setReviewCorrectionText('');
      }
    } finally {
      setReviewSubmitting(false);
    }
  };

  const CurrentStepComponent = domainConfig.steps.find(s => s.id === step)?.component;

  if (domain.loading) {
    return <div className="h-64 bg-muted/40 rounded-xl animate-pulse" />;
  }

  return (
    <div className="space-y-5 sm:space-y-6 animate-fade-in pb-32" dir={isAr ? 'rtl' : 'ltr'}>
      {/* 1. HEADER / HERO */}
      <div className="relative overflow-hidden rounded-2xl gradient-hero p-5 sm:p-7 text-primary-foreground shadow-elegant">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div className="space-y-2 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              {isLocked && (
                <Badge variant="outline" className="bg-success/30 text-white border-0 gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  {t(`status.${domain.status}`)}
                </Badge>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold leading-tight">{t('form.title')}</h1>
          </div>
        </div>
      </div>

      {/* 2. RECAPITULATIF */}
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
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-1.5">
          <Pencil className="h-3.5 w-3.5" />
          {isAr ? 'تعديل' : 'Modifier'}
        </Button>
      </Card>

      {/* 3. BARRE DES ETAPES */}
      <Card className="p-4 sm:p-5">
        {/* 🆕 Le onJump n'est plus bloqué par !isLocked */}
        <Stepper steps={domainConfig.steps} current={step} isAr={isAr} onJump={(id) => setStep(id)} />
      </Card>

      {/* 4. BARRE DE PROGRESSION */}
      <div className="sticky top-16 z-30 -mx-4 px-4 py-2.5 bg-background/95 backdrop-blur border-y border-border">
        <div className="flex items-center justify-between gap-3 mb-1.5">
          <span className="text-xs font-semibold">
            {t('common.step', { n: step, total: domainConfig.steps.length })} ·{' '}
            {t('form.completeness')} <span className="text-primary tabular-nums">{domain.completeness}%</span>
          </span>
          <SaveIndicator state={domain.saveState} lastSavedAt={domain.lastSavedAt} errorMsg={domain.errorMsg} />
        </div>
        <Progress value={completeness} className="h-1.5" />
      </div>

      {/* 5. INJECTION DU COMPOSANT D'ETAPE ACTUEL */}
      {CurrentStepComponent && (
        <CurrentStepComponent rapportId={currentId} disabled={isLocked} onActivity={onActivityGlobal} />
      )}

      {/* 6. BARRE D'ACTIONS FLOTTANTE */}
      <div className="fixed bottom-0 inset-x-0 z-40 bg-card/95 backdrop-blur border-t border-border">
        <div className="container py-3 flex items-center justify-between gap-2">
          <Button variant="outline" size="sm" onClick={goPrev} disabled={step === 1} className="gap-1.5">
            {isAr ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            <span className="hidden sm:inline">{t('common.previous')}</span>
          </Button>

          <div className="flex items-center gap-2">
            {isReview && reportStatus === 'SOUMIS' && (
              <Button variant="destructive" size="sm" onClick={() => setReviewCorrectionOpen(true)} disabled={reviewSubmitting} className="gap-1.5">
                <AlertTriangle className="h-4 w-4" />
                <span className="hidden sm:inline">Retour correction</span>
              </Button>
            )}

            {!isReview && !isLocked && (
              <Button variant="outline" size="sm" onClick={() => handleSaveDraft(false)} disabled={domain.saveState === 'saving'} className="gap-1.5">
                {domain.saveState === 'saving' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                <span className="hidden sm:inline">{t('form.actions.saveDraft')}</span>
              </Button>
            )}

            {step < domainConfig.steps.length ? (
              <Button size="sm" onClick={goNext} className="gap-1.5">
                <span className="hidden sm:inline">{t('common.next')}</span>
                {isAr ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </Button>
            ) : (
              !isReview && !isLocked && (
                <Button size="sm" onClick={() => setConfirmCompleteOpen(true)} disabled={domain.saveState === 'saving' || submitting} className="gap-1.5">
                  <Send className="h-4 w-4" />
                  {t('form.actions.completeDomain')}
                </Button>
              )
            )}
          </div>
        </div>
      </div>

      {/* 🆕 Modale de confirmation pour Terminer le domaine */}
      <Dialog open={confirmCompleteOpen} onOpenChange={setConfirmCompleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isAr ? 'تأكيد الإنهاء' : 'Confirmation'}</DialogTitle>
          </DialogHeader>
          <div className="py-3">
            <p className="text-sm text-muted-foreground">
              {isAr 
                ? 'هل أنت متأكد أنك تريد إنهاء وإرسال هذا المجال؟ لن تتمكن من التعديل عليه بعد ذلك.'
                : 'Êtes-vous sûr de vouloir terminer ce domaine ? Vous ne pourrez plus le modifier par la suite.'}
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmCompleteOpen(false)} disabled={submitting}>
              {isAr ? 'إلغاء' : 'Annuler'}
            </Button>
            <Button onClick={() => { setConfirmCompleteOpen(false); handleSubmit(); }} disabled={submitting} className="bg-primary">
              {isAr ? 'تأكيد الإنهاء' : 'Confirmer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modale de dialogue pour justifier le retour */}
      <Dialog open={reviewCorrectionOpen} onOpenChange={setReviewCorrectionOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Retour correction</DialogTitle>
          </DialogHeader>
          <Textarea
            value={reviewCorrectionText}
            onChange={(event) => setReviewCorrectionText(event.target.value)}
            placeholder="Expliquez ce que le directeur doit corriger..."
            className="min-h-32"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setReviewCorrectionOpen(false)} disabled={reviewSubmitting}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={handleReviewReturnCorrection} disabled={reviewSubmitting}>
              Envoyer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// =========================================================================
// 2. LE COMPOSANT PRINCIPAL
// =========================================================================
const Saisie = () => {
  const { t, i18n } = useTranslation();
  const { 
    utilisateur: profile,
    isPrefectoral: isDirector,
    isEquipeRegional,
    loading: authLoading
  } = useAuth();
  const { domaines } = useDomaines(); 
  const { toast } = useToast();
  const [searchParams] = useSearchParams();

  const rapportIdFromUrl = searchParams.get("rapport");
  const reviewMode = searchParams.get('mode') === 'review';
  const isAr = i18n.language === 'ar';

  const [selectionDone, setSelectionDone] = useState(false);
  const [reportStatus, setReportStatus] = useState<StatutRapport>('NON_COMMENCE');
  const [correctionComment, setCorrectionComment] = useState('');
  const [selection, setSelection] = useState<ReportSelection>({
    year: DEFAULT_YEAR,
    quarter: 't1',
    domain: 'jeunesse',
  });

  useEffect(() => {
    if (!rapportIdFromUrl) return;

    const loadReport = async () => {
      const { data: rapport } = await supabase
        .from("rapports")
        .select("id, annee, trimestre, direction_id, statut_rapport, commentaire_correction")
        .eq("id", rapportIdFromUrl)
        .single();

      if (!rapport) return;

      setSelection({
        rapportId: rapport.id,
        year: rapport.annee,
        quarter: rapport.trimestre as "t1" | "t2" | "t3" | "t4",
        directionId: rapport.direction_id,
        domain: "",
      });

      setReportStatus(rapport.statut_rapport as StatutRapport);
      setCorrectionComment(rapport.commentaire_correction ?? '');
      setSelectionDone(true);
    };

    loadReport();
  }, [rapportIdFromUrl]);

  const currentId = rapportIdFromUrl ?? selection.rapportId ?? null;

  const refreshReportStatus = useCallback(async () => {
    if (!currentId) return;
    const { data: rapport, error } = await supabase
      .from('rapports')
      .select('statut_rapport, commentaire_correction')
      .eq('id', currentId)
      .single();

    if (!error && rapport) {
      setReportStatus(rapport.statut_rapport as StatutRapport);
      setCorrectionComment(rapport.commentaire_correction ?? '');
    }
  }, [currentId]);

  const handleValidate = async (reportId: string | null) => {
    if (!reportId) return false;
    try {
      const { error } = await supabase
        .from('rapports')
        .update({
          statut_rapport: 'VALIDE',
          date_validation: new Date().toISOString(),
          validateur_id: profile?.id ?? null,
        })
        .eq('id', reportId)
        .select();

      if (error) throw error;
      toast({ title: 'Validé', description: 'Le rapport a été validé avec succès.' });
      await refreshReportStatus();
      return true;
    } catch (err: any) {
      toast({ title: 'Erreur', description: err.message, variant: 'destructive' });
      return false;
    }
  };

  const handleReturnCorrection = async (reportId: string | null, correctionText: string) => {
    if (!reportId) return false;
    if (!correctionText.trim()) {
      toast({ title: 'Champ requis', description: 'Écris ce que le directeur doit corriger.', variant: 'destructive' });
      return false;
    }
    try {
      const { error: reportError } = await supabase
        .from('rapports')
        .update({
          statut_rapport: 'RETOUR_CORRECTION',
          commentaire_correction: correctionText.trim(),
        })
        .eq('id', reportId)
        .select();

      if (reportError) throw reportError;

      const { error: suiviError } = await supabase
        .from('suivi_remplissage')
        .update({ statut: 'EN_COURS' })
        .eq('rapport_id', reportId)
        .eq('statut', 'TERMINE');

      if (suiviError) throw suiviError;

      toast({ title: 'Retour correction', description: 'Le rapport a été renvoyé pour correction.' });
      await refreshReportStatus();
      return true;
    } catch (err: any) {
      toast({ title: 'Erreur', description: err.message, variant: 'destructive' });
      return false;
    }
  };

  const domainConfig = useMemo(() => {
    if (!selectionDone) return null;
    if (!selection.domain) return null;
    return getDomainConfig(selection.domain);
  }, [selection.domain, selectionDone]);

  if (authLoading) {
    return <AppLayout><div className="h-32 bg-muted/50 rounded-xl animate-pulse" /></AppLayout>;
  }

  if (!isDirector && !isEquipeRegional) {
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

  if (isDirector && !profile?.direction_id) {
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

  const activeDomaineRow = domaines.find(d => d.code === selection.domain);
  const domainLabel = activeDomaineRow ? (isAr ? activeDomaineRow.nom_ar : activeDomaineRow.nom_fr) : selection.domain;
  const periodLabel = `${isAr ? 'فصلي' : 'Trimestriel'} · ${selection.quarter?.toUpperCase() ?? ''}`;
  
  const isReview = isEquipeRegional && reviewMode;

  return (
    <AppLayout>
      {!selectionDone || !currentId || !domainConfig ? (
        <div className="space-y-5 sm:space-y-6 animate-fade-in" dir={isAr ? 'rtl' : 'ltr'}>
          <div className="relative overflow-hidden rounded-2xl gradient-hero p-5 sm:p-7 text-primary-foreground shadow-elegant">
            <div className="relative z-10">
              <h1 className="text-2xl sm:text-3xl font-extrabold leading-tight">{t('form.title')}</h1>
            </div>
            <div className="absolute -top-12 -end-12 w-48 h-48 rounded-full bg-secondary/30 blur-3xl" />
          </div>
          <PreFormSelection
            initial={selection}
            reportStatus={reportStatus}
            onStatusChange={(newStatus) => {
              setReportStatus(newStatus as StatutRapport);
            }}
            onValidate={() => handleValidate(currentId)}
            onReturnCorrection={(correctionText) => handleReturnCorrection(currentId, correctionText)}
            onComplete={(sel) => {
              setSelection(prev => ({
                ...prev,
                ...sel,
              }));
              setSelectionDone(true);
            }}
          />
        </div>
      ) : (
        <ActiveWizard 
          selection={selection}
          currentId={currentId}
          domainConfig={domainConfig}
          onBack={() => setSelectionDone(false)}
          domainLabel={domainLabel}
          periodLabel={periodLabel}
          isAr={isAr}
          isReview={isReview}
          reportStatus={reportStatus}
          onReturnCorrection={(correctionText) => handleReturnCorrection(currentId, correctionText)}
        />
      )}
    </AppLayout>
  );
};

export default Saisie;