import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/AppLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  RadarChart,PieChart, 
  Pie,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  LineChart,
  Line,
  Tooltip,
  ResponsiveContainer,
  Legend,
  XAxis,
  YAxis,
  Cell,
} from "recharts";
import type { LucideIcon } from "lucide-react";
import {
  Activity,
  Users,
  Handshake,
  Gauge,
  Trophy,
  Calendar,
  Layers,
  FileSpreadsheet,
  Sparkles,
  CheckCircle2,
  Clock,
  AlertCircle,
  CalendarDays, // <-- زدت هادي هنا على قبل الديزاين الجديد
} from "lucide-react";
import { DOMAIN_OPTIONS, type Domain } from "@/lib/domainData";
import { useAuth } from "@/hooks/useAuth";

const fmt = (n: number, lang: string) =>
  new Intl.NumberFormat(lang === "ar" ? "ar-MA" : "fr-FR").format(Math.round(n));

type WorkflowStatus = "NON_COMMENCE" | "EN_COURS" | "TERMINE";

type DashboardCard = {
  label: string;
  value: string;
  hint?: string;
};

type BenchmarkMetric = {
  label: string;
  current: number;
  average: number;
  suffix?: string;
};

type DashboardData = {
  status: {
    workflowStatus: WorkflowStatus;
    completedSteps: number;
    totalSteps: number;
    lastUpdated: string;
    activeDomain: string;
  };
  kpis: {
    totalActivities: number;
    totalBeneficiaries: number;
    coverageRate: number;
    feminizationRate: number;
    totalPartnerships: number;
    activeEstablishments: number;
  };
  benchmark: {
    activities: { current: number; average: number };
    attractiveness: { current: number; average: number };
    network: { current: number; average: number };
  };
  radar: { category: string; value: number }[];
  evolution: { quarter: string; activities: number; beneficiaries: number }[];
  tabs: Record<string, { cards: DashboardCard[] }>;
  insight: string;
  anonymousRanking: {
    name: string;
    activities: number;
    beneficiaries: number;
    score: number;
    current?: boolean;
  }[];
};

const WORKFLOW_STATUS: Record<WorkflowStatus, { label: string; badge: string; icon: LucideIcon }> =
  {
    NON_COMMENCE: {
      label: "NON COMMENCÉ",
      badge: "bg-warning/15 text-warning",
      icon: AlertCircle,
    },
    EN_COURS: {
      label: "EN COURS",
      badge: "bg-info/15 text-info",
      icon: Clock,
    },
    TERMINE: {
      label: "TERMINÉ",
      badge: "bg-success/15 text-success",
      icon: CheckCircle2,
    },
  };

const DEFAULT_DASHBOARD: DashboardData = {
  status: {
    workflowStatus: "EN_COURS",
    completedSteps: 5,
    totalSteps: 7,
    lastUpdated: "2026-05-20",
    activeDomain: "Jeunesse",
  },
  kpis: {
    totalActivities: 1240,
    totalBeneficiaries: 18720,
    coverageRate: 62.5,
    feminizationRate: 47.3,
    totalPartnerships: 78,
    activeEstablishments: 39,
  },
  benchmark: {
    activities: { current: 1240, average: 980 },
    attractiveness: { current: 18720, average: 15200 },
    network: { current: 78, average: 62 },
  },
  radar: [
    { category: "Culture", value: 72 },
    { category: "Sport", value: 84 },
    { category: "Éducation", value: 68 },
    { category: "Capacités", value: 75 },
  ],
  evolution: [
    { quarter: "T1", activities: 280, beneficiaries: 4100 },
    { quarter: "T2", activities: 320, beneficiaries: 4600 },
    { quarter: "T3", activities: 310, beneficiaries: 4200 },
    { quarter: "T4", activities: 330, beneficiaries: 4820 },
  ],
  tabs: {
    activites: {
      cards: [
        { label: "% Rayonnante", value: "54%" },
        { label: "% Permanente", value: "46%" },
        { label: "Associations moyennes", value: "12" },
      ],
    },
    camping: {
      cards: [
        { label: "Total campeurs", value: "3 240" },
        { label: "% inclusion rurale", value: "62%" },
        { label: "% besoins spéciaux", value: "14%" },
        { label: "Ratio staff/campeur", value: "1:12" },
      ],
    },
    festivals: {
      cards: [
        { label: "Total festivals", value: "18" },
        { label: "Public total", value: "23 500" },
        { label: "Artistes invités", value: "214" },
      ],
    },
    formation: {
      cards: [
        { label: "Sessions", value: "28" },
        { label: "Bénéficiaires / session", value: "34" },
        { label: "% femmes formées", value: "52%" },
      ],
    },
    insertion: {
      cards: [
        { label: "Projets insertion", value: "16" },
        { label: "Jeunes insérés", value: "410" },
        { label: "% jeunes ruraux", value: "38%" },
      ],
    },
    partenariats: {
      cards: [
        { label: "Conventions signées", value: "78" },
        { label: "Index diversité", value: "7 types" },
      ],
    },
    etablissements: {
      cards: [
        { label: "Nouveaux projets", value: "11" },
        { label: "En cours", value: "24" },
        { label: "Fermés", value: "4" },
      ],
    },
  },
  insight:
    "Le département dépasse la moyenne régionale sur l’attractivité et reste stable en activités. Une priorité est d’accentuer la féminisation et l’implication des établissements pour préparer le trimestre prochain.",
  anonymousRanking: [
    { name: "Direction A", activities: 1120, beneficiaries: 16800, score: 77.3 },
    { name: "Direction B", activities: 980, beneficiaries: 14950, score: 72.1 },
    { name: "Vous", activities: 1240, beneficiaries: 18720, score: 81.4, current: true },
  ],
};

const ZoneHeadline = ({ title, subtitle }: { title: string; subtitle: string }) => (
  <div className="mb-4">
    <h2 className="text-xl font-extrabold text-foreground">{title}</h2>
    <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
  </div>
);

const KpiCard = ({
  label,
  value,
  hint,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string;
  hint?: string;
  icon: LucideIcon;
  accent?: number;
}) => (
  <Card className="relative p-4 sm:p-5 border-border/60 hover:shadow-elegant transition-smooth hover:-translate-y-0.5 overflow-hidden bg-card">
    <span
      className="absolute inset-y-0 start-0 w-1"
      style={{ background: accent ? `hsl(var(--kpi-${accent}))` : "hsl(var(--primary))" }}
    />
    <div
      className="h-10 w-10 rounded-xl flex items-center justify-center mb-3"
      style={{
        background: accent ? `hsl(var(--kpi-${accent}-soft))` : "hsl(var(--primary-glow))",
        color: accent ? `hsl(var(--kpi-${accent}))` : "hsl(var(--primary))",
      }}
    >
      <Icon className="h-5 w-5" />
    </div>
    <div className="text-xl sm:text-2xl font-extrabold tracking-tight tabular-nums">{value}</div>
    <div className="text-xs text-muted-foreground mt-1 leading-tight">{label}</div>
    {hint && <div className="text-[10px] text-muted-foreground/70 mt-0.5">{hint}</div>}
  </Card>
);

const BenchmarkBar = ({ metric }: { metric: BenchmarkMetric }) => {
  const maxValue = Math.max(metric.current, metric.average, 1);
  const currentPct = Math.round((metric.current / maxValue) * 100);
  const averagePct = Math.round((metric.average / maxValue) * 100);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>{metric.label}</span>
        <span className="font-semibold text-foreground tabular-nums">
          {fmt(metric.current, "fr")}
          {metric.suffix ?? ""}
        </span>
      </div>
      <div className="relative h-3 rounded-full bg-muted overflow-hidden">
        <div
          className="absolute inset-y-0 start-0 rounded-full bg-primary"
          style={{ width: `${currentPct}%` }}
        />
        <span
          className="absolute top-1/2 h-4 w-px -translate-y-1/2 bg-foreground/40"
          style={{ left: `${averagePct}%` }}
        />
      </div>
      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
        <span>
          Vous: {fmt(metric.current, "fr")}
          {metric.suffix ?? ""}
        </span>
        <span>
          Moy. régionale: {fmt(metric.average, "fr")}
          {metric.suffix ?? ""}
        </span>
      </div>
    </div>
  );
};

const DomainDashboard = () => {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const { utilisateur: profile } = useAuth();

  const [domain, setDomain] = useState<Domain>("jeunesse");
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>("activites");

  useEffect(() => {
    let mounted = true;
    type RpcFunction = <T>(
      name: string,
      params?: unknown,
    ) => Promise<{ data: T | null; error: unknown }>;
    const rpc = supabase.rpc as unknown as RpcFunction;

    const loadDashboard = async () => {
      setLoading(true);
      const { data } = await rpc<DashboardData>("get_dashboard_kpis", {
        year,
        domain,
      });
      if (mounted) {
        setDashboard(data ?? DEFAULT_DASHBOARD);
        setLoading(false);
      }
    };

    loadDashboard();
    return () => {
      mounted = false;
    };
  }, [domain, year]);

  const activeDomainLabel = useMemo(() => {
    const option = DOMAIN_OPTIONS.find((opt) => opt.value === domain);
    return option ? (lang === "ar" ? option.labelAr : option.labelFr) : domain;
  }, [domain, lang]);

  const data = dashboard ?? DEFAULT_DASHBOARD;
  const statusMeta = WORKFLOW_STATUS[data.status.workflowStatus];
  const StatusIcon = statusMeta.icon;
  const progressPct = Math.round(
    (data.status.completedSteps / Math.max(1, data.status.totalSteps)) * 100,
  );

  const benchmarkMetrics: BenchmarkMetric[] = [
    {
      label: "Volume d'activités",
      current: data.benchmark.activities.current,
      average: data.benchmark.activities.average,
    },
    {
      label: "Attractivité (bénéficiaires)",
      current: data.benchmark.attractiveness.current,
      average: data.benchmark.attractiveness.average,
    },
    {
      label: "Réseau associatif",
      current: data.benchmark.network.current,
      average: data.benchmark.network.average,
    },
  ];

  const tabDefinitions = [
    { key: "activites", title: "Activités", cards: data.tabs.activites.cards },
    { key: "camping", title: "Camping", cards: data.tabs.camping.cards },
    { key: "festivals", title: "Festivals", cards: data.tabs.festivals.cards },
    { key: "formation", title: "Formation", cards: data.tabs.formation.cards },
    { key: "insertion", title: "Insertion", cards: data.tabs.insertion.cards },
    { key: "partenariats", title: "Partenariats", cards: data.tabs.partenariats.cards },
    { key: "etablissements", title: "Établissements", cards: data.tabs.etablissements.cards },
  ];

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="gradient-hero rounded-3xl p-6 sm:p-8">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="space-y-3">
              <div className="text-xs uppercase tracking-[0.24em] text-white/80">
                {profile?.role ? `BONJOUR, ${profile.role}` : "BONJOUR"}
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight">
                  {t("domain.title", "Tableau de bord préfectoral")}
                </h1>
                <p className="text-sm text-white/80 mt-1">{year}</p>
              </div>
            </div>

            <Button
              variant="outline"
              className="bg-white/10 border-white/20 hover:bg-white/20 text-white"
            >
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              {t("domain.exportExcel", "Exporter Excel")}
            </Button>
          </div>
        </div>

        <Card className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1 flex items-center gap-1">
                <Calendar className="h-3 w-3" /> {t("common.year", "Année")}
              </label>
              <Input
                type="number"
                value={year}
                onChange={(e) => setYear(Number(e.target.value) || new Date().getFullYear())}
                className="h-9 bg-card"
                min={2020}
                max={2099}
              />
            </div>

            <div>
              <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1 flex items-center gap-1">
                <Layers className="h-3 w-3" /> {t("common.domain", "Domaine")}
              </label>
              <Select value={domain} onValueChange={(v) => setDomain(v as Domain)}>
                <SelectTrigger className="h-9 bg-card">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DOMAIN_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {lang === "ar" ? opt.labelAr : opt.labelFr}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        {/* --- هادي هي الـ Section اللي تبدلات بـ الديزاين ديال Lovable --- */}
        <section className="space-y-3">
          <div className="flex items-baseline justify-between">
            <h2 className="text-base font-bold text-foreground">
              {t("workflow.title", "Suivi du rapport")}
            </h2>
            <span className="text-[11px] text-muted-foreground">
              {t("common.year", "Année")} :{" "}
              <span className="font-semibold text-foreground">{year}</span>
            </span>
          </div>

          <Card className="p-5 sm:p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6 items-center">
              {/* 1. Statut (استعملنا كلاسات statusMeta باش يبقى اللون ديناميكي) */}
              <div
                className={`rounded-xl p-4 ${statusMeta.badge} bg-opacity-30 ring-1 ring-current/20`}
              >
                <div className="flex items-center gap-2">
                  <StatusIcon className="h-4 w-4" />
                  <span className="text-[11px] font-semibold uppercase tracking-wider">Statut</span>
                </div>
                <div className="text-lg font-extrabold mt-1">{statusMeta.label}</div>
              </div>

              {/* 2. Domaine Filtré */}
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Domaine Filtré
                </div>
                <div className="text-lg font-bold text-foreground mt-1">{activeDomainLabel}</div>
              </div>

              {/* 3. Dernière mise à jour */}
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Dernière mise à jour
                </div>
                <div className="text-lg font-bold text-foreground mt-1 flex items-center gap-1.5">
                  <CalendarDays className="h-4 w-4 text-muted-foreground" />
                  {data.status.lastUpdated
                    ? new Date(data.status.lastUpdated).toLocaleDateString("fr-FR")
                    : "-"}
                </div>
              </div>

              {/* 4. Progression */}
              <div>
                <div className="flex items-baseline justify-between mb-1.5">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Progression
                  </span>
                  <span className="text-sm font-bold tabular-nums text-foreground">
                    {progressPct}%
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-500"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
              </div>
            </div>
          </Card>
        </section>
        {/* -------------------------------------------------------- */}

        {/* --- Section: Top 5 KPIs --- */}
        <section className="space-y-3">
          {/* العنوان والـ Subtitle برا الـ Card */}
          <div>
            <h2 className="text-base sm:text-lg font-bold text-foreground">
              {t("kpis.title", "Top 5 KPI principaux")}
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              {t("kpis.subtitle", "Les métriques essentielles de performance pour le département.")}
            </p>
          </div>

          <Card className="p-4 sm:p-5">
            {/* الـ KPIs مجموعين ف سطر واحد ف الشاشات الكبيرة */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {/* KPI 1: Total des Activités */}
              <div className="relative flex items-center gap-3 p-3 rounded-xl border border-border/50 bg-card hover:shadow-sm transition-all overflow-hidden">
                <span className="absolute inset-y-0 start-0 w-1 bg-[hsl(var(--kpi-2))]" />
                <div className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0 bg-[hsl(var(--kpi-2-soft))] text-[hsl(var(--kpi-2))]">
                  <Activity className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-[11px] text-muted-foreground truncate leading-tight">
                    {t("kpis.activities", "Total des Activités")}
                  </div>
                  <div className="text-base sm:text-lg font-bold tracking-tight tabular-nums text-foreground mt-0.5">
                    {fmt(data.kpis.totalActivities, lang)}
                  </div>
                </div>
              </div>

              {/* KPI 2: Total des Bénéficiaires */}
              <div className="relative flex items-center gap-3 p-3 rounded-xl border border-border/50 bg-card hover:shadow-sm transition-all overflow-hidden">
                <span className="absolute inset-y-0 start-0 w-1 bg-[hsl(var(--kpi-3))]" />
                <div className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0 bg-[hsl(var(--kpi-3-soft))] text-[hsl(var(--kpi-3))]">
                  <Users className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[11px] text-muted-foreground truncate leading-tight">
                    {t("kpis.beneficiaries", "Total des Bénéficiaires")}
                  </div>
                  <div className="text-base sm:text-lg font-bold tracking-tight tabular-nums text-foreground mt-0.5">
                    {fmt(data.kpis.totalBeneficiaries, lang)}
                  </div>
                  <div className="text-[9px] text-muted-foreground/70 truncate mt-0.5">
                    🎯 {data.kpis.coverageRate.toFixed(1)}%
                  </div>
                </div>
              </div>

              {/* KPI 3: Taux de Féminisation */}
              <div className="relative flex items-center gap-3 p-3 rounded-xl border border-border/50 bg-card hover:shadow-sm transition-all overflow-hidden">
                <span className="absolute inset-y-0 start-0 w-1 bg-[hsl(var(--kpi-1))]" />
                <div className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0 bg-[hsl(var(--kpi-1-soft))] text-[hsl(var(--kpi-1))]">
                  <Trophy className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-[11px] text-muted-foreground truncate leading-tight">
                    {t("kpis.feminization", "Taux de Féminisation")}
                  </div>
                  <div className="text-base sm:text-lg font-bold tracking-tight tabular-nums text-foreground mt-0.5">{`${data.kpis.feminizationRate.toFixed(1)}%`}</div>
                </div>
              </div>

              {/* KPI 4: Total des Partenariats */}
              <div className="relative flex items-center gap-3 p-3 rounded-xl border border-border/50 bg-card hover:shadow-sm transition-all overflow-hidden">
                <span className="absolute inset-y-0 start-0 w-1 bg-[hsl(var(--kpi-4))]" />
                <div className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0 bg-[hsl(var(--kpi-4-soft))] text-[hsl(var(--kpi-4))]">
                  <Handshake className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-[11px] text-muted-foreground truncate leading-tight">
                    {t("kpis.partnerships", "Total des Partenariats")}
                  </div>
                  <div className="text-base sm:text-lg font-bold tracking-tight tabular-nums text-foreground mt-0.5">
                    {fmt(data.kpis.totalPartnerships, lang)}
                  </div>
                </div>
              </div>

              {/* KPI 5: Établissements Actifs */}
              <div className="relative flex items-center gap-3 p-3 rounded-xl border border-border/50 bg-card hover:shadow-sm transition-all overflow-hidden">
                <span className="absolute inset-y-0 start-0 w-1 bg-[hsl(var(--kpi-5))]" />
                <div className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0 bg-[hsl(var(--kpi-5-soft))] text-[hsl(var(--kpi-5))]">
                  <Gauge className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-[11px] text-muted-foreground truncate leading-tight">
                    {t("kpis.establishments", "Établissements Actifs")}
                  </div>
                  <div className="text-base sm:text-lg font-bold tracking-tight tabular-nums text-foreground mt-0.5">
                    {fmt(data.kpis.activeEstablishments, lang)}
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </section>

        {/* --- Section: Référence régionale (Moitié de page) --- */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* النص الأول: فيه الـ Benchmark */}
          <section className="space-y-3">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-foreground">
                {t("benchmark.title", "Référence régionale")}
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                {t(
                  "benchmark.subtitle",
                  "Comparaison de vos indicateurs clés avec la moyenne régionale.",
                )}
              </p>
            </div>

            <Card className="p-5">
              <div className="space-y-5">
                {benchmarkMetrics.map((metric) => (
                  <BenchmarkBar key={metric.label} metric={metric} />
                ))}
              </div>
            </Card>
          </section>

          <section className="flex flex-col space-y-3">
  <div>
    <h2 className="text-base sm:text-lg font-bold text-foreground">
      {t("coverage.title", "Analyse de la couverture")}
    </h2>
    <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
      {t(
        "coverage.subtitle",
        "Pénétration globale par rapport à la population cible."
      )}
    </p>
  </div>

  <Card className="p-5 flex-1 flex flex-col justify-between bg-card">
    
    {/* 1. التغطية المجالية (Province / Urbain / Rural) */}
    <div className="space-y-3">
      {/* Province */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs sm:text-sm">
          <span className="font-semibold text-foreground">Couverture Provinciale</span>
          <span className="font-bold text-primary tabular-nums">12.5%</span>
        </div>
        <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
          <div className="h-full bg-primary rounded-full transition-all" style={{ width: "12.5%" }} />
        </div>
      </div>

      {/* Urbain et Rural (مصغرين ومحطوطين فـ سطر واحد باش نقتصدو المساحة) */}
      <div className="grid grid-cols-2 gap-4 pt-1">
        {/* Urbain */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[11px] sm:text-xs">
            <span className="font-medium text-muted-foreground">Milieu Urbain</span>
            <span className="font-bold text-amber-500 tabular-nums">14.1%</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
            <div className="h-full bg-amber-500 rounded-full transition-all" style={{ width: "14.1%" }} />
          </div>
        </div>

        {/* Rural */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[11px] sm:text-xs">
            <span className="font-medium text-muted-foreground">Milieu Rural</span>
            <span className="font-bold text-emerald-500 tabular-nums">8.2%</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
            <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: "8.2%" }} />
          </div>
        </div>
      </div>
    </div>

    {/* خط فاصل خفيف */}
    <div className="border-t border-border/50 my-3" />

    {/* 2. التفاصيل حسب البرامج (Taux de pénétration par programme) */}
    <div className="space-y-2.5">
      <div className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground mb-2">
        Pénétration par programme
      </div>
      
      {/* Activités */}
      <div className="flex items-center gap-3">
        <div className="w-14 text-[11px] font-medium text-foreground">Activités</div>
        <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
          <div className="h-full bg-blue-500 rounded-full" style={{ width: "25%" }} />
        </div>
        <div className="w-8 text-right text-[11px] font-bold tabular-nums">5.1%</div>
      </div>

      {/* Festivals */}
      <div className="flex items-center gap-3">
        <div className="w-14 text-[11px] font-medium text-foreground">Festivals</div>
        <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
          <div className="h-full bg-purple-500 rounded-full" style={{ width: "75%" }} />
        </div>
        <div className="w-8 text-right text-[11px] font-bold tabular-nums">15.3%</div>
      </div>

      {/* Camping */}
      <div className="flex items-center gap-3">
        <div className="w-14 text-[11px] font-medium text-foreground">Camping</div>
        <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
          <div className="h-full bg-orange-500 rounded-full" style={{ width: "12%" }} />
        </div>
        <div className="w-8 text-right text-[11px] font-bold tabular-nums">2.4%</div>
      </div>
    </div>

  </Card>
</section>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {/* --- Section: Profil thématique (Donut Chart) --- */}
<section className="flex flex-col space-y-3">
  {/* العنوان برا برا الـ Card */}
  <div>
    <h2 className="text-base sm:text-lg font-bold text-foreground">
      {t("charts.radarTitle", "Profil thématique")}
    </h2>
    <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
      {t("charts.radarSubtitle", "Répartition par thématique d’action.")}
    </p>
  </div>

  <Card className="p-6 flex flex-col justify-between h-[420px]">
    <div className="h-[240px] w-full">
      <ResponsiveContainer width="100%" height="100%">
  <PieChart>
    <Pie
      data={data.radar}
      cx="50%"
      cy="50%"
      innerRadius={60}
      outerRadius={90}
      paddingAngle={5}
      dataKey="value"      // هادي ديال الأرقام
      nameKey="category"   // 💡 هادي هي اللي غاتخلي السمية (Culture, Sport...) تيبان فـ الـ Tooltip بلاصة 0,1,2,3
    >
      {/* الألوان */}
      <Cell fill="#2563eb" />
      <Cell fill="#22c55e" />
      <Cell fill="#8b5cf6" />
      <Cell fill="#ec4899" />
    </Pie>
    <Tooltip 
      contentStyle={{ 
        borderRadius: '12px', 
        border: 'none', 
        boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
        backgroundColor: 'hsl(var(--card))',
        color: 'hsl(var(--foreground))'
      }}
    />
  </PieChart>
</ResponsiveContainer>
    </div>

    {/* Custom Legend (نفس الستيل ديال التصويرة اللي صيفطتي) */}
    <div className="space-y-2 mt-4">
      {data.radar.map((entry, index) => {
        const colors = ["#2563eb", "#22c55e", "#8b5cf6", "#ec4899"];
        return (
          <div key={entry.category} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div 
                className="h-2.5 w-2.5 rounded-full" 
                style={{ backgroundColor: colors[index] }} 
              />
              <span className="text-sm font-medium text-muted-foreground">
                {entry.category}
              </span>
            </div>
            <span className="text-sm font-bold text-foreground tabular-nums">
              {entry.value}
            </span>
          </div>
        );
      })}
    </div>
  </Card>
</section>

          {/* --- Section: Évolution trimestrielle (Line Chart) --- */}
{/* --- Section: Évolution trimestrielle --- */}
<section className="flex flex-col space-y-3">
  {/* العنوان والعنوان الفرعي برا الـ Card */}
  <div>
    <h2 className="text-base sm:text-lg font-bold text-foreground">
      {t("charts.evolutionTitle", "Évolution trimestrielle")}
    </h2>
    <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
      {t(
        "charts.evolutionSubtitle",
        "Activités et bénéficiaires sur les quatre trimestres."
      )}
    </p>
  </div>

  {/* الـ Card فيها غير الـ Chart بوحدو بلا حتى شي تغيير داخلي */}
  <Card className="p-6 flex flex-col h-[420px]">
    <div className="flex-1 w-full mt-2">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data.evolution}>
          <XAxis dataKey="quarter" fontSize={11} tickLine={false} axisLine={false} />
          <YAxis fontSize={11} />
          <Tooltip
            contentStyle={{
              borderRadius: 8,
              border: "1px solid hsl(var(--border))",
              background: "hsl(var(--card))",
            }}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Line
            type="monotone"
            dataKey="activities"
            name={t("charts.activities", "Activités")}
            stroke="hsl(var(--primary))"
            strokeWidth={2.5}
            dot={{ r: 4 }}
          />
          <Line
            type="monotone"
            dataKey="beneficiaries"
            name={t("charts.beneficiaries", "Bénéficiaires")}
            stroke="hsl(var(--secondary))"
            strokeWidth={2.5}
            dot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  </Card>
</section>
        </div>

        <Card className="p-6">
          <ZoneHeadline
            title={t("tabs.title", "Détails sectoriels")}
            subtitle={t("tabs.subtitle", "Analyse par étape des indicateurs stratégiques.")}
          />
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="gap-1 flex-wrap">
              {tabDefinitions.map((tab) => (
                <TabsTrigger key={tab.key} value={tab.key}>
                  {tab.title}
                </TabsTrigger>
              ))}
            </TabsList>
            {tabDefinitions.map((tab) => (
              <TabsContent key={tab.key} value={tab.key}>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 mt-4">
                  {tab.cards.map((card) => (
                    <Card key={card.label} className="p-4 sm:p-5 border-border/60 bg-card">
                      <div className="text-[11px] text-muted-foreground uppercase tracking-wider mb-2">
                        {card.label}
                      </div>
                      <div className="text-2xl font-extrabold text-foreground tabular-nums">
                        {card.value}
                      </div>
                      {card.hint && (
                        <div className="text-[10px] text-muted-foreground/70 mt-1">{card.hint}</div>
                      )}
                    </Card>
                  ))}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </Card>

        <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <Card className="p-6 bg-sky-50 border border-sky-100 ring-1 ring-sky-100/60">
            <div className="flex items-start gap-4">
              <div className="rounded-2xl bg-sky-500/10 p-3 text-sky-700">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground">
                  {t("insights.title", "Insights automatisés")}
                </h3>
                <p className="text-sm text-muted-foreground mt-3 leading-6">{data.insight}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 overflow-x-auto">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="text-lg font-bold text-foreground">
                  {t("ranking.title", "Classement anonymisé")}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {t("ranking.subtitle", "Comparaison avec d'autres directions anonymes.")}
                </p>
              </div>
            </div>
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead>{t("ranking.direction", "Direction")}</TableHead>
                  <TableHead className="text-end">{t("ranking.activities", "Activités")}</TableHead>
                  <TableHead className="text-end">
                    {t("ranking.beneficiaries", "Bénéficiaires")}
                  </TableHead>
                  <TableHead className="text-end">{t("ranking.score", "Score")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.anonymousRanking.map((row) => (
                  <TableRow key={row.name} className={row.current ? "bg-primary/10" : ""}>
                    <TableCell className="font-medium text-foreground">{row.name}</TableCell>
                    <TableCell className="text-end tabular-nums">
                      {fmt(row.activities, lang)}
                    </TableCell>
                    <TableCell className="text-end tabular-nums">
                      {fmt(row.beneficiaries, lang)}
                    </TableCell>
                    <TableCell className="text-end font-semibold tabular-nums">
                      {row.score.toFixed(1)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
};

export default DomainDashboard;
