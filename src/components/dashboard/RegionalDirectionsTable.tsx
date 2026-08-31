import { AlertCircle, ArrowUpDown, CheckCircle2, Clock } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export interface RegionalDirectionTableRow {
  id: string | number;
  name: string;
  statut: string;
  score: number;
  rang: number | null;
  metric_primary?: number;
  metric_secondary?: number;
}

export interface RegionalDirectionsTableProps {
  rows: RegionalDirectionTableRow[];
  onSort: (key: string) => void;
  sortConfig: { key: string; direction: "asc" | "desc" } | null;
  title: string;
  subtitle: string;
  rankLabel: string;
  directionLabel: string;
  scoreLabel: string;
  statusLabel: string;
  metricPrimaryLabel?: string;
  metricSecondaryLabel?: string;
  formatMetric?: (value: number) => string;
  formatPrimaryMetric?: (value: number) => string;
  formatSecondaryMetric?: (value: number) => string;
  onRowClick?: (id: string | number) => void;
  statusLabels?: {
    NON_COMMENCE: string;
    TERMINE: string;
    EN_COURS: string;
  };
}

export function RegionalDirectionsTable({
  rows,
  onSort,
  sortConfig,
  title,
  subtitle,
  rankLabel,
  directionLabel,
  scoreLabel,
  statusLabel,
  metricPrimaryLabel,
  metricSecondaryLabel,
  formatMetric = String,
  formatPrimaryMetric = formatMetric,
  formatSecondaryMetric = formatMetric,
  onRowClick,
  statusLabels = {
    NON_COMMENCE: "Non commencé",
    TERMINE: "Terminé",
    EN_COURS: "En cours",
  },
}: RegionalDirectionsTableProps) {
  return (
    <Card className="p-5 sm:p-6 border-border/60 shadow-sm">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-foreground">{title}</h3>
          <p className="mt-1 text-[12px] text-muted-foreground">{subtitle}</p>
        </div>
      </div>

      <div className="overflow-hidden rounded-md border border-border/50">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow className="border-border/50 hover:bg-transparent">
              <TableHead className="w-[80px] text-start text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                {rankLabel}
              </TableHead>
              <TableHead className="text-start text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                {directionLabel}
              </TableHead>
              <TableHead
                className="cursor-pointer text-center text-[11px] font-bold uppercase tracking-wider text-muted-foreground transition-colors hover:text-primary group"
                onClick={() => onSort("score")}
              >
                <div className="flex items-center justify-center gap-1.5">
                  {scoreLabel}
                  <ArrowUpDown className="h-3 w-3 text-muted-foreground/50 transition-colors group-hover:text-primary" />
                </div>
              </TableHead>
              {metricPrimaryLabel && <TableHead className="text-center text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{metricPrimaryLabel}</TableHead>}
              {metricSecondaryLabel && <TableHead className="text-center text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{metricSecondaryLabel}</TableHead>}
              <TableHead className="text-end text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                {statusLabel}
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {rows.map((row, index) => {
              const rowStatus = row.statut || "NON_COMMENCE";

              let statusConfig = {
                label: statusLabels.NON_COMMENCE,
                badgeClass: "bg-destructive/10 ring-1 ring-destructive/20 text-destructive border-0",
                Icon: AlertCircle,
              };

              if (rowStatus === "TERMINE") {
                statusConfig = {
                  label: statusLabels.TERMINE,
                  badgeClass: "bg-success/10 ring-1 ring-success/20 text-success border-0",
                  Icon: CheckCircle2,
                };
              } else if (rowStatus === "EN_COURS") {
                statusConfig = {
                  label: statusLabels.EN_COURS,
                  badgeClass: "bg-warning/10 ring-1 ring-warning/20 text-warning border-0",
                  Icon: Clock,
                };
              }

              let rankBadgeStyle = "bg-muted text-muted-foreground border-transparent";
              if (index === 0) {
                rankBadgeStyle = "bg-amber-500/20 text-amber-800 border-amber-500/30";
              } else if (index === 1) {
                rankBadgeStyle = "bg-slate-400/20 text-slate-800 border-slate-400/30";
              } else if (index === 2) {
                rankBadgeStyle = "bg-orange-500/20 text-orange-800 border-orange-500/30";
              }

              return (
                <TableRow
                  key={row.id || index}
                  className="cursor-pointer border-border/50 transition-colors hover:bg-muted/30"
                  onClick={() => onRowClick?.(row.id)}
                >
                  <TableCell className="text-start">
                    <div
                      className={`flex h-7 w-7 items-center justify-center rounded-full border text-xs font-extrabold ${rankBadgeStyle}`}
                    >
                      {row.rang ?? "—"}
                    </div>
                  </TableCell>

                  <TableCell className="text-start text-sm font-semibold text-foreground">
                    {row.name}
                  </TableCell>

                  <TableCell className="text-center">
                    <span className="text-[15px] font-extrabold tabular-nums text-foreground" dir="ltr">
                      {row.score.toFixed(2)}%
                    </span>
                  </TableCell>

                  {metricPrimaryLabel && <TableCell className="text-center"><span className="text-[15px] font-extrabold tabular-nums text-foreground" dir="ltr">{formatPrimaryMetric(row.metric_primary ?? 0)}</span></TableCell>}
                  {metricSecondaryLabel && <TableCell className="text-center"><span className="text-[15px] font-extrabold tabular-nums text-foreground" dir="ltr">{formatSecondaryMetric(row.metric_secondary ?? 0)}</span></TableCell>}

                  <TableCell className="text-end">
                    <div className="flex justify-end">
                      <Badge variant="outline" className={`gap-1.5 px-2.5 py-1 shadow-none ${statusConfig.badgeClass}`}>
                        <statusConfig.Icon className="h-3.5 w-3.5" />
                        <span className="text-xs font-semibold tracking-wide">{statusConfig.label}</span>
                      </Badge>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}

export default RegionalDirectionsTable;
