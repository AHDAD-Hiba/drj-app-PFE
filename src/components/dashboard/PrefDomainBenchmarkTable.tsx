import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Minus, TrendingDown, TrendingUp } from "lucide-react";
import type { TFunction } from "i18next";

export interface PrefDomainBenchmarkRow {
  kpi: string;
  monScore: number;
  moyenneReg: number;
  isPercentage: boolean;
  /**
   * Optionnel : quand vrai, la moyenne régionale n'existe pas pour ce KPI
   * (ex: aucun domaine régional Affaires Féminines). On affiche alors
   * "Indisponible" au lieu d'une valeur fabriquée. Aucun impact pour
   * Jeunesse / Infrastructure qui ne renseignent pas ce champ.
   */
  moyenneRegUnavailable?: boolean;
}

interface PrefDomainBenchmarkTableProps {
  rows: PrefDomainBenchmarkRow[];
  t: TFunction;
  lang: string;
  className?: string;
}

const KPI_TRANSLATION_KEYS: Record<string, string> = {
  "Total des Activités": "totalActivities",
  "Total Bénéficiaires": "totalBeneficiaries",
  "Taux de Couverture": "coverageRate",
  "Taux de Féminisation": "feminisationRate",
  "Partenariats Actifs": "activePartnerships",
  "Établ. Opérationnels": "operationalEstab",
};

export const PrefDomainBenchmarkTable = ({ rows, t, lang, className = "bg-card w-full overflow-x-auto" }: PrefDomainBenchmarkTableProps) => {
  return (
    <Card className={className}>
      <Table>
        <TableHeader className="bg-muted/50">
          <TableRow>
            <TableHead className={`${lang === "ar" ? "text-right" : "text-left"} font-semibold py-4`}>
              {t("prefDomainDashboard.benchmark.columns.indicator", "Indicateur")}
            </TableHead>
            <TableHead className={`${lang === "ar" ? "text-left" : "text-right"} font-semibold`}>
              {t("prefDomainDashboard.benchmark.columns.prefecture", "Préfecture")}
            </TableHead>
            <TableHead className={`${lang === "ar" ? "text-left" : "text-right"} font-semibold`}>
              {t("prefDomainDashboard.benchmark.columns.regionalAverage", "Moyenne Régionale") as string}
            </TableHead>
            <TableHead className={`${lang === "ar" ? "text-left" : "text-right"} font-semibold`}>
              {t("prefDomainDashboard.benchmark.columns.variance", "Écart") as string}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((item, idx) => {
            const ecart = Number((item.monScore - item.moyenneReg).toFixed(1));
            const isPositive = ecart > 0;
            const isNegative = ecart < 0;
            const formatValue = (val: number) => (item.isPercentage ? `${val.toFixed(1)}%` : val.toFixed(1));

            const kpiTranslationKey = KPI_TRANSLATION_KEYS[item.kpi] || item.kpi;

            return (
              <TableRow key={idx} className="hover:bg-muted/20 transition-colors">
                <TableCell className={`${lang === "ar" ? "text-right" : "text-left"} font-medium text-xs sm:text-sm py-3 sm:py-4`}>
                  {t(`prefDomainDashboard.benchmark.kpis.${kpiTranslationKey}`, item.kpi) as string}
                </TableCell>

                <TableCell className={`${lang === "ar" ? "text-left" : "text-right"} font-bold tabular-nums text-xs sm:text-sm`}>
                  <span dir="ltr">{formatValue(item.monScore)}</span>
                </TableCell>

<TableCell className={`${lang === "ar" ? "text-left" : "text-right"} text-muted-foreground tabular-nums text-xs sm:text-sm`}>
                  {item.moyenneRegUnavailable ? (
                    <span className="italic text-muted-foreground/70">
                      {t("prefDomainDashboard.benchmark.unavailable", "Indisponible")}
                    </span>
                  ) : (
                    <span dir="ltr">{formatValue(item.moyenneReg)}</span>
                  )}
                </TableCell>

                <TableCell className={`${lang === "ar" ? "text-left" : "text-right"} tabular-nums text-xs sm:text-sm`}>
                  {item.moyenneRegUnavailable ? (
                    <span className="italic text-muted-foreground/70">
                      {t("prefDomainDashboard.benchmark.unavailableShort", "—")}
                    </span>
                  ) : (
                    <div className={`flex items-center ${lang === "ar" ? "justify-start" : "justify-end"} gap-1`} dir="ltr">
                      {isPositive && (
                        <>
                          <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                          <span className="text-emerald-500 font-bold">+{formatValue(ecart)}</span>
                        </>
                      )}
                      {isNegative && (
                        <>
                          <TrendingDown className="w-3.5 h-3.5 text-red-500" />
                          <span className="text-red-500 font-bold">{formatValue(ecart)}</span>
                        </>
                      )}
                      {ecart === 0 && (
                        <>
                          <Minus className="w-3.5 h-3.5 text-muted-foreground" />
                          <span className="text-muted-foreground font-medium">0</span>
                        </>
                      )}
                    </div>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </Card>
  );
};
