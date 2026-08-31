import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/common/useAuth';
import { AppLayout } from '@/components/AppLayout';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Search, ChevronRight, MapPin, Trophy } from 'lucide-react';
import { DEFAULT_YEAR } from '@/components/YearSwitcher';
import { RegionalFilters, type RegionalDomainOption } from '@/components/dashboard/RegionalFilters';
import {
  getRegionalDashboardService,
  getRegionalMetricLabels,
} from '@/services/regional/regionalDashboardServices';
import { formatNumber } from '@/lib/data';

const STATUS_STYLE: Record<string, string> = {
  TERMINE: 'bg-success/15 text-success border-success/30',
  EN_COURS: 'bg-info/15 text-info border-info/30',
  NON_COMMENCE: 'bg-warning/15 text-warning border-warning/30',
};

interface DirectionCardData {
  id: string | number;
  nomFr: string;
  nomAr: string | null;
  statut: string;
  score: number;
  rang: number | null;
  metricPrimary: number;
  metricSecondary: number;
}

const Directions = () => {
  const { t, i18n } = useTranslation();
  const { utilisateur: profile, isPrefectoral: isDirector } = useAuth();
  const navigate = useNavigate();

  const [data, setData] = useState<DirectionCardData[]>([]);
  const [search, setSearch] = useState('');
  const [year, setYear] = useState<number>(DEFAULT_YEAR);
  const [filterDomain, setFilterDomain] = useState<string>('JEUNESSE');
  const [dbDomains, setDbDomains] = useState<RegionalDomainOption[]>([]);
  const [nomArById, setNomArById] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const lang = i18n.language;

  // Liste des domaines (table de référence `domaines`) — même pattern que
  // RegDomainDashboard.tsx, pour alimenter le même composant RegionalFilters.
  useEffect(() => {
    const fetchDomains = async () => {
      const { data: domains } = await supabase.from('domaines').select('*');
      if (domains) setDbDomains(domains as RegionalDomainOption[]);
    };
    void fetchDomains();
  }, []);

  // Noms arabes des 13 directions (table `directions`, information de
  // référence indépendante du domaine/année). Les services régionaux par
  // domaine ne renvoient que `nom_fr` (comme déjà utilisé par
  // RegDomainDashboard) ; ce petit complément préserve le basculement FR/AR
  // déjà existant sur cette page, sans dupliquer de logique métier.
  useEffect(() => {
    const fetchNomsAr = async () => {
      const { data: dirs } = await supabase.from('directions').select('id, nom_ar');
      if (dirs) {
        const map: Record<string, string> = {};
        dirs.forEach((d) => {
          if (d.id) map[d.id] = d.nom_ar;
        });
        setNomArById(map);
      }
    };
    void fetchNomsAr();
  }, []);

  // Chargement des cards : réutilise exactement le même service régional par
  // domaine que RegDomainDashboard.tsx (getRegionalDashboardService).
  // Contrat : comparison.directions (status / score / rank / primary / secondary).
  useEffect(() => {
    const service = getRegionalDashboardService(filterDomain);

    if (!service) {
      setData([]);
      setLoading(false);
      return;
    }

    let active = true;
    setLoading(true);

    service(year).then((result) => {
      if (!active) return;

      const { hasRealRanking } = getRegionalMetricLabels(filterDomain, t);

      const sorted = [...result.comparison.directions].sort((a, b) => (a.rank ?? Number.MAX_SAFE_INTEGER) - (b.rank ?? Number.MAX_SAFE_INTEGER));

      const mapped: DirectionCardData[] = sorted.map((dir, index) => ({
        id: dir.id,
        nomFr: dir.name,
        nomAr: nomArById[dir.id] ?? null,
        statut: dir.status,
        score: dir.score || 0,
        rang: hasRealRanking ? dir.rank ?? index + 1 : null,
        metricPrimary: dir.primary ?? 0,
        metricSecondary: dir.secondary ?? 0,
      }));

      setData(mapped);
      setLoading(false);
    });

    return () => {
      active = false;
    };
  }, [filterDomain, year, nomArById, t]);

  const getName = (d: DirectionCardData) => (lang === 'ar' ? d.nomAr || d.nomFr : d.nomFr);
  const showSearch = !isDirector;

  const directionId = profile?.direction_id ?? null;
  const scoped = isDirector && directionId ? data.filter((d) => d.id === directionId) : data;

  const filtered = scoped.filter((d) => {
    if (!showSearch || !search) return true;
    return getName(d).toLowerCase().includes(search.toLowerCase());
  });

  const { metricPrimaryLabel, metricSecondaryLabel, isPrimaryPercent } = getRegionalMetricLabels(
    filterDomain,
    t,
  );

  const formatMetric = (value: number, isPercent: boolean) =>
    `${formatNumber(value, lang)}${isPercent ? '%' : ''}`;

  const formatScore = (value: number) =>
    typeof value === 'number' && Number.isFinite(value)
      ? new Intl.NumberFormat(lang === 'ar' ? 'ar-MA' : 'fr-FR', { maximumFractionDigits: 2 }).format(value)
      : value;

  return (
    <AppLayout>
      {/* الـ dir هنا كيتحكم فالاتجاه ديال الصفحة كاملة ديناميكياً */}
      <div className="space-y-5 animate-fade-in" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground">
            {t('directionsTab.title', 'Directions')}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {filtered.length} {t('directionsTab.countSuffix', 'Directions - Année')} <span dir="ltr">{year}</span>
          </p>
        </div>

        <RegionalFilters
          year={year}
          onYearChange={setYear}
          filterDomain={filterDomain}
          onFilterDomainChange={setFilterDomain}
          domains={dbDomains}
          yearLabel={t('common.year', 'Année')}
          domainLabel={t('RegDomainDashboard.filters.domain', 'Domaine')}
        />

        {showSearch && (
          <div className="relative max-w-md">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('directionsTab.searchPlaceholder', 'Rechercher une direction...')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="ps-10 h-11"
            />
          </div>
        )}

        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-48 rounded-xl bg-muted/40 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((dir) => {
              const statusKey = dir.statut?.toLowerCase().replace(' ', '_') || 'non_commence';

              return (
                <Card
                  key={dir.id}
                  onClick={() => navigate(`/directions/${dir.id}?domain=${filterDomain}&year=${year}`)}
                  className="p-5 cursor-pointer hover:shadow-elegant hover:-translate-y-0.5 transition-smooth gradient-card border-border/60 group flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2">
                        <div className="h-9 w-9 rounded-lg gradient-primary text-primary-foreground flex items-center justify-center">
                          <MapPin className="h-4 w-4" />
                        </div>
                        {dir.rang !== null && (
                          <Badge
                            variant="outline"
                            className="text-[10px] gap-1 font-bold border-border/60"
                          >
                            <Trophy className="h-3 w-3" />
                            <span dir="ltr">#{dir.rang}</span>
                          </Badge>
                        )}
                      </div>
                      <Badge
                        variant="outline"
                        className={`text-[10px] gap-1 font-bold ${STATUS_STYLE[dir.statut] || STATUS_STYLE.NON_COMMENCE}`}
                      >
                        {t(`directionsTab.statuses.${statusKey}`, dir.statut)}
                      </Badge>
                    </div>

                    <h3 className="font-bold text-lg text-foreground leading-tight mb-4 min-h-[2.5em] flex items-center">
                      {getName(dir)}
                    </h3>

                    <div className="flex items-center justify-between gap-4 mb-4 border-t border-border/40 pt-4 w-full">
                      <div className="flex flex-col flex-1 items-center justify-center text-center">
                        <div className="text-xl font-extrabold text-primary tabular-nums" dir="ltr">
                          {formatScore(dir.score)}%
                        </div>
                        <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-wide mt-1">
                          {t('directionsTab.scoreGlobal', 'Score Global')}
                        </div>
                      </div>

                      <div className="flex flex-col flex-1 items-center justify-center text-center">
                        <div className="text-xl font-extrabold text-secondary tabular-nums" dir="ltr">
                          {formatMetric(dir.metricPrimary, isPrimaryPercent)}
                        </div>
                        <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-wide mt-1 truncate max-w-full" title={metricPrimaryLabel}>
                          {metricPrimaryLabel}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground border-t border-border pt-3">
                      <span className="flex items-center gap-1.5" dir="ltr">
                        {formatMetric(dir.metricSecondary, false)}
                        <span className="normal-case text-[10px]" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
                          {metricSecondaryLabel}
                        </span>
                      </span>

                      <ChevronRight className="h-4 w-4 group-hover:text-primary transition-smooth rtl:rotate-180" />
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Directions;
