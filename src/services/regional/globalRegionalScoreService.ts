import { regionalDashboardServices } from "./regionalDashboardServices";

export const REGIONAL_SCORE_DOMAINS = ["JEUNESSE", "INFRA", "FEMME", "PE", "CRECHES"] as const;

export type RegionalScoreDomain = (typeof REGIONAL_SCORE_DOMAINS)[number];

export interface GlobalRegionalScoreRow {
  directionId: string;
  score: number;
  scores: Partial<Record<RegionalScoreDomain, number>>;
  availableDomains: RegionalScoreDomain[];
  completionRate: number;
}

const DOMAIN_WEIGHT = 20;

const clampScore = (score: number) =>
  Number.isFinite(score) ? Math.max(0, Math.min(100, score)) : 0;

/**
 * Agrège les scores domaine déjà calculés par les services régionaux.
 * Chaque domaine pèse toujours 20 % : un domaine absent contribue donc 0.
 */
export async function loadGlobalRegionalScores(year: number): Promise<GlobalRegionalScoreRow[]> {
  const domainResults = await Promise.all(
    REGIONAL_SCORE_DOMAINS.map(async (domain) => {
      const service = regionalDashboardServices[domain];
      return { domain, data: service ? await service(year) : null };
    }),
  );

  const rowsByDirection = new Map<string, GlobalRegionalScoreRow>();

  domainResults.forEach(({ domain, data }) => {
    data?.comparison.directions.forEach((direction) => {
      const directionId = String(direction.id);
      const row = rowsByDirection.get(directionId) ?? {
        directionId,
        score: 0,
        scores: {},
        availableDomains: [],
        completionRate: 0,
      };
      const score = Number(direction.score);

      if (Number.isFinite(score) && score > 0) {
        row.scores[domain] = score;
        row.availableDomains.push(domain);
      }
      rowsByDirection.set(directionId, row);
    });
  });

  rowsByDirection.forEach((row) => {
    const weightedScore = row.availableDomains.reduce(
      (total, domain) => total + (row.scores[domain] ?? 0) * DOMAIN_WEIGHT,
      0,
    );
    row.score = clampScore(weightedScore / 100);
    row.completionRate = (row.availableDomains.length / REGIONAL_SCORE_DOMAINS.length) * 100;
  });

  return Array.from(rowsByDirection.values());
}
