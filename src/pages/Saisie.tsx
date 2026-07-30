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
  ChevronLeft, ChevronRight, Save, Send, ShieldAlert, Loader2, CheckCircle2, Pencil,
} from 'lucide-react';
import { useToast } from '@/hooks/common/use-toast';
import { supabase } from '@/integrations/supabase/client';

import { useDomainSubmission } from '@/hooks/common/useDomainSubmission';
import { SaveIndicator } from '@/components/form/SaveIndicator';
import { Stepper } from '@/components/form/Stepper';
import { PreFormSelection, type ReportSelection } from '@/components/wizard/PreFormSelection';
import { DEFAULT_YEAR } from '@/components/YearSwitcher';
import type { DomainConfig } from '@/config/wizard.types';
// Import de notre nouveau système de configuration
import { getDomainConfig } from '@/config/domainRegistry';
import type { ReportStatus } from '@/hooks/common/useDraftSubmission';
import { useDomaines } from '@/hooks/common/useDomaines';

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
  isAr 
}: { 
  selection: ReportSelection, currentId: string, domainConfig: DomainConfig, onBack: () => void, domainLabel: string, periodLabel: string, isAr: boolean 
}) => {
  const { t } = useTranslation();
  const { utilisateur: profile } = useAuth();
  const { toast } = useToast();

  const [step, setStep] = useState<number>(1);
  const [submitting, setSubmitting] = useState(false);
  const [localLocked, setLocalLocked] = useState(false);
  
  // 1. Un compteur pour signaler les changements de données
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // 2. On transmet ce trigger au système de complétude
  const completeness = domainConfig.useCompleteness(currentId, refreshTrigger);

  console.log("ACTIVE WIZARD selection =", selection);
console.log("ACTIVE WIZARD directionId =", selection.directionId);

  const domain = useDomainSubmission({
    rapportId: currentId,
    directionId: selection.directionId ?? profile?.direction_id ?? '',
    domaineId: domainConfig.id,
    completeness,
  });

  // On stocke l'ancienne valeur pour ne déclencher la sauvegarde QUE si le % a réellement changé
  const prevCompletenessRef = useRef(completeness);
  const isFirstRender = useRef(true);
  
  useEffect(() => {
    // 1. On ignore l'initialisation à l'ouverture de la page
    if (isFirstRender.current) {
      isFirstRender.current = false;
      prevCompletenessRef.current = completeness;
      return;
    }

    // 2. Si le score a vraiment changé
    if (prevCompletenessRef.current !== completeness) {
      prevCompletenessRef.current = completeness;
      
      // 3. On attend 1.5 seconde que tous les micro-chargements se terminent
      const timeoutId = setTimeout(() => {
        domain.saveNow().catch(err => console.error("Erreur auto-save complétude:", err));
      }, 1500);
      
      // 4. NETTOYAGE : Si le score re-change AVANT la fin des 1.5s, on annule le tir précédent
      return () => clearTimeout(timeoutId);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [completeness]);

  const isLocked = domain.isReadOnly || localLocked;

  const ensureEnCoursTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  //Encapsulation de la fonction mouvante dans une Ref
  const ensureEnCoursRef = useRef(domain.ensureEnCours);
  useEffect(() => {
    ensureEnCoursRef.current = domain.ensureEnCours;
  }, [domain.ensureEnCours]);

  // Identité mémoire 100% stable : Le tableau de dépendances est vide []
  const onActivityGlobal = useCallback(async () => {
    if (ensureEnCoursTimerRef.current) clearTimeout(ensureEnCoursTimerRef.current);
    
    ensureEnCoursTimerRef.current = setTimeout(async () => {
      try { 
        await ensureEnCoursRef.current(); 
      } catch (err) { 
        console.error(err); 
      }
      setRefreshTrigger(prev => prev + 1); 
    }, 1500); 
  }, []);

  const handleSaveDraft = async () => {

    console.log("CLICK SAVE");
    try {
      const ok = await domain.saveNow();

      console.log("RESULT =", ok);
      toast({
        title: ok ? t('form.save.draftSavedTitle') : t('form.save.draftErrorTitle'),
        variant: ok ? 'default' : 'destructive',
      });
    } catch (err) {
      console.error(err);
      toast({ title: 'Erreur', variant: 'destructive' });
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
    await handleSaveDraft();
    setStep(s => Math.min(domainConfig.steps.length, s + 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goPrev = () => {
    setStep(s => Math.max(1, s - 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
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

      {/* 2. RECAPITULATIF (Année, Trimestre, Domaine) */}
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

      {/* 3. BARRE DES ETAPES (STEPPER) */}
      <Card className="p-4 sm:p-5">
        <Stepper steps={domainConfig.steps} current={step} isAr={isAr} onJump={(id) => !isLocked && setStep(id)} />
      </Card>

      {/* 4. BARRE DE PROGRESSION COLLANTE */}
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

      {/* 6. BARRE D'ACTIONS FLOTTANTE (BOTTOM) */}
      <div className="fixed bottom-0 inset-x-0 z-40 bg-card/95 backdrop-blur border-t border-border">
        <div className="container py-3 flex items-center justify-between gap-2">
          <Button variant="outline" size="sm" onClick={goPrev} disabled={step === 1} className="gap-1.5">
            {isAr ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            <span className="hidden sm:inline">{t('common.previous')}</span>
          </Button>

          <div className="flex items-center gap-2">
            {!isLocked && (
              <Button variant="outline" size="sm" onClick={handleSaveDraft} disabled={domain.saveState === 'saving'} className="gap-1.5">
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
              !isLocked && (
                <Button size="sm" onClick={handleSubmit} disabled={domain.saveState === 'saving' || submitting} className="gap-1.5">
                  <Send className="h-4 w-4" />
                  {t('form.actions.completeDomain')}
                </Button>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
// =========================================================================
// 2. LE COMPOSANT PRINCIPAL
// =========================================================================
const Saisie = () => {
  // 1. TOUS les hooks inconditionnels obligatoirement en haut
  const { t, i18n } = useTranslation();
  const { 
    utilisateur: profile,
    isPrefectoral: isDirector,
    isEquipeRegional,
    loading: authLoading
} = useAuth();
  const { domaines } = useDomaines(); // ✅ Placé tout en haut pour fixer l'ordre des hooks
  const [searchParams] = useSearchParams();

  const reviewMode = searchParams.get("mode") === "review";
  const rapportIdFromUrl = searchParams.get("rapport");
  const isAr = i18n.language === 'ar';

  const [selectionDone, setSelectionDone] = useState(false);
  const [selection, setSelection] = useState<ReportSelection>({
    year: DEFAULT_YEAR,
    quarter: 't1',
    domain: 'jeunesse',
  });

  useEffect(() => {
  if (!reviewMode || !rapportIdFromUrl) return;

  const loadReport = async () => {
    const { data: rapport } = await supabase
      .from("rapports")
      .select("id, annee, trimestre, direction_id")
      .eq("id", rapportIdFromUrl)
      .single();

      console.log("rapport =", rapport);

    if (!rapport) return;

    console.log("RAPPORT =", rapport);
    setSelection({
      rapportId: rapport.id,
      year: rapport.annee,
      quarter: rapport.trimestre,
      directionId: rapport.direction_id,
      domain: "",
   });

   console.log("direction from report =", rapport.direction_id);

    setSelectionDone(true);
  };

  loadReport();
}, [reviewMode, rapportIdFromUrl]);

  const currentId = rapportIdFromUrl ?? selection.rapportId ?? null;

  console.log("selection =", selection);

  // Configuration mémorisée
  const domainConfig = useMemo(() => {
  if (!selectionDone) return null;
  if (!selection.domain) return null;

  return getDomainConfig(selection.domain);
}, [selection.domain, selectionDone]);

  // 2. Les gardes de sécurité (Loading / Rôles)
  if (authLoading) {
    return <AppLayout><div className="h-32 bg-muted/50 rounded-xl animate-pulse" /></AppLayout>;
  }

  console.log({
  isDirector,
  isEquipeRegional,
  profile,
  directionId: profile?.direction_id,
});

  // أي دور آخر ممنوع
if (!isDirector && !isEquipeRegional) {
  return (
    <AppLayout>
      <Card className="p-8 text-center max-w-md mx-auto">
        <ShieldAlert className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
        <h2 className="font-bold text-lg">{t('form.forbidden.title')}</h2>
        <p className="text-sm text-muted-foreground mt-2">
          {t('form.forbidden.body')}
        </p>
      </Card>
    </AppLayout>
  );
}

// المدير الإقليمي خاصو direction_id
if (isDirector && !profile?.direction_id) {
  return (
    <AppLayout>
      <Card className="p-8 text-center max-w-md mx-auto">
        <ShieldAlert className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
        <h2 className="font-bold text-lg">{t('form.forbidden.title')}</h2>
        <p className="text-sm text-muted-foreground mt-2">
          {t('form.forbidden.body')}
        </p>
      </Card>
    </AppLayout>
  );
}

  const activeDomaineRow = domaines.find(d => d.code === selection.domain);
  const domainLabel = activeDomaineRow ? (isAr ? activeDomaineRow.nom_ar : activeDomaineRow.nom_fr) : selection.domain;
  const periodLabel = `${isAr ? 'فصلي' : 'Trimestriel'} · ${selection.quarter?.toUpperCase() ?? ''}`;

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
        />
      )}
    </AppLayout>
  );
};

export default Saisie;