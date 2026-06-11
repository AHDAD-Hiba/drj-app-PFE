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
import { Search, ChevronRight, MapPin, CalendarCheck } from 'lucide-react';
import { DEFAULT_YEAR } from '@/components/YearSwitcher';
import type { Database } from '@/integrations/supabase/types';

type Direction = Database['public']['Tables']['directions']['Row'];

const STATUS_STYLE: Record<string, string> = {
  TERMINE: 'bg-success/15 text-success border-success/30',
  EN_COURS: 'bg-info/15 text-info border-info/30',
  NON_COMMENCE: 'bg-warning/15 text-warning border-warning/30',
  validee: 'bg-success/15 text-success border-success/30',
  soumise: 'bg-info/15 text-info border-info/30',
};

const STATUS_LABEL: Record<string, string> = {
  TERMINE: 'Terminé',
  EN_COURS: 'En cours',
  NON_COMMENCE: 'Non commencé',
  validee: 'Validé',
  soumise: 'Soumis',
};

interface DirectionRow {
  direction: Direction;
  statutGlobal: string;
  scoreGlobal: number;
  progression: number;
  lastUpdate: string | null;
  trimestre: string | null;
}

const Directions = () => {
  const { t, i18n } = useTranslation();
  const { utilisateur: profile, isPrefectoral: isDirector } = useAuth();
  const navigate = useNavigate();
  const [data, setData]   = useState<DirectionRow[]>([]);
  const [search, setSearch] = useState('');
  const [year, setYear]   = useState<number>(DEFAULT_YEAR);
  const lang = i18n.language;

  useEffect(() => {
    const directionId = profile?.direction_id ?? null;

    let dirQuery = supabase.from('directions').select('*');
    if (isDirector && directionId) {
      dirQuery = dirQuery.eq('id', directionId);
    }

    Promise.all([
      dirQuery,
      // 1. On récupère le statut et la progression depuis notre vue de la section 1
      supabase.from('v_dashboard_reg_section1_annuel').select('*').eq('annee', year),
      // 2. On récupère le score depuis notre vue des scores
      supabase.from('v_dashboard_pref_score_jeunesse').select('*').eq('annee', year),
      // 3. On récupère les rapports pour connaître le dernier trimestre actif
      supabase.from('rapports').select('*').eq('annee', year).order('trimestre', { ascending: false })
    ]).then(([dirs, section1, scores, raps]) => {

      const merged: DirectionRow[] = (dirs.data ?? []).map((dir) => {
        // 💡 Ajout de "as any" pour forcer TypeScript à accepter nos objets
        const s1 = (section1.data?.find(s => s.direction_id === dir.id) as any) || {};
        const scoreRow = (scores.data?.find(s => s.direction_id === dir.id) as any) || {};
        const latestRap = raps.data?.find(r => r.direction_id === dir.id);

        return {
          direction: dir,
          statutGlobal: s1.statut || "NON_COMMENCE",
          scoreGlobal: scoreRow.score_jeunesse || 0,
          progression: s1.progression_pourcentage || 0,
          lastUpdate: s1.derniere_mise_a_jour || null,
          trimestre: latestRap?.trimestre || null
        };
      });

      setData(merged);
    });
    
  }, [isDirector, profile?.direction_id, year]);

  const getName = (dir: Direction) => lang === 'ar' ? dir.nom_ar : dir.nom_fr;
  const showSearch = !isDirector;

  const filtered = data.filter((d) => {
    if (!showSearch || !search) return true;
    const name = getName(d.direction).toLowerCase();
    return name.includes(search.toLowerCase());
  });

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
              onChange={(e) => setYear(Number(e.target.value) || DEFAULT_YEAR)}
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
              onChange={(e) => setSearch(e.target.value)}
              className="ps-10 h-11"
            />
          </div>
        )}

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(({ direction, statutGlobal, scoreGlobal, progression, lastUpdate, trimestre }) => {
            
            const trimestreLabel = trimestre ? `${trimestre.toUpperCase()}` : "—";            
            const formattedDate = lastUpdate
              ? new Date(lastUpdate).toLocaleDateString("fr-FR", { day: '2-digit', month: '2-digit', year: 'numeric' })
              : "—";

            return (
              <Card
                key={direction.id}
                onClick={() => navigate(`/directions/${direction.id}?year=${year}`)}
                className="p-5 cursor-pointer hover:shadow-elegant hover:-translate-y-0.5 transition-smooth gradient-card border-border/60 group"
              >
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <div className="h-9 w-9 rounded-lg gradient-primary text-primary-foreground flex items-center justify-center">
                      <MapPin className="h-4 w-4" />
                    </div>
                  </div>
                  {statutGlobal && (
                    <Badge
                      variant="outline"
                      className={`text-[10px] gap-1 ${STATUS_STYLE[statutGlobal] || STATUS_STYLE.NON_COMMENCE}`}
                    >
                      {STATUS_LABEL[statutGlobal] || 'Non commencé'}
                    </Badge>
                  )}
                </div>

                <h3 className="font-bold text-foreground leading-tight mb-3 min-h-[2.5em]">
                  {getName(direction)}
                </h3>

                <>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <div className="text-xl font-extrabold text-primary tabular-nums">
                        {scoreGlobal.toFixed(1)}
                      </div>
                      <div className="text-[10px] text-muted-foreground uppercase tracking-wide">
                        Score Global
                      </div>
                    </div>

                    <div>
                      <div className="text-xl font-extrabold text-secondary tabular-nums">
                        {trimestreLabel}
                      </div>
                      <div className="text-[10px] text-muted-foreground uppercase tracking-wide">
                        Trimestre
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mb-3">
                    <Progress
                      value={progression}
                      className="h-1.5 flex-1"
                    />
                    <span className="text-xs font-semibold text-muted-foreground tabular-nums">
                      {progression.toFixed(0)}%
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted-foreground border-t border-border pt-3">
                    <span className="flex items-center gap-1.5">
                      <CalendarCheck className="h-3.5 w-3.5 text-primary" />
                      {formattedDate}
                    </span>

                    <ChevronRight className="h-4 w-4 group-hover:text-primary transition-smooth rtl:rotate-180" />
                  </div>
                </>
              </Card>
            );
          })}
        </div>
      </div>
    </AppLayout>
  );
};

export default Directions;