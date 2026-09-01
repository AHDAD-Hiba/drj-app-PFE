import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";

interface SafeInputProps extends React.ComponentPropsWithoutRef<"input"> {
  value?: string | number | readonly string[] | undefined;
  onValueChange?: (value: string) => void;
}

// APPROCHE : Supprimer le sync conditionnel, toujours faire confiance à la saisie locale
// et ne jamais ré-écrire depuis la prop value pendant que l'utilisateur tape.

export function SafeInput({ value, onValueChange, onBlur, ...props }: SafeInputProps) {
  const [localValue, setLocalValue] = useState(String(value ?? ""));
  const isDirty = useRef(false); // ← NEW: flag pour savoir si l'utilisateur a touché

  useEffect(() => {
    // Ne syncroniser que si l'utilisateur n'est PAS en train de taper
    if (!isDirty.current) {
      setLocalValue(String(value ?? ""));
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    isDirty.current = true;
    setLocalValue(e.target.value);
    onValueChange?.(e.target.value);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    isDirty.current = false; // L'utilisateur a fini
    // Synchroniser au blur OK
    setLocalValue(String(value ?? ""));
    onBlur?.(e);
  };

  return <Input {...props} value={localValue} onChange={handleChange} onBlur={handleBlur} />;
}
