/**
 * Coordonnées géographiques (lat/lng) des 13 directions préfectorales
 * de la région Casablanca-Settat.
 *
 * Pour les 8 préfectures d'arrondissements de Casablanca (très proches
 * géographiquement), on conserve les vraies coordonnées du centroïde
 * administratif. Le composant LeafletMap applique un décalage radial
 * automatique au zoom régional pour éviter le chevauchement visuel.
 *
 * Source : OpenStreetMap / Wikipédia (centroïdes administratifs).
 */
export const PREFECTURE_COORDS: Record<string, { lat: number; lng: number }> = {
  // Wilaya de Casablanca — 8 préfectures d'arrondissements
  ANF: { lat: 33.5947, lng: -7.6328 }, // Anfa (centre-ouest)
  FMS: { lat: 33.5828, lng: -7.5947 }, // Fida - Mers Sultan (centre)
  ACH: { lat: 33.5478, lng: -7.6300 }, // Aïn Chock - Hay Hassani - Nouaceur (sud-ouest)
  BMR: { lat: 33.5650, lng: -7.5500 }, // Ben M'Sick - Moulay Rachid (sud-est)
  ASH: { lat: 33.6086, lng: -7.5453 }, // Aïn Sebaâ - Hay Mohammadi (nord-est)
  SBR: { lat: 33.6336, lng: -7.5125 }, // Sidi Bernoussi (extrême nord-est)
  MED: { lat: 33.4528, lng: -7.5106 }, // Médiouna (sud)
  MOH: { lat: 33.6861, lng: -7.3833 }, // Mohammedia (nord-est, hors Casa)

  // Province de Benslimane
  BSL: { lat: 33.6181, lng: -7.1206 },
  // Province d'El Jadida
  JDA: { lat: 33.2316, lng: -8.5007 },
  // Province de Sidi Bennour
  SBN: { lat: 32.6500, lng: -8.4333 },
  // Province de Settat
  STT: { lat: 33.0011, lng: -7.6164 },
  // Province de Berrechid
  BRC: { lat: 33.2653, lng: -7.5870 },
};

/** Centre approximatif de la région Casablanca-Settat. */
export const REGION_CENTER: [number, number] = [33.25, -7.65];
export const REGION_ZOOM = 8;

/**
 * Codes des préfectures du Grand Casablanca à "spiderfier"
 * (disposer en cercle autour du centre Casa) quand le zoom est faible.
 * MOH (Mohammedia) est exclu car déjà bien à l'écart.
 */
export const CASA_CLUSTER_CODES = ['ANF', 'FMS', 'ACH', 'BMR', 'ASH', 'SBR', 'MED'] as const;

/** Centre du cluster autour duquel disposer les marqueurs Casa. */
export const CASA_CLUSTER_CENTER: [number, number] = [33.585, -7.59];

/** Rayon (en degrés) du cercle de disposition. ~0.05° ≈ 5,5 km. */
export const CASA_CLUSTER_RADIUS = 0.055;

/** Zoom à partir duquel on revient aux vraies positions. */
export const CASA_SPIDERFY_BREAKPOINT = 11;
