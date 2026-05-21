import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { AppLayout } from '@/components/AppLayout';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Search, ChevronRight, MapPin, CheckCircle2, FileEdit, Clock, CalendarCheck } from 'lucide-react';
import { computeTotalBeneficiaries, formatNumber, formatDate, usePrefName } from '@/lib/data';
import { AVAILABLE_YEARS, DEFAULT_YEAR } from '@/components/YearSwitcher';

const STATUS_STYLE: Record<string, string> = {
  validee: 'bg-success/15 text-success border-success/30',
  soumise: 'bg-info/15 text-info border-info/30',
  brouillon: 'bg-warning/15 text-warning border-warning/30',
};

const STATUS_ICON: Record<string, any> = {
  validee: CheckCircle2,
  soumise: CheckCircle2,
  brouillon: FileEdit,
};

const Directions = () => {
  const { t, i18n } = useTranslation();
  const { profile, isDirector } = useAuth();
  const getName = usePrefName();
  const navigate = useNavigate();
  const [data, setData] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [year, setYear] = useState<number>(DEFAULT_YEAR);

  useEffect(() => {
    let prefQuery = supabase.from('prefectures').select('*');
    let subQuery = supabase.from('submissions').select('*').eq('year', year);
    if (isDirector && profile?.prefecture_id) {
      prefQuery = prefQuery.eq('id', profile.prefecture_id);
      subQuery = subQuery.eq('prefecture_id', profile.prefecture_id);
    }
    Promise.all([prefQuery, subQuery]).then(([p, s]) => {
      const subs = new Map((s.data ?? []).map((x: any) => [x.prefecture_id, x]));
      const merged = (p.data ?? []).map((pref: any) => ({
        pref,
        sub: subs.get(pref.id),
      }));
      setData(merged);
    });
  }, [isDirector, profile?.prefecture_id, year]);

  // Search bar visible only for admin / regional team — hidden for directors.
  const showSearch = !isDirector;

  const filtered = data.filter(d =>
    !showSearch || !search ||
    getName(d.pref).toLowerCase().includes(search.toLowerCase()) ||
    d.pref.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppLayout>
      <div className="space-y-5 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground">{t('nav.directions')}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              13 {t('nav.directions').toLowerCase()} · {t('common.year')} {year}
            </p>
          </div>
          <div className="w-full sm:w-auto sm:min-w-[140px]">
            <Input
              type="number"
              value={year}
              onChange={e => setYear(Number(e.target.value) || DEFAULT_YEAR)}
              min={2020}
              max={2099}
              className="h-10"
              aria-label={t('common.year')}
            />
          </div>
        </div>

        {showSearch && (
          <div className="relative max-w-md">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('common.search')}
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="ps-10 h-11"
            />
          </div>
        )}

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(({ pref, sub }) => {
            const total = sub ? computeTotalBeneficiaries(sub) : 0;
            const isSubmitted = !!sub && sub.status !== 'brouillon';
            const StatusIcon = sub ? (STATUS_ICON[sub.status] ?? FileEdit) : Clock;
            return (
              <Card
                key={pref.id}
                onClick={() => navigate(`/directions/${pref.id}`)}
                className="p-5 cursor-pointer hover:shadow-elegant hover:-translate-y-0.5 transition-smooth gradient-card border-border/60 group"
              >
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <div className="h-9 w-9 rounded-lg gradient-primary text-primary-foreground flex items-center justify-center">
                      <MapPin className="h-4 w-4" />
                    </div>
                    <span className="text-xs font-mono text-muted-foreground">{pref.code}</span>
                  </div>
                  {sub && (
                    <Badge variant="outline" className={`text-[10px] gap-1 ${STATUS_STYLE[sub.status]}`}>
                      <StatusIcon className="h-3 w-3" />
                      {t(`status.${sub.status}`)}
                    </Badge>
                  )}
                </div>
                <h3 className="font-bold text-foreground leading-tight mb-3 min-h-[2.5em]">{getName(pref)}</h3>

                {sub ? (
                  <>
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div>
                        <div className="text-xl font-extrabold text-primary tabular-nums">{Number(sub.global_score).toFixed(1)}</div>
                        <div className="text-[10px] text-muted-foreground uppercase tracking-wide">{t('detail.globalScore')}</div>
                      </div>
                      <div>
                        <div className="text-xl font-extrabold text-secondary tabular-nums">{formatNumber(total, i18n.language)}</div>
                        <div className="text-[10px] text-muted-foreground uppercase tracking-wide">{t('detail.beneficiaries')}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mb-3">
                      <Progress value={Number(sub.completeness_pct)} className="h-1.5 flex-1" />
                      <span className="text-xs font-semibold text-muted-foreground tabular-nums">{Number(sub.completeness_pct).toFixed(0)}%</span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground border-t border-border pt-3">
                      <span className="flex items-center gap-1.5">
                        {isSubmitted && <CalendarCheck className="h-3.5 w-3.5 text-success" />}
                        {formatDate(sub.submitted_at, i18n.language)}
                      </span>
                      <ChevronRight className="h-4 w-4 group-hover:text-primary transition-smooth rtl:rotate-180" />
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center gap-2 py-6 text-center">
                    <div className="h-10 w-10 rounded-full bg-muted/60 flex items-center justify-center">
                      <FileEdit className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="text-xs text-muted-foreground">{t('dashboard.noData')}</div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      </div>
    </AppLayout>
  );
};

export default Directions;
