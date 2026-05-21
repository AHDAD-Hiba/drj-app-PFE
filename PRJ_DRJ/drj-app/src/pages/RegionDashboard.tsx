import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { AppLayout } from '@/components/AppLayout';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line,
} from 'recharts';
import {
  Users, Building2, Handshake, Trophy, Tent, Sparkles, GraduationCap,
  TrendingUp, CheckCircle2, Clock, FileEdit, Download, FileText, FileSpreadsheet,
  Target, Activity, PieChart as PieChartIcon, BarChart3, LineChart as LineChartIcon,
  AlertTriangle, CheckCircle, XCircle, Filter, Search, ArrowUpDown,
} from 'lucide-react';
import { computeTotalBeneficiaries, formatNumber, formatDate, usePrefName } from '@/lib/data';
import { exportDashboardCsv, exportDashboardPdf } from '@/lib/export';
import { exportDashboardXlsx } from '@/lib/excelExport';
import { YearSwitcher, DEFAULT_YEAR } from '@/components/YearSwitcher';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const STATUS_STYLE: Record<string, string> = {
  validee: 'bg-success/15 text-success border-success/30',
  soumise: 'bg-info/15 text-info border-info/30',
  brouillon: 'bg-warning/15 text-warning border-warning/30',
};

const STATUS_ICON: Record<string, any> = {
  validee: CheckCircle2,
  soumise: Clock,
  brouillon: FileEdit,
};

const RegionDashboard = () => {
  const { t, i18n } = useTranslation();
  const { profile, isRegionalTeam } = useAuth();
  const getName = usePrefName();
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [prefectures, setPrefectures] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState<number>(DEFAULT_YEAR);
  const [filterDomain, setFilterDomain] = useState<string>('jeunesse');
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [selectedDirection, setSelectedDirection] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      supabase.from('submissions').select('*').eq('year', year),
      supabase.from('prefectures').select('*'),
    ]).then(([subs, prefs]) => {
      setSubmissions(subs.data ?? []);
      setPrefectures(prefs.data ?? []);
      setLoading(false);
    });
  }, [year]);

  // Access control: only regional team can access
  if (!isRegionalTeam) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <XCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">{t('common.accessDenied', 'Accès refusé')}</h2>
            <p className="text-muted-foreground">
              {t('common.regionalAccessOnly', 'Cette page est réservée à l\'équipe régionale.')}
            </p>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (loading) {
    return (
      <AppLayout>
        <div className="grid gap-4">
          {[...Array(8)].map((_, i) => <div key={i} className="h-24 bg-muted/50 rounded-xl animate-pulse" />)}
        </div>
      </AppLayout>
    );
  }

  // Data processing
  const prefMap = new Map(prefectures.map(p => [p.id, p]));

  // Global completion tracking
  const totalDirections = prefectures.length;
  const submittedCount = submissions.filter(s => s.status !== 'brouillon').length;
  const inProgressCount = submissions.filter(s => s.status === 'soumise').length;
  const notStartedCount = totalDirections - submittedCount;

  const submittedPct = totalDirections > 0 ? Math.round((submittedCount / totalDirections) * 100) : 0;
  const inProgressPct = totalDirections > 0 ? Math.round((inProgressCount / totalDirections) * 100) : 0;
  const notStartedPct = totalDirections > 0 ? Math.round((notStartedCount / totalDirections) * 100) : 0;

  // KPI calculations
  const totalPopulation = 8000000; // Example population for Casablanca-Settat region
  const totalParticipants = submissions.reduce((a, s) => a + computeTotalBeneficiaries(s), 0);
  const coverageRate = totalPopulation > 0 ? Math.round((totalParticipants / totalPopulation) * 100) : 0;

  const totalActivities = submissions.reduce((a, s) => a + (s.perm_educative + s.perm_cultural + s.perm_sportive + s.perm_capacity +
    s.outreach_educative + s.outreach_cultural + s.outreach_sportive + s.outreach_capacity +
    (s.camping_participants ?? 0) + (s.integration_beneficiaries ?? 0)), 0);

  const totalMale = submissions.reduce((a, s) => a + (s.camping_male ?? 0), 0);
  const totalFemale = submissions.reduce((a, s) => a + (s.camping_female ?? 0), 0);
  const totalBeneficiaries = totalMale + totalFemale;

  const totalPartnerships = submissions.reduce((a, s) => a + (s.perm_conventions ?? 0), 0);
  const avgScore = submissions.length > 0 ? submissions.reduce((a, s) => a + (s.global_score ?? 0), 0) / submissions.length : 0;

  // Direction data for comparison
  const directionData = submissions.map(s => {
    const pref = prefMap.get(s.prefecture_id);
    return {
      id: s.id,
      prefectureId: s.prefecture_id,
      name: pref ? getName(pref) : 'Unknown',
      score: Number(s.global_score ?? 0),
      activities: computeTotalBeneficiaries(s),
      participants: (s.camping_male ?? 0) + (s.camping_female ?? 0),
      coverageRate: totalPopulation > 0 ? Math.round((computeTotalBeneficiaries(s) / totalPopulation) * 100) : 0,
      status: s.status,
      completeness: Number(s.completeness_pct ?? 0),
    };
  }).sort((a, b) => b.score - a.score);

  // Filtered and sorted data
  const filteredDirections = directionData.filter(d =>
    d.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedDirections = [...filteredDirections].sort((a, b) => {
    if (!sortConfig) return 0;
    const { key, direction } = sortConfig;
    const aVal = a[key as keyof typeof a];
    const bVal = b[key as keyof typeof b];
    if (aVal < bVal) return direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return direction === 'asc' ? 1 : -1;
    return 0;
  });

  // Charts data
  const activitiesChartData = directionData.slice(0, 10).map(d => ({
    name: d.name.split(' ')[0],
    activities: d.activities,
  }));

  const evolutionData = [
    { year: year - 2, participants: Math.round(totalParticipants * 0.8) },
    { year: year - 1, participants: Math.round(totalParticipants * 0.9) },
    { year, participants: totalParticipants },
  ];

  const genderData = [
    { name: t('detail.male', 'Garçons'), value: totalMale, color: 'hsl(var(--primary))' },
    { name: t('detail.female', 'Filles'), value: totalFemale, color: 'hsl(var(--secondary))' },
  ];

  const activityTypesData = [
    { name: t('detail.permanent', 'Permanentes'), value: submissions.reduce((a, s) => a + (s.perm_educative + s.perm_cultural + s.perm_sportive + s.perm_capacity), 0), color: 'hsl(var(--primary))' },
    { name: t('detail.outreach', 'Rayonnantes'), value: submissions.reduce((a, s) => a + (s.outreach_educative + s.outreach_cultural + s.outreach_sportive + s.outreach_capacity), 0), color: 'hsl(var(--primary-glow))' },
    { name: t('detail.camping', 'Camping'), value: submissions.reduce((a, s) => a + (s.camping_participants ?? 0), 0), color: 'hsl(var(--secondary))' },
    { name: t('detail.integration', 'Intégration'), value: submissions.reduce((a, s) => a + (s.integration_beneficiaries ?? 0), 0), color: 'hsl(var(--success))' },
  ];

  // Smart insights
  const topDirections = directionData.slice(0, 3);
  const bottomDirections = directionData.slice(-3);
  const avgRegionalScore = directionData.reduce((a, d) => a + d.score, 0) / directionData.length;

  const handleSort = (key: string) => {
    setSortConfig(current => {
      if (current?.key === key) {
        return { key, direction: current.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { key, direction: 'desc' };
    });
  };

  const selectedDirectionData = selectedDirection ? directionData.find(d => d.prefectureId === selectedDirection) : null;

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Hero */}
        <div className="relative overflow-hidden rounded-2xl gradient-hero p-6 sm:p-8 text-primary-foreground shadow-elegant">
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider opacity-80">{t('dashboard.welcomeBack', { name: profile?.full_name ?? '' })}</p>
              <h1 className="text-2xl sm:text-3xl font-extrabold mt-2">{t('regionDashboard.title', 'Tableau de bord régional DRJ')}</h1>
              <p className="text-sm sm:text-base opacity-90 mt-1">{t('regionDashboard.subtitle', 'Vue globale de la région Casablanca-Settat')}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => exportDashboardCsv(directionData, i18n.language, t)}
                className="gap-1.5 bg-white/15 hover:bg-white/25 text-white border-0 backdrop-blur-sm"
              >
                <Download className="h-4 w-4" />
                CSV
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => exportDashboardXlsx(directionData, [
                  { label: t('dashboard.score'), value: avgScore.toFixed(1) },
                  { label: t('dashboard.kpi.beneficiaries'), value: formatNumber(totalBeneficiaries, i18n.language) },
                  { label: t('dashboard.kpi.associations'), value: formatNumber(totalActivities, i18n.language) },
                ], i18n.language, t, year)}
                className="gap-1.5 bg-white/15 hover:bg-white/25 text-white border-0 backdrop-blur-sm"
              >
                <FileSpreadsheet className="h-4 w-4" />
                Excel
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => exportDashboardPdf(directionData, [
                  { label: t('dashboard.score'), value: avgScore.toFixed(1) },
                  { label: t('dashboard.kpi.beneficiaries'), value: formatNumber(totalBeneficiaries, i18n.language) },
                  { label: t('dashboard.kpi.associations'), value: formatNumber(totalActivities, i18n.language) },
                ], i18n.language, t)}
                className="gap-1.5 bg-white/15 hover:bg-white/25 text-white border-0 backdrop-blur-sm"
              >
                <FileText className="h-4 w-4" />
                PDF
              </Button>
            </div>
          </div>
          <div className="absolute -top-12 -end-12 w-48 h-48 rounded-full bg-secondary/30 blur-3xl" />
          <div className="absolute -bottom-8 -start-8 w-40 h-40 rounded-full bg-primary-glow/40 blur-2xl" />
        </div>

        {/* Filters */}
        <Card className="p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-bold">{t('dashboard.filters', 'Filtres')}</h3>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            <div className="space-y-1">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                {t('common.year', 'Année')}
              </span>
              <input
                type="number"
                value={year}
                onChange={e => setYear(Number(e.target.value) || DEFAULT_YEAR)}
                min={2020}
                max={2099}
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              />
            </div>
            <div className="space-y-1">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                {t('common.domain', 'Domaine')}
              </span>
              <Select value={filterDomain} onValueChange={setFilterDomain}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="jeunesse">{t('domain.options.jeunesse', 'Jeunesse')}</SelectItem>
                  <SelectItem value="femme" disabled>{t('domain.options.femme', 'Femme / Fille')}</SelectItem>
                  <SelectItem value="enfants" disabled>{t('domain.options.enfance', 'Enfance')}</SelectItem>
                  <SelectItem value="creche" disabled>{t('domain.options.creche', 'Crèche')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        {/* Global Completion Tracking */}
        <Card className="p-5 sm:p-6">
          <h2 className="font-bold text-foreground mb-4">{t('regionDashboard.completionTracking', 'Suivi global du remplissage')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-success mb-1">{submittedPct}%</div>
              <div className="text-sm text-muted-foreground">{t('status.validee', 'Terminé')}</div>
              <div className="text-lg font-semibold">{submittedCount} directions</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-info mb-1">{inProgressPct}%</div>
              <div className="text-sm text-muted-foreground">{t('status.soumise', 'En cours')}</div>
              <div className="text-lg font-semibold">{inProgressCount} directions</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-warning mb-1">{notStartedPct}%</div>
              <div className="text-sm text-muted-foreground">{t('status.brouillon', 'Non commencé')}</div>
              <div className="text-lg font-semibold">{notStartedCount} directions</div>
            </div>
          </div>
          <Progress value={submittedPct} className="h-3 mb-4" />
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
            {prefectures.map(pref => {
              const sub = submissions.find(s => s.prefecture_id === pref.id);
              const status = sub?.status || 'brouillon';
              const StatusIcon = STATUS_ICON[status] ?? FileEdit;
              return (
                <div key={pref.id} className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                  <StatusIcon className="h-4 w-4" />
                  <span className="text-xs font-medium truncate">{getName(pref)}</span>
                </div>
              );
            })}
          </div>
        </Card>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          <Card className="relative p-4 sm:p-5 border-border/60 hover:shadow-elegant transition-smooth hover:-translate-y-0.5 overflow-hidden bg-card">
            <span className="absolute inset-y-0 start-0 w-1 bg-primary" />
            <Target className="h-8 w-8 mb-3 text-primary" />
            <div className="text-xl sm:text-2xl font-extrabold tracking-tight tabular-nums text-primary">
              {coverageRate}%
            </div>
            <div className="text-xs text-muted-foreground mt-1 leading-tight">
              {t('regionDashboard.kpi.coverageRate', 'Taux de couverture global')}
            </div>
          </Card>

          <Card className="relative p-4 sm:p-5 border-border/60 hover:shadow-elegant transition-smooth hover:-translate-y-0.5 overflow-hidden bg-card">
            <span className="absolute inset-y-0 start-0 w-1 bg-secondary" />
            <Activity className="h-8 w-8 mb-3 text-secondary" />
            <div className="text-xl sm:text-2xl font-extrabold tracking-tight tabular-nums text-secondary">
              {formatNumber(totalActivities, i18n.language)}
            </div>
            <div className="text-xs text-muted-foreground mt-1 leading-tight">
              {t('regionDashboard.kpi.totalActivities', 'Total activités')}
            </div>
          </Card>

          <Card className="relative p-4 sm:p-5 border-border/60 hover:shadow-elegant transition-smooth hover:-translate-y-0.5 overflow-hidden bg-card">
            <span className="absolute inset-y-0 start-0 w-1 bg-info" />
            <Users className="h-8 w-8 mb-3 text-info" />
            <div className="text-xl sm:text-2xl font-extrabold tracking-tight tabular-nums text-info">
              {formatNumber(totalBeneficiaries, i18n.language)}
            </div>
            <div className="text-xs text-muted-foreground mt-1 leading-tight">
              {t('regionDashboard.kpi.totalParticipants', 'Total participants')}
            </div>
          </Card>

          <Card className="relative p-4 sm:p-5 border-border/60 hover:shadow-elegant transition-smooth hover:-translate-y-0.5 overflow-hidden bg-card">
            <span className="absolute inset-y-0 start-0 w-1 bg-success" />
            <Handshake className="h-8 w-8 mb-3 text-success" />
            <div className="text-xl sm:text-2xl font-extrabold tracking-tight tabular-nums text-success">
              {formatNumber(totalPartnerships, i18n.language)}
            </div>
            <div className="text-xs text-muted-foreground mt-1 leading-tight">
              {t('regionDashboard.kpi.totalPartnerships', 'Total partenariats')}
            </div>
          </Card>

          <Card className="relative p-4 sm:p-5 border-border/60 hover:shadow-elegant transition-smooth hover:-translate-y-0.5 overflow-hidden bg-card">
            <span className="absolute inset-y-0 start-0 w-1 bg-warning" />
            <Trophy className="h-8 w-8 mb-3 text-warning" />
            <div className="text-xl sm:text-2xl font-extrabold tracking-tight tabular-nums text-warning">
              {avgScore.toFixed(1)}
            </div>
            <div className="text-xs text-muted-foreground mt-1 leading-tight">
              {t('regionDashboard.kpi.globalScore', 'Score global moyen')}
            </div>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid lg:grid-cols-3 gap-4">
          <Card className="lg:col-span-2 p-5 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-foreground flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                {t('regionDashboard.charts.activitiesPerDirection', 'Activités par direction')}
              </h2>
              <Badge variant="outline" className="text-xs">{t('common.year')} {year}</Badge>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={activitiesChartData}>
                <XAxis dataKey="name" fontSize={10} interval={0} angle={-25} textAnchor="end" height={60} />
                <YAxis fontSize={11} />
                <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid hsl(var(--border))' }} />
                <Bar dataKey="activities" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          <Card className="p-5 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-foreground flex items-center gap-2">
                <PieChartIcon className="h-5 w-5" />
                {t('regionDashboard.charts.genderDistribution', 'Répartition par genre')}
              </h2>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={genderData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={85} paddingAngle={2}>
                  {genderData.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid hsl(var(--border))' }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-1.5 mt-3">
              {genderData.map((d, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ background: d.color }} />
                    <span className="text-muted-foreground truncate">{d.name}</span>
                  </div>
                  <span className="font-semibold tabular-nums">{formatNumber(d.value, i18n.language)}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Evolution Chart */}
        <Card className="p-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-foreground flex items-center gap-2">
              <LineChartIcon className="h-5 w-5" />
              {t('regionDashboard.charts.evolution', 'Évolution temporelle')}
            </h2>
            <Badge variant="outline" className="text-xs">{t('regionDashboard.charts.participantsOverTime', 'Participants sur 3 ans')}</Badge>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={evolutionData}>
              <XAxis dataKey="year" fontSize={11} />
              <YAxis fontSize={11} />
              <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid hsl(var(--border))' }} />
              <Line type="monotone" dataKey="participants" stroke="hsl(var(--primary))" strokeWidth={3} dot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="overview">{t('regionDashboard.tabs.overview', 'Vue globale')}</TabsTrigger>
            {selectedDirection && (
              <TabsTrigger value="detail">
                {t('regionDashboard.tabs.detail', 'Détail')} - {selectedDirectionData?.name}
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            {/* Comparison Table */}
            <Card className="overflow-hidden">
              <div className="p-5 sm:p-6 border-b border-border">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-bold text-foreground">{t('regionDashboard.comparisonTable', 'Comparaison des directions')}</h2>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                      <Input
                        placeholder={t('common.search', 'Rechercher')}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9 h-9 w-64"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">{t('dashboard.rank')}</TableHead>
                      <TableHead>
                        <Button variant="ghost" onClick={() => handleSort('name')} className="h-auto p-0 font-semibold">
                          {t('dashboard.direction')}
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        </Button>
                      </TableHead>
                      <TableHead className="text-right">
                        <Button variant="ghost" onClick={() => handleSort('score')} className="h-auto p-0 font-semibold">
                          {t('dashboard.score')}
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        </Button>
                      </TableHead>
                      <TableHead className="text-right">
                        <Button variant="ghost" onClick={() => handleSort('activities')} className="h-auto p-0 font-semibold">
                          {t('regionDashboard.table.activities')}
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        </Button>
                      </TableHead>
                      <TableHead className="text-right">
                        <Button variant="ghost" onClick={() => handleSort('participants')} className="h-auto p-0 font-semibold">
                          {t('regionDashboard.table.participants')}
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        </Button>
                      </TableHead>
                      <TableHead className="text-right">
                        <Button variant="ghost" onClick={() => handleSort('coverageRate')} className="h-auto p-0 font-semibold">
                          {t('regionDashboard.table.coverageRate')}
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        </Button>
                      </TableHead>
                      <TableHead className="text-center">{t('dashboard.completeness')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedDirections.map((direction, index) => (
                      <TableRow
                        key={direction.id}
                        className="cursor-pointer hover:bg-muted/30 transition-smooth"
                        onClick={() => {
                          setSelectedDirection(direction.prefectureId);
                          setActiveTab('detail');
                        }}
                      >
                        <TableCell>
                          <span className={`inline-flex items-center justify-center h-7 w-7 rounded-lg text-xs font-bold ${
                            index < 3 ? 'gradient-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                          }`}>
                            {index + 1}
                          </span>
                        </TableCell>
                        <TableCell className="font-medium">{direction.name}</TableCell>
                        <TableCell className="text-right font-bold tabular-nums">{direction.score.toFixed(1)}</TableCell>
                        <TableCell className="text-right tabular-nums">{formatNumber(direction.activities, i18n.language)}</TableCell>
                        <TableCell className="text-right tabular-nums">{formatNumber(direction.participants, i18n.language)}</TableCell>
                        <TableCell className="text-right tabular-nums">{direction.coverageRate}%</TableCell>
                        <TableCell className="text-center">
                          <Progress value={direction.completeness} className="h-2 w-16 mx-auto" />
                          <div className="text-xs text-muted-foreground mt-1">{direction.completeness.toFixed(0)}%</div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>

            {/* Smart Insights */}
            <Card className="p-5 sm:p-6">
              <h2 className="font-bold text-foreground mb-4 flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                {t('regionDashboard.smartInsights', 'Insights intelligents')}
              </h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <div className="flex items-start gap-3 p-3 rounded-lg bg-success/10 border border-success/20">
                  <CheckCircle className="h-5 w-5 text-success mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-semibold text-success mb-1">
                      {t('regionDashboard.insights.goodPerformance', 'Bonne performance régionale')}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {avgScore >= 70 ? t('regionDashboard.insights.aboveAverage', 'Score moyen au-dessus de 70') :
                       avgScore >= 50 ? t('regionDashboard.insights.average', 'Performance moyenne satisfaisante') :
                       t('regionDashboard.insights.needsImprovement', 'Amélioration nécessaire')}
                    </div>
                  </div>
                </div>

                {topDirections.length > 0 && (
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-primary/10 border border-primary/20">
                    <Trophy className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="font-semibold text-primary mb-1">
                        {t('regionDashboard.insights.topDirections', 'Top directions')}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {topDirections.slice(0, 2).map(d => d.name.split(' ')[0]).join(', ')}
                        {topDirections.length > 2 && ` +${topDirections.length - 2}`}
                      </div>
                    </div>
                  </div>
                )}

                {bottomDirections.length > 0 && (
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-warning/10 border border-warning/20">
                    <AlertTriangle className="h-5 w-5 text-warning mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="font-semibold text-warning mb-1">
                        {t('regionDashboard.insights.needsAttention', 'Directions à surveiller')}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {bottomDirections.slice(0, 2).map(d => d.name.split(' ')[0]).join(', ')}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="detail" className="space-y-4">
            {selectedDirectionData && (
              <>
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold">{selectedDirectionData.name}</h2>
                  <Button variant="outline" onClick={() => setSelectedDirection(null)}>
                    {t('common.back', 'Retour')}
                  </Button>
                </div>

                {/* Direction KPIs */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <Card className="p-4 text-center">
                    <Activity className="h-8 w-8 mx-auto mb-2 text-primary" />
                    <div className="text-2xl font-bold text-primary">{formatNumber(selectedDirectionData.activities, i18n.language)}</div>
                    <div className="text-sm text-muted-foreground">{t('regionDashboard.kpi.totalActivities')}</div>
                  </Card>
                  <Card className="p-4 text-center">
                    <Users className="h-8 w-8 mx-auto mb-2 text-info" />
                    <div className="text-2xl font-bold text-info">{formatNumber(selectedDirectionData.participants, i18n.language)}</div>
                    <div className="text-sm text-muted-foreground">{t('regionDashboard.kpi.totalParticipants')}</div>
                  </Card>
                  <Card className="p-4 text-center">
                    <Target className="h-8 w-8 mx-auto mb-2 text-success" />
                    <div className="text-2xl font-bold text-success">{selectedDirectionData.coverageRate}%</div>
                    <div className="text-sm text-muted-foreground">{t('regionDashboard.kpi.coverageRate')}</div>
                  </Card>
                  <Card className="p-4 text-center">
                    <Handshake className="h-8 w-8 mx-auto mb-2 text-warning" />
                    <div className="text-2xl font-bold text-warning">
                      {submissions.find(s => s.prefecture_id === selectedDirection)?.perm_conventions ?? 0}
                    </div>
                    <div className="text-sm text-muted-foreground">{t('regionDashboard.kpi.partnerships')}</div>
                  </Card>
                </div>

                {/* Direction Charts */}
                <div className="grid md:grid-cols-2 gap-4">
                  <Card className="p-5">
                    <h3 className="font-semibold mb-4">{t('regionDashboard.charts.evolution')}</h3>
                    <ResponsiveContainer width="100%" height={200}>
                      <LineChart data={evolutionData}>
                        <XAxis dataKey="year" fontSize={10} />
                        <YAxis fontSize={10} />
                        <Tooltip />
                        <Line type="monotone" dataKey="participants" stroke="hsl(var(--primary))" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </Card>

                  <Card className="p-5">
                    <h3 className="font-semibold mb-4">{t('regionDashboard.charts.activityTypes')}</h3>
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie data={activityTypesData} dataKey="value" nameKey="name" innerRadius={40} outerRadius={70}>
                          {activityTypesData.map((d, i) => <Cell key={i} fill={d.color} />)}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </Card>
                </div>

                {/* Comparison with Regional Average */}
                <Card className="p-5">
                  <h3 className="font-semibold mb-4">{t('regionDashboard.comparisonWithAverage', 'Comparaison avec la moyenne régionale')}</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-sm text-muted-foreground mb-1">{t('dashboard.score')}</div>
                      <div className={`text-lg font-bold ${selectedDirectionData.score > avgScore ? 'text-success' : 'text-warning'}`}>
                        {selectedDirectionData.score > avgScore ? '+' : ''}{(selectedDirectionData.score - avgScore).toFixed(1)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        vs {avgScore.toFixed(1)} {t('regionDashboard.average', 'moyenne')}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm text-muted-foreground mb-1">{t('regionDashboard.table.activities')}</div>
                      <div className="text-lg font-bold text-primary">
                        {formatNumber(selectedDirectionData.activities, i18n.language)}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm text-muted-foreground mb-1">{t('regionDashboard.table.participants')}</div>
                      <div className="text-lg font-bold text-info">
                        {formatNumber(selectedDirectionData.participants, i18n.language)}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm text-muted-foreground mb-1">{t('dashboard.completeness')}</div>
                      <div className="text-lg font-bold text-secondary">
                        {selectedDirectionData.completeness.toFixed(0)}%
                      </div>
                    </div>
                  </div>
                </Card>
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default RegionDashboard;