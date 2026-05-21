import { forwardRef, useImperativeHandle, useMemo, memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Controller } from 'react-hook-form';

import { Card } from '@/components/ui/card';
import { Form } from '@/components/ui/form';
import { NumericField } from '@/components/form/NumericField';

import {
  permanentActivitySchema,
  PermanentActivityFormValues,
} from '@/lib/schemas';
import { useStepForm } from '@/hooks/useStepForm';

interface Step1PermanentProps {
  data?: PermanentActivityFormValues & { id?: string };
  onSave?: (values: PermanentActivityFormValues) => Promise<boolean>;
  onActivity?: () => Promise<void>;
  disabled?: boolean;
}

export interface Step1PermanentRef {
  submit: () => Promise<void>;
}

export const Step1Permanent = memo(forwardRef<
  Step1PermanentRef,
  Step1PermanentProps
>(({ data, onSave, onActivity, disabled }, ref) => {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  const defaultValues = useMemo((): PermanentActivityFormValues => ({
    nombre_associations: 0,
    nombre_conventions: 0,
    nombre_clubs: 0,
    activites_educatives: 0,
    activites_culturelles: 0,
    activites_sportives: 0,
    renforcement_capacites: 0,
  }), []);

  const { form, submit } = useStepForm<PermanentActivityFormValues>({
    schema: permanentActivitySchema,
    data,
    defaultValues,
    onSave,
    onActivity,
    disabled,
    autoSaveDebounceMs: 1500,
    autoSaveEnabled: !disabled && !!onSave,
  });

  const { control, formState: { isSubmitting } } = form;

  useImperativeHandle(ref, () => ({
    submit,
  }));

  // force positive values
  const handlePositiveChange = (
    val: any,
    onChange: (v: number) => void
  ) => {
    const num = Number(val);
    onChange(Math.max(0, num));
  };

  return (
    <Card className="p-5 sm:p-6 shadow-sm border-border/60">
      <div className="mb-6">
        <h3 className="text-xl font-bold text-foreground">
          {isAr
            ? 'الأنشطة الدائمة'
            : 'Activités permanentes'}
        </h3>

        <p className="text-sm text-muted-foreground">
          {isAr
            ? 'النوادي والأنشطة الدائمة'
            : 'Clubs et activités permanentes'}
        </p>
      </div>

      <Form {...form}>
        <form 
        id="step1-form"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        className="space-y-8">
          {/* Groupe 1 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <Controller
              control={control}
              name="nombre_associations"
              render={({ field }) => (
                <NumericField
                  label={t(
                    'form.permanent.nombreAssociations'
                  )}
                  value={field.value}
                  onChange={(v) =>
                    handlePositiveChange(
                      v,
                      field.onChange
                    )
                  }
                  disabled={disabled || isSubmitting}
                />
              )}
            />

            <Controller
              control={control}
              name="nombre_clubs"
              render={({ field }) => (
                <NumericField
                  label={t(
                    'form.permanent.nombreClubs'
                  )}
                  value={field.value}
                  onChange={(v) =>
                    handlePositiveChange(
                      v,
                      field.onChange
                    )
                  }
                  disabled={disabled || isSubmitting}
                />
              )}
            />

            <Controller
              control={control}
              name="nombre_conventions"
              render={({ field }) => (
                <NumericField
                  label={t(
                    'form.permanent.nombreConventions'
                  )}
                  value={field.value}
                  onChange={(v) =>
                    handlePositiveChange(
                      v,
                      field.onChange
                    )
                  }
                  disabled={disabled || isSubmitting}
                />
              )}
            />
          </div>

          {/* Groupe 2 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <Controller
              control={control}
              name="activites_educatives"
              render={({ field }) => (
                <NumericField
                  label={t(
                    'form.permanent.activitesEducatives'
                  )}
                  value={field.value}
                  onChange={(v) =>
                    handlePositiveChange(
                      v,
                      field.onChange
                    )
                  }
                  disabled={disabled || isSubmitting}
                />
              )}
            />

            <Controller
              control={control}
              name="activites_culturelles"
              render={({ field }) => (
                <NumericField
                  label={t(
                    'form.permanent.activitesCulturelles'
                  )}
                  value={field.value}
                  onChange={(v) =>
                    handlePositiveChange(
                      v,
                      field.onChange
                    )
                  }
                  disabled={disabled || isSubmitting}
                />
              )}
            />

            <Controller
              control={control}
              name="activites_sportives"
              render={({ field }) => (
                <NumericField
                  label={t(
                    'form.permanent.activitesSportives'
                  )}
                  value={field.value}
                  onChange={(v) =>
                    handlePositiveChange(
                      v,
                      field.onChange
                    )
                  }
                  disabled={disabled || isSubmitting}
                />
              )}
            />

            <Controller
              control={control}
              name="renforcement_capacites"
              render={({ field }) => (
                <NumericField
                  label={t(
                    'form.permanent.renforcementCapacites'
                  )}
                  value={field.value}
                  onChange={(v) =>
                    handlePositiveChange(
                      v,
                      field.onChange
                    )
                  }
                  disabled={disabled || isSubmitting}
                />
              )}
            />
          </div>
          <button type="submit" hidden />
        </form>
      </Form>
    </Card>
  );
}));

Step1Permanent.displayName = 'Step1Permanent';