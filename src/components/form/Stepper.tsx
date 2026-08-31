import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Step {
  id: number;
  labelFr: string;
  labelAr: string;
}

interface Props {
  steps: Step[];
  current: number;
  isAr: boolean;
  onJump?: (id: number) => void;
}

export const Stepper = ({ steps, current, isAr, onJump }: Props) => {
  return (
    <nav aria-label="progress" className="w-full">
      <ol className="flex items-center justify-between gap-1 sm:gap-2">
        {steps.map((step, idx) => {
          const done = step.id < current;
          const active = step.id === current;
          const label = isAr ? step.labelAr : step.labelFr;
          return (
            <li key={step.id} className="flex-1 flex items-center min-w-0">
              <button
                type="button"
                onClick={() => onJump?.(step.id)}
                className={cn(
                  'flex flex-col items-center gap-1.5 flex-1 min-w-0 group transition-smooth',
                  onJump ? 'cursor-pointer' : 'cursor-default',
                )}
              >
                <div
                  className={cn(
                    'h-9 w-9 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-smooth flex-shrink-0',
                    done && 'bg-primary text-primary-foreground border-primary',
                    active && 'bg-primary-soft text-primary border-primary ring-4 ring-primary/15',
                    !done && !active && 'bg-card text-muted-foreground border-border group-hover:border-primary/50',
                  )}
                >
                  {done ? <Check className="h-4 w-4" /> : step.id}
                </div>
                <span
                  className={cn(
                    'text-[10px] sm:text-xs font-medium text-center leading-tight max-w-[80px] truncate',
                    active ? 'text-primary' : done ? 'text-foreground' : 'text-muted-foreground',
                  )}
                >
                  {label}
                </span>
              </button>
              {idx < steps.length - 1 && (
                <div
                  className={cn(
                    'h-0.5 flex-1 mx-1 sm:mx-2 transition-smooth',
                    step.id < current ? 'bg-primary' : 'bg-border',
                  )}
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};
