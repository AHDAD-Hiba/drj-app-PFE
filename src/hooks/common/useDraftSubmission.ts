import { useEffect, useRef, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/common/useAuth';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ReportStatus = 'NON_COMMENCE' | 'EN_COURS' | 'TERMINE';
export type SaveState = 'idle' | 'saving' | 'saved' | 'error';

interface UseDraftOpts {
  rapportId: string;
  directionId: string;
  domaineId: string;
  completeness?: number;
  debounceMs?: number;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export const useDraftSubmission = ({
  rapportId,
  directionId,
  domaineId,
  completeness = 0,
  debounceMs = 2000,
}: UseDraftOpts) => {

  const { isEquipeRegional } = useAuth();

  const [status, setStatus] = useState<ReportStatus>('NON_COMMENCE');
  const [loading, setLoading] = useState(true);
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const statusRef = useRef<ReportStatus>(status);
  
  useEffect(() => { statusRef.current = status; }, [status]);

  // 🆕 Clé unique pour identifier ce brouillon dans le LocalStorage
  const localStorageKey = `draft-progress-${rapportId}-${directionId}-${domaineId}`;

  // ── Load existing suivi_remplissage on mount ──────────────────────────────

  useEffect(() => {
    if (!rapportId || !directionId || !domaineId) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    (async () => {
      const { data, error } = await supabase
        .from('suivi_remplissage')
        .select('statut, updated_at')
        .eq('rapport_id', rapportId)
        .eq('direction_id', directionId)
        .eq('domaine_id', domaineId)
        .maybeSingle();

      if (cancelled) return;

      if (error) {
        console.error('[useDraftSubmission] load error:', error.message);
        
        // 🆕 Fallback Hors-ligne : Si la requête Supabase échoue, lire le statut local
        const localDraft = localStorage.getItem(localStorageKey);
        if (localDraft) {
          try {
            const parsed = JSON.parse(localDraft);
            if (parsed.status) setStatus(parsed.status);
          } catch (e) {
            console.error("Erreur lecture brouillon local", e);
          }
        }
      } else if (data) {
        setStatus(data.statut as ReportStatus);
        setLastSavedAt(
          data.updated_at
            ? new Date(
                new Date(data.updated_at).toLocaleString('en-US', {
                  timeZone: 'Africa/Casablanca',
                })
              )
            : null
        );
      }

      setLoading(false);
    })();

    return () => { cancelled = true; };
  }, [rapportId, directionId, domaineId, localStorageKey]);

  // ── Core persist (UPSERT + LocalStorage Fallback) ──────────────────────────

  const persist = useCallback(async (overrideStatus?: ReportStatus): Promise<boolean> => {
    if (isEquipeRegional) {
      return false; 
    }

    const effectiveStatus = overrideStatus ?? statusRef.current;

    if (statusRef.current === 'TERMINE' && overrideStatus !== 'TERMINE') {
      return true;
    }

    if (!rapportId || !directionId || !domaineId) {
      setErrorMsg('Identifiants manquants (rapport, direction ou domaine).');
      setSaveState('error');
      return false;
    }

    setSaveState('saving');
    setErrorMsg(null);

    // 🆕 SAUVEGARDE DE SECOURS LOCALE INSTANTANÉE
    const localPayload = {
      status: effectiveStatus,
      completeness: Math.round(completeness),
      timestamp: new Date().toISOString()
    };
    localStorage.setItem(localStorageKey, JSON.stringify(localPayload));

    // 🆕 Vérification du réseau avant la tentative Supabase
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setSaveState('error');
      setErrorMsg('Mode Hors-Ligne : Brouillon conservé sur l\'appareil.');
      return false;
    }

    try {
      const { error } = await supabase
        .from('suivi_remplissage')
        .upsert(
          {
            rapport_id: rapportId,
            direction_id: directionId,
            domaine_id: domaineId,
            statut: effectiveStatus,
            progression_pourcentage: Math.round(completeness),
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'rapport_id,direction_id,domaine_id' }
        )
        .select();

      if (error) throw error;

      if (effectiveStatus === 'EN_COURS') {
        supabase
          .from('rapports')
          .update({ statut_rapport: 'EN_COURS' })
          .eq('id', rapportId)
          .eq('statut_rapport', 'NON_COMMENCE') 
          .then(({ error: rapportError }) => {
            if (rapportError) {
              console.error('[useDraftSubmission] Erreur mise à jour du rapport global:', rapportError);
            }
          });
      }

      // 🆕 SUCCÈS RÉSEAU : On peut supprimer la copie locale temporaire
      if (effectiveStatus === 'TERMINE') {
        localStorage.removeItem(localStorageKey);
      }

      setLastSavedAt(
        new Date(
          new Date().toLocaleString('en-US', {
            timeZone: 'Africa/Casablanca',
          })
        )
      );
      setSaveState('idle');
      return true;
    } catch (err: any) {
      setSaveState('error');
      setErrorMsg(err.message ?? 'Erreur lors de la sauvegarde. Brouillon local conservé.');
      return false;
    }
  }, [rapportId, directionId, domaineId, completeness, isEquipeRegional, localStorageKey]);

  // ── Public API ────────────────────────────────────────────────────────────

  const update = useCallback(() => {
    if (statusRef.current === 'TERMINE' || isEquipeRegional) return;

    const isInitialTransition = statusRef.current === 'NON_COMMENCE';
    setStatus('EN_COURS');

    if (timerRef.current) clearTimeout(timerRef.current);

    if (isInitialTransition) {
      persist('EN_COURS').then(ok => {
        if (!ok) console.warn('[useDraftSubmission] Impossible de persister le statut EN_COURS');
      });
    } else {
      timerRef.current = setTimeout(() => persist('EN_COURS'), debounceMs);
    }
  }, [persist, debounceMs, isEquipeRegional]);

  const saveNow = useCallback(async (): Promise<boolean> => {
    if (statusRef.current === 'TERMINE' || isEquipeRegional) return true;
    if (timerRef.current) clearTimeout(timerRef.current);
    return persist('EN_COURS');
  }, [persist, isEquipeRegional]);

  const submit = useCallback(async (): Promise<boolean> => {
    if (isEquipeRegional) return false;
    if (timerRef.current) clearTimeout(timerRef.current);

    const ok = await persist('TERMINE');
    if (ok) setStatus('TERMINE');
    return ok;
  }, [persist, isEquipeRegional]);

  const ensureEnCours = useCallback(async (): Promise<boolean> => {
    if (statusRef.current !== 'NON_COMMENCE' || isEquipeRegional) {
      return true;
    }

    setStatus('EN_COURS');
    statusRef.current = 'EN_COURS';
    return persist('EN_COURS');
  }, [persist, isEquipeRegional]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') void saveNow();
    };
    const handleBeforeUnload = () => { void saveNow(); };

    window.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [saveNow]);

  return {
    status,
    loading,
    saveState,
    lastSavedAt,
    errorMsg,
    isReadOnly: status === 'TERMINE' || isEquipeRegional,
    update,
    saveNow,
    submit,
    ensureEnCours,
    submissionId: rapportId,
    completeness: 0,
  };
};