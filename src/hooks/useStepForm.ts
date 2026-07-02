import { useCallback, useEffect, useRef, useState } from 'react';
import {
  useForm,
  type DefaultValues,
  type FieldValues,
  type UseFormReturn,
} from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { ZodType } from 'zod';
import { useAutoSave } from '@/hooks/useAutoSave';

export interface UseStepFormOptions<T extends FieldValues> {
  schema: ZodType<T>;
  data?: T;
  defaultValues: T;
  onSave?: (values: T) => Promise<boolean>;
  onActivity?: () => Promise<void>;
  disabled?: boolean;
  autoSaveDebounceMs?: number;
  autoSaveEnabled?: boolean;
}

export interface UseStepFormResult<T extends FieldValues> {
  form: UseFormReturn<T>;
  initialized: boolean;
  submit: () => Promise<void>;
}

export function useStepForm<T extends FieldValues = FieldValues>(
  options: UseStepFormOptions<T>,
): UseStepFormResult<T> {
  const {
    schema,
    data,
    defaultValues,
    onSave,
    onActivity,
    disabled = false,
    autoSaveDebounceMs = 1500,
    autoSaveEnabled = true,
  } = options;

  const defaultValuesRef = useRef(defaultValues);
  const form = useForm<T>({
    resolver: zodResolver(schema),
    defaultValues: defaultValuesRef.current as DefaultValues<T>,
  });

  const [initialized, setInitialized] = useState(false);
  const initializedRef = useRef(false);
  const hasResetRef = useRef(false);
  const onSaveRef = useRef(onSave);
  const onActivityRef = useRef(onActivity);
  const [watchedValues, setWatchedValues] = useState<T>(defaultValuesRef.current);

  // Keep defaultValuesRef in sync with prop changes
  useEffect(() => {
    defaultValuesRef.current = defaultValues;
  }, [defaultValues]);

  useEffect(() => {
    onSaveRef.current = onSave;
  }, [onSave]);

  useEffect(() => {
    onActivityRef.current = onActivity;
  }, [onActivity]);

  useEffect(() => {
    if (data && !hasResetRef.current) {
      form.reset({
        ...defaultValuesRef.current,
        ...data,
      });

      hasResetRef.current = true;
      initializedRef.current = true;
      setInitialized(true);
      return;
    }

    if (!data && !initializedRef.current) {
      initializedRef.current = true;
      setInitialized(true);
    }
  }, [data, form]);

  useEffect(() => {
    if (!autoSaveEnabled || disabled || !onSave) return;

    const subscription = form.watch((value) => {
      setWatchedValues(value as T);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [autoSaveEnabled, disabled, onSave, form]);

  const handleAutoSave = useCallback(
    async (values: T) => {
      if (!onSaveRef.current || disabled) {
        return false;
      }

      // أولاً: خليه يدير EN_COURS
      if (onActivityRef.current) {
        await onActivityRef.current();
      }

      // ثانياً: سجل البيانات
      return await onSaveRef.current(values);
    },
    [disabled],
  );

  useAutoSave(watchedValues, handleAutoSave, {
    enabled: autoSaveEnabled && initialized && !disabled && !!onSave,
    debounceMs: autoSaveDebounceMs,
    // Note: Default compare is shallow and works for flat form values.
    // For nested form values, pass a custom compare function.
  });

  const submit = useCallback(async () => {
    if (disabled || !onSaveRef.current) return;

    await form.handleSubmit(async (values: T) => {
      if (onActivityRef.current) {
        await onActivityRef.current();
      }

      const success = await onSaveRef.current!(values);

      if (!success) {
        throw new Error('Enregistrement échoué');
      }
    })();
  }, [disabled, form]);

  return {
    form,
    initialized,
    submit,
  };
}
