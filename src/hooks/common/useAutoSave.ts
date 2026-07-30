import { useCallback, useEffect, useRef } from 'react';

export interface UseAutoSaveOptions<T> {
  enabled?: boolean;
  debounceMs?: number;
  compare?: (prev: T, next: T) => boolean;
}

const defaultCompare = <T extends Record<string, any>>(prev: T, next: T) => {
  const prevKeys = Object.keys(prev);
  const nextKeys = Object.keys(next);

  if (prevKeys.length !== nextKeys.length) return false;

  return prevKeys.every((key) => prev[key] === next[key]);
};

export function useAutoSave<T>(
  values: T,
  onSave?: (values: T) => Promise<boolean>,
  options: UseAutoSaveOptions<T> = {},
) {
  const {
    enabled = true,
    debounceMs = 1500,
    compare = defaultCompare,
  } = options;

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const previousValuesRef = useRef<T | null>(null);
  const onSaveRef = useRef(onSave);
  const latestValuesRef = useRef(values);
  const isSavingRef = useRef(false);
  const pendingFlushRef = useRef(false);

  useEffect(() => {
    onSaveRef.current = onSave;
  }, [onSave]);

  useEffect(() => {
    latestValuesRef.current = values;
  }, [values]);

  const flush = useCallback(async () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    if (!enabled || !onSaveRef.current) {
      return false;
    }

    if (isSavingRef.current) {
      pendingFlushRef.current = true;
      return false;
    }

    const saveFn = onSaveRef.current;
    isSavingRef.current = true;

    try {
      const success = await saveFn(latestValuesRef.current);
      if (success) {
        previousValuesRef.current = latestValuesRef.current;
      }
      return success;
    } finally {
      isSavingRef.current = false;

      if (pendingFlushRef.current) {
        pendingFlushRef.current = false;

        if (
          previousValuesRef.current === null ||
          !compare(previousValuesRef.current, latestValuesRef.current)
        ) {
          void flush();
        }
      }
    }
  }, [compare, enabled]);

  useEffect(() => {
    if (!enabled || !onSaveRef.current) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      return;
    }

    if (previousValuesRef.current === null) {
      previousValuesRef.current = values;
      return;
    }

    if (compare(previousValuesRef.current, values)) {
      return;
    }

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      void flush();
    }, debounceMs);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [values, enabled, debounceMs, compare, flush]);

  return { flush };
}
