import { AlertCircle, CheckCircle2, Clock } from "lucide-react";

import { Card } from "@/components/ui/card";

export interface RegionalCompletionTrackingProps {
  totalDirections: number;
  completedCount: number;
  inProgressCount: number;
  title: string;
  summaryText: string;
  statusLabels: {
    completed: string;
    inProgress: string;
    notStarted: string;
  };
}

export function RegionalCompletionTracking({
  totalDirections,
  completedCount,
  inProgressCount,
  title,
  summaryText,
  statusLabels,
}: RegionalCompletionTrackingProps) {
  const notStartedCount = totalDirections - completedCount - inProgressCount;

  const completedPct = totalDirections > 0 ? Math.round((completedCount / totalDirections) * 100) : 0;
  const inProgressPct = totalDirections > 0 ? Math.round((inProgressCount / totalDirections) * 100) : 0;
  const notStartedPct = totalDirections > 0 ? Math.round((notStartedCount / totalDirections) * 100) : 0;

  const statusCards = [
    {
      key: "completed",
      label: statusLabels.completed,
      pct: completedPct,
      count: completedCount,
      bg: "bg-success/10",
      ring: "ring-success/20",
      text: "text-success",
      icon: CheckCircle2,
    },
    {
      key: "in_progress",
      label: statusLabels.inProgress,
      pct: inProgressPct,
      count: inProgressCount,
      bg: "bg-warning/10",
      ring: "ring-warning/20",
      text: "text-warning",
      icon: Clock,
    },
    {
      key: "not_started",
      label: statusLabels.notStarted,
      pct: notStartedPct,
      count: notStartedCount,
      bg: "bg-destructive/10",
      ring: "ring-destructive/20",
      text: "text-destructive",
      icon: AlertCircle,
    },
  ];

  return (
    <section className="mb-6 w-full">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-foreground">{title}</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">{summaryText}</p>
        </div>
      </div>

      <Card className="p-5 sm:p-6 shadow-sm border-muted">
        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
          {statusCards.map((item) => {
            const Icon = item.icon;

            return (
              <div
                key={item.key}
                className={`rounded-lg p-3 ${item.bg} ring-1 ${item.ring}`}
              >
                <div className={`flex items-center gap-1.5 ${item.text}`}>
                  <Icon className="h-3.5 w-3.5" />
                  <span className="text-[11px] font-semibold">{item.label}</span>
                </div>
                <div
                  className={`mt-1 text-left text-2xl font-extrabold tabular-nums ${item.text}`}
                  dir="ltr"
                >
                  {Math.round(item.pct)}%
                </div>
                <div
                  className="mt-0.5 text-left text-[10px] text-muted-foreground tabular-nums"
                  dir="ltr"
                >
                  {item.count} / {totalDirections}
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </section>
  );
}

export default RegionalCompletionTracking;
