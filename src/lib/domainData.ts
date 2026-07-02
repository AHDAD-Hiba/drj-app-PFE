import { supabase } from "@/integrations/supabase/client";
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

export type Domain = string;
export type PeriodType = "annual" | "quarterly";
export type Quarter = "t1" | "t2" | "t3" | "t4";
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

/**
 * Fetch a snapshot for a given domain + period.
 * Async to mirror future Supabase calls.
 */
/**
 * Fetch a snapshot for a given domain + period from Supabase.
 */
export async function fetchDomainSnapshot(params: {
  domain: Domain;
  year: number;
  period: PeriodType;
  quarter?: Quarter;
}): Promise<DomainSnapshot> {
  const { domain, year, period, quarter } = params;

  // 1. نجيبو التقارير والعمالات الخاصة بهاد المجال وهاد العام من السيكسيون 1
  const { data: sec1, error: err1 } = await supabase
    .from("v_dashboard_pref_section1")
    .select("*")
    .eq("domaine_id", domain)
    .eq("annee", year);

  if (err1 || !sec1 || sec1.length === 0) {
    return { domain, year, period, quarter, directions: [], totalDirections: 0 };
  }

  // نخرجوا كاع الـ rapports_id والـ direction_id باش نفلترو بهم الجداول لخرين
  const rapportIds = sec1.map((r) => r.rapport_id).filter(Boolean) as string[];
  const directionIds = sec1.map((r) => r.direction_id).filter(Boolean) as string[];

  // 2. نجيبو باقي المعطيات ف دقة واحدة من الـ Views لخرين بشكل متوازي (Parallel Fetching)
  const [resSec2, resSec3, resSec4] = await Promise.all([
    supabase.from("v_dashboard_pref_section2").select("*").in("rapport_id", rapportIds),
    supabase.from("v_dashboard_pref_section3").select("*").in("rapport_id", rapportIds),
    supabase.from("v_dashboard_pref_section4").select("*").in("direction_id", directionIds).eq("annee", year),
  ]);

  const sec2Data = resSec2.data || [];
  const sec3Data = resSec3.data || [];
  const sec4Data = resSec4.data || [];

  // 3. نجمعو الداتا كاملة ونحولوها للشكل لي كتسناه الـ Interface ديال الداشبورد
  const directions: DirectionRow[] = sec1.map((s1, index) => {
    // نلقاو الداتا المطابقة ف كاع الـ Views عن طريق الـ id
    const s2 = sec2Data.find((x) => x.rapport_id === s1.rapport_id);
    const s3 = sec3Data.find((x) => x.rapport_id === s1.rapport_id);
    const s4 = sec4Data.find((x) => x.direction_id === s1.direction_id);

    // حساب أعداد الإناث والذكور بناء على النسب المئوية اللي عندكم فـ السيكسيون 3
    const totalBenef = s2?.total_beneficiaires || 0;
    const femmesPct = s3?.femmesPct || 0;
    const hommesPct = s3?.hommesPct || 0;
    const femaleCount = Math.round(totalBenef * (femmesPct / 100));
    const maleCount = Math.round(totalBenef * (hommesPct / 100));

    // تحويل حقول الأنشطة من السيكسيون 4 إلى مصفوفة (Array) للشرطوط
    const activityTypes = [
      { type: "Camping", value: s4?.Camping || 0 },
      { type: "Festivals", value: s4?.Festivals || 0 },
      { type: "Formation", value: s4?.Formation || 0 },
      { type: "Insertion", value: s4?.Insertion || 0 },
    ];

    let status: SubmissionStatus = "not_started";
    if (s1.statut === "TERMINE") {
      status = "completed";
    } else if (s1.statut === "EN_COURS") {
      status = "in_progress";
    }
    
    return {
      id: s1.id || `dir-${index}`,
      direction_id: s1.direction_id || "",
      name: s3?.name || s1.domaine_nom || "Direction", // السمية الحقيقية للعمالة من السيكسيون 3
      status,
      score: s1.progression_pourcentage || 0, // كنعوضو الـ score بنسبة تقدم الملء الحالية
      activities: s2?.total_activites || 0,
      participants: totalBenef,
      participantsFemale: femaleCount,
      participantsMale: maleCount,
      partnerships: s2?.total_partenariats || 0,
      population: totalBenef > 0 && s2?.taux_couverture ? Math.round((totalBenef / (s2.taux_couverture / 100))) : 100000, 
      quarterly: [], // هادي خليها خاوية دابا حيت الداتا annuelle غاتحسب أوتوماتيك ف الداشبورد
      activityTypes,
    };
  });

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
  const quarters: Quarter[] = ["t1", "t2", "t3", "t4"];
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
