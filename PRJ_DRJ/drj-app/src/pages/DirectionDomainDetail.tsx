import { useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AppLayout } from '@/components/AppLayout';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  LineChart, Line, PieChart, Pie, Cell,
} from 'recharts';
import {
  ArrowLeft, AlertCircle, CheckCircle2, Clock,
} from 'lucide-react';
import {
  fetchDomainSnapshot, DOMAIN_OPTIONS,
  type Domain, type DirectionRow, type SubmissionStatus,
} from '@/lib/domainData';
import { useAuth } from '@/hooks/useAuth';

/* -------------------- normalize -------------------- */
const normalizeId = (id?: string) =>
  id?.startsWith('dir-') ? id.replace('dir-', '') : id;

/* -------------------- status UI -------------------- */
const STATUS_TONE: Record<SubmissionStatus, any> = {
  completed: {
    bg: 'bg-success/15',
    text: 'text-success',
    ring: 'ring-success/30',
    icon: CheckCircle2,
  },
  in_progress: {
    bg: 'bg-warning/15',
    text: 'text-warning',
    ring: 'ring-warning/30',
    icon: Clock,
  },
  not_started: {
    bg: 'bg-destructive/15',
    text: 'text-destructive',
    ring: 'ring-destructive/30',
    icon: AlertCircle,
  },
};

/* -------------------- format -------------------- */
const fmt = (n: number, lang: string) =>
  new Intl.NumberFormat(lang === 'ar' ? 'ar-MA' : 'fr-FR').format(Math.round(n));

/* ================================================== */
const DirectionDomainDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const lang = i18n.language;

  const { utilisateur, role } = useAuth();

  const domain = (params.get('domain') as Domain) || 'jeunesse';
  const year = Number(params.get('year')) || new Date().getFullYear();

  const [rows, setRows] = useState<DirectionRow[]>([]);
  const [loading, setLoading] = useState(true);

  /* -------------------- load data -------------------- */
  useEffect(() => {
    setLoading(true);
    fetchDomainSnapshot({ domain, year, period: 'annual' }).then(snap => {
      setRows(snap.directions);
      setLoading(false);
    });
  }, [domain, year]);

  const row = rows.find(r => r.id === id);

  /* ==================================================
     🔐 ACCESS CONTROL (ONLY ONCE — CLEAN VERSION)
  ================================================== */
  const isBlocked =
    !loading &&
    row &&
    role === 'directeur_prefectoral' &&
    normalizeId(utilisateur?.direction_id) !== normalizeId(row.id);

  if (isBlocked) {
    return (
      <AppLayout>
        <Card className="p-6 text-center">
          Access denied
        </Card>
      </AppLayout>
    );
  }

  /* -------------------- loading -------------------- */
  if (loading) {
    return (
      <AppLayout>
        <div className="grid gap-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-24 bg-muted/50 rounded-xl animate-pulse" />
          ))}
        </div>
      </AppLayout>
    );
  }

  /* -------------------- not found -------------------- */
  if (!row) {
    return (
      <AppLayout>
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">{t('dashboard.noData')}</p>
          <Button className="mt-4" onClick={() => navigate('/domain-dashboard')}>
            <ArrowLeft className="h-4 w-4 me-2 rtl:rotate-180" />
            {t('detail.back')}
          </Button>
        </Card>
      </AppLayout>
    );
  }

  /* -------------------- computed -------------------- */
  const StatusIcon = STATUS_TONE[row.status].icon;

  const cov =
    row.population > 0
      ? (row.participants / row.population) * 100
      : 0;

  const hasNoReport =
    row.status === 'not_started' ||
    (row.activities === 0 && row.participants === 0);

  const domainOpt = DOMAIN_OPTIONS.find(d => d.value === domain);
  const domainLabel =
    domainOpt ? (lang === 'ar' ? domainOpt.labelAr : domainOpt.labelFr) : domain;

  const regionalAvg = useMemo(() => {
    const active = rows.filter(r => r.status !== 'not_started');
    if (!active.length) return { activities: 0, participants: 0, coverage: 0, partnerships: 0 };

    return {
      activities: active.reduce((a, r) => a + r.activities, 0) / active.length,
      participants: active.reduce((a, r) => a + r.participants, 0) / active.length,
      coverage: active.reduce((a, r) => a + (r.participants / r.population) * 100, 0) / active.length,
      partnerships: active.reduce((a, r) => a + r.partnerships, 0) / active.length,
    };
  }, [rows]);

  const compareData = [
    { metric: t('domain.kpi.activitiesShort', 'Activités'), direction: row.activities, moyenne: regionalAvg.activities },
    { metric: t('domain.kpi.participantsShort', 'Participants'), direction: row.participants, moyenne: regionalAvg.participants },
    { metric: t('domain.kpi.partnerships', 'Total partenariats'), direction: row.partnerships, moyenne: regionalAvg.partnerships },
  ];

  const genderData = [
    { name: t('detail.female'), value: row.participantsFemale },
    { name: t('detail.male'), value: row.participantsMale },
  ];

  /* -------------------- UI -------------------- */
  return (
    <AppLayout>
      <div className="space-y-5 animate-fade-in">

        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/domain-dashboard')}
          className="gap-1.5"
        >
          <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
          {t('detail.back')}
        </Button>

        <Card className="overflow-hidden border-primary/30 ring-1 ring-primary/20">

          {/* HEADER */}
          <div className="gradient-hero p-5 sm:p-6 text-primary-foreground">
            <Badge variant="outline" className="bg-white/15 text-white border-white/20 mb-2">
              {domainLabel} · {year}
            </Badge>

            <h2 className="text-xl sm:text-2xl font-extrabold">{row.name}</h2>

            <div className="flex items-center gap-2 mt-2 text-sm opacity-90">
              <StatusIcon className="h-4 w-4" />
              {t(`domain.status.${row.status}`)}
            </div>
          </div>

          {/* BODY */}
          {hasNoReport ? (
            <div className="p-8 text-center">
              <AlertCircle className="h-8 w-8 mx-auto text-warning mb-2" />
              <p className="text-sm text-muted-foreground">
                {t('domain.detail.noReportBody')}
              </p>
            </div>
          ) : (
            <div className="p-5 sm:p-6 space-y-5">

              {/* STATS */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <MiniStat label="Activités" value={fmt(row.activities, lang)} />
                <MiniStat label="Participants" value={fmt(row.participants, lang)} />
                <MiniStat label="Couverture" value={`${cov.toFixed(2)}%`} />
                <MiniStat label="Partenariats" value={fmt(row.partnerships, lang)} />
              </div>

            </div>
          )}
        </Card>
      </div>
    </AppLayout>
  );
};

/* -------------------- mini card -------------------- */
const MiniStat = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-lg bg-muted/40 p-3">
    <div className="text-[10px] text-muted-foreground uppercase tracking-wider">
      {label}
    </div>
    <div className="text-xl font-extrabold text-foreground tabular-nums mt-1">
      {value}
    </div>
  </div>
);

export default DirectionDomainDetail;