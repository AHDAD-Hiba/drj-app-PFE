import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { AppLayout } from '@/components/AppLayout';
import { LeafletMap } from '@/components/LeafletMap';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { computeTotalBeneficiaries, formatNumber, usePrefName } from '@/lib/data';
import { MapPin, TrendingUp, Award } from 'lucide-react';

const RegionMapPage = () => {
  const { t, i18n } = useTranslation();
  const { profile, isDirector } = useAuth();
  const getName = usePrefName();
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [prefectures, setPrefectures] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState<number>(new Date().getFullYear());

  useEffect(() => {
    let subQuery = supabase.from('submissions').select('*').eq('year', year);
    if (isDirector && profile?.prefecture_id) {
      subQuery = subQuery.eq('prefecture_id', profile.prefecture_id);
    }
    Promise.all([
      subQuery,
      supabase.from('prefectures').select('*'),
    ]).then(([subs, prefs]) => {
      setSubmissions(subs.data ?? []);
      setPrefectures(prefs.data ?? []);
      setLoading(false);
    });
  }, [isDirector, profile?.prefecture_id, year]);

  if (loading) {
    return (
      <AppLayout>
        <div className="h-[500px] bg-muted/40 rounded-2xl animate-pulse" />
      </AppLayout>
    );
  }

  const totals = new Map<string, number>(
    submissions.map(s => [s.prefecture_id, computeTotalBeneficiaries(s)]),
  );

  const ranked = [...submissions]
    .filter(s => s.global_score != null)
    .sort((a, b) => Number(b.global_score) - Number(a.global_score));

  const top = ranked[0];
  const topPref = top ? prefectures.find(p => p.id === top.prefecture_id) : null;
  const totalBenef = submissions.reduce((a, s) => a + computeTotalBeneficiaries(s), 0);
  const avgScore = ranked.length
    ? ranked.reduce((a, s) => a + Number(s.global_score), 0) / ranked.length
    : 0;

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Hero */}
        <div className="relative overflow-hidden rounded-2xl gradient-hero p-6 sm:p-8 text-primary-foreground shadow-elegant">
          <div className="relative z-10">
            <p className="text-xs font-semibold uppercase tracking-wider opacity-80 flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5" />
              {t('map.eyebrow')}
            </p>
            <h1 className="text-2xl sm:text-3xl font-extrabold mt-2">{t('map.title')}</h1>
            <p className="text-sm sm:text-base opacity-90 mt-1 max-w-2xl">{t('map.subtitle')}</p>
          </div>
          <div className="absolute -top-12 -end-12 w-48 h-48 rounded-full bg-secondary/30 blur-3xl" />
          <div className="absolute -bottom-8 -start-8 w-40 h-40 rounded-full bg-primary-glow/40 blur-2xl" />
        </div>

        {/* Mini-stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
          <Card className="p-4 sm:p-5 border-border/60">
            <div className="h-10 w-10 rounded-xl flex items-center justify-center mb-3"
              style={{ background: 'hsl(var(--kpi-1-soft))', color: 'hsl(var(--kpi-1))' }}>
              <MapPin className="h-5 w-5" />
            </div>
            <div className="text-2xl font-extrabold tracking-tight">13</div>
            <div className="text-xs text-muted-foreground mt-1">{t('map.prefectures')}</div>
          </Card>
          <Card className="p-4 sm:p-5 border-border/60">
            <div className="h-10 w-10 rounded-xl flex items-center justify-center mb-3"
              style={{ background: 'hsl(var(--kpi-2-soft))', color: 'hsl(var(--kpi-2))' }}>
              <TrendingUp className="h-5 w-5" />
            </div>
            <div className="text-2xl font-extrabold tracking-tight tabular-nums">{avgScore.toFixed(1)}</div>
            <div className="text-xs text-muted-foreground mt-1">{t('map.avgScore')}</div>
          </Card>
          <Card className="p-4 sm:p-5 border-border/60 col-span-2 sm:col-span-1">
            <div className="h-10 w-10 rounded-xl flex items-center justify-center mb-3"
              style={{ background: 'hsl(var(--kpi-3-soft))', color: 'hsl(var(--kpi-3))' }}>
              <Award className="h-5 w-5" />
            </div>
            <div className="text-base font-extrabold tracking-tight truncate">
              {topPref ? getName(topPref) : '—'}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {t('map.topPerformer')} {top ? `· ${Number(top.global_score).toFixed(1)}` : ''}
            </div>
          </Card>
        </div>

        {/* Carte */}
        <Card className="overflow-hidden">
          <div className="p-5 sm:p-6 border-b border-border flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h2 className="font-bold text-foreground">{t('map.choropleth')}</h2>
              <p className="text-xs text-muted-foreground mt-1">{t('map.choroplethHint')}</p>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={year}
                onChange={e => setYear(Number(e.target.value) || new Date().getFullYear())}
                min={2020}
                max={2099}
                className="h-9 w-24 rounded-md border border-input bg-background px-3 text-sm"
                aria-label={t('common.year')}
              />
              <Badge variant="outline" className="text-xs flex-shrink-0">{t('common.year')} {year}</Badge>
            </div>
          </div>
          <div className="p-2 sm:p-3">
            <LeafletMap
              prefectures={prefectures}
              submissions={submissions}
              totals={totals}
              height={520}
            />
          </div>
        </Card>

        {/* Liste compacte sous la carte (utile mobile) */}
        <Card className="p-5 sm:p-6">
          <h2 className="font-bold text-foreground mb-4">{t('dashboard.ranking')}</h2>
          <div className="grid sm:grid-cols-2 gap-2">
            {ranked.map((s, i) => {
              const pref = prefectures.find(p => p.id === s.prefecture_id);
              if (!pref) return null;

              // 🔥 مقارنة نقية ومباشرة مع الـ DB
              const canClick = !isDirector || profile?.prefecture_id === s.prefecture_id;

              const rowContent = (
                <>
                  <span className={`flex-shrink-0 inline-flex items-center justify-center h-8 w-8 rounded-lg text-xs font-bold transition-smooth ${canClick ? 'bg-muted text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground' : 'bg-muted/50 text-muted-foreground/70'}`}>
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className={`text-sm font-medium truncate ${!canClick && 'text-muted-foreground/80'}`}>{getName(pref)}</div>
                    <div className="text-[11px] text-muted-foreground tabular-nums">
                      {formatNumber(totals.get(s.prefecture_id) ?? 0, i18n.language)} {t('detail.beneficiaries')}
                    </div>
                  </div>
                  <span className={`font-extrabold tabular-nums text-sm ${canClick ? 'text-primary' : 'text-primary/60'}`}>
                    {Number(s.global_score).toFixed(1)}
                  </span>
                </>
              );

              if (canClick) {
                return (
                  <a
                    key={s.id}
                    href={`/directions/${s.prefecture_id}`}
                    className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/50 transition-smooth group cursor-pointer"
                  >
                    {rowContent}
                  </a>
                );
              }

              return (
                <div
                  key={s.id}
                  className="flex items-center gap-3 p-2.5 rounded-lg transition-smooth cursor-not-allowed opacity-80"
                  title="Vous n'avez pas accès aux détails de cette direction"
                >
                  {rowContent}
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </AppLayout>
  );
};

export default RegionMapPage;
