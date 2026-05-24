import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/AppLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  Tooltip,
  ResponsiveContainer,
  Legend,
  XAxis,
  YAxis,
  CartesianGrid,Area,AreaChart
} from "recharts";
import {
  Activity,
  Users,
  Handshake,
  Gauge,
  Trophy,
  Calendar,
  Layers,
  FileSpreadsheet,
  CheckCircle2,
  Clock,
  AlertCircle,
  CalendarDays,
  Target,
  TrendingUp,
  TrendingDown,
  Minus,
  ChevronDown,
  ChevronUp,
  Tent,Landmark,
  GraduationCap,MapPin, Medal, Building, TreePine,
  Briefcase,
  Music,
  Building2,
  FileText,Sparkles, HardHat, Wrench, Package, Scale, Users2, Shield, HeartHandshake
} from "lucide-react";
import { DOMAIN_OPTIONS, type Domain } from "@/lib/domainData";
import { useAuth } from "@/hooks/useAuth";

const fmt = (n: number, lang: string) =>
  new Intl.NumberFormat(lang === "ar" ? "ar-MA" : "fr-FR").format(Math.round(n));

type WorkflowStatus = "NON_COMMENCE" | "EN_COURS" | "TERMINE";

const WORKFLOW_STATUS: Record<WorkflowStatus, { label: string; badge: string; icon: any }> = {
  NON_COMMENCE: { label: "NON COMMENCÉ", badge: "bg-warning/15 text-warning", icon: AlertCircle },
  EN_COURS: { label: "EN COURS", badge: "bg-info/15 text-info", icon: Clock },
  TERMINE: { label: "TERMINÉ", badge: "bg-success/15 text-success", icon: CheckCircle2 },
};

const DomainDashboard = () => {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const { utilisateur: profile } = useAuth();

  const [domain, setDomain] = useState<Domain>("jeunesse");
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [openSection, setOpenSection] = useState<string | null>("activites");

  const dashboardData = {
    status: {
      workflowStatus: "EN_COURS" as any, 
      completedSteps: 4,
      totalSteps: 6,
      lastUpdated: new Date().toISOString(),
    },
    kpis: {
      totalBeneficiaries: 24780,
      totalActivities: 1450,
      feminizationRate: 46.5,
      ruralityRate: 34.2,
      activeEstablishments: 28,
      activePartnerships: 42,
    },
    repartition: [
      {
        name: "Camping",
        total: 4800,
        hommesPct: 58,
        femmesPct: 42,
        urbainPct: 45,
        ruralPct: 55,
      },
      {
        name: "Formation",
        total: 1600,
        hommesPct: 47,
        femmesPct: 53,
        urbainPct: 100, 
        ruralPct: 0,    
      },
      {
        name: "Festivals",
        total: 5500,
        hommesPct: 50,
        femmesPct: 50,
        urbainPct: 80,
        ruralPct: 20,
      },
      {
        name: "Insertion",
        total: 400,
        hommesPct: 68,
        femmesPct: 32,
        urbainPct: 60,
        ruralPct: 40,
      },
    ],
    evolution: [
      { name: "T1", Camping: 1200, Festivals: 800, Formation: 300, Insertion: 50 },
      { name: "T2", Camping: 1500, Festivals: 1200, Formation: 400, Insertion: 80 },
      { name: "T3", Camping: 3000, Festivals: 2500, Formation: 200, Insertion: 120 },
      { name: "T4", Camping: 800,  Festivals: 1000, Formation: 700, Insertion: 150 },
    ],
    benchmark: [
      { 
        kpi: "Couverture globale", 
        monScore: 12.5, 
        moyenneReg: 10.2, 
        isPercentage: true 
      },
      { 
        kpi: "Taux de féminisation", 
        monScore: 48.0, 
        moyenneReg: 45.5, 
        isPercentage: true 
      },
      { 
        kpi: "Taux de ruralité", 
        monScore: 35.0, 
        moyenneReg: 40.0, 
        isPercentage: true 
      },
      { 
        kpi: "Établissements actifs", 
        monScore: 85.0, 
        moyenneReg: 72.0, 
        isPercentage: true 
      },
      { 
        kpi: "Partenariats / établ.", 
        monScore: 1.5, 
        moyenneReg: 0.8, 
        isPercentage: false 
      },
    ],
    
    detailed: {
      activites: {
        nombre_associations: 45,
        nombre_clubs: 18,
        nombre_conventions: 5,
        activites_sportives: 38,
        activites_culturelles: 14,
        activites_educatives: 22,
        renforcement_capacites: 12
      },
      camping: {
        participants: {
          total: 4800,
          enfants_mre: 140,
          besoins_specifiques: 35
        },
        encadrement: {
          ratio: "1:22",
          total_staff: 210,
          hommes: 120,
          femmes: 90
        },
        associations: {
          locales: 45,
          nationales: 12,
          mouvements: 8
        },
        formations: {
          total_sessions: 5,
          beneficiaires: 150
        }
      },
      etablissements: {
        total: 28,
        operationnels: 21, 
        nouvellement_creees: 2,
        en_cours_realisation: 1,
        fermees: {
          total: 4,
          causes: [
            { type: "Mise à niveau", count: 2 },
            { type: "Encadrement", count: 1 },
            { type: "Équipement", count: 1 },
            { type: "Conflit juridique", count: 0 },
            { type: "En attente d'inauguration", count: 0 }
          ]
        }
      },
      festivals: {
        total_evenements: 6,
        total_provinces: 14,
        total_participants: 1250,
        qualifies: 320,
        genre: { 
          hommes: 750, 
          femmes: 500 
        },
        milieu: { 
          urbain: 900, 
          rural: 350 
        }
      },
      insertion: {
        total_activites: 12,
        total_participants: 850,
        partenaires_actifs: 8,
        volume_horaire: "144 Heures",
        genre: { 
          hommes: 400, 
          femmes: 450 
        },
        milieu: { 
          urbain: 600, 
          rural: 250 
        }
      },
      conventions: {
        total_conventions: 45,
        total_partenaires: 12,
        repartition: [
          { type: "Secteur Public", count: 20 },
          { type: "Société Civile", count: 15 },
          { type: "Secteur Privé", count: 7 },
          { type: "Coopération Internationale", count: 3 }
        ]
      }
    }
};

  const statusMeta = WORKFLOW_STATUS[dashboardData.status.workflowStatus];
  const StatusIcon = statusMeta.icon;
  const progressPct = Math.round((dashboardData.status.completedSteps / dashboardData.status.totalSteps) * 100);

  const toggleSection = (section: string) => {
    setOpenSection(openSection === section ? null : section);
  };

  const activeDomainLabel = useMemo(() => {
  const option = DOMAIN_OPTIONS.find((opt) => opt.value === domain);
  return option ? (lang === "ar" ? option.labelAr : option.labelFr) : domain;
}, [domain, lang]);

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in pb-12">
        
        {/* --- HERO HEADER --- */}
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
            <Button variant="outline" className="bg-white/10 border-white/20 hover:bg-white/20 text-white">
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              {t("domain.exportExcel", "Exporter Excel")}
            </Button>
          </div>
        </div>


        {/* --- FILTRES --- */}
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

        {/* --- SECTION 1 : Suivi du rapport --- */}
        <section className="space-y-3">
  <div className="flex items-baseline justify-between">
    <h2 className="text-base sm:text-lg font-bold text-foreground">
      {t("workflow.title", "Suivi du rapport")}
    </h2>
  </div>
  <Card className="p-5 sm:p-6">
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6 items-center">
      <div className={`rounded-xl p-4 ${statusMeta.badge} bg-opacity-30 ring-1 ring-current/20`}>
        <div className="flex items-center gap-2">
          <StatusIcon className="h-4 w-4" />
          <span className="text-[11px] font-semibold uppercase tracking-wider">Statut</span>
        </div>
        <div className="text-lg font-extrabold mt-1">{statusMeta.label}</div>
      </div>
      <div>
        <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Domaine Filtré</div>
        <div className="text-lg font-bold text-foreground mt-1">{activeDomainLabel}</div>
      </div>
      <div>
        <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Dernière mise à jour</div>
        <div className="text-lg font-bold text-foreground mt-1 flex items-center gap-1.5">
          <CalendarDays className="h-4 w-4 text-muted-foreground" />
          {/* CORRECTION ICI : dashboardData à la place de data */}
          {dashboardData.status.lastUpdated ? new Date(dashboardData.status.lastUpdated).toLocaleDateString("fr-FR") : "-"}
        </div>
      </div>
      <div>
        <div className="flex items-baseline justify-between mb-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Progression</span>
          <span className="text-sm font-bold tabular-nums text-foreground">{progressPct}%</span>
        </div>
        <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
          <div className="h-full bg-primary transition-all duration-500" style={{ width: `${progressPct}%` }} />
        </div>
      </div>
    </div>
  </Card>
</section>

        {/* --- Section 2: Top KPIs --- */}
        <section className="space-y-3">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-foreground">
              {t("kpis.title", "Top KPIs principaux")}
            </h2>
          </div>
          <Card className="p-4 sm:p-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative p-5 rounded-2xl border border-border/60 bg-card hover:shadow-md transition-all min-h-[150px] flex flex-col justify-between overflow-hidden">
                <span className="absolute inset-y-0 start-0 w-1 bg-[hsl(var(--kpi-2))]" />
                <div className="h-11 w-11 rounded-xl flex items-center justify-center bg-[hsl(var(--kpi-2-soft))] text-[hsl(var(--kpi-2))]"><Activity className="h-5 w-5" /></div>
                <div className="space-y-1">
                  <div className="text-3xl font-extrabold tracking-tight text-foreground tabular-nums">{fmt(dashboardData.kpis.totalActivities, lang)}</div>
                  <div className="text-sm text-muted-foreground leading-snug">{t("kpis.activities", "Total des Activités")}</div>
                </div>
              </div>
              <div className="relative p-5 rounded-2xl border border-border/60 bg-card hover:shadow-md transition-all min-h-[150px] flex flex-col justify-between overflow-hidden">
                <span className="absolute inset-y-0 start-0 w-1 bg-[hsl(var(--kpi-3))]" />
                <div className="h-11 w-11 rounded-xl flex items-center justify-center bg-[hsl(var(--kpi-3-soft))] text-[hsl(var(--kpi-3))]"><Users className="h-5 w-5" /></div>
                <div className="space-y-1">
                  <div className="text-3xl font-extrabold tracking-tight text-foreground tabular-nums">{fmt(dashboardData.kpis.totalBeneficiaries, lang)}</div>
                  <div className="text-sm text-muted-foreground leading-snug">{t("kpis.beneficiaries", "Total Bénéficiaires")}</div>
                </div>
              </div>
              <div className="relative p-5 rounded-2xl border border-border/60 bg-card hover:shadow-md transition-all min-h-[150px] flex flex-col justify-between overflow-hidden">
                <span className="absolute inset-y-0 start-0 w-1 bg-[hsl(var(--kpi-6))]" />
                <div className="h-11 w-11 rounded-xl flex items-center justify-center bg-[hsl(var(--kpi-6-soft))] text-[hsl(var(--kpi-6))]"><Target className="h-5 w-5" /></div>
                <div className="space-y-1">
                  {/* استعملنا ruralityRate حيت حيدنا coverageRate فالنسخة اللخرة، أو تقدر تزيد coverageRate فالمعطيات الفوق */}
                  <div className="text-3xl font-extrabold tracking-tight text-foreground tabular-nums">{`${dashboardData.kpis.ruralityRate?.toFixed(1) || 12.5}%`}</div>
                  <div className="text-sm text-muted-foreground leading-snug">{t("kpis.coverage", "Taux de Couverture")}</div>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div className="relative p-5 rounded-2xl border border-border/60 bg-card hover:shadow-md transition-all min-h-[150px] flex flex-col justify-between overflow-hidden">
                <span className="absolute inset-y-0 start-0 w-1 bg-[hsl(var(--kpi-1))]" />
                <div className="h-11 w-11 rounded-xl flex items-center justify-center bg-[hsl(var(--kpi-1-soft))] text-[hsl(var(--kpi-1))]"><Trophy className="h-5 w-5" /></div>
                <div className="space-y-1">
                  <div className="text-3xl font-extrabold tracking-tight text-foreground tabular-nums">{`${dashboardData.kpis.feminizationRate.toFixed(1)}%`}</div>
                  <div className="text-sm text-muted-foreground leading-snug">{t("kpis.feminization", "Taux de Féminisation")}</div>
                </div>
              </div>
              <div className="relative p-5 rounded-2xl border border-border/60 bg-card hover:shadow-md transition-all min-h-[150px] flex flex-col justify-between overflow-hidden">
                <span className="absolute inset-y-0 start-0 w-1 bg-[hsl(var(--kpi-4))]" />
                <div className="h-11 w-11 rounded-xl flex items-center justify-center bg-[hsl(var(--kpi-4-soft))] text-[hsl(var(--kpi-4))]"><Handshake className="h-5 w-5" /></div>
                <div className="space-y-1">
                  <div className="text-3xl font-extrabold tracking-tight text-foreground tabular-nums">{fmt(dashboardData.kpis.activePartnerships, lang)}</div>
                  <div className="text-sm text-muted-foreground leading-snug">{t("kpis.partnerships", "Total Partenariats")}</div>
                </div>
              </div>
              <div className="relative p-5 rounded-2xl border border-border/60 bg-card hover:shadow-md transition-all min-h-[150px] flex flex-col justify-between overflow-hidden">
                <span className="absolute inset-y-0 start-0 w-1 bg-[hsl(var(--kpi-5))]" />
                <div className="h-11 w-11 rounded-xl flex items-center justify-center bg-[hsl(var(--kpi-5-soft))] text-[hsl(var(--kpi-5))]"><Gauge className="h-5 w-5" /></div>
                <div className="space-y-1">
                  <div className="text-3xl font-extrabold tracking-tight text-foreground tabular-nums">{fmt(dashboardData.kpis.activeEstablishments, lang)}</div>
                  <div className="text-sm text-muted-foreground leading-snug">{t("kpis.establishments", "Établissements Actifs")}</div>
                </div>
              </div>
            </div>
          </Card>
        </section>

        {/* --- SECTION 3 : Répartition des bénéficiaires --- */}
<section className="space-y-4">
  <div>
    <h2 className="text-lg font-bold text-foreground">
      {t("charts.axeTitle", "Répartition des bénéficiaires par axe")}
    </h2>
  </div>

  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
    
    {/* Chart 1: Volume Global */}
    <Card className="p-5 flex flex-col">
      <div className="mb-4">
        <h3 className="text-sm font-bold text-foreground">Volume Global par Programme</h3>
        <p className="text-xs text-muted-foreground mt-0.5">Nombre absolu de bénéficiaires impactés</p>
      </div>
      <div className="h-[250px] w-full mt-auto">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={dashboardData.repartition} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} dy={10} />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
            <Tooltip
              cursor={{ fill: "hsl(var(--muted)/0.4)" }}
              contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))', fontSize: '12px' }}
            />
            <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} maxBarSize={50} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>

    {/* Chart 2: Mixité H/F */}
    <Card className="p-5 flex flex-col">
      <div className="mb-4">
        <h3 className="text-sm font-bold text-foreground">Mixité H / F par Programme (%)</h3>
        <p className="text-xs text-muted-foreground mt-0.5">Taux de féminisation comparatif</p>
      </div>
      <div className="h-[250px] w-full mt-auto">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={dashboardData.repartition} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} dy={10} />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickFormatter={(val) => `${val}%`} />
            <Tooltip
              cursor={{ fill: "hsl(var(--muted)/0.4)" }}
              contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))', fontSize: '12px' }}
              formatter={(value: number) => [`${value}%`, ""]}
            />
            <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} iconType="circle" />
            <Bar dataKey="hommesPct" name="Hommes" stackId="a" fill="#3b82f6" radius={[0, 0, 4, 4]} maxBarSize={50} />
            <Bar dataKey="femmesPct" name="Femmes" stackId="a" fill="#ec4899" radius={[4, 4, 0, 0]} maxBarSize={50} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>

    {/* Chart 3: Urbain / Rural */}
    <Card className="p-5 flex flex-col">
      <div className="mb-4">
        <h3 className="text-sm font-bold text-foreground">Couverture Territorial (Urbain / Rural)</h3>
        <p className="text-xs text-muted-foreground mt-0.5">Analyse incluant les données estimées</p>
      </div>
      <div className="h-[250px] w-full mt-auto">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={dashboardData.repartition} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} dy={10} />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickFormatter={(val) => `${val}%`} />
            <Tooltip
              cursor={{ fill: "hsl(var(--muted)/0.4)" }}
              contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))', fontSize: '12px' }}
              formatter={(value: number) => [`${value}%`, ""]}
            />
            <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} iconType="square" />
            <Bar dataKey="urbainPct" name="Urbain" stackId="a" fill="#f59e0b" radius={[0, 0, 4, 4]} maxBarSize={50} />
            <Bar dataKey="ruralPct" name="Rural" stackId="a" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={50} />
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
      {t("charts.evolutionTitle", "Évolution trimestrielle des bénéficiaires")}
    </h2>
  </div>
  
  <Card className="p-5">
    <div className="mb-6">
      <h3 className="text-sm font-bold text-foreground">Trajectoire des performances par programme</h3>
      <p className="text-xs text-muted-foreground mt-0.5">
        Évolution du nombre de bénéficiaires (T1 à T4) pour les axes éligibles
      </p>
    </div>
    
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={dashboardData.evolution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="colorCamping" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorFestivals" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} dy={10} />
          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
          <Tooltip 
            contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))', fontSize: '12px' }}
          />
          <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }} iconType="circle" />
          
          <Area type="monotone" dataKey="Camping" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorCamping)" />
          <Area type="monotone" dataKey="Festivals" stroke="#8b5cf6" strokeWidth={2} fillOpacity={1} fill="url(#colorFestivals)" />
          <Area type="monotone" dataKey="Formation" stroke="#ec4899" strokeWidth={2} fill="none" />
          <Area type="monotone" dataKey="Insertion" stroke="#10b981" strokeWidth={2} fill="none" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  </Card>
</section>

        {/* --- Section 5 : Benchmark régional --- */}
<section className="space-y-3">
  <div>
    <h2 className="text-base sm:text-lg font-bold text-foreground">
      {t("benchmark.title", "Benchmark régional")}
    </h2>
  </div>
  <Card className="bg-card w-full overflow-x-auto">
    <Table>
      <TableHeader className="bg-muted/50">
        <TableRow>
          <TableHead className="font-semibold py-4">Indicateur</TableHead>
          <TableHead className="text-right font-semibold">Préfecture</TableHead>
          <TableHead className="text-right font-semibold">Moyenne Régionale</TableHead>
          <TableHead className="text-right font-semibold">Écart</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {dashboardData.benchmark.map((item, idx) => {
          const ecart = Number((item.monScore - item.moyenneReg).toFixed(1));
          const isPositive = ecart > 0;
          const isNegative = ecart < 0;
          const formatValue = (val: number) => item.isPercentage ? `${val.toFixed(1)}%` : val.toFixed(1);

          return (
            <TableRow key={idx} className="hover:bg-muted/20 transition-colors">
              <TableCell className="font-medium text-xs sm:text-sm py-3 sm:py-4">{item.kpi}</TableCell>
              <TableCell className="text-right font-bold tabular-nums text-xs sm:text-sm">{formatValue(item.monScore)}</TableCell>
              <TableCell className="text-right text-muted-foreground tabular-nums text-xs sm:text-sm">{formatValue(item.moyenneReg)}</TableCell>
              <TableCell className="text-right tabular-nums text-xs sm:text-sm">
                <div className="flex items-center justify-end gap-1">
                  {isPositive && <><TrendingUp className="w-3.5 h-3.5 text-emerald-500" /><span className="text-emerald-500 font-bold">+{formatValue(ecart)}</span></>}
                  {isNegative && <><TrendingDown className="w-3.5 h-3.5 text-red-500" /><span className="text-red-500 font-bold">{formatValue(ecart)}</span></>}
                  {ecart === 0 && <><Minus className="w-3.5 h-3.5 text-muted-foreground" /><span className="text-muted-foreground font-medium">0</span></>}
                </div>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  </Card>
</section>

        {/* --- SECTION 6 : Détails du rapport (Accordion) --- */}
        <section className="space-y-2">
          <h2 className="text-base sm:text-lg font-bold text-foreground">
            {t("benchmark.title", "Lecture détaillée du rapport")}
            </h2>
          <div className="space-y-3">
            
            {/* ACCORDION ITEM 1: ACTIVITÉS */}
            <Card className="overflow-hidden border-border/70 shadow-none">
              <button onClick={() => toggleSection("activites")} className="w-full flex items-center justify-between p-4 bg-muted/20 hover:bg-muted/40 transition-colors">
                <div className="flex items-center gap-2 font-bold text-sm text-foreground">
                  <Activity className="h-4 w-4 text-blue-500" /> Activités (Permanentes & Rayonnantes)
                </div>
                {openSection === "activites" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>
              
              {openSection === "activites" && (
                <div className="p-5 bg-card border-t border-border/50">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
                          Écosystème & Structures
                        </h4>
                        <div className="grid grid-cols-3 gap-3">
                          <div className="p-3 bg-muted/30 rounded-xl border border-border/50 flex flex-col items-center justify-center text-center">
                            <span className="text-2xl font-black text-foreground">
                              {dashboardData.detailed?.activites?.nombre_associations || 45}
                            </span>
                            <span className="text-[10px] font-medium text-muted-foreground mt-1">Associations</span>
                          </div>
                          <div className="p-3 bg-muted/30 rounded-xl border border-border/50 flex flex-col items-center justify-center text-center">
                            <span className="text-2xl font-black text-foreground">
                              {dashboardData.detailed?.activites?.nombre_clubs || 18}
                            </span>
                            <span className="text-[10px] font-medium text-muted-foreground mt-1">Clubs Actifs</span>
                          </div>
                          <div className="p-3 bg-muted/30 rounded-xl border border-border/50 flex flex-col items-center justify-center text-center">
                            <span className="text-2xl font-black text-foreground">
                              {dashboardData.detailed?.activites?.nombre_conventions || 5}
                            </span>
                            <span className="text-[10px] font-medium text-muted-foreground mt-1">Conventions</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex justify-between items-end">
                        <span>Volume d'Animation</span>
                        <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded font-bold">
                          Total: 86 Actions
                        </span>
                      </h4>
                      <div className="space-y-3.5">
                        
                        {/* Activités Sportives */}
                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="font-medium text-foreground">Activités Sportives</span>
                            <span className="font-bold">38</span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-1.5">
                            <div className="bg-orange-500 h-1.5 rounded-full" style={{ width: '44%' }}></div>
                          </div>
                        </div>

                        {/* Activités Éducatives */}
                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="font-medium text-foreground">Activités Éducatives</span>
                            <span className="font-bold">22</span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-1.5">
                            <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: '25%' }}></div>
                          </div>
                        </div>

                        {/* Activités Culturelles */}
                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="font-medium text-foreground">Activités Culturelles</span>
                            <span className="font-bold">14</span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-1.5">
                            <div className="bg-pink-500 h-1.5 rounded-full" style={{ width: '16%' }}></div>
                          </div>
                        </div>

                        {/* Renforcement des capacités */}
                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="font-medium text-foreground">Renforcement des capacités</span>
                            <span className="font-bold">12</span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-1.5">
                            <div className="bg-purple-500 h-1.5 rounded-full" style={{ width: '15%' }}></div>
                          </div>
                        </div>

                      </div>
                    </div>

                  </div>
                </div>
              )}
            </Card>

            {/* ACCORDION ITEM 2: CAMPING & FORMATION */}
            <Card className="overflow-hidden border-border/70 shadow-none">
              <button onClick={() => toggleSection("camping")} className="w-full flex items-center justify-between p-4 bg-muted/20 hover:bg-muted/40 transition-colors">
                <div className="flex items-center gap-2 font-bold text-sm text-foreground">
                  <Tent className="h-4 w-4 text-emerald-500" /> Programme National de Camping & Formations
                </div>
                {openSection === "camping" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>
              
              {openSection === "camping" && (
                <div className="p-5 bg-card border-t border-border/50 grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10">
                  
                  {/* الجهة اليسرى: المشاركين والتأطير */}
                  <div className="space-y-6">
                    {/* Participants */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                        <Users2 className="h-4 w-4" /> Bénéficiaires & Participants
                      </h4>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="col-span-2 p-4 bg-emerald-500/10 rounded-xl border border-emerald-500/20 flex items-center justify-between">
                          <div>
                            <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400 block">Total Bénéficiaires</span>
                            <span className="text-[10px] text-emerald-600/80">Colonies de vacances</span>
                          </div>
                          <span className="text-3xl font-black text-emerald-600">4,800</span>
                        </div>
                        <div className="p-3 bg-muted/20 rounded-xl border border-border/50">
                          <span className="text-[11px] font-medium text-muted-foreground block mb-1">Enfants MRE</span>
                          <span className="text-xl font-bold text-foreground">140</span>
                        </div>
                        <div className="p-3 bg-muted/20 rounded-xl border border-border/50">
                          <span className="text-[11px] font-medium text-muted-foreground block mb-1">Besoins Spécifiques</span>
                          <span className="text-xl font-bold text-foreground">35</span>
                        </div>
                      </div>
                    </div>

                    {/* Encadrement */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                        <Shield className="h-4 w-4" /> Dispositif d'Encadrement
                      </h4>
                      <div className="flex gap-3">
                        <div className="flex-1 p-3 bg-blue-500/5 rounded-xl border border-blue-500/10 flex flex-col justify-center items-center">
                          <span className="text-2xl font-black text-blue-600">1:22</span>
                          <span className="text-[10px] text-blue-600/80 font-medium">Ratio d'encadrement</span>
                        </div>
                        <div className="flex-[2] p-3 bg-muted/20 rounded-xl border border-border/50 flex flex-col justify-between">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-xs font-medium text-muted-foreground">Staff Mobilisé</span>
                            <span className="text-sm font-bold text-foreground">210</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 rounded-full bg-blue-500" style={{ width: '57%' }} title="Hommes: 120"></div>
                            <div className="flex-1 h-2 rounded-full bg-pink-500" style={{ width: '43%' }} title="Femmes: 90"></div>
                          </div>
                          <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                            <span>120 Hommes</span>
                            <span>90 Femmes</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* الجهة اليمنى: الجمعيات والتكوينات */}
                  <div className="space-y-6">
                    {/* Associations & Mouvements */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                        <HeartHandshake className="h-4 w-4" /> Tissu Associatif
                      </h4>
                      <div className="p-4 bg-muted/30 rounded-xl border border-border/50 space-y-3">
                        <div className="flex justify-between items-center text-sm border-b border-border/50 pb-2">
                          <span className="text-muted-foreground">Associations Locales</span>
                          <span className="font-bold text-foreground">45</span>
                        </div>
                        <div className="flex justify-between items-center text-sm border-b border-border/50 pb-2">
                          <span className="text-muted-foreground">Associations Nationales</span>
                          <span className="font-bold text-foreground">12</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-muted-foreground">Mouvements Associatifs</span>
                          <span className="font-bold text-foreground">8</span>
                        </div>
                      </div>
                    </div>

                    {/* Formations */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                        <GraduationCap className="h-4 w-4" /> Formations (Encadrement)
                      </h4>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-4 bg-amber-500/5 rounded-xl border border-amber-500/10 flex flex-col justify-center">
                          <span className="text-2xl font-bold text-amber-600">5</span>
                          <span className="text-[11px] font-medium text-amber-600/80 mt-1">Sessions Organisées</span>
                        </div>
                        <div className="p-4 bg-amber-500/5 rounded-xl border border-amber-500/10 flex flex-col justify-center">
                          <span className="text-2xl font-bold text-amber-600">150</span>
                          <span className="text-[11px] font-medium text-amber-600/80 mt-1">Cadres Formés</span>
                        </div>
                      </div>
                    </div>
                  </div>

                </div>
              )}
            </Card>

            {/* ACCORDION ITEM 3: CONVENTIONS & PARTENARIATS */}
            <Card className="overflow-hidden border-border/70 shadow-none">
              <button onClick={() => toggleSection("conventions")} className="w-full flex items-center justify-between p-4 bg-muted/20 hover:bg-muted/40 transition-colors">
                <div className="flex items-center gap-2 font-bold text-sm text-foreground">
                  <Handshake className="h-4 w-4 text-emerald-500" /> Conventions et Partenariats
                </div>
                {openSection === "conventions" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>
              
              {openSection === "conventions" && (
                <div className="p-5 bg-card border-t border-border/50 grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10">
                  
                  {/* الجهة اليسرى: الإحصائيات العامة */}
                  <div className="space-y-4">
                    <h4 className="h-7 text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <FileText className="h-4 w-4" /> Bilan des Conventions
                    </h4>
                    
                    <div className="grid grid-cols-2 gap-3">
                      {/* Total Conventions - واخدة العرض كامل */}
                      <div className="col-span-2 p-4 bg-emerald-500/10 rounded-xl border border-emerald-500/20 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-emerald-500/20 rounded-lg">
                            <Handshake className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                          </div>
                          <span className="font-bold text-emerald-700 dark:text-emerald-400 text-sm">Total Conventions</span>
                        </div>
                        <span className="text-3xl font-black text-emerald-600 dark:text-emerald-400">45</span>
                      </div>

                      {/* Nombre de types de partenaires */}
                      <div className="col-span-2 p-4 bg-muted/20 rounded-xl border border-border/50 flex items-center justify-between">
                         <div className="flex items-center gap-2">
                           <Building2 className="h-4 w-4 text-muted-foreground" />
                           <span className="text-sm font-semibold text-foreground">Types de Partenaires Engagés</span>
                         </div>
                         <span className="text-xl font-bold text-foreground">12</span>
                      </div>
                    </div>
                  </div>

                  {/* الجهة اليمنى: توزيع الشركاء */}
                  <div className="space-y-4">
                    <h4 className="h-7 text-xs font-bold uppercase tracking-wider text-muted-foreground flex justify-between items-center">
                      <span className="flex items-center gap-1.5"><Building2 className="h-4 w-4" /> Répartition par Type</span>
                    </h4>

                    <div className="p-4 bg-muted/30 rounded-xl border border-border/50 space-y-4">
                      
                      {/* قائمة الشركاء بـ Progress Bars صغيرة */}
                      {dashboardData.detailed.conventions.repartition.map((item, index) => {
                        // حساب النسبة المئوية بناءً على المجموع الإجمالي (45)
                        const percentage = Math.round((item.count / dashboardData.detailed.conventions.total_conventions) * 100);
                        
                        return (
                          <div key={index} className="space-y-1.5">
                            <div className="flex justify-between items-center text-xs">
                              <span className="text-foreground font-medium">{item.type}</span>
                              <span className="text-muted-foreground font-bold">{item.count} <span className="text-[10px] font-normal">({percentage}%)</span></span>
                            </div>
                            <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-emerald-500 rounded-full" 
                                style={{ width: `${percentage}%` }}
                              ></div>
                            </div>
                          </div>
                        );
                      })}

                    </div>
                  </div>

                </div>
              )}
            </Card>

            {/* ACCORDION ITEM 4: INSERTION */}
            <Card className="overflow-hidden border-border/70 shadow-none">
              <button onClick={() => toggleSection("insertion")} className="w-full flex items-center justify-between p-4 bg-muted/20 hover:bg-muted/40 transition-colors">
                <div className="flex items-center gap-2 font-bold text-sm text-foreground">
                  <Landmark className="h-4 w-4 text-indigo-500" /> Intégration Socio-Économique
                </div>
                {openSection === "insertion" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>
              
              {openSection === "insertion" && (
                <div className="p-5 bg-card border-t border-border/50 grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10">
                  
                  {/* الجهة اليسرى: الأنشطة والشركاء */}
                  <div className="space-y-4">
                    <h4 className="h-7 text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <Target className="h-4 w-4" /> Bilan des Activités
                    </h4>
                    
                    <div className="grid grid-cols-2 gap-3">
                      {/* Total Activités - واخدة العرض كامل */}
                      <div className="col-span-2 p-4 bg-indigo-500/10 rounded-xl border border-indigo-500/20 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-indigo-500/20 rounded-lg">
                            <Landmark className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                          </div>
                          <span className="font-bold text-indigo-700 dark:text-indigo-400 text-sm">Activités Réalisées</span>
                        </div>
                        <span className="text-3xl font-black text-indigo-600 dark:text-indigo-400">12</span>
                      </div>

                      {/* Partenaires */}
                      <div className="p-3 bg-muted/20 rounded-xl border border-border/50 flex flex-col justify-center">
                        <span className="text-muted-foreground font-semibold text-xs flex items-center gap-1.5 mb-1">
                          <Handshake className="h-3.5 w-3.5 text-orange-500" /> Partenaires Actifs
                        </span>
                        <span className="text-2xl font-bold text-foreground">8</span>
                      </div>

                      {/* Volume Horaire */}
                      <div className="p-3 bg-muted/20 rounded-xl border border-border/50 flex flex-col justify-center">
                        <span className="text-muted-foreground font-semibold text-xs flex items-center gap-1.5 mb-1">
                          <Clock className="h-3.5 w-3.5 text-blue-500" /> Volume Global
                        </span>
                        <span className="text-2xl font-bold text-foreground">144<span className="text-sm font-medium text-muted-foreground ml-1">Hrs</span></span>
                      </div>
                    </div>
                  </div>

                  {/* الجهة اليمنى: الديموغرافيا (التوزيع والجنس) */}
                  <div className="space-y-4">
                    <h4 className="h-7 text-xs font-bold uppercase tracking-wider text-muted-foreground flex justify-between items-center">
                      <span className="flex items-center gap-1.5"><Users className="h-4 w-4" /> Bénéficiaires</span>
                      <span className="text-[10px] bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded font-bold border border-indigo-500/20">
                        Total: 850
                      </span>
                    </h4>

                    <div className="p-4 bg-muted/30 rounded-xl border border-border/50 space-y-5">
                      
                      {/* Répartition par Genre */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-center text-xs mb-1">
                          <span className="text-foreground font-bold">Répartition par Genre</span>
                        </div>
                        <div className="flex items-center gap-1.5 h-3">
                          {/* Hommes (47%) */}
                          <div className="h-full rounded-full bg-blue-500" style={{ width: '47%' }} title="Hommes: 400"></div>
                          {/* Femmes (53%) */}
                          <div className="h-full rounded-full bg-pink-500" style={{ width: '53%' }} title="Femmes: 450"></div>
                        </div>
                        <div className="flex justify-between text-[10px] text-muted-foreground font-medium">
                          <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-blue-500"></div> Hommes: 400</span>
                          <span className="flex items-center gap-1">Femmes: 450 <div className="w-2 h-2 rounded-full bg-pink-500"></div></span>
                        </div>
                      </div>

                      <div className="border-t border-border/50 my-2"></div>

                      {/* Répartition Spatiale (Urbain/Rural) */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-center text-xs mb-1">
                          <span className="text-foreground font-bold">Répartition Spatiale</span>
                        </div>
                        <div className="flex items-center gap-1.5 h-3">
                          {/* Urbain (70%) */}
                          <div className="h-full rounded-full bg-slate-500" style={{ width: '70%' }} title="Urbain: 600"></div>
                          {/* Rural (30%) */}
                          <div className="h-full rounded-full bg-emerald-500" style={{ width: '30%' }} title="Rural: 250"></div>
                        </div>
                        <div className="flex justify-between text-[10px] text-muted-foreground font-medium">
                          <span className="flex items-center gap-1"><Building className="h-3 w-3 text-slate-500" /> Urbain: 600</span>
                          <span className="flex items-center gap-1">Rural: 250 <TreePine className="h-3 w-3 text-emerald-500" /></span>
                        </div>
                      </div>

                    </div>
                  </div>

                </div>
              )}
            </Card>

            {/* ACCORDION ITEM 5: FESTIVALS */}
            <Card className="overflow-hidden border-border/70 shadow-none">
              <button onClick={() => toggleSection("festivals")} className="w-full flex items-center justify-between p-4 bg-muted/20 hover:bg-muted/40 transition-colors">
                <div className="flex items-center gap-2 font-bold text-sm text-foreground">
                  <Trophy className="h-4 w-4 text-purple-500" /> Festivals de Jeunesse
                </div>
                {openSection === "festivals" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>
              
              {openSection === "festivals" && (
                <div className="p-5 bg-card border-t border-border/50 grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10">
                  
                  {/* الجهة اليسرى: الحدث والإقصائيات */}
                  <div className="space-y-4">
                    <h4 className="h-7 text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                      <Activity className="h-4 w-4" /> Événements & Éliminatoires
                    </h4>
                    
                    <div className="grid grid-cols-2 gap-3">
                      {/* Total Festivals - واخدة العرض كامل */}
                      <div className="col-span-2 p-4 bg-purple-500/10 rounded-xl border border-purple-500/20 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-purple-500/20 rounded-lg">
                            <Trophy className="h-5 w-5 text-purple-600" />
                          </div>
                          <span className="font-bold text-purple-700 dark:text-purple-400 text-sm">Festivals Organisés</span>
                        </div>
                        <span className="text-3xl font-black text-purple-600">6</span>
                      </div>

                      {/* Provinces Participantes */}
                      <div className="p-3 bg-muted/20 rounded-xl border border-border/50 flex flex-col justify-center">
                        <span className="text-muted-foreground font-semibold text-xs flex items-center gap-1.5 mb-1">
                          <MapPin className="h-3.5 w-3.5 text-blue-500" /> Provinces (Couverture)
                        </span>
                        <span className="text-2xl font-bold text-foreground">14</span>
                      </div>

                      {/* Qualifiés */}
                      <div className="p-3 bg-amber-500/5 rounded-xl border border-amber-500/20 flex flex-col justify-center">
                        <span className="text-amber-600 font-semibold text-xs flex items-center gap-1.5 mb-1">
                          <Medal className="h-3.5 w-3.5" /> Qualifiés (Finales)
                        </span>
                        <span className="text-2xl font-bold text-foreground">320</span>
                      </div>
                    </div>
                  </div>

                  {/* الجهة اليمنى: الديموغرافيا (التوزيع والجنس) */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex justify-between items-end">
                      <span className="flex items-center gap-1.5"><Users className="h-4 w-4" /> Démographie des Participants</span>
                      <span className="text-[10px] bg-purple-500/10 text-purple-600 px-2 py-0.5 rounded font-bold border border-purple-500/20">
                        Total: 1,250
                      </span>
                    </h4>

                    <div className="p-4 bg-muted/30 rounded-xl border border-border/50 space-y-5">
                      
                      {/* Répartition par Genre */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-center text-xs mb-1">
                          <span className="text-foreground font-bold">Répartition par Genre</span>
                        </div>
                        <div className="flex items-center gap-1.5 h-3">
                          {/* Hommes (60%) */}
                          <div className="h-full rounded-full bg-blue-500" style={{ width: '60%' }} title="Hommes: 750"></div>
                          {/* Femmes (40%) */}
                          <div className="h-full rounded-full bg-pink-500" style={{ width: '40%' }} title="Femmes: 500"></div>
                        </div>
                        <div className="flex justify-between text-[10px] text-muted-foreground font-medium">
                          <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-blue-500"></div> Hommes: 750</span>
                          <span className="flex items-center gap-1">Femmes: 500 <div className="w-2 h-2 rounded-full bg-pink-500"></div></span>
                        </div>
                      </div>

                      <div className="border-t border-border/50 my-2"></div>

                      {/* Répartition Spatiale (Urbain/Rural) */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-center text-xs mb-1">
                          <span className="text-foreground font-bold">Répartition Spatiale</span>
                        </div>
                        <div className="flex items-center gap-1.5 h-3">
                          {/* Urbain (72%) */}
                          <div className="h-full rounded-full bg-slate-500" style={{ width: '72%' }} title="Urbain: 900"></div>
                          {/* Rural (28%) */}
                          <div className="h-full rounded-full bg-emerald-500" style={{ width: '28%' }} title="Rural: 350"></div>
                        </div>
                        <div className="flex justify-between text-[10px] text-muted-foreground font-medium">
                          <span className="flex items-center gap-1"><Building className="h-3 w-3 text-slate-500" /> Urbain: 900</span>
                          <span className="flex items-center gap-1">Rural: 350 <TreePine className="h-3 w-3 text-emerald-500" /></span>
                        </div>
                      </div>

                    </div>
                  </div>

                </div>
              )}
            </Card>

            {/* ACCORDION ITEM 6: ÉTABLISSEMENTS & PARTENARIATS */}
            <Card className="overflow-hidden border-border/70 shadow-none">
              <button onClick={() => toggleSection("etablissements")} className="w-full flex items-center justify-between p-4 bg-muted/20 hover:bg-muted/40 transition-colors">
                <div className="flex items-center gap-2 font-bold text-sm text-foreground">
                  <Building2 className="h-4 w-4 text-blue-500" /> Établissements & Infrastructures
                </div>
                {openSection === "etablissements" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>
              
              {openSection === "etablissements" && (
                <div className="p-5 bg-card border-t border-border/50 grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-10">
                  
                  {/* الجهة اليسرى: وضعية المؤسسات (Statut) - شكل جديد بالمربعات */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex justify-between items-end">
                      <span>Statut du Parc Actuel</span>
                      <span className="text-[10px] bg-blue-500/10 text-blue-600 px-2 py-0.5 rounded font-bold border border-blue-500/20">
                        Total: 28
                      </span>
                    </h4>

                    <div className="grid grid-cols-2 gap-3">
                      {/* Opérationnels - واخدة العرض كامل حيت هي الأهم */}
                      <div className="col-span-2 p-4 bg-emerald-500/10 rounded-xl border border-emerald-500/20 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-emerald-500/20 rounded-lg">
                            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                          </div>
                          <span className="font-bold text-emerald-700 dark:text-emerald-400 text-sm">Opérationnels / Actifs</span>
                        </div>
                        <span className="text-3xl font-black text-emerald-600">21</span>
                      </div>

                      {/* Nouvellement créées */}
                      <div className="p-3 bg-blue-500/5 rounded-xl border border-blue-500/10 flex flex-col justify-center">
                        <span className="text-blue-600 font-semibold text-xs flex items-center gap-1.5 mb-1">
                          <Sparkles className="h-3.5 w-3.5" /> Nouvelle création
                        </span>
                        <span className="text-2xl font-bold text-foreground">2</span>
                      </div>

                      {/* En cours de réalisation */}
                      <div className="p-3 bg-amber-500/5 rounded-xl border border-amber-500/10 flex flex-col justify-center">
                        <span className="text-amber-600 font-semibold text-xs flex items-center gap-1.5 mb-1">
                          <HardHat className="h-3.5 w-3.5" /> En réalisation
                        </span>
                        <span className="text-2xl font-bold text-foreground">1</span>
                      </div>
                    </div>
                  </div>

                  {/* الجهة اليمنى: المؤسسات المغلقة وأسبابها - شكل جديد بأشرطة التقدم */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex justify-between items-end">
                      <span>Analyse des Fermetures</span>
                      <span className="text-[10px] bg-red-500/10 text-red-600 px-2 py-0.5 rounded font-bold border border-red-500/20">
                        Total Fermées: 4
                      </span>
                    </h4>

                    <div className="p-4 bg-muted/30 rounded-xl border border-border/50 space-y-4">
                      
                      {/* Cause 1 */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-foreground font-medium flex items-center gap-1.5">
                            <Wrench className="h-3.5 w-3.5 text-amber-500" /> Mise à niveau
                          </span>
                          <span className="font-bold text-foreground">2</span>
                        </div>
                        <div className="h-1.5 w-full bg-muted-foreground/20 rounded-full overflow-hidden">
                          <div className="h-full bg-amber-500 rounded-full" style={{ width: '50%' }}></div>
                        </div>
                      </div>

                      {/* Cause 2 */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-foreground font-medium flex items-center gap-1.5">
                            <Users className="h-3.5 w-3.5 text-red-500" /> Encadrement (RH)
                          </span>
                          <span className="font-bold text-foreground">1</span>
                        </div>
                        <div className="h-1.5 w-full bg-muted-foreground/20 rounded-full overflow-hidden">
                          <div className="h-full bg-red-500 rounded-full" style={{ width: '25%' }}></div>
                        </div>
                      </div>

                      {/* Cause 3 */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-foreground font-medium flex items-center gap-1.5">
                            <Package className="h-3.5 w-3.5 text-orange-500" /> Équipement
                          </span>
                          <span className="font-bold text-foreground">1</span>
                        </div>
                        <div className="h-1.5 w-full bg-muted-foreground/20 rounded-full overflow-hidden">
                          <div className="h-full bg-orange-500 rounded-full" style={{ width: '25%' }}></div>
                        </div>
                      </div>

                      {/* Les causes à 0 (Grisées pour montrer qu'elles existent dans le form mais sont inactives) */}
                      <div className="pt-2 mt-2 border-t border-border/50 grid grid-cols-2 gap-2">
                        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground opacity-60">
                           <Scale className="h-3 w-3" /> Conflit juridique: 0
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground opacity-60">
                           <Clock className="h-3 w-3" /> Attente inaugu.: 0
                        </div>
                      </div>

                    </div>
                  </div>

                </div>
              )}
            </Card>

          </div>
        </section>

      </div>
    </AppLayout>
  );
};

export default DomainDashboard;