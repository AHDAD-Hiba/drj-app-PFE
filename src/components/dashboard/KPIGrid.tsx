import type { ComponentType, ReactNode } from "react";
import { Card } from "@/components/ui/card";

export interface KPIItem {
  label: string;
  value: ReactNode;
  icon: ComponentType<{ className?: string }>;
  accentClass: string;
  iconContainerClass: string;
  valueClassName?: string;
}

interface KPIGridProps {
  title: string;
  metrics: KPIItem[];
  className?: string;
  gridClassName?: string;
}

export const KPIGrid = ({
  title,
  metrics,
  className = "",
  gridClassName = "grid grid-cols-1 md:grid-cols-3 gap-4",
}: KPIGridProps) => {
  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-base sm:text-lg font-bold text-foreground">{title}</h2>
      </div>
      <Card className={`p-4 sm:p-5 ${className}`.trim()}>
        <div className={gridClassName}>
          {metrics.map((metric, index) => {
            const Icon = metric.icon;
            return (
              <div
                key={`${metric.label}-${index}`}
                className="relative p-5 rounded-2xl border border-border/60 bg-card hover:shadow-md transition-all min-h-[150px] flex flex-col justify-between overflow-hidden"
              >
                <span className={`absolute inset-y-0 start-0 w-1 ${metric.accentClass}`} />
                <div
                  className={`h-11 w-11 rounded-xl flex items-center justify-center ${metric.iconContainerClass}`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <div
                    className={`text-3xl font-extrabold tracking-tight text-foreground tabular-nums ${metric.valueClassName ?? ""}`}
                  >
                    {metric.value}
                  </div>
                  <div className="text-sm text-muted-foreground leading-snug">{metric.label}</div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </section>
  );
};
