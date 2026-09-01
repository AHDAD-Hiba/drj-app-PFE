import type { ReactNode } from "react";
import { Trophy } from "lucide-react";

import { Card } from "@/components/ui/card";

export interface RegionalTopThreeItem {
  id: string | number;
  name: string;
  value: number;
}

export interface RegionalTopThreeMetric {
  label: string;
  items: RegionalTopThreeItem[];
  accentClassName?: string;
}

export interface RegionalTopThreeProps {
  primary: RegionalTopThreeMetric;
  secondary: RegionalTopThreeMetric;
  formatValue?: (value: number) => string;
  renderItemName?: (item: RegionalTopThreeItem) => ReactNode;
}

const rankStyles = [
  {
    row: "bg-amber-500/10 border border-amber-500/20",
    badge: "bg-amber-500/20 text-amber-800 border-amber-500/30",
  },
  {
    row: "bg-slate-400/10 border border-slate-400/20",
    badge: "bg-slate-400/20 text-slate-800 border-slate-400/30",
  },
  {
    row: "bg-orange-500/10 border border-orange-500/20",
    badge: "bg-orange-500/20 text-orange-800 border-orange-500/30",
  },
];

function RegionalTopThreeCard({
  metric,
  formatValue,
  renderItemName,
}: {
  metric: RegionalTopThreeMetric;
  formatValue: (value: number) => string;
  renderItemName: (item: RegionalTopThreeItem) => ReactNode;
}) {
  return (
    <Card className="p-5 border-border/60 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <Trophy className={`h-5 w-5 ${metric.accentClassName ?? "text-primary"}`} />
        <h3 className="font-bold text-base text-foreground">{metric.label}</h3>
      </div>
      <div className="space-y-3">
        {metric.items.map((item, index) => {
          const styles = rankStyles[index] ?? {
            row: "bg-muted/40 border border-transparent",
            badge: "bg-muted text-muted-foreground border-transparent",
          };
          return (
            <div
              key={item.id}
              className={`flex items-center justify-between p-3 rounded-xl transition-all duration-200 ${styles.row}`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`h-8 w-8 rounded-full flex items-center justify-center font-extrabold text-xs border ${styles.badge}`}
                >
                  {index + 1}
                </div>
                <span className="font-semibold text-sm text-foreground">
                  {renderItemName(item)}
                </span>
              </div>
              <span className="font-bold text-sm text-foreground tabular-nums" dir="ltr">
                {formatValue(item.value)}
              </span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

export function RegionalTopThree({
  primary,
  secondary,
  formatValue = String,
  renderItemName = (item) => item.name,
}: RegionalTopThreeProps) {
  return (
    <div className="grid lg:grid-cols-2 gap-6 mb-6">
      <RegionalTopThreeCard
        metric={primary}
        formatValue={formatValue}
        renderItemName={renderItemName}
      />
      <RegionalTopThreeCard
        metric={secondary}
        formatValue={formatValue}
        renderItemName={renderItemName}
      />
    </div>
  );
}

export default RegionalTopThree;
