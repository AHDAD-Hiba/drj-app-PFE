import { useCallback } from 'react';
import { useDraftSubmission } from './useDraftSubmission';

/**
 * Central orchestrator for domain workflow.
 *
 * Responsibilities:
 * - manage suivi_remplissage status
 * - autosave draft state
 * - submit / lock workflow
 * - expose readonly state
 *
 * IMPORTANT:
 * Entry tables are already persisted directly by useSubmissionEntries.
 * This hook DOES NOT manage DB rows anymore.
 */
export interface UseDomainSubmissionOpts {
  rapportId: string;
  directionId: string;
  domaineId: string;
  debounceMs?: number;
  completeness?: number;

}

export const useDomainSubmission = ({
  rapportId,
  directionId,
  domaineId,
  debounceMs = 2000,
  completeness = 0,
}: UseDomainSubmissionOpts) => {
  /**
   * Draft/status manager
   */
  const draft = useDraftSubmission({
    rapportId,
    directionId,
    domaineId,
    completeness,
    debounceMs,
  });

  /**
   * Called whenever user changes data.
   * Only updates workflow status (EN_COURS).
   *
   * DB rows are already persisted directly
   * by useSubmissionEntries.
   */
  const update = useCallback(async (): Promise<void> => {
    draft.update();
  }, [draft]);

  /**
   * Force immediate draft persistence.
   * Does NOT save entries because entries
   * are already saved directly to DB.
   */
  const saveNow = useCallback(async (): Promise<boolean> => {
    return draft.saveNow();
  }, [draft]);

  /**
   * Final submission:
   * - mark workflow as TERMINE
   * - lock future edits
   */
  const submit = useCallback(async (): Promise<boolean> => {
    return draft.submit();
  }, [draft]);

  /**
   * Force immediate persistence of EN_COURS status.
   * Prevents RLS race conditions on metadata table UPSERTs.
   */
  const ensureEnCours = useCallback(async (): Promise<boolean> => {
    return draft.ensureEnCours();
  }, [draft]);

  return {
    // Status
    status: draft.status,
    loading: draft.loading,
    saveState: draft.saveState,
    lastSavedAt: draft.lastSavedAt,
    errorMsg: draft.errorMsg,
    isReadOnly: draft.isReadOnly,

    // Actions
    update,
    saveNow,
    submit,
    ensureEnCours,
    
    completeness,
  };
};