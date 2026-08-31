import type { ReactNode } from "react";

export interface RegionalDirectionPerformanceProps {
  title: string;
  subtitle: string;
  children?: ReactNode;
}

export function RegionalDirectionPerformance({
  title,
  subtitle,
  children,
}: RegionalDirectionPerformanceProps) {
  return (
    <section className="mt-8 w-full">
      <div className="mb-4">
        <h2 className="text-xl font-bold text-foreground">{title}</h2>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </div>

      {children}
    </section>
  );
}

export default RegionalDirectionPerformance;
