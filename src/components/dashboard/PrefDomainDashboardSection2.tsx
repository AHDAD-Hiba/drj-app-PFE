import type { TFunction } from "i18next";
import { Card } from "@/components/ui/card";
import { Activity, Handshake, Target, Trophy, Users } from "lucide-react";
import { Gauge } from "lucide-react";
import { KpiCard } from "./KpiCard";

export interface PrefDomainDashboardSection2Kpis {
  totalActivities: number;
  totalBeneficiaries: number;
  coverageRate: number;
  feminizationRate: number;
  activePartnerships: number;
  activeEstablishments: number;
}

interface PrefDomainDashboardSection2Props {
  kpis: PrefDomainDashboardSection2Kpis;
  lang: string;
  t: TFunction;
  fmt: (n: number, lang: string) => string;
}

export const PrefDomainDashboardSection2 = ({
  kpis,
  lang,
  t,
  fmt,
}: PrefDomainDashboardSection2Props) => {
  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-base sm:text-lg font-bold text-foreground">
          {t("prefDomainDashboard.kpis.title", "Top KPIs principaux")}
        </h2>
      </div>
      <Card className="p-4 sm:p-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* 1. Total des Activités */}
          <KpiCard
            icon={<Activity className="h-5 w-5" />}
            value={fmt(kpis.totalActivities, lang)}
            label={t("prefDomainDashboard.kpis.activities", "Total des Activités")}
            accentBarClassName="bg-[hsl(var(--kpi-2))]"
            iconWrapperClassName="bg-[hsl(var(--kpi-2-soft))] text-[hsl(var(--kpi-2))]"
          />

          {/* 2. Total Bénéficiaires */}
          <KpiCard
            icon={<Users className="h-5 w-5" />}
            value={fmt(kpis.totalBeneficiaries, lang)}
            label={t("prefDomainDashboard.kpis.beneficiaries", "Total Bénéficiaires")}
            accentBarClassName="bg-[hsl(var(--kpi-3))]"
            iconWrapperClassName="bg-[hsl(var(--kpi-3-soft))] text-[hsl(var(--kpi-3))]"
          />

          {/* 3. Taux de Couverture */}
          <KpiCard
            icon={<Target className="h-5 w-5" />}
            value={`${kpis.coverageRate?.toFixed(1) || 12.5}%`}
            label={t("prefDomainDashboard.kpis.coverage", "Taux de Couverture")}
            accentBarClassName="bg-[hsl(var(--kpi-6))]"
            iconWrapperClassName="bg-[hsl(var(--kpi-6-soft))] text-[hsl(var(--kpi-6))]"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          {/* 4. Taux de Féminisation */}
          <KpiCard
            icon={<Trophy className="h-5 w-5" />}
            value={`${kpis.feminizationRate.toFixed(1)}%`}
            label={t("prefDomainDashboard.kpis.feminization", "Taux de Féminisation")}
            accentBarClassName="bg-[hsl(var(--kpi-1))]"
            iconWrapperClassName="bg-[hsl(var(--kpi-1-soft))] text-[hsl(var(--kpi-1))]"
          />

          {/* 5. Total Partenariats */}
          <KpiCard
            icon={<Handshake className="h-5 w-5" />}
            value={fmt(kpis.activePartnerships, lang)}
            label={t("prefDomainDashboard.kpis.partnerships", "Total Partenariats")}
            accentBarClassName="bg-[hsl(var(--kpi-4))]"
            iconWrapperClassName="bg-[hsl(var(--kpi-4-soft))] text-[hsl(var(--kpi-4))]"
          />

          {/* 6. Établissements Actifs */}
          <KpiCard
            icon={<Gauge className="h-5 w-5" />}
            value={fmt(kpis.activeEstablishments, lang)}
            label={t("prefDomainDashboard.kpis.establishments", "Établissements Actifs")}
            accentBarClassName="bg-[hsl(var(--kpi-5))]"
            iconWrapperClassName="bg-[hsl(var(--kpi-5-soft))] text-[hsl(var(--kpi-5))]"
          />
        </div>
      </Card>
    </section>
  );
};
