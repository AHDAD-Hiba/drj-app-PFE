/**
 * Domain Dashboard data layer.
 *
 * All data is dynamic and exposed through async fetcher functions so it can be
 * swapped to Supabase queries later without touching the UI.
 *
 * To wire to Supabase:
 *   - Replace the body of `fetchDomainSnapshot` with a query against
 *     a `domain_submissions` view aggregating per (domain, year, quarter, direction).
 *   - Keep the returned shape identical.
 */

export type Domain = "jeunesse" | "femme" | "enfance" | "creche" | "sport";
export type PeriodType = "annual" | "quarterly";
export type Quarter = "Q1" | "Q2" | "Q3" | "Q4";
export type SubmissionStatus = "completed" | "in_progress" | "not_started";

export interface DirectionRow {
  id: string;
  direction_id: string;
  name: string;
  status: SubmissionStatus;
  score: number; // 0-100 — global domain score
  activities: number;
  participants: number;
  participantsFemale: number;
  participantsMale: number;
  partnerships: number;
  population: number; // for coverage %
  // quarterly time series
  quarterly: { quarter: Quarter; participants: number; activities: number }[];
  // category breakdown
  activityTypes: { type: string; value: number }[];
}

export interface DomainSnapshot {
  domain: Domain;
  year: number;
  period: PeriodType;
  quarter?: Quarter;
  directions: DirectionRow[];
  totalDirections: number;
}

export interface DomainOption {
  value: Domain;
  labelFr: string;
  labelAr: string;
}

export const DOMAIN_OPTIONS: DomainOption[] = [
  { value: "jeunesse", labelFr: "Jeunesse", labelAr: "الشباب" },
  { value: "femme", labelFr: "Femme / Fille", labelAr: "المرأة والفتاة" },
  { value: "enfance", labelFr: "Enfance", labelAr: "الطفولة" },
  { value: "creche", labelFr: "Crèche", labelAr: "الحضانة" },
  { value: "sport", labelFr: "Sport", labelAr: "الرياضة" },
];

const DIRECTION_NAMES = [
  "Casablanca-Anfa",
  "Aïn Sebaâ-Hay Mohammadi",
  "Aïn Chock",
  "Hay Hassani",
  "Sidi Bernoussi",
  "Moulay Rachid",
  "Ben M'Sick",
  "Al Fida-Mers Sultan",
  "Mohammedia",
  "Settat",
  "Berrechid",
  "Benslimane",
  "El Jadida",
];

// Deterministic pseudo-random — stable across renders and useful for demos
const seeded = (seed: number) => {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
};

const STATUS_DISTRIBUTION: SubmissionStatus[] = [
  "completed",
  "completed",
  "completed",
  "completed",
  "completed",
  "in_progress",
  "in_progress",
  "in_progress",
  "in_progress",
  "not_started",
  "not_started",
  "not_started",
  "not_started",
];

const ACTIVITY_TYPE_LABELS: Record<Domain, string[]> = {
  jeunesse: ["Éducative", "Culturelle", "Sportive", "Capacitation"],
  femme: ["Formation", "Sensibilisation", "Accompagnement", "Insertion"],
  enfance: ["Animation", "Soutien scolaire", "Loisirs", "Santé"],
  creche: ["Éveil", "Garde", "Repas", "Soutien parental"],
  sport: ["Compétition", "Loisir", "Formation", "Évènements"],
};

function buildDirection(
  index: number,
  domain: Domain,
  year: number,
  quarterFilter?: Quarter,
): DirectionRow {
  const rand = seeded(
    index * 1000 + year + domain.length + (quarterFilter ? quarterFilter.charCodeAt(1) : 0),
  );
  const status = STATUS_DISTRIBUTION[index % STATUS_DISTRIBUTION.length];

  const baseActivities = status === "not_started" ? 0 : Math.floor(rand() * 80) + 20;
  const baseParticipants = status === "not_started" ? 0 : Math.floor(rand() * 4500) + 500;
  const female = Math.floor(baseParticipants * (0.4 + rand() * 0.25));
  const male = baseParticipants - female;
  const partnerships = status === "not_started" ? 0 : Math.floor(rand() * 18) + 2;
  const population = 80_000 + Math.floor(rand() * 320_000);
  const score = status === "not_started" ? 0 : Math.round((40 + rand() * 55) * 10) / 10;

  const quarterly: DirectionRow["quarterly"] = (["Q1", "Q2", "Q3", "Q4"] as Quarter[]).map((q) => {
    const factor = status === "not_started" ? 0 : 0.18 + rand() * 0.15;
    return {
      quarter: q,
      participants: Math.round(baseParticipants * factor),
      activities: Math.round(baseActivities * factor),
    };
  });

  // If a specific quarter filter is set, scale current totals down to that quarter
  let activities = baseActivities;
  let participants = baseParticipants;
  if (quarterFilter) {
    const q = quarterly.find((x) => x.quarter === quarterFilter)!;
    activities = q.activities;
    participants = q.participants;
  }

  const types = ACTIVITY_TYPE_LABELS[domain];
  const activityTypes = types.map((type) => ({
    type,
    value: Math.floor((participants / types.length) * (0.5 + rand())),
  }));

  return {
    id: `dir-${index + 1}`,
    direction_id: crypto.randomUUID(),
    name: DIRECTION_NAMES[index % DIRECTION_NAMES.length],
    status,
    score,
    activities,
    participants,
    participantsFemale: female,
    participantsMale: male,
    partnerships,
    population,
    quarterly,
    activityTypes,
  };
}

/**
 * Fetch a snapshot for a given domain + period.
 * Async to mirror future Supabase calls.
 */
export async function fetchDomainSnapshot(params: {
  domain: Domain;
  year: number;
  period: PeriodType;
  quarter?: Quarter;
}): Promise<DomainSnapshot> {
  const { domain, year, period, quarter } = params;
  const directions = DIRECTION_NAMES.map((_, i) =>
    buildDirection(i, domain, year, period === "quarterly" ? quarter : undefined),
  );

  // small simulated latency, removable
  await new Promise((r) => setTimeout(r, 120));

  return {
    domain,
    year,
    period,
    quarter,
    directions,
    totalDirections: directions.length,
  };
}

// ---------- selectors / aggregations (pure, easy to unit-test) ----------

export const sumActivities = (rows: DirectionRow[]) => rows.reduce((a, r) => a + r.activities, 0);

export const sumParticipants = (rows: DirectionRow[]) =>
  rows.reduce((a, r) => a + r.participants, 0);

export const sumPartnerships = (rows: DirectionRow[]) =>
  rows.reduce((a, r) => a + r.partnerships, 0);

export const sumPopulation = (rows: DirectionRow[]) => rows.reduce((a, r) => a + r.population, 0);

export const coverageRate = (rows: DirectionRow[]) => {
  const pop = sumPopulation(rows);
  return pop > 0 ? (sumParticipants(rows) / pop) * 100 : 0;
};

export const avgScore = (rows: DirectionRow[]) => {
  const active = rows.filter((r) => r.status !== "not_started");
  return active.length > 0 ? active.reduce((a, r) => a + r.score, 0) / active.length : 0;
};

export const statusBreakdown = (rows: DirectionRow[]) => {
  const total = rows.length || 1;
  const counts = { completed: 0, in_progress: 0, not_started: 0 };
  rows.forEach((r) => {
    counts[r.status] += 1;
  });
  return {
    counts,
    pct: {
      completed: (counts.completed / total) * 100,
      in_progress: (counts.in_progress / total) * 100,
      not_started: (counts.not_started / total) * 100,
    },
    submitted: counts.completed + counts.in_progress,
    total,
  };
};

export const rankedByScore = (rows: DirectionRow[]) =>
  [...rows].sort((a, b) => b.score - a.score).map((r, i) => ({ ...r, rank: i + 1 }));

export const quarterlyAggregate = (rows: DirectionRow[]) => {
  const quarters: Quarter[] = ["Q1", "Q2", "Q3", "Q4"];
  return quarters.map((q) => ({
    quarter: q,
    participants: rows.reduce(
      (a, r) => a + (r.quarterly.find((x) => x.quarter === q)?.participants ?? 0),
      0,
    ),
    activities: rows.reduce(
      (a, r) => a + (r.quarterly.find((x) => x.quarter === q)?.activities ?? 0),
      0,
    ),
  }));
};

export const aggregateActivityTypes = (rows: DirectionRow[]) => {
  const map = new Map<string, number>();
  rows.forEach((r) => {
    r.activityTypes.forEach(({ type, value }) => {
      map.set(type, (map.get(type) ?? 0) + value);
    });
  });
  return Array.from(map.entries()).map(([type, value]) => ({ type, value }));
};

// ============================================================================
// PREFECTORAL DASHBOARD: COMPOSITE KPIs & INSIGHTS
// ============================================================================

/**
 * Calculate composite KPI score: 30% activités + 30% participants + 20% partenariats + 20% couverture
 * Normalized to 0-100.
 */
export const compositeKpiScore = (row: DirectionRow): number => {
  const maxActivities = 200; // normalized baseline
  const maxParticipants = 10000;
  const maxPartnerships = 50;
  const maxCoverage = 100;

  const activitiesScore = Math.min(100, (row.activities / maxActivities) * 100);
  const participantsScore = Math.min(100, (row.participants / maxParticipants) * 100);
  const partnershipsScore = Math.min(100, (row.partnerships / maxPartnerships) * 100);
  const coverageScore =
    row.population > 0
      ? Math.min(100, (((row.participants / row.population) * 100) / maxCoverage) * 100)
      : 0;

  return (
    activitiesScore * 0.3 + participantsScore * 0.3 + partnershipsScore * 0.2 + coverageScore * 0.2
  );
};

/**
 * Recalculate all direction scores using composite KPI formula.
 */
export const recalculateCompositeScores = (rows: DirectionRow[]): DirectionRow[] => {
  return rows.map((r) => ({
    ...r,
    score: r.status === "not_started" ? 0 : compositeKpiScore(r),
  }));
};

/**
 * Aggregate gender breakdown across all directions.
 */
export const genderBreakdown = (rows: DirectionRow[]) => {
  const female = rows.reduce((a, r) => a + r.participantsFemale, 0);
  const male = rows.reduce((a, r) => a + r.participantsMale, 0);
  return [
    { name: "Femmes", value: female },
    { name: "Hommes", value: male },
  ];
};

/**
 * Calculate regional averages for KPIs.
 */
export interface RegionalAverages {
  activities: number;
  participants: number;
  coverage: number;
  partnerships: number;
  score: number;
  femmesPercentage: number;
}

export const calculateRegionalAverages = (rows: DirectionRow[]): RegionalAverages => {
  const active = rows.filter((r) => r.status !== "not_started");
  if (!active.length) {
    return {
      activities: 0,
      participants: 0,
      coverage: 0,
      partnerships: 0,
      score: 0,
      femmesPercentage: 0,
    };
  }

  const avgActivities = active.reduce((a, r) => a + r.activities, 0) / active.length;
  const avgParticipants = active.reduce((a, r) => a + r.participants, 0) / active.length;
  const avgCoverage =
    active.reduce((a, r) => a + (r.participants / r.population) * 100, 0) / active.length;
  const avgPartnerships = active.reduce((a, r) => a + r.partnerships, 0) / active.length;
  const avgScore = active.reduce((a, r) => a + r.score, 0) / active.length;

  const totalFemmes = active.reduce((a, r) => a + r.participantsFemale, 0);
  const totalParticipants = active.reduce((a, r) => a + r.participants, 0);
  const femmesPercentage = totalParticipants > 0 ? (totalFemmes / totalParticipants) * 100 : 0;

  return {
    activities: avgActivities,
    participants: avgParticipants,
    coverage: avgCoverage,
    partnerships: avgPartnerships,
    score: avgScore,
    femmesPercentage,
  };
};

/**
 * Compare a single direction vs regional average.
 */
export const comparisonVsAverage = (
  row: DirectionRow,
  avg: RegionalAverages,
): {
  metric: string;
  direction: number;
  average: number;
  percentDiff: number;
  isAbove: boolean;
}[] => {
  const cov = row.population > 0 ? (row.participants / row.population) * 100 : 0;
  return [
    {
      metric: "Activités",
      direction: row.activities,
      average: avg.activities,
      percentDiff:
        avg.activities > 0 ? ((row.activities - avg.activities) / avg.activities) * 100 : 0,
      isAbove: row.activities >= avg.activities,
    },
    {
      metric: "Participants",
      direction: row.participants,
      average: avg.participants,
      percentDiff:
        avg.participants > 0 ? ((row.participants - avg.participants) / avg.participants) * 100 : 0,
      isAbove: row.participants >= avg.participants,
    },
    {
      metric: "Couverture (%)",
      direction: cov,
      average: avg.coverage,
      percentDiff: ((cov - avg.coverage) / Math.max(1, avg.coverage)) * 100,
      isAbove: cov >= avg.coverage,
    },
    {
      metric: "Partenariats",
      direction: row.partnerships,
      average: avg.partnerships,
      percentDiff:
        avg.partnerships > 0 ? ((row.partnerships - avg.partnerships) / avg.partnerships) * 100 : 0,
      isAbove: row.partnerships >= avg.partnerships,
    },
  ];
};

/**
 * Smart insights: generate dynamic alerts based on data patterns.
 */
export interface SmartInsight {
  type: "positive" | "warning" | "info";
  title: string;
  description: string;
  icon: string; // icon name for UI
}

export const generateSmartInsights = (
  rows: DirectionRow[],
  avg: RegionalAverages,
  domain: Domain,
): SmartInsight[] => {
  const insights: SmartInsight[] = [];

  const active = rows.filter((r) => r.status !== "not_started");
  if (!active.length) return insights;

  const totalFemmes = active.reduce((a, r) => a + r.participantsFemale, 0);
  const totalParticipants = active.reduce((a, r) => a + r.participants, 0);
  const femmesPercentage = totalParticipants > 0 ? (totalFemmes / totalParticipants) * 100 : 0;

  // Insight 1: Female participation
  if (femmesPercentage > avg.femmesPercentage + 5) {
    insights.push({
      type: "positive",
      title: "Forte participation féminine",
      description: `${femmesPercentage.toFixed(1)}% vs ${avg.femmesPercentage.toFixed(1)}% moyenne régionale`,
      icon: "Users",
    });
  } else if (femmesPercentage < avg.femmesPercentage - 5) {
    insights.push({
      type: "warning",
      title: "Participation féminine en baisse",
      description: `${femmesPercentage.toFixed(1)}% vs ${avg.femmesPercentage.toFixed(1)}% moyenne régionale`,
      icon: "AlertCircle",
    });
  }

  // Insight 2: Coverage rate
  const coverage = coverageRate(active);
  if (coverage < 15) {
    insights.push({
      type: "warning",
      title: "Taux de couverture faible",
      description: `${coverage.toFixed(2)}% - Opportunité d'expansion`,
      icon: "TrendingDown",
    });
  } else if (coverage > 40) {
    insights.push({
      type: "positive",
      title: "Excellente couverture",
      description: `${coverage.toFixed(2)}% - Au-delà de la moyenne régionale`,
      icon: "TrendingUp",
    });
  }

  // Insight 3: Activity diversity
  const activityTypes = aggregateActivityTypes(active);
  if (activityTypes.length >= 4) {
    insights.push({
      type: "info",
      title: "Portfolio diversifié",
      description: `${activityTypes.length} types d'activités proposées`,
      icon: "Layers",
    });
  }

  // Insight 4: Partnership engagement
  const avgPartnerships = active.reduce((a, r) => a + r.partnerships, 0) / active.length;
  if (avgPartnerships > avg.partnerships * 1.2) {
    insights.push({
      type: "positive",
      title: "Partenariats renforcés",
      description: `${avgPartnerships.toFixed(0)} conventions actives`,
      icon: "Handshake",
    });
  }

  // Insight 5: Quarterly trend
  const q1 = quarterlyAggregate(active);
  if (q1.length >= 2) {
    const latestQ = q1[q1.length - 1];
    const prevQ = q1[q1.length - 2];
    const participantsTrend =
      ((latestQ.participants - prevQ.participants) / prevQ.participants) * 100;
    if (participantsTrend > 15) {
      insights.push({
        type: "positive",
        title: "Tendance positive",
        description: `Augmentation de ${participantsTrend.toFixed(0)}% trimestre précédent`,
        icon: "ArrowUpRight",
      });
    }
  }

  return insights;
};

/**
 * Prepare data for regional ranking/comparison chart.
 */
export const prepareDirectionRanking = (
  rows: DirectionRow[],
  avg: RegionalAverages,
): {
  direction: string;
  score: number;
  activities: number;
  participants: number;
  coverage: number;
  rank: number;
}[] => {
  const ranked = rankedByScore(rows).map((r, i) => ({
    direction: r.name.split(" ")[0],
    score: r.score,
    activities: r.activities,
    participants: r.participants,
    coverage: (r.participants / r.population) * 100,
    rank: i + 1,
  }));

  // Add regional average line
  ranked.push({
    direction: "Moyenne régionale",
    score: avg.score,
    activities: avg.activities,
    participants: avg.participants,
    coverage: avg.coverage,
    rank: 0,
  });

  return ranked;
};
