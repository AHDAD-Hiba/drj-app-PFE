import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Moon, Sun } from 'lucide-react';
import {
  PREFECTURE_COORDS,
  REGION_CENTER,
  REGION_ZOOM,
  CASA_CLUSTER_CODES,
  CASA_CLUSTER_CENTER,
  CASA_CLUSTER_RADIUS,
  CASA_SPIDERFY_BREAKPOINT,
} from '@/lib/prefectureCoords';
import { formatNumber } from '@/lib/data';

type BaseLayerKey = 'dark' | 'light';

const TILE_LAYERS: Record<BaseLayerKey, { url: string; attribution: string }> = {
  dark: {
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
  },
  light: {
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
  },
};

const STORAGE_KEY = 'drj-cs.map.baselayer';

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
  totals: Map<string, number>;
  height?: number;
}

const scoreColor = (score: number | null) => {
  if (score == null) return '#64748b';
  if (score >= 80) return 'hsl(158, 60%, 38%)';
  if (score >= 70) return 'hsl(158, 55%, 48%)';
  if (score >= 60) return 'hsl(38, 80%, 52%)';
  if (score >= 50) return 'hsl(25, 80%, 55%)';
  return 'hsl(0, 70%, 55%)';
};

const scoreLabel = (score: number | null) => {
  if (score == null) return '—';
  if (score >= 80) return 'Excellent';
  if (score >= 70) return 'Très bon';
  if (score >= 60) return 'Bon';
  if (score >= 50) return 'Moyen';
  return 'À améliorer';
};

/**
 * Calcule la position d'un marqueur Casa sur un cercle autour du centre,
 * triée par angle pour être stable d'un rendu à l'autre.
 */
const spiderfyPosition = (code: string): [number, number] => {
  const idx = CASA_CLUSTER_CODES.indexOf(code as (typeof CASA_CLUSTER_CODES)[number]);
  if (idx < 0) return [0, 0];
  const total = CASA_CLUSTER_CODES.length;
  // Angle en partant du haut, sens horaire
  const angle = (idx / total) * 2 * Math.PI - Math.PI / 2;
  const lat = CASA_CLUSTER_CENTER[0] + CASA_CLUSTER_RADIUS * Math.sin(angle) * 0.7;
  const lng = CASA_CLUSTER_CENTER[1] + CASA_CLUSTER_RADIUS * Math.cos(angle);
  return [lat, lng];
};

export const LeafletMap = ({ prefectures, submissions, totals, height = 520 }: Props) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markersRef = useRef<Map<string, { marker: L.Marker; line: L.Polyline | null; realLatLng: L.LatLngExpression }>>(new Map());
  const clusterCircleRef = useRef<L.Circle | null>(null);
  const navigate = useNavigate();
  const { i18n, t } = useTranslation();
  const isAr = i18n.language === 'ar';

  const [baseLayer, setBaseLayer] = useState<BaseLayerKey>(() => {
    if (typeof window === 'undefined') return 'dark';
    const v = window.localStorage.getItem(STORAGE_KEY);
    return v === 'light' || v === 'dark' ? v : 'dark';
  });

  // Init map (1 fois)
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: REGION_CENTER,
      zoom: REGION_ZOOM,
      zoomControl: true,
      scrollWheelZoom: false,
      attributionControl: true,
    });
    mapRef.current = map;

    const cfg = TILE_LAYERS[baseLayer];
    tileLayerRef.current = L.tileLayer(cfg.url, {
      attribution: cfg.attribution,
      subdomains: 'abcd',
      maxZoom: 19,
    }).addTo(map);

    return () => {
      map.remove();
      mapRef.current = null;
      tileLayerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Switch tile layer when user toggles
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (tileLayerRef.current) map.removeLayer(tileLayerRef.current);
    const cfg = TILE_LAYERS[baseLayer];
    tileLayerRef.current = L.tileLayer(cfg.url, {
      attribution: cfg.attribution,
      subdomains: 'abcd',
      maxZoom: 19,
    }).addTo(map);
    try {
      window.localStorage.setItem(STORAGE_KEY, baseLayer);
    } catch {
      /* ignore */
    }
  }, [baseLayer]);

  // Markers + spiderfy logic
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const layer = L.layerGroup().addTo(map);
    const subByPref = new Map(submissions.map(s => [s.prefecture_id, s]));
    markersRef.current.clear();

    prefectures.forEach(pref => {
      const coord = PREFECTURE_COORDS[pref.code];
      if (!coord) return;
      const sub = subByPref.get(pref.id);
      const score = sub?.global_score != null ? Number(sub.global_score) : null;
      const color = scoreColor(score);
      const total = totals.get(pref.id) ?? 0;
      const name = isAr ? pref.name_ar : pref.name_fr;
      const isClustered = CASA_CLUSTER_CODES.includes(pref.code as any);

      const html = `
        <div class="leaflet-pref-marker" style="--c:${color}">
          <span class="leaflet-pref-pulse"></span>
          <span class="leaflet-pref-dot">${score != null ? score.toFixed(0) : '·'}</span>
        </div>
      `;
      const icon = L.divIcon({
        className: 'leaflet-pref-icon',
        html,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const realLatLng: L.LatLngExpression = [coord.lat, coord.lng];
      const marker = L.marker(realLatLng, { icon }).addTo(layer);

      // Ligne reliant position spiderfy ↔ position réelle (pour les marqueurs Casa)
      let line: L.Polyline | null = null;
      if (isClustered) {
        line = L.polyline([realLatLng, realLatLng], {
          color,
          weight: 1,
          opacity: 0.55,
          dashArray: '3 3',
          interactive: false,
        }).addTo(layer);
      }

      markersRef.current.set(pref.code, { marker, line, realLatLng });

      const popupHtml = `
        <div class="leaflet-pref-popup" dir="${isAr ? 'rtl' : 'ltr'}">
          <div class="lpp-head" style="background:${color}">
            <div class="lpp-name">${name}</div>
            <div class="lpp-code">${pref.code}</div>
          </div>
          <div class="lpp-body">
            ${
              sub
                ? `
              <div class="lpp-row">
                <span>${t('dashboard.score')}</span>
                <strong>${score != null ? score.toFixed(1) : '—'}</strong>
              </div>
              <div class="lpp-row">
                <span>${t('detail.beneficiaries')}</span>
                <strong>${formatNumber(total, i18n.language)}</strong>
              </div>
              <div class="lpp-row">
                <span>${t('dashboard.completeness')}</span>
                <strong>${Number(sub.completeness_pct ?? 0).toFixed(0)}%</strong>
              </div>
              <div class="lpp-badge" style="background:${color}1a;color:${color}">${scoreLabel(score)}</div>
            `
                : `<div class="lpp-empty">${t('dashboard.noData')}</div>`
            }
            <button class="lpp-cta" data-pref-id="${pref.id}">${t('dashboard.viewDetail')} →</button>
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml, {
        maxWidth: 260,
        className: 'leaflet-pref-popup-wrap',
      });

      marker.on('popupopen', e => {
        const node = (e.popup as L.Popup).getElement();
        const btn = node?.querySelector<HTMLButtonElement>('.lpp-cta');
        btn?.addEventListener('click', () => navigate(`/directions/${pref.id}`));
      });
    });

    // Cercle visuel englobant le cluster Casa (visible quand zoom faible)
    const clusterCircle = L.circle(CASA_CLUSTER_CENTER, {
      radius: 9000, // mètres
      color: 'hsl(158, 50%, 50%)',
      weight: 1.5,
      opacity: 0.55,
      fillColor: 'hsl(158, 55%, 24%)',
      fillOpacity: 0.08,
      dashArray: '4 4',
      interactive: false,
    }).addTo(layer);
    clusterCircleRef.current = clusterCircle;

    /**
     * Applique ou retire la disposition en cercle autour de Casa
     * selon le niveau de zoom courant.
     */
    const applySpiderfy = () => {
      const zoom = map.getZoom();
      const shouldSpread = zoom < CASA_SPIDERFY_BREAKPOINT;

      CASA_CLUSTER_CODES.forEach(code => {
        const entry = markersRef.current.get(code);
        if (!entry) return;
        const target: L.LatLngExpression = shouldSpread
          ? spiderfyPosition(code)
          : entry.realLatLng;
        entry.marker.setLatLng(target);
        if (entry.line) {
          entry.line.setLatLngs([entry.realLatLng, target]);
          entry.line.setStyle({ opacity: shouldSpread ? 0.55 : 0 });
        }
      });

      if (clusterCircleRef.current) {
        clusterCircleRef.current.setStyle({
          opacity: shouldSpread ? 0.55 : 0,
          fillOpacity: shouldSpread ? 0.08 : 0,
        });
      }
    };

    applySpiderfy();
    map.on('zoomend', applySpiderfy);

    return () => {
      map.off('zoomend', applySpiderfy);
      layer.clearLayers();
      map.removeLayer(layer);
      markersRef.current.clear();
      clusterCircleRef.current = null;
    };
  }, [prefectures, submissions, totals, isAr, i18n.language, navigate, t]);

  return (
    <div className="relative w-full rounded-xl overflow-hidden ring-1 ring-border" style={{ height }}>
      <div ref={containerRef} className="absolute inset-0" />
      {/* Légende score */}
      <div className="pointer-events-none absolute bottom-3 start-3 z-[400] bg-card/95 backdrop-blur border border-border rounded-lg px-3 py-2 shadow-elegant">
        <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
          {t('dashboard.score')}
        </div>
        <div className="flex items-center gap-2">
          {[
            { c: 'hsl(0, 70%, 55%)', l: '<50' },
            { c: 'hsl(25, 80%, 55%)', l: '50' },
            { c: 'hsl(38, 80%, 52%)', l: '60' },
            { c: 'hsl(158, 55%, 48%)', l: '70' },
            { c: 'hsl(158, 60%, 38%)', l: '80+' },
          ].map((s, i) => (
            <div key={i} className="flex items-center gap-1">
              <span className="h-3 w-3 rounded-full" style={{ background: s.c }} />
              <span className="text-[10px] tabular-nums text-foreground">{s.l}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Toggle thème de fond */}
      <div className="absolute top-3 start-3 z-[400] bg-card/95 backdrop-blur border border-border rounded-lg p-1 shadow-elegant flex items-center gap-0.5">
        <button
          type="button"
          onClick={() => setBaseLayer('dark')}
          aria-pressed={baseLayer === 'dark'}
          aria-label={t('map.themeDark')}
          title={t('map.themeDark')}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[11px] font-semibold transition-smooth ${
            baseLayer === 'dark'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
          }`}
        >
          <Moon className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">{t('map.themeDark')}</span>
        </button>
        <button
          type="button"
          onClick={() => setBaseLayer('light')}
          aria-pressed={baseLayer === 'light'}
          aria-label={t('map.themeLight')}
          title={t('map.themeLight')}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[11px] font-semibold transition-smooth ${
            baseLayer === 'light'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
          }`}
        >
          <Sun className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">{t('map.themeLight')}</span>
        </button>
      </div>

      {/* Hint cluster Casa */}
      <div className="pointer-events-none absolute top-3 end-3 z-[400] bg-card/95 backdrop-blur border border-border rounded-lg px-3 py-2 shadow-elegant max-w-[220px]">
        <div className="text-[10px] font-bold uppercase tracking-wider text-primary mb-1">
          {t('map.casaWilaya')}
        </div>
        <div className="text-[10px] text-muted-foreground leading-snug">
          {t('map.casaHint', { zoom: CASA_SPIDERFY_BREAKPOINT })}
        </div>
      </div>
    </div>
  );
};
