import {
  forwardRef,
  useImperativeHandle,
  useMemo,
  memo
} from 'react';
import { useTranslation } from 'react-i18next';
import { Controller } from 'react-hook-form';

import { Card } from '@/components/ui/card';
import { Form } from '@/components/ui/form';
import { NumericField } from '@/components/form/NumericField';

import {
  rayonanteActivitySchema,
  type RayonanteActivityFormValues,
} from '@/lib/schemas';
import { useStepForm } from '@/hooks/useStepForm';

interface Step2RayonanteProps {
  data?: RayonanteActivityFormValues & { id?: string };
  onSave?: (values: RayonanteActivityFormValues) => Promise<boolean>;
  onActivity?: () => Promise<void>;
  disabled?: boolean;
}

export interface Step2RayonanteRef {
  submit: () => Promise<void>;
}

export const Step2Rayonante = memo(forwardRef<
  Step2RayonanteRef,
  Step2RayonanteProps
>(({ data, onSave, onActivity, disabled }, ref) => {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  

  const defaultValues = useMemo((): RayonanteActivityFormValues => ({
    activites_educatives: 0,
    activites_culturelles: 0,
    activites_sportives: 0,
    renforcement_capacites: 0,
  }), []);

  const { form, submit } = useStepForm<RayonanteActivityFormValues>({
    schema: rayonanteActivitySchema,
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

  const handlePositiveChange = (val: any, onChange: (v: number) => void) => {
    const num = Number(val);
    onChange(Math.max(0, num));
  };

  return (
    <Card className="p-5 sm:p-6 shadow-sm border-border/60">
      <div className="mb-6">
        <h3 className="text-xl font-bold text-foreground">
          {isAr ? 'الأنشطة الإشعاعية' : 'Activités rayonnantes'}
        </h3>
        <p className="text-sm text-muted-foreground">
          {isAr ? 'الأنشطة الإشعاعية حسب النوع' : 'Activités rayonnantes par type'}
        </p>
      </div>

      <Form {...form}>
        <form
          id="step2-form"
          onSubmit={(event) => {
            event.preventDefault();
            submit();
          }}
          className="space-y-8"
        >
          {/* Grille avec le même style que Step 1 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6">
            <Controller
              control={control}
              name="activites_educatives"
              render={({ field }) => (
                <NumericField
                  label={t('form.permanent.activitesEducatives')}
                  value={field.value}
                  onChange={(v) => handlePositiveChange(v, field.onChange)}
                  disabled={disabled || isSubmitting}
                />
              )}
            />

            <Controller
              control={control}
              name="activites_culturelles"
              render={({ field }) => (
                <NumericField
                  label={t('form.permanent.activitesCulturelles')}
                  value={field.value}
                  onChange={(v) => handlePositiveChange(v, field.onChange)}
                  disabled={disabled || isSubmitting}
                />
              )}
            />

            <Controller
              control={control}
              name="activites_sportives"
              render={({ field }) => (
                <NumericField
                  label={t('form.permanent.activitesSportives')}
                  value={field.value}
                  onChange={(v) => handlePositiveChange(v, field.onChange)}
                  disabled={disabled || isSubmitting}
                />
              )}
            />

            <Controller
              control={control}
              name="renforcement_capacites"
              render={({ field }) => (
                <NumericField
                  label={t('form.permanent.renforcementCapacites')}
                  value={field.value}
                  onChange={(v) => handlePositiveChange(v, field.onChange)}
                  disabled={disabled || isSubmitting}
                />
              )}
            />
          </div>
          {/* Bouton caché pour supporter la soumission classique si besoin */}
          <button type="submit" hidden />
        </form>
      </Form>
    </Card>
  );
}));

Step2Rayonante.displayName = 'Step2Rayonante';