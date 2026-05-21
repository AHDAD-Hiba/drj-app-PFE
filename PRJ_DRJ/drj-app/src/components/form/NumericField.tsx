import { useState, useEffect, useId } from 'react';
import { useTranslation } from 'react-i18next';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { validateNumericField } from '@/lib/formSchema';

interface Props {
  label: string;
  value: number;
  onChange?: (v: number) => void;
  hint?: string;
  computed?: boolean;
  disabled?: boolean;
}

/**
 * Champ numérique mobile-first :
 * - inputMode="numeric" pour clavier chiffres sur mobile
 * - validation locale (entier ≥ 0)
 * - tabular-nums pour alignement
 */
export const NumericField = ({ label, value, onChange, hint, computed, disabled }: Props) => {
  const { t } = useTranslation();
  const id = useId();
  const [raw, setRaw] = useState<string>(String(value ?? 0));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Synchronise quand la valeur (calculée par exemple) change depuis l'extérieur
    setRaw(String(value ?? 0));
  }, [value]);

  const handleChange = (next: string) => {
    setRaw(next);
    const { value: parsed, error } = validateNumericField(next);
    setError(error);
    if (!error) onChange?.(parsed);
  };

  const handleBlur = () => {
    if (!error) setRaw(String(value ?? 0));
  };

  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 leading-tight">
        {computed && <Lock className="h-3 w-3 flex-shrink-0" aria-hidden />}
        <span>{label}</span>
      </Label>
      <Input
        id={id}
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        value={raw}
        onChange={e => handleChange(e.target.value)}
        onBlur={handleBlur}
        onFocus={e => e.target.select()}
        readOnly={computed}
        disabled={disabled}
        aria-invalid={!!error}
        aria-describedby={hint || error ? `${id}-hint` : undefined}
        className={cn(
          'h-11 text-base tabular-nums text-end font-semibold',
          computed && 'bg-muted/60 cursor-not-allowed',
          error && 'border-destructive focus-visible:ring-destructive',
        )}
      />
      {(hint || error) && (
        <p
          id={`${id}-hint`}
          className={cn('text-[11px] leading-tight', error ? 'text-destructive' : 'text-muted-foreground')}
        >
          {error ? t(`form.error.${error}`) : hint}
        </p>
      )}
    </div>
  );
};
