import type { TFunction } from "i18next";
import { PrefDomainBenchmarkTable, type PrefDomainBenchmarkRow } from "./PrefDomainBenchmarkTable";

interface PrefDomainDashboardSection5Props {
  benchmark: PrefDomainBenchmarkRow[];
  lang: string;
  t: TFunction;
}

export const PrefDomainDashboardSection5 = ({
  benchmark,
  lang,
  t,
}: PrefDomainDashboardSection5Props) => {
  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-base sm:text-lg font-bold text-foreground">
          {t("prefDomainDashboard.benchmark.title", "Benchmark régional")}
        </h2>
      </div>
      <PrefDomainBenchmarkTable rows={benchmark} t={t} lang={lang} />
    </section>
  );
};
