import { useEffect, useRef, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ReportStatus = 'NON_COMMENCE' | 'EN_COURS' | 'TERMINE';
export type SaveState = 'idle' | 'saving' | 'saved' | 'error';

interface UseDraftOpts {
  rapportId: string;
  directionId: string;
  domain: string;
  completeness?: number;
  debounceMs?: number;
}

const DOMAIN_IDS = {
  jeunesse: '6a3a9ab9-2f5a-4775-a09e-ca4b4a6a8349',
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

export const useDraftSubmission = ({
  rapportId,
  directionId,
  domain,
  completeness = 0,
  debounceMs = 2000,
}: UseDraftOpts) => {
  const [status, setStatus] = useState<ReportStatus>('NON_COMMENCE');
  const [loading, setLoading] = useState(true);
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Keep a ref to the current status so persist() always reads the latest value
  // without being re-created on every status change.
  const statusRef = useRef<ReportStatus>(status);
  useEffect(() => { statusRef.current = status; }, [status]);

  // ── Load existing suivi_remplissage on mount ──────────────────────────────

  useEffect(() => {
    if (!rapportId || !directionId || !domain) {
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
        .eq('domaine_id', domain)
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
  }, [rapportId, directionId, domain]);

  // ── Core persist (UPSERT) ─────────────────────────────────────────────────

  /**
   * Writes the current status into suivi_remplissage via UPSERT.
   * If the report is already TERMINE, calling persist() is a no-op.
   */
  const persist = useCallback(async (overrideStatus?: ReportStatus): Promise<boolean> => {
    const effectiveStatus = overrideStatus ?? statusRef.current;

    // Guard: never overwrite a TERMINE record except when explicitly submitting.
    if (statusRef.current === 'TERMINE' && overrideStatus !== 'TERMINE') {
      return true;
    }

    if (!rapportId || !directionId || !domain) {
      setErrorMsg('Identifiants manquants (rapport, direction ou domaine).');
      setSaveState('error');
      return false;
    }

    setSaveState('saving');
    setErrorMsg(null);

    try {
      const { error } = await supabase
        .from('suivi_remplissage')
        .upsert(
          {
            rapport_id: rapportId,
            direction_id: directionId,
            domaine_id: DOMAIN_IDS['jeunesse'],
            statut: effectiveStatus,
            progression_pourcentage: Math.round(completeness),
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'rapport_id,direction_id,domaine_id' },
        );

      if (error) throw error;

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
  }, [rapportId, directionId, domain, completeness]);

  // ── Public API ────────────────────────────────────────────────────────────

  /**
   * Call this whenever the user modifies data.
   * Marks the report EN_COURS and schedules a debounced persist.
   * No-op if the report is already TERMINE.
   */
  const update = useCallback(() => {
    if (statusRef.current === 'TERMINE') return;

    setStatus('EN_COURS');

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => persist('EN_COURS'), debounceMs);
  }, [persist, debounceMs]);

  /**
   * Flush pending debounce and persist immediately.
   * No-op if the report is TERMINE.
   */
  const saveNow = useCallback(async (): Promise<boolean> => {
    if (statusRef.current === 'TERMINE') return true;
    if (timerRef.current) clearTimeout(timerRef.current);
    return persist('EN_COURS');
  }, [persist]);

  /**
   * Finalise the report:
   * 1. Cancels pending debounce.
   * 2. Persists with status TERMINE.
   * 3. Locks future edits.
   */
  const submit = useCallback(async (): Promise<boolean> => {
    if (timerRef.current) clearTimeout(timerRef.current);

    const ok = await persist('TERMINE');
    if (ok) setStatus('TERMINE');
    return ok;
  }, [persist]);

  // Clean up debounce on unmount
  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  return {
    // State
    status,
    loading,
    saveState,
    lastSavedAt,
    errorMsg,
    isReadOnly: status === 'TERMINE',
    // Actions
    update,
    saveNow,
    submit,
    // Stable alias kept for backward-compat with existing consumers
    submissionId: rapportId,
    /** Réservé à l’UI (progression) ; non calculé par ce hook pour l’instant. */
    completeness: 0,
  };
};