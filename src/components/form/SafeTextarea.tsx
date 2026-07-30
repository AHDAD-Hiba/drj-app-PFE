import { useEffect, useRef, useState } from 'react';
import { Textarea } from '@/components/ui/textarea';

interface SafeTextareaProps extends React.ComponentPropsWithoutRef<'textarea'> {
  value?: string;
  onValueChange?: (value: string) => void;
}

export function SafeTextarea({
  value,
  onValueChange,
  onBlur,
  className,
  ...props
}: SafeTextareaProps) {
  const [localValue, setLocalValue] = useState(String(value ?? ''));
  const isDirty = useRef(false); // Flag pour isoler la frappe utilisateur

  useEffect(() => {
    // Ne synchroniser depuis la BDD/Prop que si l'utilisateur n'est PAS en train de taper
    if (!isDirty.current) {
      setLocalValue(String(value ?? ''));
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    isDirty.current = true;
    setLocalValue(e.target.value);
    onValueChange?.(e.target.value);
  };

  const handleBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
    isDirty.current = false; // L'utilisateur a quitté le champ
    setLocalValue(String(value ?? ''));
    onBlur?.(e);
  };

  return (
    <Textarea
      {...props}
      value={localValue}
      onChange={handleChange}
      onBlur={handleBlur}
      className={`min-h-[80px] text-xs bg-background resize-y leading-relaxed ${className || ''}`}
    />
  );
}