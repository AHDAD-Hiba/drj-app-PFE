import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { AppLayout } from '@/components/AppLayout';
import { LeafletMap } from '@/components/LeafletMap';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, TrendingUp, Award } from 'lucide-react';
import type { Database } from '@/integrations/supabase/types';

type Direction = Database['public']['Tables']['directions']['Row'];
type Rapport = Database['public']['Tables']['rapports']['Row'];

type ScoreJeunesseRow = {
  annee: number;
  direction_id: string;

  score_jeunesse: number;

  score_activites: number;
  score_beneficiaires: number;
  score_couverture: number;
  score_feminisation: number;
  score_partenariats: number;
  score_etablissements: number;

  
};

interface DirectionData {
  direction: Direction;
  rapport: Rapport | null;

  score: number;
  activitesScore?: number;
  beneficiairesScore?: number;
  couvertureScore?: number;
  feminisationScore?: number;
  partenariatsScore?: number;
  etablissementsScore?: number;
}

const RegionMapPage = () => {
  const { t, i18n } = useTranslation();
  const { utilisateur: profile, isRegional, isPrefectoral } = useAuth();
  const [items, setItems] = useState<DirectionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const lang = i18n.language;

  const getName = (dir: Direction) => (lang === 'ar' ? dir.nom_ar : dir.nom_fr);

  useEffect(() => {
    setLoading(true);

    let rapQuery = supabase.from('rapports').select('*').eq('annee', year);
    if (isPrefectoral && profile?.direction_id) {
      rapQuery = rapQuery.eq('direction_id', profile.direction_id);
    }

    Promise.all([
      supabase.from('directions').select('*'),
      rapQuery,
      supabase
        .from('v_dashboard_pref_score_jeunesse')
        .select('*')
        .eq('annee', year)
    ]).then(([dirs, raps, scores]) => {
      console.log(scores.data?.slice(0, 3));

      const rapMap = new Map<string, Rapport>(
        (raps.data ?? []).map((r) => [r.direction_id ?? '', r]),
      );

      const scoreMap = new Map<string, ScoreJeunesseRow>(
        (scores.data ?? []).map((s) => [s.direction_id, s])
      );

      const result: DirectionData[] = (dirs.data ?? []).map((dir) => {
        const rapport = rapMap.get(dir.id) ?? null;
        const scoreData = scoreMap.get(dir.id);

        return {
          direction: dir,
          rapport,
          score: scoreData?.score_jeunesse ?? 0,
          activitesScore: scoreData?.score_activites ?? 0,
          beneficiairesScore: scoreData?.score_beneficiaires ?? 0,
          couvertureScore: scoreData?.score_couverture ?? 0,
          feminisationScore: scoreData?.score_feminisation ?? 0,
          partenariatsScore: scoreData?.score_partenariats ?? 0,
          etablissementsScore: scoreData?.score_etablissements ?? 0,
        };
      });

      setItems(result);
      setLoading(false);
    });
  }, [isPrefectoral, profile?.direction_id, year]);

  if (loading) {
    return (
      <AppLayout>
        <div className="h-[500px] bg-muted/40 rounded-2xl animate-pulse" />
      </AppLayout>
    );
  }

  const rankedItems = items.filter((i) => i.score > 0);

  const avgScore = rankedItems.length
    ? Math.round(rankedItems.reduce((a, i) => a + i.score, 0) / rankedItems.length)
    : 0;

  const top = [...rankedItems].sort((a, b) => b.score - a.score)[0] ?? null;

  /* Adapter pour LeafletMap */
  const directionsForMap = items.map((i) => i.direction);
  const submissionsForMap = rankedItems
  .filter((i) => i.rapport)
  .map((i) => ({
    ...(i.rapport as Rapport),
    global_score: i.score,
  }));

  console.log(submissionsForMap.slice(0,5));
  const totalsMap = new Map<string, number>(items.map((i) => [i.direction.id, i.score]));

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
            <div
              className="h-10 w-10 rounded-xl flex items-center justify-center mb-3"
              style={{ background: 'hsl(var(--kpi-1-soft))', color: 'hsl(var(--kpi-1))' }}
            >
              <MapPin className="h-5 w-5" />
            </div>
            <div className="text-2xl font-extrabold tracking-tight">13</div>
            <div className="text-xs text-muted-foreground mt-1">{t('map.prefectures')}</div>
          </Card>
          <Card className="p-4 sm:p-5 border-border/60">
            <div
              className="h-10 w-10 rounded-xl flex items-center justify-center mb-3"
              style={{ background: 'hsl(var(--kpi-2-soft))', color: 'hsl(var(--kpi-2))' }}
            >
              <TrendingUp className="h-5 w-5" />
            </div>
            <div className="text-2xl font-extrabold tracking-tight tabular-nums">{avgScore}%</div>
            <div className="text-xs text-muted-foreground mt-1">{t('map.avgScore')}</div>
          </Card>
          <Card className="p-4 sm:p-5 border-border/60 col-span-2 sm:col-span-1">
            <div
              className="h-10 w-10 rounded-xl flex items-center justify-center mb-3"
              style={{ background: 'hsl(var(--kpi-3-soft))', color: 'hsl(var(--kpi-3))' }}
            >
              <Award className="h-5 w-5" />
            </div>
            <div className="text-base font-extrabold tracking-tight truncate">
              {top ? getName(top.direction) : '—'}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {t('map.topPerformer')} {top ? `· ${top.score}%` : ''}
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
                onChange={(e) => setYear(Number(e.target.value) || new Date().getFullYear())}
                min={2020}
                max={2099}
                className="h-9 w-24 rounded-md border border-input bg-background px-3 text-sm"
                aria-label={t('common.year')}
              />
              <Badge variant="outline" className="text-xs flex-shrink-0">
                {t('common.year')} {year}
              </Badge>
            </div>
          </div>
          <div className="p-2 sm:p-3">
            <LeafletMap
              directions={directionsForMap}
              rapports={submissionsForMap}
              totals={totalsMap}
              height={520}
            />
          </div>
        </Card>

        
      </div>
    </AppLayout>
  );
};

export default RegionMapPage;