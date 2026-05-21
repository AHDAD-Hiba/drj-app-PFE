import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { REGION_SHAPES, REGION_OUTLINE, REGION_VIEWBOX } from '@/lib/regionMap';
import { formatNumber } from '@/lib/data';

type Pref = { id: string; code: string; name_fr: string; name_ar: string };
type Sub = {
  prefecture_id: string;
  global_score: number | null;
  completeness_pct: number | null;
  status: string;
};

interface Props {
  prefectures: Pref[];
  submissions: Sub[];
  totals: Map<string, number>; // prefecture_id -> total bénéficiaires
  className?: string;
  height?: number;
}

const scoreColor = (score: number | null) => {
  if (score == null) return 'hsl(var(--muted))';
  if (score >= 80) return 'hsl(var(--score-5))';
  if (score >= 70) return 'hsl(var(--score-4))';
  if (score >= 60) return 'hsl(var(--score-3))';
  if (score >= 50) return 'hsl(var(--score-2))';
  return 'hsl(var(--score-1))';
};

export const RegionMap = ({ prefectures, submissions, totals, className = '', height = 460 }: Props) => {
  const { i18n, t } = useTranslation();
  const navigate = useNavigate();
  const [hovered, setHovered] = useState<string | null>(null);
  const isAr = i18n.language === 'ar';

  const subByPref = new Map(submissions.map(s => [s.prefecture_id, s]));
  const prefByCode = new Map(prefectures.map(p => [p.code, p]));

  const hoveredShape = hovered ? REGION_SHAPES.find(s => s.code === hovered) : null;
  const hoveredPref = hoveredShape ? prefByCode.get(hoveredShape.code) : null;
  const hoveredSub = hoveredPref ? subByPref.get(hoveredPref.id) : null;
  const hoveredTotal = hoveredPref ? totals.get(hoveredPref.id) ?? 0 : 0;

  return (
    <div className={`relative w-full ${className}`} style={{ height }}>
      <svg
        viewBox={REGION_VIEWBOX}
        className="w-full h-full"
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label="Carte région Casablanca-Settat"
      >
        <defs>
          <filter id="region-shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="4" />
            <feOffset dx="0" dy="4" result="off" />
            <feComponentTransfer><feFuncA type="linear" slope="0.18" /></feComponentTransfer>
            <feMerge><feMergeNode /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {/* Halo / contour région */}
        <path d={REGION_OUTLINE} fill="hsl(var(--primary-soft))" opacity={0.35} />
        <path d={REGION_OUTLINE} fill="none" stroke="hsl(var(--primary))" strokeWidth={1.5} strokeDasharray="4 4" opacity={0.4} />

        {/* Préfectures */}
        <g filter="url(#region-shadow)">
          {REGION_SHAPES.map(shape => {
            const pref = prefByCode.get(shape.code);
            const sub = pref ? subByPref.get(pref.id) : null;
            const score = sub ? Number(sub.global_score) : null;
            const fill = scoreColor(score);
            const isHover = hovered === shape.code;
            return (
              <g
                key={shape.code}
                onMouseEnter={() => setHovered(shape.code)}
                onMouseLeave={() => setHovered(null)}
                onClick={() => pref && navigate(`/directions/${pref.id}`)}
                style={{ cursor: pref ? 'pointer' : 'default' }}
              >
                <path
                  d={shape.path}
                  fill={fill}
                  stroke="hsl(var(--background))"
                  strokeWidth={isHover ? 3 : 1.5}
                  opacity={isHover ? 1 : 0.92}
                  style={{ transition: 'all 0.2s ease' }}
                />
                {/* Label code prefecture */}
                <text
                  x={shape.cx}
                  y={shape.cy}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize={14}
                  fontWeight={800}
                  fill="hsl(var(--primary-foreground))"
                  pointerEvents="none"
                  style={{ textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}
                >
                  {shape.code}
                </text>
              </g>
            );
          })}
        </g>

        {/* Indicateur boussole / nord */}
        <g transform="translate(940, 50)">
          <circle r={24} fill="hsl(var(--card))" stroke="hsl(var(--border))" />
          <text textAnchor="middle" y={-6} fontSize={10} fontWeight={600} fill="hsl(var(--muted-foreground))">N</text>
          <path d="M 0,4 L -7,14 L 0,10 L 7,14 Z" fill="hsl(var(--primary))" />
        </g>

        {/* Légende score */}
        <g transform="translate(20, 680)">
          <text fontSize={12} fontWeight={600} fill="hsl(var(--foreground))">{t('dashboard.score')}</text>
          {[
            { c: 'hsl(var(--score-1))', l: '< 50' },
            { c: 'hsl(var(--score-2))', l: '50-60' },
            { c: 'hsl(var(--score-3))', l: '60-70' },
            { c: 'hsl(var(--score-4))', l: '70-80' },
            { c: 'hsl(var(--score-5))', l: '≥ 80' },
          ].map((s, i) => (
            <g key={i} transform={`translate(${i * 90 + 60}, -10)`}>
              <rect width={20} height={14} fill={s.c} rx={3} />
              <text x={26} y={11} fontSize={11} fill="hsl(var(--muted-foreground))">{s.l}</text>
            </g>
          ))}
        </g>
      </svg>

      {/* Tooltip flottant */}
      {hoveredPref && (
        <div className="pointer-events-none absolute top-3 end-3 bg-card/95 backdrop-blur border border-border rounded-xl shadow-elegant p-3 text-sm min-w-[180px] animate-fade-in">
          <div className="font-bold text-foreground">{isAr ? hoveredPref.name_ar : hoveredPref.name_fr}</div>
          <div className="text-[10px] text-muted-foreground mb-2 font-mono">{hoveredPref.code}</div>
          {hoveredSub ? (
            <div className="space-y-1 text-xs">
              <div className="flex justify-between gap-3">
                <span className="text-muted-foreground">{t('dashboard.score')}</span>
                <span className="font-bold tabular-nums">{Number(hoveredSub.global_score ?? 0).toFixed(1)}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-muted-foreground">{t('detail.beneficiaries')}</span>
                <span className="font-semibold tabular-nums">{formatNumber(hoveredTotal, i18n.language)}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-muted-foreground">{t('dashboard.completeness')}</span>
                <span className="font-semibold tabular-nums">{Number(hoveredSub.completeness_pct ?? 0).toFixed(0)}%</span>
              </div>
            </div>
          ) : (
            <div className="text-xs text-muted-foreground">{t('dashboard.noData')}</div>
          )}
        </div>
      )}
    </div>
  );
};
