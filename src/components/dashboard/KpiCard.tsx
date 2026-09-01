import type { ReactNode } from "react";

export interface KpiCardProps {
  /** Icon element, e.g. <Activity className="h-5 w-5" /> */
  icon: ReactNode;
  /** Value already formatted as a string (number, percentage, etc.) */
  value: string;
  /** Label displayed under the value */
  label: string;
  /** Accent color classes for the left bar / icon badge, e.g. "bg-[hsl(var(--kpi-2))]" */
  accentBarClassName: string;
  iconWrapperClassName: string;
  /** Optional extra class on the value text (used for the feminization pink variant) */
  valueClassName?: string;
}

export const KpiCard = ({
  icon,
  value,
  label,
  accentBarClassName,
  iconWrapperClassName,
  valueClassName,
}: KpiCardProps) => {
  return (
    <div className="relative p-5 rounded-2xl border border-border/60 bg-card hover:shadow-md transition-all min-h-[150px] flex flex-col justify-between overflow-hidden">
      <span className={`absolute inset-y-0 start-0 w-1 ${accentBarClassName}`} />
      <div
        className={`h-11 w-11 rounded-xl flex items-center justify-center ${iconWrapperClassName}`}
      >
        {icon}
      </div>
      <div className="space-y-1">
        <div
          className={`text-3xl font-extrabold tracking-tight text-foreground tabular-nums ${valueClassName ?? ""}`}
        >
          {value}
        </div>
        <div className="text-sm text-muted-foreground leading-snug">{label}</div>
      </div>
    </div>
  );
};
