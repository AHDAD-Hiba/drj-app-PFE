import { useEffect, useRef, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/common/useAuth'; // 🆕 Importation de useAuth pour l'équipe régionale

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

  // 🆕 Récupération du statut de l'utilisateur (Équipe régionale)
  const { isEquipeRegional } = useAuth();

  const [status, setStatus] = useState<ReportStatus>('NON_COMMENCE');
  const [loading, setLoading] = useState(true);
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // Keep a ref to the current status so persist() always reads the latest value
  const statusRef = useRef<ReportStatus>(status);
  useEffect(() => { statusRef.current = status; }, [status]);

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
  }, [rapportId, directionId, domaineId]);

  // ── Core persist (UPSERT) ─────────────────────────────────────────────────

  const persist = useCallback(async (overrideStatus?: ReportStatus): Promise<boolean> => {
    // 🛑 SÉCURITÉ : L'équipe régionale ne doit JAMAIS sauvegarder de modifications
    if (isEquipeRegional) {
      return false; 
    }

    const effectiveStatus = overrideStatus ?? statusRef.current;

    // Guard: never overwrite a TERMINE record except when explicitly submitting.
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

    try {
      const { data, error } = await supabase
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

      // Mise à jour du statut global du rapport
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
      setErrorMsg(err.message ?? 'Erreur inconnue lors de la sauvegarde.');
      return false;
    }
  }, [rapportId, directionId, domaineId, completeness, isEquipeRegional]);

  // ── Public API ────────────────────────────────────────────────────────────

  const update = useCallback(() => {
    if (statusRef.current === 'TERMINE' || isEquipeRegional) return; // 🛑 Bloqué pour l'équipe régionale

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
    if (statusRef.current === 'TERMINE' || isEquipeRegional) return true; // 🛑 Bloqué pour l'équipe régionale
    if (timerRef.current) clearTimeout(timerRef.current);
    return persist('EN_COURS');
  }, [persist, isEquipeRegional]);

  const submit = useCallback(async (): Promise<boolean> => {
    if (isEquipeRegional) return false; // 🛑 Bloqué pour l'équipe régionale
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

  // Clean up debounce on unmount
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
    // State
    status,
    loading,
    saveState,
    lastSavedAt,
    errorMsg,
    
    // 🛡️ CRITIQUE : Force la "Lecture Seule" si l'utilisateur est de l'équipe régionale,
    // ou si le statut est déjà terminé.
    isReadOnly: status === 'TERMINE' || isEquipeRegional,
    
    // Actions
    update,
    saveNow,
    submit,
    ensureEnCours,
    submissionId: rapportId,
    completeness: 0,
  };
};