/** Validation d'une valeur numérique : entier ≥ 0, < 10 millions. */
export const validateNumericField = (raw: string): { value: number; error: string | null } => {
  if (raw === '' || raw === null || raw === undefined) return { value: 0, error: null };
  const n = Number(String(raw).replace(/\s/g, '').replace(',', '.'));
  if (!Number.isFinite(n)) return { value: 0, error: 'invalid' };
  if (n < 0) return { value: 0, error: 'negative' };
  if (n > 10_000_000) return { value: 0, error: 'tooLarge' };
  if (!Number.isInteger(n)) return { value: Math.round(n), error: null };
  return { value: n, error: null };
};

/** Calcule le pourcentage de complétude (champs > 0 sur total). */
/** Completion is now measured with logical fields, not raw numeric magnitude. */
export interface StepCompletion {
  completedFields: number;
  totalFields: number;
}

export const clampPercentage = (value: number): number =>
  Math.max(0, Math.min(100, Math.round(value)));

export const hasValue = (value: unknown): boolean => {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (typeof value === 'number') return Number.isFinite(value);
  if (typeof value === 'boolean') return value;
  if (Array.isArray(value)) return value.length > 0;
  return true;
};

export const hasPositiveNumber = (value: number | null | undefined): boolean =>
  Number(value ?? 0) > 0;

export const hasText = (value?: string | null): boolean =>
  typeof value === 'string' && value.trim().length > 0;

export const countCompleted = (checks: boolean[]): StepCompletion => ({
  completedFields: checks.filter(Boolean).length,
  totalFields: checks.length,
});

/**
 * Completion is based on meaningful filled data, not quantitative totals.
 * Each step contributes completed/total logical fields; numeric magnitudes never
 * increase the weight of a completed section.
 */
export const computeCompleteness = (steps: StepCompletion[]): number => {
  const totals = steps.reduce(
    (acc, step) => ({
      completedFields: acc.completedFields + Math.max(0, step.completedFields),
      totalFields: acc.totalFields + Math.max(0, step.totalFields),
    }),
    { completedFields: 0, totalFields: 0 },
  );

  if (totals.totalFields === 0) return 0;
  return clampPercentage((totals.completedFields / totals.totalFields) * 100);
};