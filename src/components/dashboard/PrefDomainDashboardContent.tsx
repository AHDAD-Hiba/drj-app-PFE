import { useState } from "react";
import type { TFunction } from "i18next";
import { Card } from "@/components/ui/card";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { PrefDomainDashboardSection2 } from "@/components/dashboard/PrefDomainDashboardSection2";
import { PrefDomainDashboardSection5 } from "@/components/dashboard/PrefDomainDashboardSection5";
import { PrefDomainDashboardSection6 } from "@/components/dashboard/PrefDomainDashboardSection6";
import { PrefDomainDashboardSection3Infrastructure } from "@/components/dashboard/PrefDomainDashboardSection3Infrastructure";
import { PrefDomainDashboardSection4Infrastructure } from "@/components/dashboard/PrefDomainDashboardSection4Infrastructure";
import { PrefDomainDashboardSection3AffairesFeminines } from "@/components/dashboard/PrefDomainDashboardSection3AffairesFeminines";
import { PrefDomainDashboardSection4AffairesFeminines } from "@/components/dashboard/PrefDomainDashboardSection4AffairesFeminines";
import { PrefDomainDashboardSection3ProtectionEnfance } from "@/components/dashboard/PrefDomainDashboardSection3ProtectionEnfance";
import { PrefDomainDashboardSection4ProtectionEnfance } from "@/components/dashboard/PrefDomainDashboardSection4ProtectionEnfance";
import { PrefDomainDashboardSection3EnfanceCreches } from "@/components/dashboard/PrefDomainDashboardSection3EnfanceCreches";
import { PrefDomainDashboardSection4EnfanceCreches } from "@/components/dashboard/PrefDomainDashboardSection4EnfanceCreches";
import { PrefDomainDashboardSection3Jeunesse } from "@/components/dashboard/PrefDomainDashboardSection3Jeunesse";
import { PrefDomainDashboardSection4Jeunesse } from "@/components/dashboard/PrefDomainDashboardSection4Jeunesse";
import { buildJeunesseKpiItems } from "@/components/dashboard/section2/JeunesseKpiConfig";
import { buildInfrastructureKpiItems } from "@/components/dashboard/section2/InfrastructureKpiConfig";
import { buildAffairesFemininesKpiItems } from "@/components/dashboard/section2/AffairesFemininesKpiConfig";
import { buildProtectionEnfanceKpiItems } from "@/components/dashboard/section2/ProtectionEnfanceKpiConfig";
import { buildEnfanceCrechesKpiItems } from "@/components/dashboard/section2/EnfanceCrechesKpiConfig";
import { buildJeunesseSection6Blocks } from "@/components/dashboard/section6/JeunesseSection6Blocks";
import { buildInfrastructureSection6Blocks } from "@/components/dashboard/section6/InfrastructureSection6Blocks";
import { buildAffairesFemininesSection6Blocks } from "@/components/dashboard/section6/AffairesFemininesSection6Blocks";
import { buildProtectionEnfanceSection6Blocks } from "@/components/dashboard/section6/ProtectionEnfanceSection6Blocks";
import { buildEnfanceCrechesSection6Blocks } from "@/components/dashboard/section6/EnfanceCrechesSection6Blocks";
import {
  PROTECTION_ENFANCE_DOMAIN_CODE,
  ENFANCE_CRECHES_DOMAIN_CODE,
} from "@/hooks/usePrefDomainDashboardData";
import type { PrefDomainDashboardData } from "@/services/prefDomainDashboardTypes";
import type { JeunesseDashboardData } from "@/services/PrefDomainDashboardDataService";
import type { InfrastructureDashboardData } from "@/services/PrefDomainDashboardInfrastructureDataService";
import type { AffairesFemininesDashboardData } from "@/services/PrefDomainDashboardAffairesFemininesDataService";
import type { ProtectionEnfanceDashboardData } from "@/services/PrefDomainDashboardProtectionEnfanceDataService";
import type { EnfanceCrechesDashboardData } from "@/services/PrefDomainDashboardEnfanceCrechesDataService";

interface PrefDomainDashboardContentProps {
  dashboardData: PrefDomainDashboardData;
  domain: string;
  lang: string;
  t: TFunction;
  className?: string;
}

export function PrefDomainDashboardContent({
  dashboardData,
  domain,
  lang,
  t,
  className,
}: PrefDomainDashboardContentProps) {
  const [openSection, setOpenSection] = useState<string | null>("activites");

  const toggleSection = (section: string) => {
    setOpenSection(openSection === section ? null : section);
  };

  // NB narrowing : `domain` et `dashboardData` proviennent tous deux du même
  // appelant (cf. `usePrefDomainDashboardData`, qui ne libère `dashboardData`
  // que lorsqu'il correspond au `domain` demandé). Le cast `as
  // XxxDashboardData` dans chaque `case` exprime ce contrat pour le typeur.
  const buildSection2Items = () => {
    switch (domain) {
      case "INFRA": {
        const data = dashboardData as InfrastructureDashboardData;
        return buildInfrastructureKpiItems(data.kpis, t, lang);
      }
      case "FEMME": {
        const data = dashboardData as AffairesFemininesDashboardData;
        return buildAffairesFemininesKpiItems(data.kpis, t, lang);
      }
      case PROTECTION_ENFANCE_DOMAIN_CODE: {
        const data = dashboardData as ProtectionEnfanceDashboardData;
        return buildProtectionEnfanceKpiItems(data.kpis, t);
      }
      case ENFANCE_CRECHES_DOMAIN_CODE: {
        const data = dashboardData as EnfanceCrechesDashboardData;
        return buildEnfanceCrechesKpiItems(data.kpis, t);
      }
      case "JEUNESSE":
      default: {
        const data = dashboardData as JeunesseDashboardData;
        return buildJeunesseKpiItems(data.kpis, t);
      }
    }
  };

  const buildSection6Blocks = () => {
    switch (domain) {
      case "INFRA": {
        const data = dashboardData as InfrastructureDashboardData;
        return buildInfrastructureSection6Blocks(data.detailed, lang, t);
      }
      case "FEMME": {
        const data = dashboardData as AffairesFemininesDashboardData;
        return buildAffairesFemininesSection6Blocks(data.detailed, lang, t);
      }
      case PROTECTION_ENFANCE_DOMAIN_CODE: {
        const data = dashboardData as ProtectionEnfanceDashboardData;
        return buildProtectionEnfanceSection6Blocks(data.detailed, lang, t);
      }
      case ENFANCE_CRECHES_DOMAIN_CODE: {
        const data = dashboardData as EnfanceCrechesDashboardData;
        return buildEnfanceCrechesSection6Blocks(data.detailed, lang, t);
      }
      case "JEUNESSE":
      default: {
        const data = dashboardData as JeunesseDashboardData;
        return buildJeunesseSection6Blocks(data, lang, t);
      }
    }
  };

  const renderDomainCharts = () => {
    if (domain === "JEUNESSE") {
      const data = dashboardData as JeunesseDashboardData;
      return (
        <>
          <PrefDomainDashboardSection3Jeunesse
            data={data.section3.repartitionProgrammes}
            lang={lang}
            t={t}
          />
          <PrefDomainDashboardSection4Jeunesse
            data={data.evolution.trimestriel}
            lang={lang}
            t={t}
          />
        </>
      );
    }

    switch (domain) {
      case "INFRA": {
        const data = dashboardData as InfrastructureDashboardData;
        return (
          <>
            <PrefDomainDashboardSection3Infrastructure
              budget={data.section3.budget}
              etatProjets={data.section3.etatProjets}
              natureProjets={data.section3.natureProjets}
              lang={lang}
              t={t}
            />
            <PrefDomainDashboardSection4Infrastructure
              budget={data.evolution.budget}
              arrieres={data.evolution.arrieres}
              projets={data.evolution.projets}
              lang={lang}
              t={t}
            />
          </>
        );
      }

      case "FEMME": {
        const data = dashboardData as AffairesFemininesDashboardData;
        return (
          <>
            <PrefDomainDashboardSection3AffairesFeminines
              formationParSecteur={data.section3.formationParSecteur}
              urbainRural={data.section3.urbainRural}
              lang={lang}
              t={t}
            />
            <PrefDomainDashboardSection4AffairesFeminines
              integration={data.evolution.integration}
              activiteSociale={data.evolution.activiteSociale}
              lang={lang}
              t={t}
            />
          </>
        );
      }

      case PROTECTION_ENFANCE_DOMAIN_CODE: {
        const data = dashboardData as ProtectionEnfanceDashboardData;
        return (
          <>
            <PrefDomainDashboardSection3ProtectionEnfance
              priseEnCharge={data.section3.priseEnCharge}
              incidentsParType={data.section3.incidentsParType}
              beneficiairesParDomaine={data.section3.beneficiairesParDomaine}
              lang={lang}
              t={t}
            />
            <PrefDomainDashboardSection4ProtectionEnfance
              genre={data.evolution.genre}
              incidents={data.evolution.incidents}
              lang={lang}
              t={t}
            />
          </>
        );
      }

      case ENFANCE_CRECHES_DOMAIN_CODE: {
        const data = dashboardData as EnfanceCrechesDashboardData;
        return (
          <>
            <PrefDomainDashboardSection3EnfanceCreches data={data.section3} lang={lang} t={t} />
            <PrefDomainDashboardSection4EnfanceCreches data={data.evolution} lang={lang} t={t} />
          </>
        );
      }

      case "JEUNESSE":
      default: {
        // Domaine par défaut = Jeunesse (comportement de repli déjà existant).
        const data = dashboardData as JeunesseDashboardData;
        return (
          <>
            {/* --- SECTION 3 : Répartition des bénéficiaires --- */}
            <section className="space-y-4">
              <div>
                <h2 className="text-lg font-bold text-foreground">
                  {t(
                    "prefDomainDashboard.charts.axeTitle",
                    "Répartition des bénéficiaires par axe",
                  )}
                </h2>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
                {/* Chart 1: Volume Global */}
                <Card className="p-5 flex flex-col">
                  <div className="mb-4">
                    <h3 className="text-sm font-bold text-foreground">
                      {t("prefDomainDashboard.charts.volumeTitle", "Volume Global par Programme")}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {t(
                        "prefDomainDashboard.charts.volumeSubtitle",
                        "Nombre absolu de bénéficiaires impactés",
                      )}
                    </p>
                  </div>
                  <div className="h-[250px] w-full mt-auto">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={data.section3.repartitionProgrammes}
                        margin={{
                          top: 10,
                          right: lang === "ar" ? 45 : 10,
                          left: lang === "ar" ? 10 : 30,
                          bottom: 20,
                        }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          vertical={false}
                          stroke="hsl(var(--border))"
                        />
                        <XAxis
                          dataKey="name"
                          axisLine={{ stroke: "hsl(var(--muted-foreground))" }}
                          tickLine={{ stroke: "hsl(var(--muted-foreground))" }}
                          tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                          dy={10}
                          interval={0}
                          height={36}
                          tickFormatter={(value) =>
                            t(
                              `prefDomainDashboard.programs.${String(value).toLowerCase()}`,
                              String(value),
                            ) as string
                          }
                        />
                        <YAxis
                          orientation="left"
                          axisLine={{ stroke: "hsl(var(--muted-foreground))" }}
                          tickLine={{ stroke: "hsl(var(--muted-foreground))" }}
                          width={45}
                          tick={{
                            fontSize: 11,
                            fill: "hsl(var(--muted-foreground))",
                            dx: lang === "ar" ? -18 : 0,
                          }}
                          domain={[0, (dataMax: number) => Math.ceil(dataMax / 100) * 100]}
                        />
                        <Tooltip
                          cursor={{ fill: "hsl(var(--muted)/0.4)" }}
                          contentStyle={{
                            borderRadius: "8px",
                            border: "1px solid hsl(var(--border))",
                            fontSize: "12px",
                          }}
                        />
                        <Bar
                          dataKey="total"
                          fill="hsl(var(--primary))"
                          radius={[4, 4, 0, 0]}
                          maxBarSize={50}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </Card>

                {/* Chart 2: Mixité H/F */}
                <Card className="p-5 flex flex-col">
                  <div className="mb-4">
                    <h3 className="text-sm font-bold text-foreground">
                      {t(
                        "prefDomainDashboard.charts.mixityTitle",
                        "Mixité H / F par Programme (%)",
                      )}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {t(
                        "prefDomainDashboard.charts.mixitySubtitle",
                        "Taux de féminisation comparatif",
                      )}
                    </p>
                  </div>
                  <div className="h-[250px] w-full mt-auto">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={data.section3.repartitionProgrammes}
                        margin={{
                          top: 10,
                          right: lang === "ar" ? 45 : 10,
                          left: lang === "ar" ? 10 : 30,
                          bottom: 20,
                        }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          vertical={false}
                          stroke="hsl(var(--border))"
                        />
                        <XAxis
                          dataKey="name"
                          axisLine={{ stroke: "hsl(var(--muted-foreground))" }}
                          tickLine={{ stroke: "hsl(var(--muted-foreground))" }}
                          tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                          dy={10}
                          interval={0}
                          height={36}
                          tickFormatter={(value) =>
                            t(
                              `prefDomainDashboard.programs.${String(value).toLowerCase()}`,
                              String(value),
                            ) as string
                          }
                        />
                        <YAxis
                          orientation="left"
                          axisLine={{ stroke: "hsl(var(--muted-foreground))" }}
                          tickLine={{ stroke: "hsl(var(--muted-foreground))" }}
                          width={45}
                          tick={{
                            fontSize: 11,
                            fill: "hsl(var(--muted-foreground))",
                            dx: lang === "ar" ? -18 : 0,
                          }}
                          tickFormatter={(val) => `${val}%`}
                          domain={[0, 100]}
                        />
                        <Tooltip
                          cursor={{ fill: "hsl(var(--muted)/0.4)" }}
                          contentStyle={{
                            borderRadius: "8px",
                            border: "1px solid hsl(var(--border))",
                            fontSize: "12px",
                          }}
                          formatter={(value: number) => [`${value}%`, ""]}
                        />
                        <Legend
                          wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }}
                          iconType="circle"
                        />
                        <Bar
                          dataKey="hommesPct"
                          name={t("prefDomainDashboard.charts.men", "Hommes")}
                          stackId="a"
                          fill="#3b82f6"
                          radius={[0, 0, 4, 4]}
                          maxBarSize={50}
                        />
                        <Bar
                          dataKey="femmesPct"
                          name={t("prefDomainDashboard.charts.women", "Femmes")}
                          stackId="a"
                          fill="#ec4899"
                          radius={[4, 4, 0, 0]}
                          maxBarSize={50}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </Card>

                {/* Chart 3: Urbain / Rural */}
                <Card className="p-5 flex flex-col">
                  <div className="mb-4">
                    <h3 className="text-sm font-bold text-foreground">
                      {t(
                        "prefDomainDashboard.charts.coverageTitle",
                        "Couverture Territorial (Urbain / Rural)",
                      )}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {t(
                        "prefDomainDashboard.charts.coverageSubtitle",
                        "Analyse incluant les données estimées",
                      )}
                    </p>
                  </div>
                  <div className="h-[250px] w-full mt-auto">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={data.section3.repartitionProgrammes}
                        margin={{ top: 10, right: 10, left: 45, bottom: 20 }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          vertical={false}
                          stroke="hsl(var(--border))"
                        />
                        <XAxis
                          dataKey="name"
                          axisLine={{ stroke: "hsl(var(--muted-foreground))" }}
                          tickLine={{ stroke: "hsl(var(--muted-foreground))" }}
                          tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                          dy={10}
                          interval={0}
                          height={36}
                          tickFormatter={(value) =>
                            t(
                              `prefDomainDashboard.programs.${String(value).toLowerCase()}`,
                              String(value),
                            ) as string
                          }
                        />
                        <YAxis
                          orientation="left"
                          axisLine={{ stroke: "hsl(var(--muted-foreground))" }}
                          tickLine={{ stroke: "hsl(var(--muted-foreground))" }}
                          width={45}
                          tick={{
                            fontSize: 11,
                            fill: "hsl(var(--muted-foreground))",
                            dx: lang === "ar" ? -18 : 0,
                          }}
                          tickFormatter={(val) => `${val}%`}
                          domain={[0, 100]}
                        />
                        <Tooltip
                          cursor={{ fill: "hsl(var(--muted)/0.4)" }}
                          contentStyle={{
                            borderRadius: "8px",
                            border: "1px solid hsl(var(--border))",
                            fontSize: "12px",
                          }}
                          formatter={(value: number) => [`${value}%`, ""]}
                        />
                        <Legend
                          wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }}
                          iconType="square"
                        />
                        <Bar
                          dataKey="urbainPct"
                          name={t("prefDomainDashboard.charts.urban", "Urbain")}
                          stackId="a"
                          fill="#f59e0b"
                          radius={[0, 0, 4, 4]}
                          maxBarSize={50}
                        />
                        <Bar
                          dataKey="ruralPct"
                          name={t("prefDomainDashboard.charts.rural", "Rural")}
                          stackId="a"
                          fill="#10b981"
                          radius={[4, 4, 0, 0]}
                          maxBarSize={50}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </Card>
              </div>
            </section>

            {/* --- SECTION 4 : Évolution temporelle --- */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-foreground">
                  {t(
                    "prefDomainDashboard.charts.evolutionTitle",
                    "Évolution trimestrielle des bénéficiaires",
                  )}
                </h2>
              </div>

              <Card className="p-5">
                <div className="mb-6">
                  <h3 className="text-sm font-bold text-foreground">
                    {t(
                      "prefDomainDashboard.charts.evolutionCardTitle",
                      "Trajectoire des performances par programme",
                    )}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {t(
                      "prefDomainDashboard.charts.evolutionCardSubtitle",
                      "Évolution du nombre de bénéficiaires (T1 à T4) pour les axes éligibles",
                    )}
                  </p>
                </div>

                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={data.evolution.trimestriel}
                      margin={{ top: 10, right: 30, left: 45, bottom: 20 }}
                    >
                      <defs>
                        <linearGradient id="colorCamping" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorFestivals" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke="hsl(var(--border))"
                      />
                      <XAxis
                        dataKey="name"
                        axisLine={{ stroke: "hsl(var(--muted-foreground))" }}
                        tickLine={{ stroke: "hsl(var(--muted-foreground))" }}
                        tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                        dy={10}
                        interval={0}
                        height={40}
                        tickFormatter={(value) =>
                          t(
                            `prefDomainDashboard.quarters.${String(value).toLowerCase()}`,
                            String(value),
                          ) as string
                        }
                      />
                      <YAxis
                        orientation="left"
                        axisLine={{ stroke: "hsl(var(--muted-foreground))" }}
                        tickLine={{ stroke: "hsl(var(--muted-foreground))" }}
                        width={45}
                        tick={{
                          fontSize: 11,
                          fill: "hsl(var(--muted-foreground))",
                          dx: lang === "ar" ? -18 : 0,
                        }}
                        domain={[0, (dataMax: number) => Math.ceil(dataMax / 100) * 100]}
                      />
                      <Tooltip
                        contentStyle={{
                          borderRadius: "8px",
                          border: "1px solid hsl(var(--border))",
                          fontSize: "12px",
                        }}
                      />
                      <Legend
                        wrapperStyle={{ fontSize: "12px", paddingTop: "20px" }}
                        iconType="circle"
                      />

                      <Area
                        type="linear"
                        dataKey="Camping"
                        name={t("prefDomainDashboard.programs.camping", "Camping")}
                        stroke="#3b82f6"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorCamping)"
                      />
                      <Area
                        type="linear"
                        dataKey="Festivals"
                        name={t("prefDomainDashboard.programs.festivals", "Festivals")}
                        stroke="#8b5cf6"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorFestivals)"
                      />
                      <Area
                        type="linear"
                        dataKey="Formation"
                        name={t("prefDomainDashboard.programs.formation", "Formation")}
                        stroke="#ec4899"
                        strokeWidth={2}
                        fill="none"
                      />
                      <Area
                        type="linear"
                        dataKey="Insertion"
                        name={t("prefDomainDashboard.programs.insertion", "Insertion")}
                        stroke="#10b981"
                        strokeWidth={2}
                        fill="none"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </section>
          </>
        );
      }
    }
  };

  const content = (
    <>
      <PrefDomainDashboardSection2 items={buildSection2Items()} lang={lang} t={t} />
      {renderDomainCharts()}
      <PrefDomainDashboardSection5 benchmark={dashboardData.benchmark} lang={lang} t={t} />
      <PrefDomainDashboardSection6
        blocks={buildSection6Blocks()}
        t={t}
        openSection={openSection}
        toggleSection={toggleSection}
      />
    </>
  );

  if (className) {
    return <div className={className}>{content}</div>;
  }

  return content;
}
