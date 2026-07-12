import { useEffect, useRef } from 'react';

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

  useEffect(() => {
    onSaveRef.current = onSave;
  }, [onSave]);

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

    timeoutRef.current = setTimeout(async () => {
      const saveFn = onSaveRef.current;
      if (!saveFn) return;

      const success = await saveFn(values);

      if (success) {
        previousValuesRef.current = values;
      }

      timeoutRef.current = null;
    }, debounceMs);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [values, enabled, debounceMs, compare]);
}