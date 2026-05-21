import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { AppLayout } from '@/components/AppLayout';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
} from 'recharts';
import {
  ArrowLeft, Users, Building2, Handshake, Trophy, Tent, GraduationCap, Sparkles,
  TrendingUp, AlertTriangle, CheckCircle2, Download, FileText, FileSpreadsheet,
} from 'lucide-react';
import { computeTotalBeneficiaries, formatNumber, formatDate, usePrefName } from '@/lib/data';
import { exportDirectionCsv, exportDirectionPdf } from '@/lib/export';
import { exportDirectionXlsx } from '@/lib/excelExport';

const STATUS_STYLE: Record<string, string> = {
  validee: 'bg-success/15 text-success border-success/30',
  soumise: 'bg-info/15 text-info border-info/30',
  brouillon: 'bg-warning/15 text-warning border-warning/30',
};

const DirectionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const getName = usePrefName();
  const [pref, setPref] = useState<any>(null);
  const [sub, setSub] = useState<any>(null);
  const [allSubs, setAllSubs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      supabase.from('prefectures').select('*').eq('id', id).maybeSingle(),
      supabase.from('submissions').select('*').eq('prefecture_id', id).eq('year', 2025).maybeSingle(),
      supabase.from('submissions').select('global_score, completeness_pct, perm_associations, perm_conventions, perm_clubs, integration_trainings, camping_trainings').eq('year', 2025),
    ]).then(([p, s, all]) => {
      setPref(p.data);
      setSub(s.data);
      setAllSubs(all.data ?? []);
      setLoading(false);
    });
  }, [id]);

  if (loading) {
    return (
      <AppLayout>
        <div className="h-32 bg-muted/50 rounded-xl animate-pulse" />
      </AppLayout>
    );
  }

  if (!pref) {
    return (
      <AppLayout>
        <Card className="p-8 text-center">
          <div className="mx-auto h-14 w-14 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
            <Building2 className="h-7 w-7 text-muted-foreground" />
          </div>
          <h2 className="text-lg font-bold text-foreground">Direction introuvable</h2>
          <p className="text-sm text-muted-foreground mt-2">
            L'identifiant fourni dans l'URL ne correspond à aucune direction.
          </p>
          <Button variant="outline" size="sm" onClick={() => navigate('/directions')} className="mt-4 gap-2">
            <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
            {t('detail.back')}
          </Button>
        </Card>
      </AppLayout>
    );
  }

  if (!sub) {
    return (
      <AppLayout>
        <div className="space-y-5 animate-fade-in">
          <Button variant="ghost" size="sm" onClick={() => navigate('/directions')} className="gap-2 -ms-2">
            <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
            {t('detail.back')}
          </Button>

          <Card className="overflow-hidden border-border/60">
            <div className="gradient-hero p-6 sm:p-8 text-primary-foreground relative">
              <div className="relative z-10">
                <Badge variant="outline" className="mb-3 border-0 bg-white/15 text-white">
                  En attente de soumission
                </Badge>
                <h1 className="text-2xl sm:text-3xl font-extrabold">{getName(pref)}</h1>
                <p className="text-sm opacity-90 mt-1">Code: {pref.code} · Année 2025</p>
              </div>
              <div className="absolute -top-12 -end-12 w-48 h-48 rounded-full bg-secondary/30 blur-3xl" />
            </div>
          </Card>

          <Card className="p-8 sm:p-12 text-center">
            <div className="mx-auto h-16 w-16 rounded-2xl bg-warning/15 text-warning flex items-center justify-center mb-4">
              <AlertTriangle className="h-8 w-8" />
            </div>
            <h2 className="text-lg font-bold text-foreground">Aucun rapport encore soumis</h2>
            <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
              Aucun rapport n'a encore été soumis pour la direction <strong>{getName(pref)}</strong> sur l'année en cours.
              Les indicateurs apparaîtront ici dès la première saisie validée.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 max-w-2xl mx-auto">
              {['Score global', 'Complétude', 'Bénéficiaires', 'Activités'].map(label => (
                <div key={label} className="rounded-lg bg-muted/40 p-3 text-start">
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</div>
                  <div className="text-2xl font-extrabold text-muted-foreground/40 mt-1">—</div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </AppLayout>
    );
  }

  const total = computeTotalBeneficiaries(sub);
  const permTotal = sub.perm_educative + sub.perm_cultural + sub.perm_sportive + sub.perm_capacity;
  const outreachTotal = sub.outreach_educative + sub.outreach_cultural + sub.outreach_sportive + sub.outreach_capacity;

  // Benchmarks
  const avgScore = allSubs.reduce((a, s) => a + Number(s.global_score), 0) / allSubs.length;
  const avgAssoc = allSubs.reduce((a, s) => a + s.perm_associations, 0) / allSubs.length;
  const avgConv = allSubs.reduce((a, s) => a + s.perm_conventions, 0) / allSubs.length;

  // Strengths / weaknesses
  const insights: { type: 'strength' | 'weakness'; label: string }[] = [];
  if (sub.perm_associations > avgAssoc * 1.1) insights.push({ type: 'strength', label: `${t('detail.associations')}: ${sub.perm_associations} (> moy. ${avgAssoc.toFixed(0)})` });
  else if (sub.perm_associations < avgAssoc * 0.85) insights.push({ type: 'weakness', label: `${t('detail.associations')}: ${sub.perm_associations} (< moy. ${avgAssoc.toFixed(0)})` });
  if (sub.perm_conventions > avgConv * 1.1) insights.push({ type: 'strength', label: `${t('detail.conventions')}: ${sub.perm_conventions}` });
  else if (sub.perm_conventions < avgConv * 0.85) insights.push({ type: 'weakness', label: `${t('detail.conventions')}: ${sub.perm_conventions}` });
  if (Number(sub.global_score) > avgScore * 1.05) insights.push({ type: 'strength', label: `${t('detail.globalScore')}: ${Number(sub.global_score).toFixed(1)}` });
  if (Number(sub.completeness_pct) < 80) insights.push({ type: 'weakness', label: `${t('detail.completenessRate')}: ${Number(sub.completeness_pct).toFixed(0)}%` });

  const programChart = [
    { name: t('detail.permanent'), value: permTotal },
    { name: t('detail.outreach'), value: outreachTotal },
    { name: t('detail.camping'), value: sub.camping_participants },
    { name: t('detail.festivals'), value: sub.festivals_participants },
    { name: t('detail.integration'), value: sub.integration_beneficiaries },
  ];

  const radarData = [
    { axis: t('detail.permanent'), v: Math.min(100, (permTotal / 20000) * 100) },
    { axis: t('detail.outreach'), v: Math.min(100, (outreachTotal / 12000) * 100) },
    { axis: t('detail.camping'), v: Math.min(100, (sub.camping_participants / 500) * 100) },
    { axis: t('detail.festivals'), v: Math.min(100, (sub.festivals_participants / 2500) * 100) },
    { axis: t('detail.integration'), v: Math.min(100, (sub.integration_beneficiaries / 1500) * 100) },
  ];

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between gap-2">
          <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')} className="gap-2 -ms-2">
            <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
            {t('detail.back')}
          </Button>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => exportDirectionCsv(pref, sub, i18n.language, t)}
              className="gap-1.5"
            >
              <Download className="h-4 w-4" />
              CSV
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => exportDirectionXlsx(pref, sub, i18n.language, t, 2025)}
              className="gap-1.5"
            >
              <FileSpreadsheet className="h-4 w-4" />
              Excel
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => exportDirectionPdf(pref, sub, i18n.language, t)}
              className="gap-1.5"
            >
              <FileText className="h-4 w-4" />
              PDF
            </Button>
          </div>
        </div>

        {/* Hero */}
        <Card className="overflow-hidden border-border/60">
          <div className="gradient-hero p-6 sm:p-8 text-primary-foreground relative">
            <div className="relative z-10">
              <Badge variant="outline" className={`mb-3 ${STATUS_STYLE[sub.status]} border-0 bg-white/15 text-white`}>
                {t(`status.${sub.status}`)}
              </Badge>
              <h1 className="text-2xl sm:text-3xl font-extrabold">{getName(pref)}</h1>
            </div>
            <div className="absolute -top-12 -end-12 w-48 h-48 rounded-full bg-secondary/30 blur-3xl" />
          </div>
          <div className="grid grid-cols-3 divide-x rtl:divide-x-reverse divide-border">
            <div className="p-4 sm:p-5 text-center">
              <div className="text-2xl sm:text-3xl font-extrabold text-primary">{Number(sub.global_score).toFixed(1)}</div>
              <div className="text-xs text-muted-foreground mt-1">{t('detail.globalScore')}</div>
            </div>
            <div className="p-4 sm:p-5 text-center">
              <div className="text-2xl sm:text-3xl font-extrabold text-success">{Number(sub.completeness_pct).toFixed(0)}%</div>
              <div className="text-xs text-muted-foreground mt-1">{t('detail.completenessRate')}</div>
            </div>
            <div className="p-4 sm:p-5 text-center">
              <div className="text-2xl sm:text-3xl font-extrabold text-secondary">{formatNumber(total, i18n.language)}</div>
              <div className="text-xs text-muted-foreground mt-1">{t('detail.totalBeneficiaries')}</div>
            </div>
          </div>
        </Card>

        {/* Insights */}
        {insights.length > 0 && (
          <div className="grid sm:grid-cols-2 gap-4">
            <Card className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle2 className="h-4 w-4 text-success" />
                <h3 className="font-bold text-sm">{t('detail.strengths')}</h3>
              </div>
              <div className="space-y-2">
                {insights.filter(i => i.type === 'strength').map((ins, i) => (
                  <div key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-success mt-1.5 flex-shrink-0" />
                    {ins.label}
                  </div>
                ))}
                {insights.filter(i => i.type === 'strength').length === 0 && (
                  <p className="text-xs text-muted-foreground">—</p>
                )}
              </div>
            </Card>
            <Card className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="h-4 w-4 text-warning" />
                <h3 className="font-bold text-sm">{t('detail.weaknesses')}</h3>
              </div>
              <div className="space-y-2">
                {insights.filter(i => i.type === 'weakness').map((ins, i) => (
                  <div key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-warning mt-1.5 flex-shrink-0" />
                    {ins.label}
                  </div>
                ))}
                {insights.filter(i => i.type === 'weakness').length === 0 && (
                  <p className="text-xs text-muted-foreground">—</p>
                )}
              </div>
            </Card>
          </div>
        )}

        {/* Charts */}
        <div className="grid lg:grid-cols-2 gap-4">
          <Card className="p-5">
            <h3 className="font-bold text-sm mb-4">{t('dashboard.byProgram')}</h3>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={programChart}>
                <XAxis dataKey="name" fontSize={10} interval={0} angle={-15} textAnchor="end" height={60} />
                <YAxis fontSize={11} />
                <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid hsl(var(--border))' }} />
                <Bar dataKey="value" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
          <Card className="p-5">
            <h3 className="font-bold text-sm mb-4">Performance multi-axes</h3>
            <ResponsiveContainer width="100%" height={260}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="hsl(var(--border))" />
                <PolarAngleAxis dataKey="axis" fontSize={10} />
                <PolarRadiusAxis domain={[0, 100]} fontSize={9} />
                <Radar name="Score" dataKey="v" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.4} />
              </RadarChart>
            </ResponsiveContainer>
          </Card>
        </div>

        {/* Sections */}
        <SectionCard icon={Building2} title={t('detail.permanent')} items={[
          { label: t('detail.associations'), value: sub.perm_associations },
          { label: t('detail.conventions'), value: sub.perm_conventions },
          { label: t('detail.clubs'), value: sub.perm_clubs },
          { label: t('detail.educative'), value: sub.perm_educative },
          { label: t('detail.cultural'), value: sub.perm_cultural },
          { label: t('detail.sportive'), value: sub.perm_sportive },
          { label: t('detail.capacity'), value: sub.perm_capacity },
        ]} total={permTotal} totalLabel={t('detail.totalBeneficiaries')} lang={i18n.language} />

        <SectionCard icon={Sparkles} title={t('detail.outreach')} items={[
          { label: t('detail.educative'), value: sub.outreach_educative },
          { label: t('detail.cultural'), value: sub.outreach_cultural },
          { label: t('detail.sportive'), value: sub.outreach_sportive },
          { label: t('detail.capacity'), value: sub.outreach_capacity },
        ]} total={outreachTotal} totalLabel={t('detail.totalBeneficiaries')} lang={i18n.language} />

        <SectionCard icon={Tent} title={t('detail.camping')} items={[
          { label: t('detail.associations'), value: sub.camping_associations },
          { label: t('detail.participants'), value: sub.camping_participants },
          { label: t('detail.female'), value: sub.camping_female },
          { label: t('detail.male'), value: sub.camping_male },
          { label: t('detail.rural'), value: sub.camping_rural },
          { label: t('detail.urban'), value: sub.camping_urban },
          { label: t('detail.facilitators'), value: sub.camping_facilitators },
          { label: t('detail.trainings'), value: sub.camping_trainings },
        ]} lang={i18n.language} />

        <SectionCard icon={Trophy} title={t('detail.festivals')} items={[
          { label: 'Nb festivals', value: sub.festivals_count },
          { label: t('detail.participants'), value: sub.festivals_participants },
          { label: t('detail.qualified'), value: sub.festivals_qualified },
        ]} lang={i18n.language} />

        <SectionCard icon={GraduationCap} title={t('detail.integration')} items={[
          { label: t('detail.trainings'), value: sub.integration_trainings },
          { label: t('detail.beneficiaries'), value: sub.integration_beneficiaries },
          { label: t('detail.partners'), value: sub.integration_partners },
        ]} lang={i18n.language} />

        <SectionCard icon={Building2} title={t('detail.institutions')} items={[
          { label: t('detail.updated'), value: sub.inst_updated },
          { label: t('detail.inProgress'), value: sub.inst_in_progress },
          { label: t('detail.dispute'), value: sub.inst_dispute },
          { label: t('detail.rehabNeeds'), value: sub.inst_rehab_needs },
        ]} lang={i18n.language} />

        <p className="text-xs text-muted-foreground text-center">
          {t('detail.lastUpdate')}: {formatDate(sub.submitted_at, i18n.language)} · {t('detail.scoreFormula')}
        </p>
      </div>
    </AppLayout>
  );
};

const SectionCard = ({ icon: Icon, title, items, total, totalLabel, lang }: any) => (
  <Card className="p-5 sm:p-6">
    <div className="flex items-center gap-3 mb-4">
      <div className="h-9 w-9 rounded-lg bg-primary-soft text-primary flex items-center justify-center">
        <Icon className="h-4 w-4" />
      </div>
      <h3 className="font-bold text-foreground">{title}</h3>
    </div>
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      {items.map((it: any, i: number) => (
        <div key={i} className="rounded-lg bg-muted/40 p-3">
          <div className="text-xs text-muted-foreground leading-tight">{it.label}</div>
          <div className="text-lg font-bold text-foreground tabular-nums mt-1">{formatNumber(it.value ?? 0, lang)}</div>
        </div>
      ))}
    </div>
    {total !== undefined && (
      <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{totalLabel}</span>
        <span className="text-xl font-extrabold text-primary tabular-nums">{formatNumber(total, lang)}</span>
      </div>
    )}
  </Card>
);

export default DirectionDetail;
